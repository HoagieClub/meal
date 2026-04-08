/**
 * @overview Hook that merges API menu data with local interaction overrides for display.
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

'use client';

import { useMemo } from 'react';
import { canonicalIndex, RESIDENTIAL_HALL_ORDER, RETAIL_LOCATION_ORDER } from '@/ordering';
import { localInteractions } from '@/hooks/use-menu-item-interactions';

/** Merge local interaction overrides over API data for a single menu item. */
function mergeInteraction(menuItemId: string, apiInteraction: any, apiMetrics: any) {
  const local = localInteractions.get(menuItemId);
  if (!local) return { userInteraction: apiInteraction, metrics: apiMetrics };

  const apiLiked = apiInteraction?.liked === true ? true : apiInteraction?.liked === false ? false : null;
  const mergedInteraction = { ...apiInteraction, ...local };

  let likeCount = apiMetrics?.likeCount ?? 0;
  let dislikeCount = apiMetrics?.dislikeCount ?? 0;

  if (local.liked !== undefined && local.liked !== apiLiked) {
    if (apiLiked === true && local.liked !== true) likeCount--;
    if (apiLiked === false && local.liked !== false) dislikeCount--;
    if (local.liked === true && apiLiked !== true) likeCount++;
    if (local.liked === false && apiLiked !== false) dislikeCount++;
  }

  return {
    userInteraction: mergedInteraction,
    metrics: apiMetrics ? { ...apiMetrics, likeCount, dislikeCount } : apiMetrics,
  };
}

/** Residential: locationId -> meal (Breakfast/Lunch/Dinner) -> category -> itemIds */
function buildResidentialLocationMenuShape(
  locations: any,
  residentialMenus: any,
  menuItems: any,
  interactions: any,
  metrics: any,
  meal: string
) {
  const result: any[] = [];

  for (const locationId in residentialMenus) {
    const location = locations[locationId];
    if (!location || location.category !== 'residential') {
      continue;
    }

    const locationMenus = residentialMenus[locationId];
    if (!locationMenus || !locationMenus[meal]) {
      continue;
    }

    const menu: any[] = [];
    for (const station in locationMenus[meal]) {
      const stationItemIds = locationMenus[meal][station] || [];
      for (const menuItemId of stationItemIds) {
        const menuItem = menuItems[menuItemId];
        if (!menuItem || !menuItem.name) {
          continue;
        }

        const merged = mergeInteraction(menuItemId, interactions?.[menuItemId] || null, metrics?.[menuItemId] || null);
        menu.push({
          ...menuItem,
          category: station,
          metrics: merged.metrics,
          userInteraction: merged.userInteraction,
        });
      }
    }

    result.push({
      ...location,
      menu,
    });
  }

  return result;
}

/**
 * Retail: locationId -> area -> category -> itemIds[]
 * e.g. { "15": { "Grill": { "Breakfast Grill": ["600907", ...] } } }
 */
function buildRetailLocationMenuShape(
  locations: any,
  retailMenus: any,
  menuItems: any,
  interactions: any,
  metrics: any
) {
  const result: any[] = [];

  for (const locationId in retailMenus) {
    const location = locations[locationId];
    if (!location || location.category !== 'retail') {
      continue;
    }
    const locationMenus = retailMenus[locationId];
    if (!locationMenus || typeof locationMenus !== 'object') {
      continue;
    }

    const menu: any[] = [];
    for (const areaKey in locationMenus) {
      const areaVal = locationMenus[areaKey];
      if (!areaVal || typeof areaVal !== 'object') continue;

      if (Array.isArray(areaVal)) {
        for (const menuItemId of areaVal) {
          const menuItem = menuItems[menuItemId];
          if (!menuItem || !menuItem.name) continue;
          const merged = mergeInteraction(menuItemId, interactions?.[menuItemId] || null, metrics?.[menuItemId] || null);
          menu.push({
            ...menuItem,
            category: areaKey,
            metrics: merged.metrics,
            userInteraction: merged.userInteraction,
          });
        }
      } else {
        // locationId -> area -> category -> [ids]; category = "area - category"
        for (const categoryKey in areaVal) {
          const itemIds = areaVal[categoryKey];
          if (!Array.isArray(itemIds)) continue;
          const categoryLabel = categoryKey;
          for (const menuItemId of itemIds) {
            const menuItem = menuItems[menuItemId];
            if (!menuItem || !menuItem.name) continue;
            const merged = mergeInteraction(menuItemId, interactions?.[menuItemId] || null, metrics?.[menuItemId] || null);
            menu.push({
              ...menuItem,
              category: categoryLabel,
              metrics: merged.metrics,
              userInteraction: merged.userInteraction,
            });
          }
        }
      }
    }

    result.push({
      ...location,
      menu,
    });
  }

  return result;
}

