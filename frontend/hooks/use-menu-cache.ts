/**
 * @overview Hook for managing menu and menu item caches.
 * Uses three separate caches:
 * - Menu structure cache: date -> meal -> location -> api_ids[]
 * - Menu items cache: api_id -> MenuItem
 * - Locations cache: location_id -> DiningVenue
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

'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  MenuItem,
  Meal,
  MenusForDateMealAndLocations,
  MenuItemMap,
  LocationMap,
  ApiId,
  LocationId,
  DateKey,
  Menu,
  Location,
} from '@/types/dining';

const CACHE_KEYS = {
  MENU_STRUCTURE: 'menuStructureCache',
  MENU_ITEMS: 'menuItemsCache',
  LOCATIONS: 'locationsCache',
} as const;

/**
 * Hook for managing menu structure cache.
 *
 * @returns Object with cache state and functions.
 */
export function useMenuStructureCache() {
  // Menu structure cache
  const [menuStructureCache, setMenuStructureCache, menuStructureCacheLoading] =
    useLocalStorage<MenusForDateMealAndLocations>({
      key: CACHE_KEYS.MENU_STRUCTURE,
      initialValue: {},
    });

  // Get API IDs for a specific date, meal, and location
  const getApiIdsForMenu = (date: DateKey, meal: Meal, locationId: LocationId): Menu => {
    return menuStructureCache?.[date]?.[meal]?.[String(locationId)] ?? [];
  };

  // Get API IDs for all locations for a specific date and meal
  const getApiIdsForMenusForLocations = (date: DateKey, meal: Meal) => {
    return menuStructureCache?.[date]?.[meal] ?? {};
  };

  // Get API IDs for all meals and locations for a specific date
  const getApiIdsForMenusForMealsLocations = (
    date: DateKey
  ): MenusForDateMealAndLocations[DateKey] | undefined => {
    return menuStructureCache?.[date];
  };

  // Check if API IDs exist for a specific date, meal, and location
  const hasApiIds = (date: DateKey, meal: Meal, locationId: LocationId): boolean => {
    const apiIds = getApiIdsForMenu(date, meal, locationId);
    return apiIds.length > 0;
  };

  // Set API IDs for a specific date, meal, and location
  const setApiIdsForMenu = (
    date: DateKey,
    meal: Meal,
    locationId: LocationId,
    apiIds: Menu
  ): void => {
    setMenuStructureCache((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [meal]: {
          ...prev[date]?.[meal],
          [String(locationId)]: apiIds,
        },
      },
    }));
  };

  // Set API IDs for all locations for a specific date and meal
  const setApiIdsForMenusForLocations = (
    date: DateKey,
    meal: Meal,
    apiIdsByLocation: MenusForDateMealAndLocations[DateKey][Meal]
  ): void => {
    setMenuStructureCache((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [meal]: apiIdsByLocation,
      },
    }));
  };

  // Set API IDs for all meals and locations for a specific date
  const setApiIdsForMenusForMealsLocations = (
    date: DateKey,
    apiIdsByMealAndLocation: MenusForDateMealAndLocations[DateKey]
  ): void => {
    setMenuStructureCache((prev) => ({
      ...prev,
      [date]: apiIdsByMealAndLocation,
    }));
  };

  // Remove API IDs for a specific date, meal, and location
  const removeApiIdsForMenu = (date: DateKey, meal: Meal, locationId: LocationId): void => {
    setMenuStructureCache((prev) => {
      const updated = { ...prev };
      const locationIdStr = String(locationId);
      if (updated[date]?.[meal]?.[locationIdStr]) {
        const mealData = { ...updated[date][meal] };
        delete mealData[locationIdStr];
        updated[date] = {
          ...updated[date],
          [meal]: mealData,
        };
      }
      return updated;
    });
  };

  // Clear all menu structure cache
  const clearMenuStructure = (): void => {
    setMenuStructureCache({});
  };

  // Clear menu structure for a specific date
  const clearMenuStructureForDate = (date: DateKey): void => {
    setMenuStructureCache((prev) => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
  };

  return {
    // State
    menuStructureCacheLoading,
    menuStructureCache,

    // Getters
    getApiIdsForMenu,
    getApiIdsForMenusForLocations,
    getApiIdsForMenusForMealsLocations,

    // Checkers
    hasApiIds,

    // Setters
    setApiIdsForMenu,
    setApiIdsForMenusForLocations,
    setApiIdsForMenusForMealsLocations,

    // Removers
    removeApiIdsForMenu,

    // Clearers
    clearMenuStructure,
    clearMenuStructureForDate,
  };
}

/**
 * Hook for managing menu items cache.
 *
 * @returns Object with cache state and functions.
 */
