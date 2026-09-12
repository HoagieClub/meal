'use client';

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { LOCATIONS } from '@/lib/constants';
import { getEngagementData, getMenusAndItemsForDate } from '@/lib/endpoints';
import { toDateKey, upcomingDates } from '@/lib/utils';
import type { MenuData, MenusByLocation, MenuTree } from '@/types';

const PREFETCH_DAYS = 7;
// How long a day's data is shown before being re-checked in the background. Menus change during the day.
const STALE_AFTER_MS = 10 * 60 * 1000;

/** First element of every menus query key, so all cached days can be found at once. */
export const MENUS_KEY = 'menus';

function splitByCategory(menus: MenusByLocation) {
  const residentialMenus: MenusByLocation = {};
  const retailMenus: MenusByLocation = {};
  for (const [locationId, tree] of Object.entries(menus)) {
    const category = LOCATIONS[locationId]?.category;
    if (category === 'residential') residentialMenus[locationId] = tree;
    else if (category === 'retail') retailMenus[locationId] = tree;
  }
  return { residentialMenus, retailMenus };
}

/** Every menu item id in a set of menu trees, whatever their nesting depth. */
function collectItemIds(menus: MenusByLocation): string[] {
  const ids = new Set<string>();
  const walk = (node: MenuTree | string[]) => {
    if (Array.isArray(node)) node.forEach((id) => ids.add(id));
    else Object.values(node).forEach(walk);
  };
  Object.values(menus).forEach(walk);
  return Array.from(ids);
}

function hasMenus(data: MenuData | undefined): boolean {
  if (!data) return false;
  return Object.keys(data.residentialMenus).length + Object.keys(data.retailMenus).length > 0;
}

/** A day's menus and items from the backend, with like counts and the user's own likes merged in. */
async function fetchMenuData(dateKey: string): Promise<MenuData> {
  const { menus, menuItems } = await getMenusAndItemsForDate(dateKey);
  const data: MenuData = {
    ...splitByCategory(menus ?? {}),
    menuItems: menuItems ?? {},
    interactions: {},
    metrics: {},
  };

  const itemIds = collectItemIds({ ...data.residentialMenus, ...data.retailMenus });
  if (itemIds.length === 0) return data;
  try {
    const engagement = await getEngagementData(itemIds);
    return { ...data, interactions: engagement.interactions, metrics: engagement.metrics };
  } catch {
    // Engagement is optional; the menus are still usable without it.
    return data;
  }
}

/** The key includes who is logged in, because the answer contains that user's likes. */
function menusQuery(dateKey: string, userId: string) {
  return queryOptions({
    queryKey: [MENUS_KEY, dateKey, userId],
    queryFn: () => fetchMenuData(dateKey),
    // An empty day may simply not be published yet, so it is re-checked on the next visit.
    staleTime: (query) => (hasMenus(query.state.data) ? STALE_AFTER_MS : 0),
  });
}

/**
 * Menu data for one day. Cached days show immediately and are re-checked in the background once
 * stale; after a day loads, the coming week is prefetched so switching days feels instant.
 */
export function useMenus(dateKey: string) {
  const { user } = useUser();
  const userId = user?.sub ?? 'anonymous';
  const client = useQueryClient();
  const query = useQuery(menusQuery(dateKey, userId));

  useEffect(() => {
    if (!query.isSuccess) return;
    for (const date of upcomingDates(PREFETCH_DAYS)) {
      const key = toDateKey(date);
      if (key !== dateKey) void client.prefetchQuery(menusQuery(key, userId));
    }
  }, [query.isSuccess, dateKey, userId, client]);

  return query;
}
