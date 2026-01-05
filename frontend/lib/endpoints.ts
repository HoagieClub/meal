/**
 * @overview Centralized endpoint functions for Django backend API calls.
 * These functions are used by Next.js API routes to communicate with the Django backend.
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

import { request } from '@/lib/http';

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
  return request.get<any>()(url, {});
};

/**
 * Gets all dining locations.
 *
 * @returns API response with all dining locations
 */
export const getAllDiningLocations = () => {
  const url = '/api/dining/locations/all/';
  return request.get<any>()(url, {});
};

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
  return request.get<any>()(url, {});
};

/**
 * Gets a single dining menu item by API ID.
 *
 * @param params - Query parameters (api_id)
 * @returns API response with menu item data
 */
export const getDiningMenuItem = (params: { api_id: string }) => {
  const queryParams = new URLSearchParams({ api_id: params.api_id });
  const url = `/api/dining/menu-items/?${queryParams.toString()}`;
  return request.get<any>()(url, {});
};

/**
 * Gets multiple dining menu items by API IDs.
 *
 * @param params - Query parameters (api_ids - comma-separated string of integers)
 * @returns API response with menu items data
 */
export const getDiningMenuItems = (params: { api_ids: string }) => {
  const queryParams = new URLSearchParams({ api_ids: params.api_ids });
  const url = `/api/dining/menu-items/batch/?${queryParams.toString()}`;
  return request.get<any>()(url, {});
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
  return request.get<any>()(url, {});
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
  return request.get<any>()(url, {});
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
  return request.get<any>()(url, {});
};

/**
 * Gets user menu item interaction.
 *
 * @param accessToken - Auth0 access token
 * @param params - Query parameters (menu_item_api_id)
 * @returns API response with interaction data
 */
export const getUserMenuItemInteraction = (
  accessToken: string,
  params: { menu_item_api_id: string }
) => {
  const queryParams = new URLSearchParams({ menu_item_api_id: params.menu_item_api_id });
  const url = `/api/interactions/user/menu-item/?${queryParams.toString()}`;
  return request.getAuth(accessToken)(url, {});
};

/**
 * Records a user menu item view.
 *
 * @param accessToken - Auth0 access token
 * @param params - Request body (menu_item_api_id)
 * @returns API response
 */
export const recordUserMenuItemView = (
  accessToken: string,
  params: { menu_item_api_id: number }
) => {
  const url = '/api/interactions/user/menu-item/view/';
  return request.postAuth(accessToken)(url, {
    arg: { menu_item_api_id: params.menu_item_api_id },
  });
};

/**
 * Updates user menu item interaction (PUT).
 *
 * @param accessToken - Auth0 access token
 * @param params - Request body (menu_item_api_id, liked, favorited, saved_for_later, would_eat_again)
 * @returns API response with updated interaction data
 */
export const updateUserMenuItemInteraction = (
  accessToken: string,
  params: {
    menu_item_api_id: number;
    liked?: boolean | null;
    favorited?: boolean;
    saved_for_later?: boolean;
    would_eat_again?: string;
  }
) => {
  const url = '/api/interactions/user/menu-item/update/';
  return request.putAuth(accessToken)(url, {
    arg: {
      menu_item_api_id: params.menu_item_api_id,
      liked: params.liked,
      favorited: params.favorited,
      saved_for_later: params.saved_for_later,
      would_eat_again: params.would_eat_again,
    },
  });
};

/**
 * Patches user menu item interaction (PATCH).
 *
 * @param accessToken - Auth0 access token
 * @param params - Request body (menu_item_api_id, liked, favorited, saved_for_later, would_eat_again)
 * @returns API response with updated interaction data
 */
export const patchUserMenuItemInteraction = (
  accessToken: string,
  params: {
    menu_item_api_id: number;
    liked?: boolean | null;
    favorited?: boolean;
    saved_for_later?: boolean;
    would_eat_again?: string;
  }
) => {
  const url = '/api/interactions/user/menu-item/update/';
  return request.patchAuth(accessToken)(url, {
    arg: {
      menu_item_api_id: params.menu_item_api_id,
      liked: params.liked,
      favorited: params.favorited,
      saved_for_later: params.saved_for_later,
      would_eat_again: params.would_eat_again,
    },
  });
};

/**
 * Gets menu item metrics.
 *
 * @param params - Query parameters (menu_item_api_id)
 * @returns API response with metrics data
 */
export const getMenuItemMetrics = (params: { menu_item_api_id: string }) => {
  const queryParams = new URLSearchParams({ menu_item_api_id: params.menu_item_api_id });
  const url = `/api/interactions/menu-item/metrics/?${queryParams.toString()}`;
  return request.get<any>()(url, {});
};

/**
 * Gets metrics for multiple menu items.
 *
 * @param params - Request body (menu_item_api_ids - array of integers)
 * @returns API response with metrics data dictionary
 */
export const getMenuItemsMetrics = (params: { menu_item_api_ids: number[] }) => {
  const url = '/api/interactions/menu-items/metrics/';
  return request.post<any>()(url, {
    arg: { menu_item_api_ids: params.menu_item_api_ids },
  });
};

/**
 * Verifies user authentication and gets or creates the user.
 *
 * @param accessToken - Auth0 access token
 * @returns API response with user data
 */
export const verifyUser = (accessToken: string) => {
  const url = '/api/user/verify/';
  return request.postAuth(accessToken)(url, { arg: {} });
};