export function useMenuItemsCache() {
  // Menu items cache
  const [menuItemsCache, setMenuItemsCache, menuItemsCacheLoading] = useLocalStorage<MenuItemMap>({
    key: CACHE_KEYS.MENU_ITEMS,
    initialValue: {},
  });

  // Get a single menu item by API ID
  const getMenuItem = (apiId: ApiId): MenuItem | undefined => {
    return menuItemsCache?.[String(apiId)];
  };

  // Get multiple menu items by API IDs
  const getMenuItems = (apiIds: Menu): MenuItemMap => {
    const menuItems: MenuItemMap = {};
    apiIds.forEach((apiId) => {
      const menuItem = menuItemsCache?.[String(apiId)];
      if (menuItem) {
        menuItems[String(apiId)] = menuItem;
      }
    });
    return menuItems;
  };

  // Check if a menu item exists in cache
  const hasMenuItem = (apiId: ApiId): boolean => {
    const apiIdStr = String(apiId);
    return apiIdStr in menuItemsCache && menuItemsCache[apiIdStr] !== undefined;
  };

  // Set a single menu item in cache
  const setMenuItem = (menuItem: MenuItem): void => {
    if (menuItem.apiId === null || menuItem.apiId === undefined) return;
    const apiId = menuItem.apiId;
    setMenuItemsCache((prev) => ({
      ...prev,
      [String(apiId)]: menuItem,
    }));
  };

  // Set multiple menu items in cache
  const setMenuItems = (menuItems: MenuItemMap): void => {
    setMenuItemsCache((prev) => {
      const updated = { ...prev };
      Object.entries(menuItems).forEach(([apiId, menuItem]) => {
        updated[apiId] = menuItem;
      });
      return updated;
    });
  };

  // Remove a menu item from cache
  const removeMenuItem = (apiId: ApiId): void => {
    setMenuItemsCache((prev) => {
      const updated = { ...prev };
      delete updated[String(apiId)];
      return updated;
    });
  };

  // Clear all menu items cache
  const clearMenuItems = (): void => {
    setMenuItemsCache({});
  };

  return {
    // State
    menuItemsCacheLoading,
    menuItemsCache,

    // Getters
    getMenuItem,
    getMenuItems,

    // Checkers
    hasMenuItem,

    // Setters
    setMenuItem,
    setMenuItems,

    // Removers
    removeMenuItem,

    // Clearers
    clearMenuItems,
  };
}

/**
 * Hook for managing locations cache.
 *
 * @returns Object with cache state and functions.
 */
export function useLocationsCache() {
  // Locations cache
  const [locationsCache, setLocationsCache, locationsCacheLoading] = useLocalStorage<LocationMap>({
    key: CACHE_KEYS.LOCATIONS,
    initialValue: {},
  });

  // Get a single location by location ID
  const getLocation = (locationId: LocationId): Location | undefined => {
    return locationsCache?.[String(locationId)];
  };

  // Get multiple locations by location IDs
  const getLocations = (locationIds: LocationId[]): LocationMap => {
    const locations: LocationMap = {};
    locationIds.forEach((locationId) => {
      const location = locationsCache?.[String(locationId)];
      if (location) {
        locations[String(locationId)] = location;
      }
    });
    return locations;
  };

  // Get all locations from cache
  const getAllLocations = (): LocationMap => {
    return locationsCache;
  };

  // Check if a location exists in cache
  const hasLocation = (locationId: LocationId): boolean => {
    const locationIdStr = String(locationId);
    return locationIdStr in locationsCache && locationsCache[locationIdStr] !== undefined;
  };

  // Set a single location in cache
  const setLocation = (location: Location): void => {
    setLocationsCache((prev) => ({
      ...prev,
      [String(location.databaseId)]: location,
    }));
  };

  // Set multiple locations in cache
  const setLocations = (locations: LocationMap): void => {
    setLocationsCache((prev) => {
      const updated = { ...prev };
      Object.entries(locations).forEach(([locationId, location]) => {
        updated[locationId] = location;
      });
      return updated;
    });
  };

  // Remove a location from cache
  const removeLocation = (locationId: LocationId): void => {
    setLocationsCache((prev) => {
      const updated = { ...prev };
      delete updated[String(locationId)];
      return updated;
    });
  };

  // Clear all locations cache
  const clearLocations = (): void => {
    setLocationsCache({});
  };

  return {
    // State
    locationsCacheLoading,
    locationsCache,

    // Getters
    getLocation,
    getLocations,
    getAllLocations,

    // Checkers
    hasLocation,

    // Setters
    setLocation,
    setLocations,

    // Removers
    removeLocation,

    // Clearers
    clearLocations,
  };
}
