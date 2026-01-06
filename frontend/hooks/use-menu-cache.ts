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
  DiningVenue,
  MenusForDateMealAndLocations,
  MenuItemMap,
  LocationMap,
  ApiId,
  LocationId,
  DateKey,
  Menu,
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

  /**
   * Gets API IDs for a specific date, meal, and location.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param locationId - Location ID
   * @returns Array of API IDs (Menu). Returns empty array if not found.
   * @example
   * // Returns: [123, 456, 789]
   * getApiIds('2025-01-15', 'Lunch', '5')
   */
  const getApiIds = (date: DateKey, meal: Meal, locationId: LocationId): Menu => {
    return menuStructureCache?.[date]?.[meal]?.[String(locationId)] ?? [];
  };

  /**
   * Gets API IDs for all locations for a specific date and meal.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @returns Object mapping location IDs to arrays of API IDs (MenusForLocations).
   *          Returns empty object if not found.
   * @example
   * // Returns: { '5': [123, 456], '6': [789, 101] }
   * getApiIdsForMeal('2025-01-15', 'Lunch')
   */
  const getApiIdsForMeal = (date: DateKey, meal: Meal) => {
    return menuStructureCache?.[date]?.[meal] ?? {};
  };

  /**
   * Gets API IDs for all meals and locations for a specific date.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @returns Object structure: MenusForMealAndLocations.
   *          Returns undefined if date not found.
   * @example
   * // Returns: { Breakfast: { '5': [123] }, Lunch: { '5': [456], '6': [789] } }
   * getApiIdsForDate('2025-01-15')
   */
  const getApiIdsForDate = (date: DateKey): MenusForDateMealAndLocations[DateKey] | undefined => {
    return menuStructureCache?.[date];
  };

  /**
   * Checks if API IDs exist for a specific date, meal, and location.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param locationId - Location ID
   * @returns Boolean indicating if API IDs exist in cache.
   */
  const hasApiIds = (date: DateKey, meal: Meal, locationId: LocationId): boolean => {
    const apiIds = getApiIds(date, meal, locationId);
    return apiIds.length > 0;
  };

  /**
   * Sets API IDs for a specific date, meal, and location.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param locationId - Location ID
   * @param apiIds - Array of menu item API IDs to store (Menu)
   * @returns void
   */
  const setApiIds = (date: DateKey, meal: Meal, locationId: LocationId, apiIds: Menu): void => {
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

  /**
   * Sets API IDs for all locations for a specific date and meal.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param apiIdsByLocation - Object mapping location IDs to arrays of API IDs (MenusForLocations)
   * @returns void
   * @example
   * // Usage: setApiIdsForMeal('2025-01-15', 'Lunch', { '5': [123, 456], '6': [789] })
   */
  const setApiIdsForMeal = (
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

  /**
   * Sets API IDs for all meals and locations for a specific date.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param apiIdsByMealAndLocation - Object structure: MenusForMealAndLocations
   * @returns void
   * @example
   * // Usage: setApiIdsForDate('2025-01-15', { Breakfast: { '5': [123] }, Lunch: { '5': [456], '6': [789] } })
   */
  const setApiIdsForDate = (
    date: DateKey,
    apiIdsByMealAndLocation: MenusForDateMealAndLocations[DateKey]
  ): void => {
    setMenuStructureCache((prev) => ({
      ...prev,
      [date]: apiIdsByMealAndLocation,
    }));
  };

  /**
   * Removes API IDs for a specific date, meal, and location.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param locationId - Location ID
   * @returns void
   */
  const removeApiIds = (date: DateKey, meal: Meal, locationId: LocationId): void => {
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

  /**
   * Clears all menu structure cache.
   *
   * @returns void
   */
  const clearMenuStructure = (): void => {
    setMenuStructureCache({});
  };

  /**
   * Clears menu structure for a specific date.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @returns void
   */
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
    getApiIds,
    getApiIdsForMeal,
    getApiIdsForDate,

    // Checkers
    hasApiIds,

    // Setters
    setApiIds,
    setApiIdsForMeal,
    setApiIdsForDate,

    // Removers
    removeApiIds,

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

  /**
   * Gets a single menu item by API ID.
   *
   * @param apiId - Menu item API ID
   * @returns MenuItem object or undefined if not found.
   *          Structure: { apiId, name, description, calories, allergens, ingredients, dietaryFlags, ... }
   */
  const getMenuItem = (apiId: ApiId): MenuItem | undefined => {
    return menuItemsCache?.[String(apiId)];
  };

  /**
   * Gets multiple menu items by API IDs.
   *
   * @param apiIds - Array of menu item API IDs (Menu)
   * @returns Dictionary of MenuItem objects. Only includes items that exist in cache.
   *          Structure: { [apiId: string]: MenuItem }
   * @example
   * // Returns: { '123': { apiId: 123, name: 'Pizza', ... }, '456': { apiId: 456, name: 'Pasta', ... } }
   * getMenuItems([123, 456, 999]) // 999 will be filtered out if not in cache
   */
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

  /**
   * Checks if a menu item exists in cache.
   *
   * @param apiId - Menu item API ID
   * @returns Boolean indicating if menu item exists in cache.
   */
  const hasMenuItem = (apiId: ApiId): boolean => {
    const apiIdStr = String(apiId);
    return apiIdStr in menuItemsCache && menuItemsCache[apiIdStr] !== undefined;
  };

  /**
   * Sets a single menu item in cache.
   *
   * @param menuItem - MenuItem object to store. Structure: { apiId, name, description, calories, allergens, ingredients, dietaryFlags, ... }
   * @returns void
   */
  const setMenuItem = (menuItem: MenuItem): void => {
    if (menuItem.apiId === null || menuItem.apiId === undefined) return;
    const apiId = menuItem.apiId;
    setMenuItemsCache((prev) => ({
      ...prev,
      [String(apiId)]: menuItem,
    }));
  };

  /**
   * Sets multiple menu items in cache.
   *
   * @param menuItems - Dictionary of MenuItem objects to store. Structure: { [apiId: string]: MenuItem }
   * @returns void
   */
  const setMenuItems = (menuItems: MenuItemMap): void => {
    setMenuItemsCache((prev) => {
      const updated = { ...prev };
      Object.entries(menuItems).forEach(([apiId, menuItem]) => {
        updated[apiId] = menuItem;
      });
      return updated;
    });
  };

  /**
   * Removes a menu item from cache.
   *
   * @param apiId - Menu item API ID to remove
   * @returns void
   */
  const removeMenuItem = (apiId: ApiId): void => {
    setMenuItemsCache((prev) => {
      const updated = { ...prev };
      delete updated[String(apiId)];
      return updated;
    });
  };

  /**
   * Clears all menu items cache.
   *
   * @returns void
   */
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

  /**
   * Gets a single location by location ID.
   *
   * @param locationId - Location ID
   * @returns DiningVenue object or undefined if not found.
   *          Structure: { databaseId, name, mapName, latitude, longitude, buildingName, amenities, isActive, categoryId }
   */
  const getLocation = (locationId: LocationId): DiningVenue | undefined => {
    return locationsCache?.[String(locationId)];
  };

  /**
   * Gets multiple locations by location IDs.
   *
   * @param locationIds - Array of location IDs
   * @returns Dictionary of DiningVenue objects. Only includes locations that exist in cache.
   *          Structure: { [locationId: string]: DiningVenue }
   * @example
   * // Returns: { '5': { databaseId: 5, name: 'Forbes College', ... }, '6': { databaseId: 6, name: 'Whitman', ... } }
   * getLocations(['5', '6', '999']) // '999' will be filtered out if not in cache
   */
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

  /**
   * Gets all locations from cache.
   *
   * @returns Dictionary of all DiningVenue objects in cache.
   *          Structure: { [locationId: string]: DiningVenue }
   */
  const getAllLocations = (): LocationMap => {
    return locationsCache;
  };

  /**
   * Checks if a location exists in cache.
   *
   * @param locationId - Location ID
   * @returns Boolean indicating if location exists in cache.
   */
  const hasLocation = (locationId: LocationId): boolean => {
    const locationIdStr = String(locationId);
    return locationIdStr in locationsCache && locationsCache[locationIdStr] !== undefined;
  };

  /**
   * Sets a single location in cache.
   *
   * @param location - DiningVenue object to store. Uses location.databaseId as the key.
   *                  Structure: { databaseId, name, mapName, latitude, longitude, buildingName, amenities, isActive, categoryId }
   * @returns void
   */
  const setLocation = (location: DiningVenue): void => {
    setLocationsCache((prev) => ({
      ...prev,
      [String(location.databaseId)]: location,
    }));
  };

  /**
   * Sets multiple locations in cache.
   *
   * @param locations - Dictionary of DiningVenue objects to store. Structure: { [locationId: string]: DiningVenue }
   * @returns void
   */
  const setLocations = (locations: LocationMap): void => {
    setLocationsCache((prev) => {
      const updated = { ...prev };
      Object.entries(locations).forEach(([locationId, location]) => {
        updated[locationId] = location;
      });
      return updated;
    });
  };

  /**
   * Removes a location from cache.
   *
   * @param locationId - Location ID to remove
   * @returns void
   */
  const removeLocation = (locationId: LocationId): void => {
    setLocationsCache((prev) => {
      const updated = { ...prev };
      delete updated[String(locationId)];
      return updated;
    });
  };

  /**
   * Clears all locations cache.
   *
   * @returns void
   */
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
