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
import { toCamelCase } from '@/utils/toCamelCase';

/**
 * Gets all locations.
 *
 * @returns API response with all locations
 */
export const getAllLocations = async () => {
  const url = '/api/locations/';
  return request
    .get<any>()(url, {})
    .then((res) => ({
      ...res,
      data: res.data ? toCamelCase(res.data) : null,
    }));
};


/**
 * Gets or caches menu items by IDs.
 *
 * @param params - Request body (ids - comma-separated string or array)
 * @returns API response with menu items data
 */
export const getMenuItems = async (params: { ids: string | string[] }) => {
  const ids = Array.isArray(params.ids) ? params.ids.join(',') : params.ids;
  const url = `/api/menu-items/?ids=${encodeURIComponent(ids)}`;
  return request
    .get<any>()(url, {})
    .then((res) => ({
      ...res,
      data: res.data ? toCamelCase(res.data) : null,
    }));
};

/**
 * Gets all menus for a date.
 *
 * @param params - Query parameters (date - YYYY-MM-DD format)
 * @returns API response with menus data
 */
export const getAllMenusForDate = async (params: { date: string }) => {
  const queryParams = new URLSearchParams({ date: params.date });
  const url = `/api/menus/?${queryParams.toString()}`;
  return request
    .get<any>()(url, {})
    .then((res) => ({
      ...res,
      data: res.data ? toCamelCase(res.data) : null,
    }));
};

/**
 * Gets user menu item interactions for multiple menu items.
 *
 * @param accessToken - Auth0 access token
 * @param params - Request body (menu_item_api_ids - array of strings)
 * @returns API response with interactions data dictionary
 */
export const getUserMenuItemsInteractions = async (
  accessToken: string,
  params: { menu_item_api_ids: string[] }
) => {
  const url = '/api/engagement/interactions/';
  return request
    .postAuth(accessToken)(url, {
      arg: { menu_item_api_ids: params.menu_item_api_ids },
    })
    .then((res) => ({
      ...res,
      data: res.data ? toCamelCase(res.data) : null,
    }));
};

/**
 * Patches user menu item interaction (PATCH).
 *
 * @param accessToken - Auth0 access token
 * @param params - Request body (menu_item_api_id, liked, favorited, saved_for_later, would_eat_again)
 * @returns API response with updated interaction data
 */
export const patchUserMenuItemInteraction = async (
  accessToken: string,
  params: {
    menu_item_api_id: string;
    liked?: boolean | null;
    favorited?: boolean;
    saved_for_later?: boolean;
    would_eat_again?: string;
  }
) => {
  const url = '/api/engagement/interaction/';
  return request
    .patchAuth(accessToken)(url, {
      arg: {
        menu_item_api_id: params.menu_item_api_id,
        liked: params.liked,
        favorited: params.favorited,
        saved_for_later: params.saved_for_later,
        would_eat_again: params.would_eat_again,
      },
    })
    .then((res) => ({
      ...res,
      data: res.data ? toCamelCase(res.data) : null,
    }));
};

/**
 * Gets metrics for multiple menu items.
 *
 * @param params - Request body (menu_item_api_ids - array of strings)
 * @returns API response with metrics data dictionary
 */
export const getMenuItemsMetrics = async (params: { menu_item_api_ids: string | string[] }) => {
  const ids = Array.isArray(params.menu_item_api_ids) ? params.menu_item_api_ids.join(',') : params.menu_item_api_ids;
  const url = `/api/engagement/metrics/?menu_item_api_ids=${encodeURIComponent(ids)}`;
  return request
    .get<any>()(url, {})
    .then((res) => ({
      ...res,
      data: res.data ? toCamelCase(res.data) : null,
    }));
};

/**
 * Gets recommendation scores for multiple menu items.
 *
 * @param accessToken - Auth0 access token
 * @param params - Request body (menu_item_api_ids - array of strings)
 * @returns API response with dictionary mapping menu item API IDs to scores
 */
export const getMenuItemsScore = async (
  accessToken: string,
  params: { menu_item_api_ids: string[] }
) => {
  const url = '/api/recommend/';
  return request
    .postAuth(accessToken)(url, {
      arg: { menu_item_api_ids: params.menu_item_api_ids },
    })
    .then((res) => ({
      ...res,
      data: res.data ? toCamelCase(res.data) : null,
    }));
};

/**
 * Verifies user authentication and gets or creates the user.
 *
 * @param accessToken - Auth0 access token
 * @returns API response with user data
 */
export const verifyUser = async (accessToken: string) => {
  const url = '/api/user/';
  return request
    .postAuth(accessToken)(url, { arg: {} })
    .then((res) => ({
      ...res,
      data: res.data ? toCamelCase(res.data) : null,
    }));
};
