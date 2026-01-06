/**
 * @overview Actions for the menu page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { LocationMap, MenuItemMap, MenusForLocations } from '@/types/dining';
import { DiningHall, DietaryTag, Allergen, MenuItem } from '@/types/dining';

const lowercased = (array: string[] | null | undefined) =>
  array?.map((item) => item.toLowerCase()) ?? [];

/**
 * Build display data props.
 *
 * @param menusForLocations - The menus for locations.
 * @param locationItems - The location items.
 * @param appliedDiningHalls - The applied dining halls.
 * @param appliedDietaryRestrictions - The applied dietary restrictions.
 * @param appliedAllergens - The applied allergens.
 * @param searchTerm - The search term.
 * @param pinnedHalls - The pinned halls.
 */
interface BuildDisplayDataProps {
  menusForLocations: MenusForLocations;
  locationItems: LocationMap;
  appliedDiningHalls: DiningHall[];
  appliedDietaryRestrictions: DietaryTag[];
  appliedAllergens: Allergen[];
  searchTerm: string;
  pinnedHalls: DiningHall[];
  menuItems: MenuItemMap;
}

/**
 * Build display data for the menu page.
 *
 * @param props - The build display data props.
 * @returns The display menus for locations.
 */
export const buildDisplayData = (props: BuildDisplayDataProps) => {
  const {
    menusForLocations,
    menuItems,
    locationItems,
    appliedDiningHalls,
    appliedDietaryRestrictions,
    appliedAllergens,
    searchTerm,
    pinnedHalls,
  } = props;
  // Build display menus for locations using menus and location and menu items maps

  console.log('menusForLocations', menusForLocations);
  console.log('locationItems', locationItems);
  console.log('menuItems', menuItems);

  const displayMenusForLocations = [];
  for (const locationId of Object.keys(menusForLocations)) {
    const location = locationItems?.[locationId];
    if (!location) {
        console.log('location not found for locationId', locationId);
        continue;
    }

    const menu = menusForLocations[locationId];
    if (!menu) {
        console.log('menu not found for location', locationId);
        continue;
    }

    const locationMenuItems: MenuItem[] = [];
    for (const menuItemId of menu) {
      const menuItem: MenuItem = menuItems[menuItemId];
      if (!menuItem || !menuItem.name) {
        console.log('menuItem not found for menuItemId', menuItemId);
        continue;
      }
      locationMenuItems.push(menuItem);
    }
    if (locationMenuItems.length === 0) {
        console.log('locationMenuItems is empty for location', locationId);
        continue;
    }

    location.menu = locationMenuItems;
    displayMenusForLocations.push(location);
  }
  console.log('displayMenusForLocations', displayMenusForLocations);

  // Normalize search term, dietary restrictions, allergens, and dietary flags
  const searchTermLower = searchTerm.trim().toLowerCase();
  const appliedDietaryRestrictionsLower = lowercased(appliedDietaryRestrictions);
  const appliedAllergensLower = lowercased(appliedAllergens);
  const appliedDiningHallsLower = lowercased(appliedDiningHalls);

  // Check if any filters are applied
  const hasSearch = searchTermLower.length > 0;
  const hasDietaryRestrictionFilter = appliedDietaryRestrictionsLower.length > 0;
  const hasAllergenFilter = appliedAllergensLower.length > 0;

  // Filter  by applied dining halls
  let filteredMenusForLocations = displayMenusForLocations.filter((diningVenue) => {
    const diningVenueNameLower = diningVenue.name.toLowerCase();
    const isDiningHallApplied = appliedDiningHallsLower.some((hallName) => {
      if (hallName === diningVenueNameLower) return true;
    });
    return isDiningHallApplied;
  });

  // Filter menu items by applied filters
  filteredMenusForLocations = filteredMenusForLocations.map((diningVenue) => {
    const menuItems = diningVenue.menu && diningVenue.menu.length > 0 ? diningVenue.menu : [];

    const filteredMenuItems = menuItems.filter((menuItem) => {
      // Normalize menu item allergens, ingredients, and dietary flags
      const menuItemAllergensLower = lowercased(menuItem.allergens);
      const menuItemIngredientsLower = lowercased(menuItem.ingredients);
      const menuItemDietaryFlagsLower = lowercased(menuItem.dietaryFlags);
      const menuItemNameLower = menuItem.name.toLowerCase();

      const combinedText =
        `${menuItemNameLower} ${menuItemIngredientsLower.join(' ')} ${menuItemAllergensLower.join(' ')} ${menuItemDietaryFlagsLower.join(' ')}`.toLowerCase();

      // Check if search term is in combined text
      if (hasSearch) {
        const includesSearch = combinedText.includes(searchTermLower);
        if (!includesSearch) {
          return false;
        }
      }

      // Check if dietary flag filter is in menu item dietary flags
      if (hasDietaryRestrictionFilter) {
        const includesDietFilter = appliedDietaryRestrictionsLower.some((dietaryRestriction) =>
          menuItemDietaryFlagsLower.includes(dietaryRestriction)
        );
        if (!includesDietFilter) {
          return false;
        }
      }

      // Check if allergen filter is in menu item allergens or ingredients
      if (hasAllergenFilter) {
        const includesAllergen = appliedAllergensLower.some(
          (allergen) =>
            menuItemAllergensLower.includes(allergen) || menuItemIngredientsLower.includes(allergen)
        );
        if (includesAllergen) {
          return false;
        }
      }

      return true;
    });

    // Return the dining venue with the filtered menu items
    return {
      ...diningVenue,
      menu: filteredMenuItems,
    };
  });

  // Filter dining venues with no filtered menu items
  filteredMenusForLocations = filteredMenusForLocations.filter((diningVenue) => {
    const hasMenuItems = diningVenue.menu && diningVenue.menu.length > 0;
    return hasMenuItems;
  });

  // Sort dining venues by pin status
  filteredMenusForLocations = filteredMenusForLocations.sort((a, b) => {
    const aIsPinned = pinnedHalls.includes(a.name as DiningHall);
    const bIsPinned = pinnedHalls.includes(b.name as DiningHall);
    return aIsPinned ? -1 : bIsPinned ? 1 : 0;
  });

  console.log('filteredMenusForLocations', filteredMenusForLocations);
  return filteredMenusForLocations;
};

/**
 * Filter menu items into main entrée and vegan entrée.
 *
 * @param menuItems - The menu items.
 * @returns The main entrée and vegan entrée menu items.
 */
export const filterMenuItems = (menuItems: MenuItem[]) => {
  const mainEntreeMenuItems = [];
  const veganEntreeMenuItems = [];
  for (const menuItem of menuItems) {
    const dietaryFlags = menuItem?.dietaryFlags ?? [];
    const dietaryFlagsLower = dietaryFlags.map((flag: string) => flag.toLowerCase());
    if (dietaryFlagsLower.includes('vegetarian') || dietaryFlagsLower.includes('vegan')) {
      veganEntreeMenuItems.push(menuItem);
    } else {
      mainEntreeMenuItems.push(menuItem);
    }
  }
  return {
    mainEntreeMenuItems,
    veganEntreeMenuItems,
  };
};
