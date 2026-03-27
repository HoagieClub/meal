'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getMenusAndItemsForDate,
  getEngagementData,
} from '@/lib/next-endpoints';
import { locations as allLocations, residentialLocations, retailLocations } from '@/locations';

interface MenuData {
  residentialLocations: any;
  retailLocations: any;
  residentialMenus: any;
  retailMenus: any;
  menuItems: any;
  interactions: any;
  metrics: any;
}

// Module-level caches — persist across renders and remounts
const menuCache = new Map<string, MenuData>();
const inFlight = new Map<string, Promise<MenuData>>();

function getNext7DayKeys(): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

/** Walk the menu tree to collect all 6-digit item IDs without serializing to JSON. */
function extractMenuItemIds(menus: any): string[] {
  const ids = new Set<string>();
  for (const locationId in menus) {
    const locationMenus = menus[locationId];
    if (typeof locationMenus !== 'object' || !locationMenus) continue;
    for (const key in locationMenus) {
      const value = locationMenus[key];
      // Residential: value is { station: [id, ...] }
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        for (const station in value) {
          const stationIds = value[station];
          if (Array.isArray(stationIds)) {
            for (const id of stationIds) {
              if (typeof id === 'string' && /^\d{6}$/.test(id)) ids.add(id);
            }
          }
        }
      }
      // Retail: value is [id, ...] directly
      if (Array.isArray(value)) {
        for (const id of value) {
          if (typeof id === 'string' && /^\d{6}$/.test(id)) ids.add(id);
        }
      }
    }
  }
  return Array.from(ids);
}

function splitMenus(allMenus: any) {
  const residentialMenus: any = {};
  const retailMenus: any = {};
  for (const locationId in allMenus) {
    const loc = allLocations[locationId];
    if (loc?.category === 'residential') residentialMenus[locationId] = allMenus[locationId];
    else if (loc?.category === 'retail') retailMenus[locationId] = allMenus[locationId];
  }
  return { residentialMenus, retailMenus };
}

/** Fetch just menus + menu items (no engagement). */
async function fetchMenuData(dateKey: string): Promise<MenuData> {
  const res = await getMenusAndItemsForDate({ date: dateKey });
  const allMenus = res.data?.menus || {};
  const menuItems = res.data?.menuItems || {};
  const { residentialMenus, retailMenus } = splitMenus(allMenus);

  return {
    residentialLocations,
    retailLocations,
    residentialMenus,
    retailMenus,
    menuItems,
    interactions: {},
    metrics: {},
  };
}

/** Fetch engagement data and merge into existing MenuData. */
async function fetchEngagement(menuData: MenuData): Promise<MenuData> {
  const allMenus: any = {};
  for (const locId in menuData.residentialMenus) allMenus[locId] = menuData.residentialMenus[locId];
  for (const locId in menuData.retailMenus) allMenus[locId] = menuData.retailMenus[locId];

  const itemIds = extractMenuItemIds(allMenus);
  if (itemIds.length === 0) return menuData;

  try {
    const engagementRes = await getEngagementData({ menu_item_api_ids: itemIds });
    return {
      ...menuData,
      interactions: engagementRes.data?.interactions || {},
      metrics: engagementRes.data?.metrics || {},
    };
  } catch {
    return menuData;
  }
}

/** Full fetch (menus + engagement) for prefetching — no intermediate state needed. */
async function fetchFullDateData(dateKey: string): Promise<MenuData> {
  if (menuCache.has(dateKey)) return menuCache.get(dateKey)!;
  if (inFlight.has(dateKey)) return inFlight.get(dateKey)!;

  const promise = (async () => {
    try {
      const menuData = await fetchMenuData(dateKey);
      const fullData = await fetchEngagement(menuData);
      menuCache.set(dateKey, fullData);
      return fullData;
    } finally {
      inFlight.delete(dateKey);
    }
  })();

  inFlight.set(dateKey, promise);
  return promise;
}

function prefetchOtherDays(currentDateKey: string): void {
  for (const day of getNext7DayKeys()) {
    if (day !== currentDateKey && !menuCache.has(day) && !inFlight.has(day)) {
      fetchFullDateData(day); // fire and forget
    }
  }
}

export const useMenuApi = (dateKey: string) => {
  const [data, setData] = useState<MenuData | null>(() => menuCache.get(dateKey) ?? null);
  const [loading, setLoading] = useState(!menuCache.has(dateKey));

  useEffect(() => {
    if (!dateKey) {
      setLoading(false);
      return;
    }

    // Cache hit — show immediately
    if (menuCache.has(dateKey)) {
      setData(menuCache.get(dateKey)!);
      setLoading(false);
      prefetchOtherDays(dateKey);
      return;
    }

    let cancelled = false;

    // Phase 1: fetch menus, render immediately
    setData(null);
    setLoading(true);

    fetchMenuData(dateKey)
      .then((menuData) => {
        if (cancelled) return;
        setData(menuData);
        setLoading(false);

        // Phase 2: fetch engagement, update data in place
        return fetchEngagement(menuData).then((fullData) => {
          if (cancelled) return;
          menuCache.set(dateKey, fullData);
          setData(fullData);
          prefetchOtherDays(dateKey);
        });
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [dateKey]);

  return { data, loading };
};
