/**
 * @overview Simple hook for managing menu, location, and menu item caches in local storage.
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
import { MenuItem, Location } from '@/types/types';

// Menu structure: date -> locationId -> meal -> station -> menuItemIds[]
type MenuStructure = {
    [locationId: string]: {
        [meal: string]: {
            [station: string]: string[];
        };
    };
};

type MenusCache = {
    [date: string]: MenuStructure;
};

type LocationsCache = {
    [locationId: string]: Location;
};

type MenuItemsCache = {
    [menuItemId: string]: MenuItem;
};

const CACHE_KEYS = {
    MENUS: 'menusCache',
    LOCATIONS: 'locationsCache',
    MENU_ITEMS: 'menuItemsCache',
} as const;

/**
 * Hook for managing menus cache.
 * Structure: date (YYYY-MM-DD) -> locationId -> meal -> station -> menuItemIds[]
 */
export function useMenusCache() {
    const [menusCache, setMenusCache, menusCacheLoading] = useLocalStorage<MenusCache>({
        key: CACHE_KEYS.MENUS,
        initialValue: {},
    });

    // Get menus for a specific date
    const getMenusForDate = (date: string): MenuStructure | undefined => {
        return menusCache[date];
    };

    // Set menus for a specific date
    const setMenusForDate = (date: string, menus: MenuStructure): void => {
        setMenusCache((prev) => ({
            ...prev,
            [date]: menus,
        }));
    };

    // Check if menus exist for a date
    const hasMenusForDate = (date: string): boolean => {
        return date in menusCache && menusCache[date] !== undefined;
    };

    // Clear all menus
    const clearAllMenus = (): void => {
        setMenusCache({});
    };

    return {
        menusCache,
        menusCacheLoading,
        getMenusForDate,
        setMenusForDate,
        hasMenusForDate,
        clearAllMenus,
    };
}

/**
 * Hook for managing locations cache.
 * Structure: locationId -> Location
 */
export function useLocationsCache() {
    const [locationsCache, setLocationsCache, locationsCacheLoading] = useLocalStorage<LocationsCache>({
        key: CACHE_KEYS.LOCATIONS,
        initialValue: {},
    });

    // Get a location by ID
    const getLocation = (locationId: string): Location | undefined => {
        return locationsCache[locationId];
    };

    // Get all locations
    const getAllLocations = (): LocationsCache => {
        return locationsCache;
    };

    // Set multiple locations
    const setLocations = (locations: LocationsCache): void => {
        setLocationsCache((prev) => ({
            ...prev,
            ...locations,
        }));
    };

    // Check if a location exists
    const hasLocation = (locationId: string): boolean => {
        return locationId in locationsCache && locationsCache[locationId] !== undefined;
    };

    // Clear all locations
    const clearAllLocations = (): void => {
        setLocationsCache({});
    };

    return {
        locationsCache,
        locationsCacheLoading,
        getLocation,
        getAllLocations,
        setLocations,
        hasLocation,
        clearAllLocations,
    };
}

/**
 * Hook for managing menu items cache.
 * Structure: menuItemId -> MenuItem
 */
export function useMenuItemsCache() {
    const [menuItemsCache, setMenuItemsCache, menuItemsCacheLoading] = useLocalStorage<MenuItemsCache>({
        key: CACHE_KEYS.MENU_ITEMS,
        initialValue: {},
    });

    // Get a menu item by ID
    const getMenuItem = (menuItemId: string): MenuItem | undefined => {
        return menuItemsCache[menuItemId];
    };

    // Get multiple menu items by IDs
    const getMenuItems = (menuItemIds: string[]): MenuItemsCache => {
        const items: MenuItemsCache = {};
        menuItemIds.forEach((id) => {
            if (menuItemsCache[id]) {
                items[id] = menuItemsCache[id];
            }
        });
        return items;
    };

    // Set a menu item
    const setMenuItem = (menuItemId: string, menuItem: MenuItem): void => {
        setMenuItemsCache((prev) => ({
            ...prev,
            [menuItemId]: menuItem,
        }));
    };

    // Set multiple menu items
    const setMenuItems = (menuItems: MenuItemsCache): void => {
        setMenuItemsCache((prev) => ({
            ...prev,
            ...menuItems,
        }));
    };

    // Check if a menu item exists
    const hasMenuItem = (menuItemId: string): boolean => {
        return menuItemId in menuItemsCache && menuItemsCache[menuItemId] !== undefined;
    };

    // Clear all menu items
    const clearAllMenuItems = (): void => {
        setMenuItemsCache({});
    };

    return {
        menuItemsCache,
        menuItemsCacheLoading,
        getMenuItem,
        getMenuItems,
        setMenuItem,
        setMenuItems,
        hasMenuItem,
        clearAllMenuItems,
    };
}
