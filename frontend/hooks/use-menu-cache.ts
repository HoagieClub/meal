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
import { MenuItem, Meal, DiningVenue } from '@/types/dining';

/**
 * Cache structure: date -> meal -> location -> api_ids[]
 */
type MenuStructureCache = {
  [date: string]: {
    [meal in Meal]?: {
      [locationId: string]: number[];
    };
  };
};

/**
 * Cache structure: api_id -> MenuItem
 */
type MenuItemsCache = {
  [apiId: number]: MenuItem;
};

/**
 * Cache structure: location_id -> DiningVenue
 */
type LocationsCache = {
  [locationId: string]: DiningVenue;
};

const CACHE_KEYS = {
  MENU_STRUCTURE: 'menuStructureCache',
  MENU_ITEMS: 'menuItemsCache',
  LOCATIONS: 'locationsCache',
} as const;

/**
 * Hook for managing menu structure, menu items, and locations caches.
 *
 * @returns Object with cache state and functions:
 *   - State: { loading, menuStructureCache, menuItemsCache, locationsCache }
 *   - Getters: { getApiIds, getApiIdsForMeal, getApiIdsForDate, getMenuItem, getMenuItems, getMenuItemsForLocation, getMenuItemsForMeal, getLocation, getLocations, getAllLocations }
 *   - Checkers: { hasApiIds, hasMenuItem, hasLocation }
 *   - Setters: { setApiIds, setApiIdsForMeal, setApiIdsForDate, setMenuItem, setMenuItems, setLocation, setLocations }
 *   - Removers: { removeApiIds, removeMenuItem, removeMenuItems, removeLocation, removeLocations }
 *   - Clearers: { clearMenuStructure, clearMenuStructureForDate, clearMenuItems, clearLocations }
 */
