'use client';

import { useMemo } from 'react';
import { canonicalIndex, RESIDENTIAL_HALL_ORDER, RETAIL_LOCATION_ORDER } from '@/ordering';

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

        menu.push({
          ...menuItem,
          category: station,
          metrics: metrics?.[menuItemId] || null,
          userInteraction: interactions?.[menuItemId] || null,
        });
      }
    }

    if (menu.length > 0) {
      result.push({
        ...location,
        menu,
      });
    }
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
        // Flat fallback: areaKey as category
        for (const menuItemId of areaVal) {
          const menuItem = menuItems[menuItemId];
          if (!menuItem || !menuItem.name) continue;
          menu.push({
            ...menuItem,
            category: areaKey,
            metrics: metrics?.[menuItemId] || null,
            userInteraction: interactions?.[menuItemId] || null,
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
            menu.push({
              ...menuItem,
              category: categoryLabel,
              metrics: metrics?.[menuItemId] || null,
              userInteraction: interactions?.[menuItemId] || null,
            });
          }
        }
      }
    }

    if (menu.length > 0) {
      result.push({
        ...location,
        menu,
      });
    }
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
  console.log(appliedDiningHalls)
  if (!appliedDiningHalls || appliedDiningHalls.length === 0) {
    return locations;
  }
  const diningHallsLower = appliedDiningHalls.map((h: any) => String(h).toLowerCase().trim());
  return locations.filter((location) => {
    const locationNameLower = (location.name || '').toLowerCase().trim();
    return diningHallsLower.includes(locationNameLower);
  });
}

function sortMenuItems(menu: any[], sortOption: string, recommendations: any) {
  const menuCopy = [...menu];

  if (sortOption === 'Category') {
    menuCopy.sort((a: any, b: any) => {
      const categoryA = String(a.category || '').trim();
      const categoryB = String(b.category || '').trim();
      return categoryA.localeCompare(categoryB, undefined, { sensitivity: 'base' });
    });
  } else if (sortOption === 'Recommended') {
    menuCopy.sort((a: any, b: any) => {
      const scoreA = recommendations?.[a.id] || 0;
      const scoreB = recommendations?.[b.id] || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      const categoryA = String(a.category || '').trim();
      const categoryB = String(b.category || '').trim();
      return categoryA.localeCompare(categoryB, undefined, { sensitivity: 'base' });
    });
  } else if (sortOption === 'Most Liked') {
    menuCopy.sort((a: any, b: any) => {
      const likeA = a.metrics?.likeCount > 0 ? a.metrics.likeCount : -(a.metrics?.dislikeCount || 0);
      const likeB = b.metrics?.likeCount > 0 ? b.metrics.likeCount : -(b.metrics?.dislikeCount || 0);
      if (likeB !== likeA) {
        return likeB - likeA;
      }
      const categoryA = String(a.category || '').trim();
      const categoryB = String(b.category || '').trim();
      return categoryA.localeCompare(categoryB, undefined, { sensitivity: 'base' });
    });
  } else {
    menuCopy.sort((a: any, b: any) => {
      const scoreA = a.metrics?.averageLikeScore || 0;
      const scoreB = b.metrics?.averageLikeScore || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      const categoryA = String(a.category || '').trim();
      const categoryB = String(b.category || '').trim();
      return categoryA.localeCompare(categoryB, undefined, { sensitivity: 'base' });
    });
  }

  return menuCopy;
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

export const useBuildResidentialDisplayData = ({
  locations,
  residentialMenus,
  menuItems,
  interactions,
  metrics,
  recommendations,
  appliedDiningHalls,
  appliedAllergens,
  searchTerm,
  pinnedHalls,
  meal,
  sortOption,
}: any) => {
  const displayData = useMemo(() => {
    if (!locations || !residentialMenus || !menuItems) {
      return [];
    }
    const shapedData = buildResidentialLocationMenuShape(
      locations,
      residentialMenus,
      menuItems,
      interactions,
      metrics,
      meal
    );

    const filteredAndSorted = shapedData
      .map((location) => {
        const filteredMenu = filterMenuItems(location.menu, appliedAllergens, searchTerm);
        if (filteredMenu.length === 0) {
          return null;
        }
        const sortedMenu = sortMenuItems(filteredMenu, sortOption, recommendations);
        return {
          ...location,
          menu: sortedMenu,
        };
      })
      .filter((location) => location !== null) as any[];

    const filteredLocations = filterLocations(filteredAndSorted, appliedDiningHalls);
    const sortedLocations = sortLocations(filteredLocations, pinnedHalls, RESIDENTIAL_HALL_ORDER);
    return sortedLocations;
  }, [
    locations,
    residentialMenus,
    menuItems,
    interactions,
    metrics,
    recommendations,
    appliedDiningHalls,
    appliedAllergens,
    searchTerm,
    pinnedHalls,
    meal,
    sortOption,
  ]);

  return displayData;
};

export const useBuildRetailDisplayData = ({
  locations,
  retailMenus,
  menuItems,
  interactions,
  metrics,
  recommendations,
  appliedDiningHalls,
  appliedAllergens,
  searchTerm,
  pinnedHalls,
  sortOption,
}: any) => {
  const displayData = useMemo(() => {
    if (!locations || !retailMenus || !menuItems) {
      return [];
    }
    const shapedData = buildRetailLocationMenuShape(
      locations,
      retailMenus,
      menuItems,
      interactions,
      metrics
    );

    const filteredAndSorted = shapedData
      .map((location) => {
        const filteredMenu = filterMenuItems(location.menu, appliedAllergens, searchTerm);
        if (filteredMenu.length === 0) {
          return null;
        }
        const sortedMenu = sortMenuItems(filteredMenu, sortOption, recommendations);
        return {
          ...location,
          menu: sortedMenu,
        };
      })
      .filter((location) => location !== null) as any[];

    const filteredLocations = filterLocations(filteredAndSorted, appliedDiningHalls);
    const sortedLocations = sortLocations(filteredLocations, pinnedHalls, RETAIL_LOCATION_ORDER);
    return sortedLocations;
  }, [
    locations,
    retailMenus,
    menuItems,
    interactions,
    metrics,
    recommendations,
    appliedDiningHalls,
    appliedAllergens,
    searchTerm,
    pinnedHalls,
    sortOption,
  ]);

  return displayData;
};
