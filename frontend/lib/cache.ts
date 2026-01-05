'use client';

import {
  MenusForDateMealAndLocations,
  MenuItem,
  MenuItemMetrics,
  Meal,
  MenusForMealAndLocations,
  MenusForLocations,
} from '@/types/dining';
import { useLocalStorage } from '@/hooks/use-local-storage';

export const CACHE_KEYS = {
  MENUS_FOR_DATE_MEAL_AND_LOCATIONS: 'menuCache',
  MENU_ITEMS_BY_API_ID: 'menuItemsByApiId',
  MENU_ITEM_METRICS_BY_API_ID: 'menuItemMetricsByApiId',
} as const;

export const useMenusForDateMealAndLocationsCache = () => {
  const [cache, setCache, loading] = useLocalStorage<MenusForDateMealAndLocations>({
    key: CACHE_KEYS.MENUS_FOR_DATE_MEAL_AND_LOCATIONS,
    initialValue: {},
  });
  return { cache, setCache, loading };
};

export const getMenusForLocationsCache = ({
  cache,
  dateKey,
  meal,
}: {
  cache: MenusForDateMealAndLocations;
  dateKey: string;
  meal: Meal;
}): MenusForLocations => {
  return cache?.[dateKey]?.[meal] ?? [];
};

const getMenuItemsCache = (): MenuItemsByApiIdCache => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(CACHE_KEYS.MENU_ITEMS_BY_API_ID);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const setMenuItemsCache = (cache: MenuItemsByApiIdCache): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CACHE_KEYS.MENU_ITEMS_BY_API_ID, JSON.stringify(cache));
};

const getMenuItemMetricsCache = (): MenuItemMetricsByApiIdCache => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(CACHE_KEYS.MENU_ITEM_METRICS_BY_API_ID);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const setMenuItemMetricsCache = (cache: MenuItemMetricsByApiIdCache): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CACHE_KEYS.MENU_ITEM_METRICS_BY_API_ID, JSON.stringify(cache));
};

export const getMenusByDate = (dateKey: string): MenusForMealAndLocations | undefined => {
  const cache = getMenusCache();
  return cache[dateKey];
};

export const getMenusByDateAndMeal = (dateKey: string, meal: Meal) => {
  const menus = getMenusByDate(dateKey);
  return menus?.[meal];
};

export const setMenusByDate = (dateKey: string, menus: MenusForMealAndLocations): void => {
  const cache = getMenusCache();
  const updatedCache = {
    ...cache,
    [dateKey]: menus,
  };
  setMenusCache(updatedCache);
};

export const hasMenusByDate = (dateKey: string): boolean => {
  const cache = getMenusCache();
  return dateKey in cache && cache[dateKey] !== undefined;
};

export const hasMenusByDateAndMeal = (dateKey: string, meal: Meal): boolean => {
  const menus = getMenusByDate(dateKey);
  return menus !== undefined && menus[meal] !== undefined;
};

export const clearMenusByDate = (dateKey: string): void => {
  const cache = getMenusCache();
  const newCache = { ...cache };
  delete newCache[dateKey];
  setMenusCache(newCache);
};

export const clearAllMenus = (): void => {
  setMenusCache({});
};

export const getMenuItemByApiId = (apiId: number): MenuItem | undefined => {
  const cache = getMenuItemsCache();
  return cache[apiId];
};

export const getMenuItemsByApiIds = (apiIds: number[]): MenuItemsByApiIdCache => {
  const cache = getMenuItemsCache();
  const result: MenuItemsByApiIdCache = {};
  apiIds.forEach((apiId) => {
    const item = cache[apiId];
    if (item !== undefined) {
      result[apiId] = item;
    }
  });
  return result;
};

export const setMenuItemByApiId = (menuItem: MenuItem): void => {
  const cache = getMenuItemsCache();
  const updatedCache = {
    ...cache,
    [menuItem.apiId]: menuItem,
  };
  setMenuItemsCache(updatedCache);
};

export const setMenuItemsByApiIds = (menuItems: MenuItem[]): void => {
  const cache = getMenuItemsCache();
  const newCache = { ...cache };
  menuItems.forEach((item) => {
    newCache[item.apiId] = item;
  });
  setMenuItemsCache(newCache);
};

export const hasMenuItemByApiId = (apiId: number): boolean => {
  const cache = getMenuItemsCache();
  return apiId in cache && cache[apiId] !== undefined;
};

export const removeMenuItemByApiId = (apiId: number): void => {
  const cache = getMenuItemsCache();
  const newCache = { ...cache };
  delete newCache[apiId];
  setMenuItemsCache(newCache);
};

export const clearAllMenuItems = (): void => {
  setMenuItemsCache({});
};

export const getMenuItemMetricsByApiId = (apiId: number): MenuItemMetrics | undefined => {
  const cache = getMenuItemMetricsCache();
  return cache[apiId];
};

export const getMenuItemMetricsByApiIds = (apiIds: number[]): MenuItemMetricsByApiIdCache => {
  const cache = getMenuItemMetricsCache();
  const result: MenuItemMetricsByApiIdCache = {};
  apiIds.forEach((apiId) => {
    const metrics = cache[apiId];
    if (metrics !== undefined) {
      result[apiId] = metrics;
    }
  });
  return result;
};

export const setMenuItemMetricsByApiId = (apiId: number, metrics: MenuItemMetrics): void => {
  const cache = getMenuItemMetricsCache();
  const updatedCache = {
    ...cache,
    [apiId]: metrics,
  };
  setMenuItemMetricsCache(updatedCache);
};

export const setMenuItemMetricsByApiIds = (metricsMap: MenuItemMetricsByApiIdCache): void => {
  const cache = getMenuItemMetricsCache();
  const updatedCache = {
    ...cache,
    ...metricsMap,
  };
  setMenuItemMetricsCache(updatedCache);
};

export const updateMenuItemMetricsByApiIds = (
  metricsMap: Partial<MenuItemMetricsByApiIdCache>
): void => {
  const cache = getMenuItemMetricsCache();
  const updatedCache: MenuItemMetricsByApiIdCache = { ...cache };
  Object.entries(metricsMap).forEach(([apiId, metrics]) => {
    if (metrics !== undefined) {
      updatedCache[Number(apiId)] = metrics;
    }
  });
  setMenuItemMetricsCache(updatedCache);
};

export const hasMenuItemMetricsByApiId = (apiId: number): boolean => {
  const cache = getMenuItemMetricsCache();
  return apiId in cache && cache[apiId] !== undefined;
};

export const removeMenuItemMetricsByApiId = (apiId: number): void => {
  const cache = getMenuItemMetricsCache();
  const newCache = { ...cache };
  delete newCache[apiId];
  setMenuItemMetricsCache(newCache);
};

export const clearAllMenuItemMetrics = (): void => {
  setMenuItemMetricsCache({});
};