export function useCache() {
  const [menuStructureCache, setMenuStructureCache, menuStructureLoading] =
    useLocalStorage<MenuStructureCache>({
      key: CACHE_KEYS.MENU_STRUCTURE,
      initialValue: {},
    });

  const [menuItemsCache, setMenuItemsCache, menuItemsLoading] = useLocalStorage<MenuItemsCache>({
    key: CACHE_KEYS.MENU_ITEMS,
    initialValue: {},
  });

  const [locationsCache, setLocationsCache, locationsLoading] = useLocalStorage<LocationsCache>({
    key: CACHE_KEYS.LOCATIONS,
    initialValue: {},
  });

  const loading = menuStructureLoading || menuItemsLoading || locationsLoading;

  /**
   * Gets API IDs for a specific date, meal, and location.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param locationId - Location ID string
   * @returns Array of API IDs (number[]). Returns empty array if not found.
   * @example
   * // Returns: [123, 456, 789]
   * getApiIds('2025-01-15', 'Lunch', '5')
   */
  const getApiIds = (date: string, meal: Meal, locationId: string): number[] => {
    return menuStructureCache?.[date]?.[meal]?.[locationId] ?? [];
  };

  /**
   * Gets API IDs for all locations for a specific date and meal.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @returns Object mapping location IDs to arrays of API IDs ({ [locationId: string]: number[] }).
   *          Returns empty object if not found.
   * @example
   * // Returns: { '5': [123, 456], '6': [789, 101] }
   * getApiIdsForMeal('2025-01-15', 'Lunch')
   */
  const getApiIdsForMeal = (date: string, meal: Meal): { [locationId: string]: number[] } => {
    return menuStructureCache?.[date]?.[meal] ?? {};
  };

  /**
   * Gets API IDs for all meals and locations for a specific date.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @returns Object structure: { [meal: Meal]?: { [locationId: string]: number[] } }.
   *          Returns undefined if date not found.
   * @example
   * // Returns: { Breakfast: { '5': [123] }, Lunch: { '5': [456], '6': [789] } }
   * getApiIdsForDate('2025-01-15')
   */
  const getApiIdsForDate = (date: string): MenuStructureCache[string] | undefined => {
    return menuStructureCache?.[date];
  };

  /**
   * Gets a single menu item by API ID.
   *
   * @param apiId - Menu item API ID
   * @returns MenuItem object or undefined if not found.
   *          Structure: { apiId, name, description, calories, allergens, ingredients, dietaryFlags, ... }
   */
  const getMenuItem = (apiId: number): MenuItem | undefined => {
    return menuItemsCache?.[apiId];
  };

  /**
   * Gets multiple menu items by API IDs.
   *
   * @param apiIds - Array of menu item API IDs
   * @returns Array of MenuItem objects. Only includes items that exist in cache.
   *          Structure: MenuItem[]
   * @example
   * // Returns: [{ apiId: 123, name: 'Pizza', ... }, { apiId: 456, name: 'Pasta', ... }]
   * getMenuItems([123, 456, 999]) // 999 will be filtered out if not in cache
   */
  const getMenuItems = (apiIds: number[]): MenuItem[] => {
    return apiIds
      .map((apiId) => menuItemsCache?.[apiId])
      .filter((item): item is MenuItem => item !== undefined);
  };

  /**
   * Gets menu items for a specific date, meal, and location.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param locationId - Location ID string
   * @returns Array of MenuItem objects for that location.
   *          Structure: MenuItem[]
   */
  const getMenuItemsForLocation = (date: string, meal: Meal, locationId: string): MenuItem[] => {
    const apiIds = getApiIds(date, meal, locationId);
    return getMenuItems(apiIds);
  };

  /**
   * Gets menu items for all locations for a specific date and meal.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @returns Object mapping location IDs to arrays of MenuItem objects.
   *          Structure: { [locationId: string]: MenuItem[] }
   * @example
   * // Returns: { '5': [{ apiId: 123, name: 'Pizza', ... }], '6': [{ apiId: 456, name: 'Pasta', ... }] }
   * getMenuItemsForMeal('2025-01-15', 'Lunch')
   */
  const getMenuItemsForMeal = (date: string, meal: Meal): { [locationId: string]: MenuItem[] } => {
    const apiIdsByLocation = getApiIdsForMeal(date, meal);
    const result: { [locationId: string]: MenuItem[] } = {};
    for (const [locationId, apiIds] of Object.entries(apiIdsByLocation)) {
      result[locationId] = getMenuItems(apiIds);
    }
    return result;
  };

  /**
   * Checks if API IDs exist for a specific date, meal, and location.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param locationId - Location ID string
   * @returns Boolean indicating if API IDs exist in cache.
   */
  const hasApiIds = (date: string, meal: Meal, locationId: string): boolean => {
    const apiIds = getApiIds(date, meal, locationId);
    return apiIds.length > 0;
  };

  /**
   * Checks if a menu item exists in cache.
   *
   * @param apiId - Menu item API ID
   * @returns Boolean indicating if menu item exists in cache.
   */
  const hasMenuItem = (apiId: number): boolean => {
    return apiId in menuItemsCache && menuItemsCache[apiId] !== undefined;
  };

  /**
   * Gets a single location by location ID.
   *
   * @param locationId - Location ID string
   * @returns DiningVenue object or undefined if not found.
   *          Structure: { databaseId, name, mapName, latitude, longitude, buildingName, amenities, isActive, categoryId }
   */
  const getLocation = (locationId: string): DiningVenue | undefined => {
    return locationsCache?.[locationId];
  };

  /**
   * Gets multiple locations by location IDs.
   *
   * @param locationIds - Array of location ID strings
   * @returns Array of DiningVenue objects. Only includes locations that exist in cache.
   *          Structure: DiningVenue[]
   * @example
   * // Returns: [{ databaseId: 5, name: 'Forbes College', ... }, { databaseId: 6, name: 'Whitman', ... }]
   * getLocations(['5', '6', '999']) // '999' will be filtered out if not in cache
   */
  const getLocations = (locationIds: string[]): DiningVenue[] => {
    return locationIds
      .map((locationId) => locationsCache?.[locationId])
      .filter((location): location is DiningVenue => location !== undefined);
  };

  /**
   * Gets all locations from cache.
   *
   * @returns Array of all DiningVenue objects in cache.
   *          Structure: DiningVenue[]
   */
  const getAllLocations = (): DiningVenue[] => {
    return Object.values(locationsCache);
  };

  /**
   * Checks if a location exists in cache.
   *
   * @param locationId - Location ID string
   * @returns Boolean indicating if location exists in cache.
   */
  const hasLocation = (locationId: string): boolean => {
    return locationId in locationsCache && locationsCache[locationId] !== undefined;
  };

  /**
   * Sets API IDs for a specific date, meal, and location.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param locationId - Location ID string
   * @param apiIds - Array of menu item API IDs to store
   * @returns void
   */
  const setApiIds = (date: string, meal: Meal, locationId: string, apiIds: number[]): void => {
    setMenuStructureCache((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [meal]: {
          ...prev[date]?.[meal],
          [locationId]: apiIds,
        },
      },
    }));
  };

  /**
   * Sets API IDs for all locations for a specific date and meal.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param apiIdsByLocation - Object mapping location IDs to arrays of API IDs.
   *                          Structure: { [locationId: string]: number[] }
   * @returns void
   * @example
   * // Usage: setApiIdsForMeal('2025-01-15', 'Lunch', { '5': [123, 456], '6': [789] })
   */
  const setApiIdsForMeal = (
    date: string,
    meal: Meal,
    apiIdsByLocation: { [locationId: string]: number[] }
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
   * @param apiIdsByMealAndLocation - Object structure: { [meal: Meal]?: { [locationId: string]: number[] } }
   * @returns void
   * @example
   * // Usage: setApiIdsForDate('2025-01-15', { Breakfast: { '5': [123] }, Lunch: { '5': [456], '6': [789] } })
   */
  const setApiIdsForDate = (
    date: string,
    apiIdsByMealAndLocation: MenuStructureCache[string]
  ): void => {
    setMenuStructureCache((prev) => ({
      ...prev,
      [date]: apiIdsByMealAndLocation,
    }));
  };

  /**
   * Sets a single menu item in cache.
   *
   * @param menuItem - MenuItem object to store. Structure: { apiId, name, description, calories, allergens, ingredients, dietaryFlags, ... }
   * @returns void
   */
  const setMenuItem = (menuItem: MenuItem): void => {
    setMenuItemsCache((prev) => ({
      ...prev,
      [menuItem.apiId]: menuItem,
    }));
  };

  /**
   * Sets multiple menu items in cache.
   *
   * @param menuItems - Array of MenuItem objects to store. Structure: MenuItem[]
   * @returns void
   */
  const setMenuItems = (menuItems: MenuItem[]): void => {
    setMenuItemsCache((prev) => {
      const updated = { ...prev };
      menuItems.forEach((item) => {
        updated[item.apiId] = item;
      });
      return updated;
    });
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
   * @param locations - Array of DiningVenue objects to store. Structure: DiningVenue[]
   * @returns void
   */
  const setLocations = (locations: DiningVenue[]): void => {
    setLocationsCache((prev) => {
      const updated = { ...prev };
      locations.forEach((location) => {
        updated[String(location.databaseId)] = location;
      });
      return updated;
    });
  };

  /**
   * Removes API IDs for a specific date, meal, and location.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @param meal - Meal type (Breakfast, Lunch, or Dinner)
   * @param locationId - Location ID string
   * @returns void
   */
  const removeApiIds = (date: string, meal: Meal, locationId: string): void => {
    setMenuStructureCache((prev) => {
      const updated = { ...prev };
      if (updated[date]?.[meal]?.[locationId]) {
        const mealData = { ...updated[date][meal] };
        delete mealData[locationId];
        updated[date] = {
          ...updated[date],
          [meal]: mealData,
        };
      }
      return updated;
    });
  };

  /**
   * Removes a menu item from cache.
   *
   * @param apiId - Menu item API ID to remove
   * @returns void
   */
  const removeMenuItem = (apiId: number): void => {
    setMenuItemsCache((prev) => {
      const updated = { ...prev };
      delete updated[apiId];
      return updated;
    });
  };

  /**
   * Removes multiple menu items from cache.
   *
   * @param apiIds - Array of menu item API IDs to remove
   * @returns void
   */
  const removeMenuItems = (apiIds: number[]): void => {
    setMenuItemsCache((prev) => {
      const updated = { ...prev };
      apiIds.forEach((apiId) => {
        delete updated[apiId];
      });
      return updated;
    });
  };

  /**
   * Removes a location from cache.
   *
   * @param locationId - Location ID string to remove
   * @returns void
   */
  const removeLocation = (locationId: string): void => {
    setLocationsCache((prev) => {
      const updated = { ...prev };
      delete updated[locationId];
      return updated;
    });
  };

  /**
   * Removes multiple locations from cache.
   *
   * @param locationIds - Array of location ID strings to remove
   * @returns void
   */
  const removeLocations = (locationIds: string[]): void => {
    setLocationsCache((prev) => {
      const updated = { ...prev };
      locationIds.forEach((locationId) => {
        delete updated[locationId];
      });
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
  const clearMenuStructureForDate = (date: string): void => {
    setMenuStructureCache((prev) => {
      const updated = { ...prev };
      delete updated[date];
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
    loading,
    menuStructureCache,
    menuItemsCache,
    locationsCache,

    // Getters
    getApiIds,
    getApiIdsForMeal,
    getApiIdsForDate,
    getMenuItem,
    getMenuItems,
    getMenuItemsForLocation,
    getMenuItemsForMeal,
    getLocation,
    getLocations,
    getAllLocations,

    // Checkers
    hasApiIds,
    hasMenuItem,
    hasLocation,

    // Setters
    setApiIds,
    setApiIdsForMeal,
    setApiIdsForDate,
    setMenuItem,
    setMenuItems,
    setLocation,
    setLocations,

    // Removers
    removeApiIds,
    removeMenuItem,
    removeMenuItems,
    removeLocation,
    removeLocations,

    // Clearers
    clearMenuStructure,
    clearMenuStructureForDate,
    clearMenuItems,
    clearLocations,
  };
}
