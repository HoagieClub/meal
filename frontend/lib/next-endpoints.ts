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
  DiningVenue,
  MenuItem,
  MenuItemInteraction,
  MenuItemMetrics,
  Menu,
  MenusForLocations,
  MenusForMealAndLocations,
  MenusForDateMealAndLocations,
  LocationMap,
} from '@/types/dining';

/**
 * Gets dining locations.
 *
 * @param params - Query parameters (category_id, fmt)
 * @returns API response with dining locations
 */
export const getDiningLocations = (params: { category_id?: string; fmt?: string } = {}) => {
  const queryParams = new URLSearchParams({
    category_id: params.category_id || '2',
    ...(params.fmt && { fmt: params.fmt }),
  });
  const url = `/api/dining/locations/?${queryParams.toString()}`;
  return api.get<{ data: LocationMap }>(url);
};

/**
 * Gets all dining locations.
 *
 * @returns API response with all dining locations
 */
export const getAllDiningLocations = () => {
  const url = '/api/dining/locations/all/';
  return api.get<{ data: LocationMap }>(url);
};

/**
 * Dining Menus API Endpoints
 */

/**
 * Gets dining menu for a specific location and menu ID.
 *
 * @param params - Query parameters (location_id, menu_id)
 * @returns API response with menu data
 */
export const getDiningMenu = (params: { location_id: string; menu_id: string }) => {
  const queryParams = new URLSearchParams({
    location_id: params.location_id,
    menu_id: params.menu_id,
  });
  const url = `/api/dining/menus/?${queryParams.toString()}`;
  return api.get<{ data: Menu }>(url);
};

/**
 * Gets dining menus for all locations for a specific menu ID.
 *
 * @param params - Query parameters (menu_id)
 * @returns API response with menus data
 */
export const getDiningMenusForLocations = (params: { menu_id: string }) => {
  const queryParams = new URLSearchParams({ menu_id: params.menu_id });
  const url = `/api/dining/menus/locations/?${queryParams.toString()}`;
  return api.get<{ data: MenusForLocations }>(url);
};

/**
 * Gets dining menus for all locations for a specific day.
 *
 * @param params - Query parameters (menu_date - YYYY-MM-DD format)
 * @returns API response with menus data
 */
export const getDiningMenusForLocationsAndDay = (params: { menu_date: string }) => {
  const queryParams = new URLSearchParams({ menu_date: params.menu_date });
  const url = `/api/dining/menus/locations/day/?${queryParams.toString()}`;
  return api.get<{ data: MenusForMealAndLocations }>(url);
};

/**
 * Gets dining menus for all locations for a date range.
 *
 * @param params - Query parameters (start_date, end_date - YYYY-MM-DD format)
 * @returns API response with menus data
 */
export const getDiningMenusForLocationsAndDays = (params: {
  start_date: string;
  end_date: string;
}) => {
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  const url = `/api/dining/menus/locations/days/?${queryParams.toString()}`;
  return api.get<{ data: MenusForDateMealAndLocations }>(url);
};

/**
 * Gets a single dining menu item by API ID.
 *
 * @param params - Query parameters (api_id)
 * @returns API response with menu item data
 */
export const getDiningMenuItem = (params: { api_id: string | number }) => {
  const queryParams = new URLSearchParams({ api_id: String(params.api_id) });
  const url = `/api/dining/menu-items/?${queryParams.toString()}`;
  return api.get<{ data: MenuItem }>(url);
};

/**
 * Gets multiple dining menu items by API IDs.
 *
 * @param params - Request body (api_ids - array of integers)
 * @returns API response with menu items data
 */
export const getDiningMenuItems = (params: { api_ids: number[] }) => {
  const url = '/api/dining/menu-items/batch/';
  return api.post<{ data: Record<string, MenuItem> }>(url, {
    api_ids: params.api_ids,
  });
};

/**
 * Gets user menu item interaction.
 *
 * @param params - Query parameters (menu_item_api_id)
 * @returns API response with interaction data
 */
