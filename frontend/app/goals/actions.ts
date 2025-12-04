/**
 * @overview Actions for the Goals page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { toast } from 'sonner';
import { DEFAULT_NUTRIENTS, DINING_HALLS } from './data';
import { DailyPlan, FoodItem, MealType, Nutrients, PlanSettings, WeeklyPlan } from './types';

export const fetchMenuFor = async (
  date: Date,
  meal: MealType,
  locationId: number
): Promise<FoodItem[]> => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const menuId = `${yyyy}-${mm}-${dd}-${meal}`;

  try {
    // 1. Get all *real* hall IDs (excluding -1)
    const allHallIds = Object.values(DINING_HALLS).filter((id) => id !== -1);

    // 2. Decide which location IDs we need to fetch
    const locationIdsToFetch: number[] = [];
    if (locationId === -1) {
      // 'Any Available Hall' was selected, so use all real IDs
      locationIdsToFetch.push(...allHallIds);
    } else {
      // A specific hall was selected
      locationIdsToFetch.push(locationId);
    }

    // 3. Create an array of fetch promises, one for each hall
    const fetchPromises = locationIdsToFetch.map(async (locId) => {
      try {
        const response = await fetch(`/api/dining/menu?location_id=${locId}&menu_id=${menuId}`);
        if (!response.ok) return []; // Return empty for this hall on error
        const data = await response.json(); // data is { menus: [ { id: 'apiId', ..., nutrition: {...} } ] }

        // Process this *single* hall's menu items
        const foodItems: FoodItem[] = []; // Type is now FoodItem
        data.menus.forEach((item: any) => {
          // The server response includes the 'nutrition' object directly.
          if (item.id && item.link && item.nutrition) {
            foodItems.push({
              apiId: item.id,
              name: item.name,
              location: locId.toString(),
              description: item.description,
              link: item.link,
              nutrition: item.nutrition,
            });
          }
        });
        return foodItems;
      } catch (hallError) {
        console.error(`Failed to fetch menu for ${menuId} at locId ${locId}:`, hallError);
        return []; // Return empty array if a single hall fetch fails
      }
    });

    // 4. Wait for all fetch promises to resolve
    const resultsPerHall = await Promise.all(fetchPromises);

    // 5. Flatten the array of arrays into one single array of all items
    const allFoodItems = resultsPerHall.flat();

    if (allFoodItems.length === 0) return [];

    // 6. The scraping step is GONE. We just filter the items we received.
    return allFoodItems.filter((item) => item.nutrition.calories > 0);
  } catch (error) {
    // This will catch errors in Promise.all or the .flat() call
    console.error(`Failed to fetch and process menus for ${menuId}:`, error);
    return [];
  }
};

export const findBestMealCombination = (
  availableFoods: FoodItem[],
  targetCalories: number,
  targetProtein: number,
  targetFat: number,
  targetCarbohydrates: number,
  maxItems = 3
): FoodItem[] => {
  if (availableFoods.length === 0) return [];
  let mealCombination: FoodItem[] = [];
  let currentTotals: Nutrients = { ...DEFAULT_NUTRIENTS };
  let remainingFoods = [...availableFoods];
  for (let i = 0; i < maxItems; i++) {
    if (currentTotals.calories > targetCalories * 0.85 || remainingFoods.length === 0) break;
    let bestFood: FoodItem | null = null;
    let bestScore = Infinity;
    let bestFoodIndex = -1;
    // We loop through our available foods to find the one that gets us closest to our targets.
    for (let j = 0; j < remainingFoods.length; j++) {
      const food = remainingFoods[j];
      const newCalories = currentTotals.calories + food.nutrition.calories;
      const newProtein = currentTotals.protein + food.nutrition.protein;
      const newFat = currentTotals.fat + food.nutrition.fat;
      const newCarbs = currentTotals.carbohydrates + food.nutrition.carbohydrates;

      if (newCalories > targetCalories * 1.25) continue; // Don't go too far over the target.
      const calError = (newCalories - targetCalories) / (targetCalories || 1);
      const proError = (newProtein - targetProtein) / (targetProtein || 1);
      const fatError = (newFat - targetFat) / (targetFat || 1);
      const carbError = (newCarbs - targetCarbohydrates) / (targetCarbohydrates || 1);
      const score = calError ** 2 + proError ** 2 + fatError ** 2 + carbError ** 2;

      if (score < bestScore) {
        bestScore = score;
        bestFood = food;
        bestFoodIndex = j;
      }
    }
    if (bestFood && bestFoodIndex > -1) {
      mealCombination.push(bestFood);
      Object.keys(bestFood.nutrition).forEach((key) => {
        currentTotals[key as keyof Nutrients] += bestFood.nutrition[key as keyof Nutrients];
      });
      remainingFoods.splice(bestFoodIndex, 1);
    } else {
      break;
    }
  }
  return mealCombination;
};

export const generateDayPlan = async (date: Date, settings: PlanSettings): Promise<DailyPlan> => {
  const locationId = DINING_HALLS[settings.preferredHall];
  const [breakfastMenu, lunchMenu, dinnerMenu] = await Promise.all([
    fetchMenuFor(date, 'Breakfast', locationId),
    fetchMenuFor(date, 'Lunch', locationId),
    fetchMenuFor(date, 'Dinner', locationId),
  ]);
  const filterByAllergen = (items: FoodItem[]) =>
    settings.allergens.length === 0
      ? items
      : items.filter(
          (item) =>
            !settings.allergens.some((allergen: string) =>
              item.description.toLowerCase().includes(allergen.toLowerCase())
            )
        );
  const dailyPlan: DailyPlan = {
    date,
    meals: {
      Breakfast: findBestMealCombination(
        filterByAllergen(breakfastMenu),
        settings.calories * 0.25,
        settings.protein * 0.25,
        settings.fat * 0.25,
        settings.carbohydrates * 0.25
      ),
      Lunch: findBestMealCombination(
        filterByAllergen(lunchMenu),
        settings.calories * 0.4,
        settings.protein * 0.4,
        settings.fat * 0.4,
        settings.carbohydrates * 0.4
      ),
      Dinner: findBestMealCombination(
        filterByAllergen(dinnerMenu),
        settings.calories * 0.35,
        settings.protein * 0.35,
        settings.fat * 0.35,
        settings.carbohydrates * 0.35
      ),
    },
    totals: { ...DEFAULT_NUTRIENTS },
  };
  // Finally, we add up all the nutrients for the day.
  const allMealItemsForDay = Object.values(dailyPlan.meals).flat();
  dailyPlan.totals = allMealItemsForDay.reduce(
    (acc, meal) => {
      Object.keys(meal.nutrition).forEach((key) => {
        acc[key as keyof Nutrients] += meal.nutrition[key as keyof Nutrients];
      });
      return acc;
    },
    { ...DEFAULT_NUTRIENTS }
  );
  return dailyPlan;
};

export const handleGeneratePlan = async (
  startDate: Date,
  settings: PlanSettings,
  setFormError: (error: string) => void,
  setLoading: (loading: boolean) => void,
  setStoredPlan: (plan: WeeklyPlan | null) => void
) => {
  if (
    settings.calories <= 0 ||
    settings.protein <= 0 ||
    settings.fat <= 0 ||
    settings.carbohydrates <= 0
  ) {
    setFormError('Nutritional values must be positive.');
    return;
  }
  setFormError('');
  setLoading(true);
  setStoredPlan(null); // Clear old plan first
  toast.loading('Crafting your weekly plan...');
  try {
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return date;
    });
    const newPlan = await Promise.all(weekDates.map((date) => generateDayPlan(date, settings)));
    setStoredPlan(newPlan);
    toast.dismiss();
    toast.success('Your weekly diet plan is ready!');
  } catch (error) {
    console.error(error);
    toast.dismiss();
    toast.error('Oh no! Something went wrong while generating the plan.');
  } finally {
    setLoading(false);
  }
};
