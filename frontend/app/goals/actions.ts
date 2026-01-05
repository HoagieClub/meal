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
import { DEFAULT_NUTRIENTS } from './data';
import { DailyPlan, Nutrients, PlanSettings, WeeklyPlan } from './types';
import { Meal, DiningHall } from '@/types/dining';
import { MenuItem, MenusForDateMealAndLocations, DiningVenue } from '@/types/dining';
import { getDiningMenusForDay } from '@/lib/next-endpoints';

const MENU_CACHE_KEY = 'menuCache';

/**
 * Converts string/number to number for calculations.
 */
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats a date as YYYY-MM-DD string.
 */
const formatDateKey = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Extracts menu items from venues, filtering by preferred hall name if specified.
 */
const extractItemsFromVenues = (
  venues: DiningVenue[],
  preferredHall: DiningHall | 'Any Available Hall'
): { items: MenuItem[]; venueMap: Record<string, string> } => {
  const items: MenuItem[] = [];
  const venueMap: Record<string, string> = {};

  for (const venue of venues) {
    // If preferredHall is 'Any Available Hall', include all venues. Otherwise, filter by venue name.
    if (preferredHall !== 'Any Available Hall' && venue.name !== preferredHall) continue;

    if (venue.menu) {
      for (const item of venue.menu) {
        items.push(item);
        venueMap[item.apiId.toString()] = venue.name;
      }
    }
  }

  return { items, venueMap };
};

/**
 * Adds a menu item's nutrients to an existing nutrients object.
 */
const addItemNutrients = (totals: Nutrients, item: MenuItem): void => {
  totals.calories += toNumber(item.calories);
  totals.protein += toNumber(item.protein);
  totals.fat += toNumber(item.totalFat);
  totals.carbohydrates += toNumber(item.totalCarbohydrates);
  totals.fiber += toNumber(item.dietaryFiber);
  totals.sugar += toNumber(item.sugars);
  totals.sodium += toNumber(item.sodium);
  totals.cholesterol += toNumber(item.cholesterol);
  totals.calcium += toNumber(item.calcium);
  totals.iron += toNumber(item.iron);
  totals.potassium += toNumber(item.potassium);
  totals.vitaminD += toNumber(item.vitaminD);
  // vitaminA, vitaminC, magnesium, zinc not available in MenuItem
};

/**
 * Calculates nutrient totals from an array of menu items.
 */
const calculateTotals = (items: MenuItem[]): Nutrients => {
  const totals = { ...DEFAULT_NUTRIENTS };
  for (const item of items) {
    addItemNutrients(totals, item);
  }
  return totals;
};

/**
 * Filters menu items by allergens.
 */
const filterByAllergen = (items: MenuItem[], allergens: string[]): MenuItem[] => {
  if (allergens.length === 0) return items;

  return items.filter((item) => {
    // Check allergens array if available
    if (item.allergens && item.allergens.length > 0) {
      const itemAllergensLower = item.allergens.map((a) => a.toLowerCase());
      const hasMatchingAllergen = allergens.some((allergen) =>
        itemAllergensLower.includes(allergen.toLowerCase())
      );
      return !hasMatchingAllergen;
    }

    // Fallback to checking description
    return !allergens.some((allergen: string) =>
      (item.description || '').toLowerCase().includes(allergen.toLowerCase())
    );
  });
};

/**
 * Calculates normalized error score for a menu item against targets.
 */
const calculateNutritionScore = (
  currentTotals: Nutrients,
  item: MenuItem,
  targetCalories: number,
  targetProtein: number,
  targetFat: number,
  targetCarbohydrates: number
): number => {
  const newCalories = currentTotals.calories + toNumber(item.calories);
  const newProtein = currentTotals.protein + toNumber(item.protein);
  const newFat = currentTotals.fat + toNumber(item.totalFat);
  const newCarbs = currentTotals.carbohydrates + toNumber(item.totalCarbohydrates);

  const calError = (newCalories - targetCalories) / (targetCalories || 1);
  const proError = (newProtein - targetProtein) / (targetProtein || 1);
  const fatError = (newFat - targetFat) / (targetFat || 1);
  const carbError = (newCarbs - targetCarbohydrates) / (targetCarbohydrates || 1);

  return calError ** 2 + proError ** 2 + fatError ** 2 + carbError ** 2;
};

/**
 * Generates an array of dates for a week starting from the given date.
 */
const generateWeekDates = (startDate: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });
};

/**
 * Validates that all nutritional values in settings are positive.
 */
const validateSettings = (settings: PlanSettings): boolean => {
  return (
    settings.calories > 0 && settings.protein > 0 && settings.fat > 0 && settings.carbohydrates > 0
  );
};

/**
 * Gets menu items for a specific date and meal from cache or API.
 */
