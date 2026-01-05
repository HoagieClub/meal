/**
 * @overview Centralized endpoint functions for Next.js API route calls.
 * These functions are used by frontend client components to communicate with Next.js API routes.
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

import { api } from '@/hooks/use-next-api';
import {
  MenuItem,
  MenuItemInteraction,
  MenuItemMetrics,
  MenusForMealAndLocations,
} from '@/types/dining';

/**
 * Dining API Endpoints
 */

/**
 * Gets a single dining menu item by API ID.
 *
 * @param params - Query parameters (api_id)
 * @returns API response with menu item data
 */
export const getDiningMenuItem = (params: { api_id: string | number }) => {
  const url = `/api/dining/menu/item/?api_id=${params.api_id}`;
  return api.get<MenuItem>(url);
};

/**
 * Gets dining menus for all locations for a specific day.
 *
 * @param params - Query parameters (menu_date)
 * @returns API response with menus data
 */
export const getDiningMenusForDay = (params: { menu_date: string }) => {
  const url = `/api/dining/menu/locations/day?menu_date=${params.menu_date}`;
  return api.get<MenusForMealAndLocations>(url);
};

/**
 * Interactions API Endpoints
 */

/**
 * Gets user menu item interaction.
 *
 * @param params - Query parameters (menu_item_api_id)
 * @returns API response with interaction data
 */
export const getUserMenuItemInteraction = (params: { menu_item_api_id: number | string }) => {
  const url = `/api/interactions/user/?menu_item_api_id=${params.menu_item_api_id}`;
  return api.get<MenuItemInteraction>(url);
};

/**
 * Records a user menu item view.
 *
 * @param params - Request body (menu_item_api_id)
 * @returns API response
 */
export const recordUserMenuItemView = (params: { menu_item_api_id: number }) => {
  const url = '/api/interactions/user/view/';
  return api.post(url, {
    menu_item_api_id: params.menu_item_api_id,
  });
};

/**
 * Updates user menu item interaction (PATCH).
 *
 * @param params - Request body (menu_item_api_id, liked, favorited, saved_for_later, would_eat_again)
 * @returns API response with updated interaction data
 */
export const updateUserMenuItemInteraction = (params: {
  menu_item_api_id: number;
  liked?: boolean | null;
  favorited?: boolean;
  saved_for_later?: boolean;
  would_eat_again?: string;
}) => {
  const url = '/api/interactions/user/update/';
  return api.patch(url, {
    menu_item_api_id: params.menu_item_api_id,
    liked: params.liked,
    favorited: params.favorited,
    saved_for_later: params.saved_for_later,
    would_eat_again: params.would_eat_again,
  });
};

/**
 * Gets menu item metrics.
 *
 * @param params - Query parameters (menu_item_api_id)
 * @returns API response with metrics data
 */
export const getMenuItemMetrics = (params: { menu_item_api_id: number | string }) => {
  const url = `/api/interactions/metrics/?menu_item_api_id=${params.menu_item_api_id}`;
  return api.get<MenuItemMetrics>(url);
};
