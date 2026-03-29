/**
 * @overview Centralized endpoint functions for backend API calls.
 * Menu data goes through Next.js rewrites (/backend/...) for speed — no serverless function.
 * Authenticated endpoints (engagement, interactions) go through Next.js proxy routes
 * which handle auth token extraction server-side.
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

import { api } from '@/lib/api';
import { toCamelCase } from '@/utils/toCamelCase';
import {
  MenuItemInteraction,
  MenuItemMetrics,
} from '@/types/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_HOAGIE_API_URL || 'http://localhost:8000';

// TODO: move to Next.js rewrite once upgraded to Next.js 15
export const getMenusAndItemsForDate = async (params: { date: string }) => {
  const queryParams = new URLSearchParams({ date: params.date });
  const res = await fetch(`${BACKEND_URL}/api/menus/?${queryParams.toString()}`);
  const json = await res.json();
  return {
    status: json?.status || res.status,
    message: json?.message || 'Success',
    data: json?.data ? toCamelCase(json.data) : null,
    error: json?.error || null,
  };
};

export const getEngagementData = (params: { menu_item_api_ids: string[] }) => {
  const url = '/api/engagement/';
  return api.post<{ data: { interactions: Record<string, MenuItemInteraction | null>; metrics: Record<string, MenuItemMetrics | null> } }>(url, {
    menu_item_api_ids: params.menu_item_api_ids,
  });
};

export const getRecommendationScores = (params: { menu_item_api_ids: string[] }) => {
  const url = '/api/recommend/';
  return api.post<{ data: Record<string, number> }>(url, {
    menu_item_api_ids: params.menu_item_api_ids,
  });
};

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
