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
  LocationsCache,
  DiningHall,
  Allergen,
  MenuSortOption,
} from '@/types/types';
import {
  getMenuItems,
  getAllMenusForDate,
  getMenuItemsMetrics,
  getUserMenuItemsInteractions,
  getMenuItemsScore,
} from '@/lib/next-endpoints';

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
  locationItems: LocationsCache;
  appliedDiningHalls: DiningHall[];
  appliedAllergens: Allergen[];
  searchTerm: string;
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
  // If missing required data, return an empty array.
  const missingLocationItems = !locationItems || Object.keys(locationItems).length === 0;
  const missingMenus = !menusForLocations || Object.keys(menusForLocations).length === 0;
  const missingMenuItems = !menuItems || Object.keys(menuItems).length === 0;
  if (missingLocationItems || missingMenus || missingMenuItems) {
    return [];
  }

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
    Object.entries(locationItems).filter(([_, location]) => {
      const locationNameReduced = location.name.toLowerCase().trim();
      const isDiningHallApplied = appliedDiningHallsReduced.includes(locationNameReduced);
      return isDiningHallApplied;
    })
  );

  // Filter the menu items by the applied dining halls, dietary restrictions, and allergens.
  const filteredMenuItems = Object.fromEntries(
    Object.entries(menuItems).filter(([_, menuItem]) => {
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
  if (sortOption === 'Recommended') {
    // Sort the display menus for locations by the recommended score.
    sortedDisplayMenusForLocations.forEach((location) => {
      location.menu = location?.menu?.sort((menuItem1, menuItem2) => {
        const menuItem1Score = menuItemScores[menuItem1.apiId];
        const menuItem2Score = menuItemScores[menuItem2.apiId];
        return menuItem2Score - menuItem1Score;
      });
    });
  } else if (sortOption === 'Most Viewed') {
    // Sort the display menus for locations by the most viewed count.
    sortedDisplayMenusForLocations.forEach((location) => {
      location.menu = location?.menu?.sort((menuItem1, menuItem2) => {
        const menuItem1ViewCount = menuItem1.metrics?.viewCount ?? 0;
        const menuItem2ViewCount = menuItem2.metrics?.viewCount ?? 0;
        return menuItem2ViewCount - menuItem1ViewCount;
      });
    });
  } else if (sortOption === 'Most Liked') {
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
  } else if (sortOption === 'Best') {
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

/**
 * Fetch locations with cache-first strategy.
 * Checks cache first, then falls back to API if cache is empty.
 *
 * @param getAllLocations - Function to get all locations from cache.
 * @param setLocations - Function to set locations in cache.
 * @returns Promise that resolves to LocationMap.
 */
export const fetchLocationsWithCache = async (
  getAllLocations: () => LocationMap,
  setLocations: (locations: LocationMap) => void
): Promise<LocationMap> => {
  // Check cache first
  const cachedLocations = getAllLocations();
  console.log('locations (cache)', cachedLocations);
  if (cachedLocations && Object.keys(cachedLocations).length > 0) {
    return cachedLocations;
  }

  // Otherwise, fetch from API
  const { data: locations } = (await getAllDiningLocations()) as unknown as {
    data: LocationMap;
  };
  console.log('locations (API)', locations);
  if (locations && Object.keys(locations).length > 0) {
    setLocations(locations);
    return locations;
  }

  return {};
};

/**
 * Fetch menus for locations with cache-first strategy.
 * Checks cache first, then falls back to API if cache is empty.
 *
 * @param dateKey - The date key (YYYY-MM-DD format).
 * @param meal - The meal type.
 * @param getApiIdsForMenusForLocations - Function to get menus for locations from cache.
 * @param setApiIdsForMenusForMealsLocations - Function to set menus for meals and locations in cache.
 * @returns Promise that resolves to MenusForLocations.
 */
export const fetchMenusForLocations = async (
  dateKey: DateKey,
  meal: Meal,
  getApiIdsForMenusForLocations: (date: DateKey, meal: Meal) => MenusForLocations,
  setApiIdsForMenusForMealsLocations: (date: DateKey, menus: MenusForMealAndLocations) => void
): Promise<MenusForLocations> => {
  // Check cache first
  const cachedMenusForLocations = getApiIdsForMenusForLocations(dateKey, meal);
  console.log('menusForLocations (cache)', cachedMenusForLocations);
  if (cachedMenusForLocations && Object.keys(cachedMenusForLocations).length > 0) {
    return cachedMenusForLocations;
  }

  // Otherwise, fetch from API
  const { data: menusForDateMealAndLocations } = (await getDiningMenusForLocationsAndDay({
    menu_date: dateKey,
  })) as unknown as { data: MenusForMealAndLocations };
  console.log('menusForDateMealAndLocations (API)', menusForDateMealAndLocations);
  if (menusForDateMealAndLocations && Object.keys(menusForDateMealAndLocations).length > 0) {
    // Cache the fetched menus
    setApiIdsForMenusForMealsLocations(dateKey, menusForDateMealAndLocations);

    const menusForLocations = menusForDateMealAndLocations[meal];
    console.log('menusForLocations (API)', menusForLocations);
    if (menusForLocations && Object.keys(menusForLocations).length > 0) {
      return menusForLocations;
    }
  }

  return {};
};

/**
 * Fetch menu items with cache-first strategy.
 * Checks cache first, then fetches missing items from API if needed and caches them.
 *
 * @param menusForLocations - The menus for locations to extract API IDs from.
 * @param getMenuItems - Function to get menu items from cache.
 * @param setMenuItems - Function to set menu items in cache.
 * @returns Promise that resolves to MenuItemMap.
 */
export const fetchMenuItems = async (
  menusForLocations: MenusForLocations,
  getMenuItems: (apiIds: ApiId[]) => MenuItemMap,
  setMenuItems: (menuItems: MenuItemMap) => void
): Promise<MenuItemMap> => {
  // Extract all unique API IDs from the menus for locations
  const apiIdsSet = new Set<ApiId>(Object.values(menusForLocations).flatMap((menu) => menu));
  const apiIds = Array.from(apiIdsSet);
  if (apiIds.length === 0) {
    return {};
  }

  // Check cache first
  const cachedMenuItems = getMenuItems(apiIds);
  console.log('menuItems (cache)', cachedMenuItems);
  const cachedApiIds = Object.keys(cachedMenuItems);

  // Extract any API IDs that are not in the cache
  const missingApiIds = apiIds.filter((apiId) => !cachedApiIds.includes(String(apiId)));
  if (missingApiIds.length === 0) {
    return cachedMenuItems;
  }

  // If any API IDs are missing, fetch from API
  const { data: menuItems } = (await getDiningMenuItems({
    api_ids: missingApiIds,
  })) as unknown as { data: MenuItemMap };
  console.log('menuItems (API)', menuItems);
  if (menuItems && Object.keys(menuItems).length > 0) {
    // Cache the newly fetched items
    setMenuItems(menuItems);
    return { ...cachedMenuItems, ...menuItems };
  }

  return cachedMenuItems;
};

/**
 * Fetch menu item metrics from API.
 *
 * @param menusForLocations - The menus for locations to extract API IDs from.
 * @returns Promise that resolves to MenuItemMetricsMap.
 */
export const fetchMenuItemMetrics = async (
  menusForLocations: MenusForLocations
): Promise<MenuItemMetricsMap> => {
  const apiIdsSet = new Set<ApiId>(Object.values(menusForLocations).flatMap((menu) => menu));
  const apiIds = Array.from(apiIdsSet);
  if (apiIds.length === 0) {
    return {};
  }

  const { data: menuItemMetrics } = (await getMenuItemsMetrics({
    menu_item_api_ids: apiIds,
  })) as unknown as { data: MenuItemMetricsMap };
  console.log('menuItemMetrics (API)', menuItemMetrics);
  return menuItemMetrics && Object.keys(menuItemMetrics).length > 0 ? menuItemMetrics : {};
};

/**
 * Fetch user menu item interactions from API.
 *
 * @param menusForLocations - The menus for locations to extract API IDs from.
 * @returns Promise that resolves to MenuItemInteractionMap.
 */
export const fetchUserMenuItemInteractions = async (
  menusForLocations: MenusForLocations
): Promise<MenuItemInteractionMap> => {
  const apiIdsSet = new Set<ApiId>(Object.values(menusForLocations).flatMap((menu) => menu));
  const apiIds = Array.from(apiIdsSet);
  if (apiIds.length === 0) {
    return {};
  }

  const { data: userMenuItemInteractions } = (await getUserMenuItemsInteractions({
    menu_item_api_ids: apiIds,
  })) as unknown as { data: MenuItemInteractionMap };
  console.log('userMenuItemInteractions (API)', userMenuItemInteractions);
  return userMenuItemInteractions && Object.keys(userMenuItemInteractions).length > 0
    ? userMenuItemInteractions
    : {};
};

/**
 * Fetch menu item scores from API.
 *
 * @param menusForLocations - The menus for locations to extract API IDs from.
 * @returns Promise that resolves to MenuItemScoreMap.
 */
export const fetchMenuItemScores = async (
  menusForLocations: MenusForLocations
): Promise<MenuItemScoreMap> => {
  const apiIdsSet = new Set<ApiId>(Object.values(menusForLocations).flatMap((menu) => menu));
  const apiIds = Array.from(apiIdsSet);
  if (apiIds.length === 0) {
    return {};
  }

  const { data: menuItemScores } = (await getMenuItemsScore({
    menu_item_api_ids: apiIds,
  })) as unknown as { data: MenuItemScoreMap };
  console.log('menuItemScores (API)', menuItemScores);
  return menuItemScores && Object.keys(menuItemScores).length > 0 ? menuItemScores : {};
};
