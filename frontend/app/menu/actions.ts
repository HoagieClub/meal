/**
 * @overview Actions for the Menu page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { classifyDish, DietTag } from '@/utils/dietary';
import { RawApiMenuItem, UIMenuItem, UIVenue } from '@/data';
import { AllergenType, DietaryTagType, DiningHallType } from '@/data';

const FETCH_MENU_DATA_URL = '/api/dining/locations/with-menus';

interface RawVenue {
  name: string;
  menu: {
    menus: RawApiMenuItem[];
  };
}

/**
 * Fetch the menu data for the given menu ID.
 *
 * @param menuId - The menu ID to fetch.
 * @param isCurrent - The function to check if the current menu is the current menu.
 * @returns The menu data.
 */
const fetchMenuData = async (
  menuId: string,
  isCurrent: () => boolean
): Promise<UIVenue[] | null> => {
  try {
    const response = await fetch(`${FETCH_MENU_DATA_URL}?menu_id=${menuId}`);
    if (!response.ok) {
      throw new Error(`HTTP error fetching menu! status: ${response.status}`);
    }
    const data: { locations: { location: RawVenue[] } } = await response.json();
    if (!isCurrent()) return null;

    const uiVenues: UIVenue[] = data.locations.location.map((raw) => {
      // 1. Create the flat list of items
      const allItems: UIMenuItem[] = (raw.menu.menus || []).map((x: RawApiMenuItem) => ({
        id: x.id,
        name: x.name,
        description: x.description,
        link: x.link,
        calories: x.nutrition?.calories || 0,
        protein: x.nutrition?.protein || 0,
        allergens: x.allergens || [],
        ingredients: x.ingredients || [],
      }));

      // 2. Aggregate Allergens from all items for the Venue-level Set
      const venueAllergens = new Set<string>();
      allItems.forEach((item) => item.allergens.forEach((a) => venueAllergens.add(a)));

      // 3. Helper to filter items into categories (Logic assumed based on your error message)
      const categorizedItems = {
        'Main Entrée': allItems.filter((i) => true), // Replace 'true' with your category logic
        'Vegan Entrée': [],
        Soups: [],
      };

      // 4. Return the full UIVenue object
      return {
        name: raw.name,
        items: categorizedItems,
        allergens: venueAllergens,
        calories: {},
        protein: {},
        nutrition: new Set<string>(),
      };
    });

    return uiVenues;
  } catch (error) {
    if (isCurrent()) {
      console.error(`Error fetching menu data for ${menuId}:`, error);
    }
    return null;
  }
};

interface BuildDisplayDataProps {
  venues: UIVenue[];
  appliedDiningHalls: DiningHallType[];
  appliedDietaryRestrictions: DietaryTagType[];
  appliedAllergens: AllergenType[];
  searchTerm: string;
  pinnedHalls: Set<DiningHallType>;
  showNutrition: boolean;
}

/**
 * Build the display data for the menu.
 *
 * @param venues - The venues to build the display data for.
 * @param appliedDiningHalls - The applied dining halls.
 * @param appliedDietaryRestrictions - The applied dietary restrictions.
 * @param appliedAllergens - The applied allergens.
 * @param searchTerm - The search term.
 * @param pinnedHalls - The pinned halls.
 * @param showNutrition - The show nutrition.
 * @returns The display data.
 */
function buildDisplayData({
  venues,
  appliedDiningHalls,
  appliedDietaryRestrictions,
  appliedAllergens,
  searchTerm,
  pinnedHalls,
  showNutrition,
}: BuildDisplayDataProps): UIVenue[] {
  const term = searchTerm.trim().toLowerCase();

  const hasDietFilter = appliedDietaryRestrictions.length > 0;
  const hasAllergenFilter = appliedAllergens.length > 0;
  const hasSearch = term !== '';

  const sortByPinned = (a: UIVenue, b: UIVenue) => {
    const aPinned = pinnedHalls.has(a.name as DiningHallType);
    const bPinned = pinnedHalls.has(b.name as DiningHallType);
    if (aPinned === bPinned) return 0;
    return aPinned ? -1 : 1;
  };

  if (!hasDietFilter && !hasAllergenFilter && !hasSearch) {
    return appliedDiningHalls
      .map((name) => venues.find((v) => v.name === (name as DiningHallType)))
      .filter((v): v is UIVenue => !!v)
      .sort(sortByPinned);
  }

  const matchesDish = (dish: any): boolean => {
    const text = `${dish.name} ${dish.description}`.toLowerCase();

    if (hasSearch && !text.includes(term)) return false;

    if (hasDietFilter) {
      const tags = classifyDish(dish);
      if (!tags.some((tag: DietTag) => appliedDietaryRestrictions.includes(tag))) {
        return false;
      }
    }

    if (hasAllergenFilter) {
      const allergens = dish.allergens.map((a: AllergenType) => a);
      if (appliedAllergens.some((a: AllergenType) => allergens.includes(a))) {
        return false;
      }
    }

    return true;
  };

  const normalizeDish = (dish: any): any => {
    if (showNutrition) return dish;
    if (!('nutrition' in dish)) return dish;

    const { nutrition, ...rest } = dish;
    return rest;
  };

  const buildVenue = (hallName: DiningHallType): UIVenue | null => {
    const venue = venues.find((v) => v.name === hallName);
    if (!venue) return null;

    const items = Object.fromEntries(
      Object.entries(venue.items).map(([category, dishes]) => [
        category,
        dishes.filter(matchesDish).map(normalizeDish),
      ])
    ) as UIVenue['items'];

    const hasItems = Object.values(items).some((list) => list.length > 0);
    if (!hasItems) return null;

    return { ...venue, items };
  };

  return appliedDiningHalls
    .map(buildVenue)
    .filter((v): v is UIVenue => v !== null)
    .sort(sortByPinned);
}

export { buildDisplayData, fetchMenuData };