function filterMenuItems(
  menu: any[],
  appliedAllergens: string[],
  searchTerm: string
) {
  const searchLower = (searchTerm || '').toLowerCase().trim();
  const allergensLower = (appliedAllergens || []).map((a: any) => a.toLowerCase().trim());
  const hasSearch = searchLower.length > 0;
  const hasAllergenFilter = allergensLower.length > 0;

  return menu.filter((menuItem) => {
    if (hasAllergenFilter) {
      const ingredientsAllergensText = `${menuItem.nutrition?.ingredients} ${menuItem.nutrition?.allergens}`.toLowerCase();
      const hasBlockedAllergen = allergensLower.some((a: any) => ingredientsAllergensText.includes(a));
      if (hasBlockedAllergen) {
        return false;
      }
    }

    if (hasSearch) {
      const searchText = `${menuItem.name} ${(menuItem.allergens || []).join(' ')} ${(menuItem.ingredients || []).join(' ')}`.toLowerCase();
      if (!searchText.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
}

function filterLocations(
  locations: any[],
  appliedDiningHalls: string[]
) {
  if (!appliedDiningHalls) {
    return locations;
  }
  if (appliedDiningHalls.length === 0) {
    return [];
  }
  const diningHallsLower = appliedDiningHalls.map((h: any) => String(h).toLowerCase().trim());
  return locations.filter((location) => {
    const locationNameLower = (location.name || '').toLowerCase().trim();
    return diningHallsLower.includes(locationNameLower);
  });
}

function filterBySort(menu: any[], sortOption: string) {
  if (sortOption === 'Starred') {
    return menu.filter((item) => item.userInteraction?.favorited === true);
  }
  return menu;
}

function sortLocations(locations: any[], pinnedHalls: string[], order: readonly string[]) {
  const locationsCopy = [...locations];

  locationsCopy.sort((a: any, b: any) => {
    const aName = String(a.name || '').trim();
    const bName = String(b.name || '').trim();
    const aPinned = pinnedHalls && pinnedHalls.length > 0 && pinnedHalls.includes(aName);
    const bPinned = pinnedHalls && pinnedHalls.length > 0 && pinnedHalls.includes(bName);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    const aIdx = canonicalIndex(aName, order);
    const bIdx = canonicalIndex(bName, order);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
  });

  return locationsCopy;
}

export const useBuildResidentialDisplayData = (
  data: any,
  preferences: any,
  searchTerm: string,
  meal: string,
  sortOption: string,
  interactionVersion: number = 0,
) => {
  const locations = data?.residentialLocations ?? {};
  const residentialMenus = data?.residentialMenus ?? {};
  const menuItems = data?.menuItems ?? {};
  const interactions = data?.interactions ?? {};
  const metrics = data?.metrics ?? {};
  const { diningHalls, allergens, pinnedHalls } = preferences;

  const displayData = useMemo(() => {
    if (!locations || !residentialMenus || !menuItems) {
      return { displayData: [], hasAnyRawLocations: false };
    }
    const shapedData = buildResidentialLocationMenuShape(
      locations,
      residentialMenus,
      menuItems,
      interactions,
      metrics,
      meal
    );

    const filteredAndSorted = shapedData.map((location) => {
      const rawMenuCount = location.menu.length;
      const filteredMenu = filterMenuItems(location.menu, allergens, searchTerm);
      const sortedMenu = filterBySort(filteredMenu, sortOption);
      return {
        ...location,
        rawMenuCount,
        menu: sortedMenu,
      };
    });

    const filteredLocations = filterLocations(filteredAndSorted, diningHalls);
    const sortedLocations = sortLocations(filteredLocations, pinnedHalls, RESIDENTIAL_HALL_ORDER);

    const missingDiningHalls = diningHalls.filter((diningHall: any) => !sortedLocations.some((location: any) => location.name === diningHall));
    const filteredMissingDiningHalls = missingDiningHalls.filter((diningHall: any) => RESIDENTIAL_HALL_ORDER.includes(diningHall));
    filteredMissingDiningHalls.forEach((diningHall: any) => {
      sortedLocations.push({
        name: diningHall,
        rawMenuCount: 0,
        menu: [],
      });
    });
    const finalLocations = sortLocations(sortedLocations, pinnedHalls, RESIDENTIAL_HALL_ORDER);
    return { displayData: finalLocations, hasAnyRawLocations: shapedData.length > 0 };
  }, [
    locations,
    residentialMenus,
    menuItems,
    interactions,
    metrics,
    diningHalls,
    allergens,
    searchTerm,
    pinnedHalls,
    meal,
    sortOption,
    interactionVersion,
  ]);

  return displayData;
};

export const useBuildRetailDisplayData = (
  data: any,
  preferences: any,
  searchTerm: string,
  sortOption: string,
  interactionVersion: number = 0,
) => {
  const locations = data?.retailLocations ?? {};
  const retailMenus = data?.retailMenus ?? {};
  const menuItems = data?.menuItems ?? {};
  const interactions = data?.interactions ?? {};
  const metrics = data?.metrics ?? {};
  const { diningHalls, allergens, pinnedHalls } = preferences;

  const displayData = useMemo(() => {
    if (!locations || !retailMenus || !menuItems) {
      return { displayData: [], hasAnyRawLocations: false };
    }
    const shapedData = buildRetailLocationMenuShape(
      locations,
      retailMenus,
      menuItems,
      interactions,
      metrics
    );

    const filteredAndSorted = shapedData.map((location) => {
      const rawMenuCount = location.menu.length;
      const filteredMenu = filterMenuItems(location.menu, allergens, searchTerm);
      const sortedMenu = filterBySort(filteredMenu, sortOption);
      return {
        ...location,
        rawMenuCount,
        menu: sortedMenu,
      };
    });

    const filteredLocations = filterLocations(filteredAndSorted, diningHalls);
    const sortedLocations = sortLocations(filteredLocations, pinnedHalls, RETAIL_LOCATION_ORDER);

    const missingDiningHalls = diningHalls.filter((diningHall: any) => !sortedLocations.some((location: any) => location.name === diningHall));
    const filteredMissingDiningHalls = missingDiningHalls.filter((diningHall: any) => RETAIL_LOCATION_ORDER.includes(diningHall));
    filteredMissingDiningHalls.forEach((diningHall: any) => {
      sortedLocations.push({
        name: diningHall,
        rawMenuCount: 0,
        menu: [],
      });
    });
    const finalLocations = sortLocations(sortedLocations, pinnedHalls, RETAIL_LOCATION_ORDER);
    return { displayData: finalLocations, hasAnyRawLocations: shapedData.length > 0 };
  }, [
    locations,
    retailMenus,
    menuItems,
    interactions,
    metrics,
    diningHalls,
    allergens,
    searchTerm,
    pinnedHalls,
    sortOption,
    interactionVersion,
  ]);

  return displayData;
};
