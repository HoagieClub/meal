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
} from '@/types/types';

/**
 * Gets all menus and their menu items for a date.
 *
 * @param params - Query parameters (date - YYYY-MM-DD format)
 * @returns API response with { menus, menuItems } data
 */
export const getMenusAndItemsForDate = (params: { date: string }) => {
    const queryParams = new URLSearchParams({ date: params.date });
    const url = `/api/menus/?${queryParams.toString()}`;
    return api.get<{ data: { menus: any; menuItems: Record<string, MenuItem> } }>(url);
};

/**
 * Gets engagement data (interactions + metrics) for multiple menu items.
 *
 * @param params - Request body (menu_item_api_ids - array of strings)
 * @returns API response with { interactions, metrics } data
 */
export const getEngagementData = (params: { menu_item_api_ids: string[] }) => {
    const url = '/api/engagement/';
    return api.post<{ data: { interactions: Record<string, MenuItemInteraction | null>; metrics: Record<string, MenuItemMetrics | null> } }>(url, {
        menu_item_api_ids: params.menu_item_api_ids,
    });
};

/**
 * Patches user menu item interaction.
 *
 * @param params - Request body (menu_item_api_id, liked, favorited, saved_for_later, would_eat_again)
 * @returns API response with updated interaction data
 */
export const patchUserMenuItemInteraction = (params: {
    menu_item_api_id: string;
    liked?: boolean | null;
    favorited?: boolean;
    saved_for_later?: boolean;
    would_eat_again?: string;
}) => {
    const url = '/api/engagement/interaction/';
    return api.patch<{ data: MenuItemInteraction }>(url, {
        menu_item_api_id: params.menu_item_api_id,
        liked: params.liked,
        favorited: params.favorited,
        saved_for_later: params.saved_for_later,
        would_eat_again: params.would_eat_again,
    });
};

/**
 * Verifies user authentication and gets or creates the user.
 *
 * @returns API response with user data
 */
export const verifyUser = () => {
    const url = '/api/user/';
    return api.post<{ data: any }>(url, {});
};