export const fetchMenuFor = async (
  date: Date,
  meal: Meal,
  preferredHall: DiningHall | 'Any Available Hall',
  menuCache: MenusForDateMealAndLocations,
  setMenuCache: (cache: MenusForDateMealAndLocations) => void
): Promise<{ items: MenuItem[]; venueMap: Record<string, string> }> => {
  const dateKey = formatDateKey(date);

  // Check cache first
  const cachedMenus = menuCache[dateKey];
  if (cachedMenus?.[meal]) {
    return extractItemsFromVenues(cachedMenus[meal], preferredHall);
  }

  // Fetch from API
  try {
    const { data, error } = await getDiningMenusForDay({ menu_date: dateKey });
    if (error) throw new Error(error);

    const menuData = data?.data || data;
    if (!menuData || (typeof menuData === 'object' && Object.keys(menuData).length === 0)) {
      return { items: [], venueMap: {} };
    }

    // Update cache
    const menusData = menuData as MenusForDateMealAndLocations;
    setMenuCache({ ...menuCache, [dateKey]: menusData });

    // Extract items for the requested meal
    const mealMenus = menusData[meal];
    if (!mealMenus) {
      return { items: [], venueMap: {} };
    }

    return extractItemsFromVenues(mealMenus as DiningVenue[], preferredHall);
  } catch (error) {
    console.error(`Failed to fetch menu for ${dateKey} ${meal}:`, error);
    return { items: [], venueMap: {} };
  }
};

/**
 * Finds the best meal combination from available menu items using a greedy algorithm.
 */
export const findBestMealCombination = (
  availableItems: MenuItem[],
  targetCalories: number,
  targetProtein: number,
  targetFat: number,
  targetCarbohydrates: number,
  maxItems = 3
): MenuItem[] => {
  if (availableItems.length === 0) return [];

  const mealCombination: MenuItem[] = [];
  const currentTotals: Nutrients = { ...DEFAULT_NUTRIENTS };
  const remainingItems = [...availableItems];

  for (let i = 0; i < maxItems; i++) {
    if (currentTotals.calories > targetCalories * 0.85 || remainingItems.length === 0) break;

    let bestItem: MenuItem | null = null;
    let bestScore = Infinity;
    let bestIndex = -1;

    for (let j = 0; j < remainingItems.length; j++) {
      const item = remainingItems[j];
      const newCalories = currentTotals.calories + toNumber(item.calories);

      // Skip items that would exceed 125% of calorie target
      if (newCalories > targetCalories * 1.25) continue;

      const score = calculateNutritionScore(
        currentTotals,
        item,
        targetCalories,
        targetProtein,
        targetFat,
        targetCarbohydrates
      );

      if (score < bestScore) {
        bestScore = score;
        bestItem = item;
        bestIndex = j;
      }
    }

    if (bestItem && bestIndex > -1) {
      mealCombination.push(bestItem);
      addItemNutrients(currentTotals, bestItem);
      remainingItems.splice(bestIndex, 1);
    } else {
      break;
    }
  }

  return mealCombination;
};

/**
 * Generates a daily meal plan.
 */
export const generateDayPlan = async (
  date: Date,
  settings: PlanSettings,
  menuCache: MenusForDateMealAndLocations,
  setMenuCache: (cache: MenusForDateMealAndLocations) => void
): Promise<DailyPlan> => {
  // Fetch menu data for all meals in parallel
  const [breakfastData, lunchData, dinnerData] = await Promise.all([
    fetchMenuFor(date, 'Breakfast', settings.preferredHall, menuCache, setMenuCache),
    fetchMenuFor(date, 'Lunch', settings.preferredHall, menuCache, setMenuCache),
    fetchMenuFor(date, 'Dinner', settings.preferredHall, menuCache, setMenuCache),
  ]);

  // Filter by allergens
  const breakfastItems = filterByAllergen(breakfastData.items, settings.allergens);
  const lunchItems = filterByAllergen(lunchData.items, settings.allergens);
  const dinnerItems = filterByAllergen(dinnerData.items, settings.allergens);

  // Find best meal combinations (25% breakfast, 40% lunch, 35% dinner)
  const breakfastMeal = findBestMealCombination(
    breakfastItems,
    settings.calories * 0.25,
    settings.protein * 0.25,
    settings.fat * 0.25,
    settings.carbohydrates * 0.25
  );

  const lunchMeal = findBestMealCombination(
    lunchItems,
    settings.calories * 0.4,
    settings.protein * 0.4,
    settings.fat * 0.4,
    settings.carbohydrates * 0.4
  );

  const dinnerMeal = findBestMealCombination(
    dinnerItems,
    settings.calories * 0.35,
    settings.protein * 0.35,
    settings.fat * 0.35,
    settings.carbohydrates * 0.35
  );

  // Combine venue maps and calculate totals
  const venueMap = {
    ...breakfastData.venueMap,
    ...lunchData.venueMap,
    ...dinnerData.venueMap,
  };

  const allItems = [...breakfastMeal, ...lunchMeal, ...dinnerMeal];
  const totals = calculateTotals(allItems);

  return {
    date,
    meals: {
      Breakfast: breakfastMeal,
      Lunch: lunchMeal,
      Dinner: dinnerMeal,
    },
    totals,
    venueMap,
  };
};

/**
 * Handles generating a weekly plan.
 */
export const handleGeneratePlan = async (
  startDate: Date,
  settings: PlanSettings,
  setFormError: (error: string) => void,
  setLoading: (loading: boolean) => void,
  setStoredPlan: (plan: WeeklyPlan | null) => void,
  menuCache: MenusForDateMealAndLocations,
  setMenuCache: (cache: MenusForDateMealAndLocations) => void
): Promise<void> => {
  if (!validateSettings(settings)) {
    setFormError('Nutritional values must be positive.');
    return;
  }

  setFormError('');
  setLoading(true);
  setStoredPlan(null);
  toast.loading('Crafting your weekly plan...');

  try {
    const weekDates = generateWeekDates(startDate);
    const newPlan = await Promise.all(
      weekDates.map((date) => generateDayPlan(date, settings, menuCache, setMenuCache))
    );
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
