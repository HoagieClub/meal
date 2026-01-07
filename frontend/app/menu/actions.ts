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

import {
  LocationMap,
  MenuItemInteractionMap,
  MenuItemMap,
  MenuItemMetricsMap,
  MenusForLocations,
} from '@/types/dining';
import { DiningHall, DietaryTag, Allergen, MenuItem } from '@/types/dining';

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
 * @param menuItems - The menu items.
 * @param menuItemMetrics - The menu item metrics.
 * @param userMenuItemInteractions - The user menu item interactions.
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
  menuItemMetrics: MenuItemMetricsMap;
  userMenuItemInteractions: MenuItemInteractionMap;
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
    menuItemMetrics,
    userMenuItemInteractions,
    locationItems,
    appliedDiningHalls,
    appliedDietaryRestrictions,
    appliedAllergens,
    searchTerm,
    pinnedHalls,
  } = props;

  const appliedDiningHallsReduced = appliedDiningHalls.map((diningHall) =>
    diningHall.toLowerCase().trim()
  );
  const appliedDietaryRestrictionsReduced = appliedDietaryRestrictions.map((dietaryRestriction) =>
    dietaryRestriction.toLowerCase().trim()
  );
  const appliedAllergensReduced = appliedAllergens.map((allergen) => allergen.toLowerCase().trim());
  const searchTermReduced = searchTerm.toLowerCase().trim();

  const hasSearchFilter = searchTermReduced.length > 0;
  const hasDietaryRestrictionFilter = appliedDietaryRestrictionsReduced.length > 0;
  const hasAllergenFilter = appliedAllergensReduced.length > 0;

  const filteredLocationItems = Object.fromEntries(
    Object.entries(locationItems).filter(([locationId, location]) => {
      const locationNameReduced = location.name.toLowerCase().trim();
      const isDiningHallApplied = appliedDiningHallsReduced.includes(locationNameReduced);
      return isDiningHallApplied;
    })
  );

  const filteredMenuItems = Object.fromEntries(
    Object.entries(menuItems).filter(([menuItemId, menuItem]) => {
      if (!menuItem || !menuItem.name) {
        return false;
      }

      if (hasAllergenFilter) {
        const menuItemAllergensReduced = menuItem.allergens?.map((allergen) =>
          allergen.toLowerCase().trim()
        );
        const hasAllergen = menuItemAllergensReduced?.some((menuItemAllergen) =>
          appliedAllergensReduced.includes(menuItemAllergen)
        );
        if (hasAllergen) {
          return false;
        }
      }

      if (hasDietaryRestrictionFilter) {
        const menuItemDietaryFlagsReduced = menuItem.dietaryFlags?.map((dietaryFlag) =>
          dietaryFlag.toLowerCase().trim()
        );
        const hasDietaryRestriction = menuItemDietaryFlagsReduced?.some((menuItemDietaryFlag) =>
          appliedDietaryRestrictionsReduced.includes(menuItemDietaryFlag)
        );
        if (!hasDietaryRestriction) {
          return false;
        }
      }

      if (hasSearchFilter) {
        const combinedText = `${menuItem.name} ${menuItem.allergens?.join(' ')} ${menuItem.dietaryFlags?.join(' ')} ${menuItem.ingredients?.join(' ')}`;
        const hasSearch = combinedText.toLowerCase().includes(searchTermReduced);
        if (!hasSearch) {
          return false;
        }
      }

      return true;
    })
  );

  const filteredMenusForLocations = Object.fromEntries(
    Object.entries(menusForLocations)
      .filter(([locationId]) => filteredLocationItems[locationId])
      .map(([locationId, menu]) => [
        locationId,
        menu.filter((menuItemId) => filteredMenuItems[menuItemId]),
      ])
  );

  const displayMenusForLocations = [];
  for (const locationId of Object.keys(filteredMenusForLocations)) {
    const location = filteredLocationItems[locationId];
    let menuItems = filteredMenusForLocations[locationId].map((menuItemId) => {
      const menuItem = filteredMenuItems[menuItemId];
      if (!menuItem || !menuItem.name) {
        return null;
      }
      menuItem.metrics = menuItemMetrics[menuItemId];
      menuItem.userInteraction = userMenuItemInteractions[menuItemId];
      return menuItem;
    });
    menuItems = menuItems.filter((menuItem) => menuItem !== null);
    if (menuItems.length === 0) {
      continue;
    }
    location.menu = menuItems as MenuItem[];
    displayMenusForLocations.push(location);
  }

  const sortedDisplayMenusForLocations = displayMenusForLocations.sort((location1, location2) => {
    const location1IsPinned = pinnedHalls.includes(location1.name as DiningHall);
    const location2IsPinned = pinnedHalls.includes(location2.name as DiningHall);
    return location1IsPinned ? -1 : location2IsPinned ? 1 : 0;
  });

  console.log('sortedDisplayMenusForLocations', sortedDisplayMenusForLocations);
  return sortedDisplayMenusForLocations;
};