export const getUserMenuItemInteraction = (params: { menu_item_api_id: string | number }) => {
  const queryParams = new URLSearchParams({ menu_item_api_id: String(params.menu_item_api_id) });
  const url = `/api/interactions/user/menu-item/?${queryParams.toString()}`;
  return api.get<{ data: MenuItemInteraction }>(url);
};

/**
 * Gets user menu item interactions for multiple menu items.
 *
 * @param params - Request body (menu_item_api_ids - array of integers)
 * @returns API response with interactions data dictionary
 */
export const getUserMenuItemsInteractions = (params: { menu_item_api_ids: number[] }) => {
  const url = '/api/interactions/user/menu-items/';
  return api.post<{ data: Record<string, MenuItemInteraction | null> }>(url, {
    menu_item_api_ids: params.menu_item_api_ids,
  });
};

/**
 * Records a user menu item view.
 *
 * @param params - Request body (menu_item_api_id)
 * @returns API response
 */
export const recordUserMenuItemView = (params: { menu_item_api_id: number }) => {
  const url = '/api/interactions/user/menu-item/view/';
  return api.post<{ data: MenuItemInteraction }>(url, {
    menu_item_api_id: params.menu_item_api_id,
  });
};

/**
 * Updates user menu item interaction (PUT).
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
  const url = '/api/interactions/user/menu-item/update/';
  return api.put<{ data: MenuItemInteraction }>(url, {
    menu_item_api_id: params.menu_item_api_id,
    liked: params.liked,
    favorited: params.favorited,
    saved_for_later: params.saved_for_later,
    would_eat_again: params.would_eat_again,
  });
};

/**
 * Patches user menu item interaction (PATCH).
 *
 * @param params - Request body (menu_item_api_id, liked, favorited, saved_for_later, would_eat_again)
 * @returns API response with updated interaction data
 */
export const patchUserMenuItemInteraction = (params: {
  menu_item_api_id: number;
  liked?: boolean | null;
  favorited?: boolean;
  saved_for_later?: boolean;
  would_eat_again?: string;
}) => {
  const url = '/api/interactions/user/menu-item/update/';
  return api.patch<{ data: MenuItemInteraction }>(url, {
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
export const getMenuItemMetrics = (params: { menu_item_api_id: string | number }) => {
  const queryParams = new URLSearchParams({ menu_item_api_id: String(params.menu_item_api_id) });
  const url = `/api/interactions/menu-item/metrics/?${queryParams.toString()}`;
  return api.get<{ data: MenuItemMetrics }>(url);
};

/**
 * Gets metrics for multiple menu items.
 *
 * @param params - Request body (menu_item_api_ids - array of integers)
 * @returns API response with metrics data dictionary
 */
export const getMenuItemsMetrics = (params: { menu_item_api_ids: number[] }) => {
  const url = '/api/interactions/menu-items/metrics/';
  return api.post<{ data: Record<string, MenuItemMetrics | null> }>(url, {
    menu_item_api_ids: params.menu_item_api_ids,
  });
};

/**
 * Gets recommendation score for a single menu item.
 *
 * @param params - Request body (menu_item_api_id - integer)
 * @returns API response with menu item score
 */
export const getMenuItemScore = (params: { menu_item_api_id: number }) => {
  const url = '/api/recommend/menu-item/';
  return api.post<{ data: number }>(url, {
    menu_item_api_id: params.menu_item_api_id,
  });
};

/**
 * Gets recommendation scores for multiple menu items.
 *
 * @param params - Request body (menu_item_api_ids - array of integers)
 * @returns API response with dictionary mapping menu item API IDs to scores
 */
export const getMenuItemsScore = (params: { menu_item_api_ids: number[] }) => {
  const url = '/api/recommend/menu-items/';
  return api.post<{ data: Record<string, number> }>(url, {
    menu_item_api_ids: params.menu_item_api_ids,
  });
};