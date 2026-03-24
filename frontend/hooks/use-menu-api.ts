'use client';

import { useState, useEffect } from 'react';
import {
  getAllMenusForDate,
  getMenuItems,
  getUserMenuItemsInteractions,
  getMenuItemsMetrics,
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

// Module-level — persists across renders and remounts
const dataCache = new Map<string, MenuData>();
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

async function fetchDateData(dateKey: string): Promise<MenuData> {
  if (dataCache.has(dateKey)) return dataCache.get(dateKey)!;
  if (inFlight.has(dateKey)) return inFlight.get(dateKey)!;

  const promise = (async (): Promise<MenuData> => {
    try {
      const menusRes = await getAllMenusForDate({ date: dateKey });

      const allMenus: any = menusRes.data || {};

      const residentialMenus: any = {};
      const retailMenus: any = {};
      for (const locationId in allMenus) {
        const loc = allLocations[locationId];
        if (loc?.category === 'residential') residentialMenus[locationId] = allMenus[locationId];
        else if (loc?.category === 'retail') retailMenus[locationId] = allMenus[locationId];
      }

      const itemIds = extractMenuItemIds(allMenus);

      let menuItems: any = {};
      let interactions: any = {};
      let metrics: any = {};

      if (itemIds.length > 0) {
        const [menuItemsRes, interactionsRes, metricsRes] = await Promise.all([
          getMenuItems({ ids: itemIds }),
          getUserMenuItemsInteractions({ menu_item_api_ids: itemIds }),
          getMenuItemsMetrics({ menu_item_api_ids: itemIds }),
        ]);
        menuItems = menuItemsRes.data || {};
        interactions = interactionsRes.data || {};
        metrics = metricsRes.data || {};
      }

      const result: MenuData = {
        residentialLocations,
        retailLocations,
        residentialMenus,
        retailMenus,
        menuItems,
        interactions,
        metrics,
      };

      dataCache.set(dateKey, result);
      return result;
    } finally {
      inFlight.delete(dateKey);
    }
  })();

  inFlight.set(dateKey, promise);
  return promise;
}

function prefetchOtherDays(currentDateKey: string): void {
  for (const day of getNext7DayKeys()) {
    if (day !== currentDateKey && !dataCache.has(day) && !inFlight.has(day)) {
      fetchDateData(day); // fire and forget
    }
  }
}

export const useMenuApi = (dateKey: string) => {
  const [data, setData] = useState<MenuData | null>(() => dataCache.get(dateKey) ?? null);
  const [loading, setLoading] = useState(!dataCache.has(dateKey));

  useEffect(() => {
    if (dataCache.has(dateKey)) {
      setData(dataCache.get(dateKey)!);
      setLoading(false);
      prefetchOtherDays(dateKey);
      return;
    }

    let cancelled = false;
    setData(null);
    setLoading(true);

    fetchDateData(dateKey)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
        prefetchOtherDays(dateKey);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [dateKey]);

  return { data, loading };
};
