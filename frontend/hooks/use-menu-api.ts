'use client';

import { useState, useEffect } from 'react';
import {
  getAllLocations,
  getAllMenusForDate,
  getMenuItems,
  getUserMenuItemsInteractions,
  getMenuItemsMetrics,
  getMenuItemsScore,
} from '@/lib/next-endpoints';

interface MenuData {
  residentialLocations: any;
  retailLocations: any;
  residentialMenus: any;
  retailMenus: any;
  menuItems: any;
  interactions: any;
  metrics: any;
  recommendations: any;
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

function extractMenuItemIds(menus: any): string[] {
  const matches = JSON.stringify(menus).match(/"\d{6}"/g) || [];
  return Array.from(new Set(matches.map((m) => m.replace(/"/g, ''))));
}

async function fetchDateData(dateKey: string): Promise<MenuData> {
  if (dataCache.has(dateKey)) return dataCache.get(dateKey)!;
  if (inFlight.has(dateKey)) return inFlight.get(dateKey)!;

  const promise = (async (): Promise<MenuData> => {
    try {
      const [locationsRes, menusRes] = await Promise.all([
        getAllLocations(),
        getAllMenusForDate({ date: dateKey }),
      ]);

      const locations: any = locationsRes.data || {};
      const allMenus: any = menusRes.data || {};

      const residentialMenus: any = {};
      const retailMenus: any = {};
      for (const locationId in allMenus) {
        const loc = locations[locationId];
        if (loc?.category === 'residential') residentialMenus[locationId] = allMenus[locationId];
        else if (loc?.category === 'retail') retailMenus[locationId] = allMenus[locationId];
      }

      const itemIds = extractMenuItemIds(allMenus);

      let menuItems: any = {};
      let interactions: any = {};
      let metrics: any = {};
      let recommendations: any = {};

      if (itemIds.length > 0) {
        const [menuItemsRes, interactionsRes, metricsRes, recommendationsRes] = await Promise.all([
          getMenuItems({ ids: itemIds }),
          getUserMenuItemsInteractions({ menu_item_api_ids: itemIds }),
          getMenuItemsMetrics({ menu_item_api_ids: itemIds }),
          getMenuItemsScore({ menu_item_api_ids: itemIds }),
        ]);
        menuItems = menuItemsRes.data || {};
        interactions = interactionsRes.data || {};
        metrics = metricsRes.data || {};
        recommendations = recommendationsRes.data || {};
      }

      const residentialLocations = Object.fromEntries(
        Object.entries(locations).filter(([, v]: [string, any]) => v.category === 'residential')
      );
      const retailLocations = Object.fromEntries(
        Object.entries(locations).filter(([, v]: [string, any]) => v.category === 'retail')
      );

      const result: MenuData = {
        residentialLocations,
        retailLocations,
        residentialMenus,
        retailMenus,
        menuItems,
        interactions,
        metrics,
        recommendations,
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
