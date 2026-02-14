/**
 * @overview Hook for calling Next.js API endpoints to fetch menu-related data with cache-first strategy.
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

import { useCallback } from 'react';
import {
  getAllLocations,
  getAllMenusForDate,
  getMenuItems,
  getUserMenuItemsInteractions,
  getMenuItemsMetrics,
  getMenuItemsScore,
} from '@/lib/next-endpoints';
import {
  useLocationsCache,
  useResidentialMenusCache,
  useRetailMenusCache,
  useMenuItemsCache,
  useInteractionsCache,
  useMetricsCache,
  useRecommendationsCache,
} from '@/hooks/use-menu-cache';

export const useMenuApi = () => {
  const locationsCache = useLocationsCache();
  const residentialMenusCache = useResidentialMenusCache();
  const retailMenusCache = useRetailMenusCache();
  const menuItemsCache = useMenuItemsCache();
  const interactionsCache = useInteractionsCache();
  const metricsCache = useMetricsCache();
  const recommendationsCache = useRecommendationsCache();

  const extractMenuItemIds = useCallback((menus: any) => {
    const menuString = JSON.stringify(menus);
    const matches = menuString.match(/"\d{6}"/g) || [];
    const ids = new Set(matches.map((match) => match.replace(/"/g, '')));
    return Array.from(ids);
  }, []);

  const fetchLocations = useCallback(async () => {
    const cached = locationsCache.locationsCache;
    if (cached && Object.keys(cached).length > 0) {
      return cached;
    }
    const response = await getAllLocations();
    const locations = response.data || {};
    if (Object.keys(locations).length > 0) {
      locationsCache.setLocations(locations);
    }
    return locations;
  }, [locationsCache]);

  const fetchMenusForDate = useCallback(async (date: string) => {
    const cachedResidential = residentialMenusCache.getResidentialMenusForDate(date);
    const cachedRetail = retailMenusCache.getRetailMenusForDate(date);
    if (cachedResidential && Object.keys(cachedResidential).length > 0 && cachedRetail && Object.keys(cachedRetail).length > 0) {
      return {
        residential: cachedResidential,
        retail: cachedRetail,
      };
    }

    const response = await getAllMenusForDate({ date });
    const allMenus: any = response.data || {};
    const locations: any = await fetchLocations();

    const residentialMenus: any = {};
    const retailMenus: any = {};
    for (const locationId in allMenus) {
      const location = locations[locationId];
      if (location?.category === 'residential') {
        residentialMenus[locationId] = allMenus[locationId];
      } else if (location?.category === 'retail') {
        retailMenus[locationId] = allMenus[locationId];
      }
    }

    if (Object.keys(residentialMenus).length > 0) {
      residentialMenusCache.setResidentialMenusForDate(date, residentialMenus);
    }
    if (Object.keys(retailMenus).length > 0) {
      retailMenusCache.setRetailMenusForDate(date, retailMenus);
    }
    return {
      residential: residentialMenus,
      retail: retailMenus,
    };
  }, [residentialMenusCache, retailMenusCache, fetchLocations]);

  const fetchMenuItems = useCallback(async (menuItemIds: string[]) => {
    if (menuItemIds.length === 0) {
      return {};
    }
    const cached: any = menuItemsCache.menuItemsCache;
    const missingIds = menuItemIds.filter((id) => !cached[id]);

    if (missingIds.length === 0) {
      const result: any = {};
      menuItemIds.forEach((id) => {
        result[id] = cached[id];
      });
      return result;
    }

    const response = await getMenuItems({ ids: missingIds });
    const menuItems = response.data || {};
    menuItemsCache.setMenuItems(menuItems);
    const result: any = { ...cached };
    Object.assign(result, menuItems);
    return result;
  }, [menuItemsCache]);

  const fetchInteractions = useCallback(async (menuItemIds: string[]) => {
    if (menuItemIds.length === 0) {
      return {};
    }
    const cached: any = interactionsCache.interactionsCache;
    const missingIds = menuItemIds.filter((id) => !cached[id]);
    if (missingIds.length === 0) {
      const result: any = {};
      menuItemIds.forEach((id) => {
        result[id] = cached[id];
      });
      return result;
    }

    const response = await getUserMenuItemsInteractions({ menu_item_api_ids: missingIds });
    const interactions = response.data || {};
    interactionsCache.setInteractions(interactions);
    const result: any = { ...cached };
    Object.assign(result, interactions);
    return result;
  }, [interactionsCache]);

  const fetchMetrics = useCallback(async (menuItemIds: string[]) => {
    if (menuItemIds.length === 0) {
      return {};
    }
    const cached: any = metricsCache.metricsCache;
    const missingIds = menuItemIds.filter((id) => !cached[id]);
    if (missingIds.length === 0) {
      const result: any = {};
      menuItemIds.forEach((id) => {
        result[id] = cached[id];
      });
      return result;
    }

    const response = await getMenuItemsMetrics({ menu_item_api_ids: missingIds });
    const metrics = response.data || {};
    metricsCache.setMetrics(metrics);
    const result: any = { ...cached };
    Object.assign(result, metrics);
    return result;
  }, [metricsCache]);

  const fetchRecommendations = useCallback(async (menuItemIds: string[]) => {
    if (menuItemIds.length === 0) {
      return {};
    }
    const cached: any = recommendationsCache.recommendationsCache;
    const missingIds = menuItemIds.filter((id) => cached[id] === undefined);

    if (missingIds.length === 0) {
      const result: any = {};
      menuItemIds.forEach((id) => {
        result[id] = cached[id];
      });
      return result;
    }

    const response = await getMenuItemsScore({ menu_item_api_ids: missingIds });
    const recommendations = response.data || {};
    recommendationsCache.setRecommendations(recommendations);
    const result: any = { ...cached };
    Object.assign(result, recommendations);
    return result;
  }, [recommendationsCache]);

  const fetchAll = useCallback(async (date: string) => {
    const [locations, menus] = await Promise.all([fetchLocations(), fetchMenusForDate(date)]);
    const allMenus = { ...menus.residential, ...menus.retail };
    const itemIds = extractMenuItemIds(allMenus);
    const menuItems = await fetchMenuItems(itemIds);
    const [interactions, metrics, recommendations] = await Promise.all([
      fetchInteractions(itemIds),
      fetchMetrics(itemIds),
      fetchRecommendations(itemIds),
    ]);

    return {
      locations,
      menus: allMenus,
      residentialMenus: menus.residential || {},
      retailMenus: menus.retail || {},
      menuItems,
      interactions,
      metrics,
      recommendations,
    };
  }, [fetchLocations, fetchMenusForDate, fetchMenuItems, fetchInteractions, fetchMetrics, fetchRecommendations, extractMenuItemIds]);

  return {
    fetchLocations,
    fetchMenusForDate,
    fetchMenuItems,
    fetchInteractions,
    fetchMetrics,
    fetchRecommendations,
    fetchAll,
  };
};
