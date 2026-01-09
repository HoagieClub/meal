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
  MenuItemScoreMap,
  MenusForLocations,
} from '@/types/dining';
import { DiningHall, DietaryTag, Allergen, MenuItem } from '@/types/dining';
import { MenuSortOption } from './components/sort-dropdown';

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
  menuItemScores: MenuItemScoreMap;
  sortOption: MenuSortOption;
}

/**
 * Build display data for the menu page.
 *
 * @param props - The build display data props.
 * @returns The display menus for locations.
 */
export const buildDisplayData = ({
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
  menuItemScores,
  sortOption,
}: BuildDisplayDataProps) => {
  // Reduce the applied dining halls, dietary restrictions, and allergens to lowercase.
  const appliedDiningHallsReduced = appliedDiningHalls.map((diningHall) =>
    diningHall.toLowerCase().trim()
  );
  const appliedDietaryRestrictionsReduced = appliedDietaryRestrictions.map((dietaryRestriction) =>
    dietaryRestriction.toLowerCase().trim()
  );
  const appliedAllergensReduced = appliedAllergens.map((allergen) => allergen.toLowerCase().trim());
  const searchTermReduced = searchTerm.toLowerCase().trim();

  // Determine if there is a search filter, dietary restriction filter, and allergen filter.
  const hasSearchFilter = searchTermReduced.length > 0;
  const hasDietaryRestrictionFilter = appliedDietaryRestrictionsReduced.length > 0;
  const hasAllergenFilter = appliedAllergensReduced.length > 0;

  // Filter the location items by the applied dining halls.
  const filteredLocationItems = Object.fromEntries(
    Object.entries(locationItems).filter(([locationId, location]) => {
      const locationNameReduced = location.name.toLowerCase().trim();
      const isDiningHallApplied = appliedDiningHallsReduced.includes(locationNameReduced);
      return isDiningHallApplied;
    })
  );

  // Filter the menu items by the applied dining halls, dietary restrictions, and allergens.
  const filteredMenuItems = Object.fromEntries(
    Object.entries(menuItems).filter(([menuItemId, menuItem]) => {
      // If the menu item is not valid, return false.
      if (!menuItem || !menuItem.name) {
        return false;
      }

      // Filter the menu items by the applied allergens.
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

      // Filter the menu items by the applied dietary restrictions.
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

      // Filter the menu items by the search term.
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

  // Filter the menus for locations by the filtered menu items.
  const filteredMenusForLocations = Object.fromEntries(
    Object.entries(menusForLocations)
      .filter(([locationId]) => filteredLocationItems[locationId])
      .map(([locationId, menu]) => [
        locationId,
        menu.filter((menuItemId) => filteredMenuItems[menuItemId]),
      ])
  );

  // Build the display menus for locations.
  const displayMenusForLocations = [];
  for (const locationId of Object.keys(filteredMenusForLocations)) {
    const location = filteredLocationItems[locationId];

    // Map the menu items for the location.
    let menuItems = filteredMenusForLocations[locationId].map((menuItemId) => {
      const menuItem = filteredMenuItems[menuItemId];
      if (!menuItem || !menuItem.name) {
        return null;
      }

      // Set the metrics and user interaction for the menu item.
      menuItem.metrics = menuItemMetrics[menuItemId];
      menuItem.userInteraction = userMenuItemInteractions[menuItemId];
      return menuItem;
    });

    // Filter out any null menu items.
    menuItems = menuItems.filter((menuItem) => menuItem !== null);
    if (menuItems.length === 0) {
      continue;
    }

    // Set the menu items for the location and push to display menus
    location.menu = menuItems as MenuItem[];
    displayMenusForLocations.push(location);
  }

  // Sort the display menus for locations by the pinned halls.
  const sortedDisplayMenusForLocations = displayMenusForLocations.sort((location1, location2) => {
    const location1IsPinned = pinnedHalls.includes(location1.name as DiningHall);
    const location2IsPinned = pinnedHalls.includes(location2.name as DiningHall);
    return location1IsPinned ? -1 : location2IsPinned ? 1 : 0;
  });

  // Sort the display menus for locations by the sort option.
  if (sortOption === 'recommended') {
    // Sort the display menus for locations by the recommended score.
    sortedDisplayMenusForLocations.forEach((location) => {
      location.menu = location?.menu?.sort((menuItem1, menuItem2) => {
        const menuItem1Score = menuItemScores[menuItem1.apiId];
        const menuItem2Score = menuItemScores[menuItem2.apiId];
        return menuItem2Score - menuItem1Score;
      });
    });
  } else if (sortOption === 'most viewed') {
    // Sort the display menus for locations by the most viewed count.
    sortedDisplayMenusForLocations.forEach((location) => {
      location.menu = location?.menu?.sort((menuItem1, menuItem2) => {
        const menuItem1ViewCount = menuItem1.metrics?.viewCount ?? 0;
        const menuItem2ViewCount = menuItem2.metrics?.viewCount ?? 0;
        return menuItem2ViewCount - menuItem1ViewCount;
      });
    });
  } else if (sortOption === 'most liked') {
    // Sort the display menus for locations by the most liked count.
    sortedDisplayMenusForLocations.forEach((location) => {
      location.menu = location?.menu?.sort((menuItem1, menuItem2) => {
        const menuItem1LikeCount =
          menuItem1.metrics?.likeCount && menuItem1.metrics?.likeCount > 0
            ? menuItem1.metrics?.likeCount
            : -1 * (menuItem1.metrics?.dislikeCount ?? 0);
        const menuItem2LikeCount =
          menuItem2.metrics?.likeCount && menuItem2.metrics?.likeCount > 0
            ? menuItem2.metrics?.likeCount
            : -1 * (menuItem2.metrics?.dislikeCount ?? 0);
        return menuItem2LikeCount - menuItem1LikeCount;
      });
    });
  } else if (sortOption === 'best') {
    // Sort the display menus for locations by the best score.
    sortedDisplayMenusForLocations.forEach((location) => {
      location.menu = location?.menu?.sort((menuItem1, menuItem2) => {
        const menuItem1AverageLikeScore = menuItem1.metrics?.averageLikeScore ?? 0;
        const menuItem2AverageLikeScore = menuItem2.metrics?.averageLikeScore ?? 0;
        return menuItem2AverageLikeScore - menuItem1AverageLikeScore;
      });
    });
  }

  console.log('sortedDisplayMenusForLocations', sortedDisplayMenusForLocations);
  return sortedDisplayMenusForLocations;
};
