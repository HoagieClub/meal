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

export const useMenuApi = () => {
  const extractMenuItemIds = useCallback((menus: any) => {
    const menuString = JSON.stringify(menus);
    const matches = menuString.match(/"\d{6}"/g) || [];
    const ids = new Set(matches.map((match) => match.replace(/"/g, '')));
    return Array.from(ids);
  }, []);

  const fetchLocations = useCallback(async () => {
    const response = await getAllLocations();
    return response.data || {};
  }, []);

  const fetchMenusForDate = useCallback(async (date: string) => {
    const [response, locations] = await Promise.all([getAllMenusForDate({ date }), fetchLocations()]);
    const allMenus: any = response.data || {};

    const residentialMenus: any = {};
    const retailMenus: any = {};
    for (const locationId in allMenus) {
      const location = (locations as any)[locationId];
      if (location?.category === 'residential') {
        residentialMenus[locationId] = allMenus[locationId];
      } else if (location?.category === 'retail') {
        retailMenus[locationId] = allMenus[locationId];
      }
    }

    return { residential: residentialMenus, retail: retailMenus };
  }, [fetchLocations]);

  const fetchMenuItems = useCallback(async (menuItemIds: string[]) => {
    if (menuItemIds.length === 0) return {};
    const response = await getMenuItems({ ids: menuItemIds });
    return response.data || {};
  }, []);

  const fetchInteractions = useCallback(async (menuItemIds: string[]) => {
    if (menuItemIds.length === 0) return {};
    const response = await getUserMenuItemsInteractions({ menu_item_api_ids: menuItemIds });
    return response.data || {};
  }, []);

  const fetchMetrics = useCallback(async (menuItemIds: string[]) => {
    if (menuItemIds.length === 0) return {};
    const response = await getMenuItemsMetrics({ menu_item_api_ids: menuItemIds });
    return response.data || {};
  }, []);

  const fetchRecommendations = useCallback(async (menuItemIds: string[]) => {
    if (menuItemIds.length === 0) return {};
    const response = await getMenuItemsScore({ menu_item_api_ids: menuItemIds });
    return response.data || {};
  }, []);

  const fetchAll = useCallback(async (date: string) => {
    const [locations, menus] = await Promise.all([fetchLocations(), fetchMenusForDate(date)]);
    const allMenus = { ...menus.residential, ...menus.retail };
    const itemIds = extractMenuItemIds(allMenus);
    const [menuItems, interactions, metrics, recommendations] = await Promise.all([
      fetchMenuItems(itemIds),
      fetchInteractions(itemIds),
      fetchMetrics(itemIds),
      fetchRecommendations(itemIds),
    ]);

    const residentialLocations = Object.fromEntries(Object.entries(locations).filter(([, value]: [string, any]) => value.category === 'residential'));
    const retailLocations = Object.fromEntries(Object.entries(locations).filter(([, value]: [string, any]) => value.category === 'retail'));

    return {
      residentialLocations,
      retailLocations,
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
