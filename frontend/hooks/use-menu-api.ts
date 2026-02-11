/**
 * @overview Hook for calling Next.js API endpoints to fetch menu-related data.
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

export const useMenuApi = () => {
  const extractMenuItemIds = useCallback((menus: any) => {
    const menuString = JSON.stringify(menus);
    const matches = menuString.match(/"\d{6}"/g) || [];
    const ids = new Set(matches.map((match) => match.replace(/"/g, '')));
    return Array.from(ids);
  }, []);

  const fetchAll = useCallback(async (date: string, menuItemIds?: string[]) => {
    const [locationsResponse, menusResponse] = await Promise.all([
      getAllLocations(),
      getAllMenusForDate({ date }),
    ]);

    const locations = locationsResponse.data || {};
    const menus = menusResponse.data || {};
    const itemIds = menuItemIds || extractMenuItemIds(menus);

    const menuItemsResponse =
      itemIds.length > 0 ? await getMenuItems({ ids: itemIds }) : { data: {} };

    const [metricsResponse, interactionsResponse, recommendationsResponse] = await Promise.all([
      itemIds.length > 0
        ? getMenuItemsMetrics({ menu_item_api_ids: itemIds })
        : Promise.resolve({ data: {} }),
      itemIds.length > 0
        ? getUserMenuItemsInteractions({ menu_item_api_ids: itemIds })
        : Promise.resolve({ data: {} }),
      itemIds.length > 0
        ? getMenuItemsScore({ menu_item_api_ids: itemIds })
        : Promise.resolve({ data: {} }),
    ]);

    return {
      locations,
      menus,
      menuItems: menuItemsResponse.data || {},
      interactions: interactionsResponse.data || {},
      metrics: metricsResponse.data || {},
      recommendations: recommendationsResponse.data || {},
    };
  }, [extractMenuItemIds]);

  return fetchAll;
}
