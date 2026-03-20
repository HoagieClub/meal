'use client';

import { useMemo } from 'react';
import { canonicalIndex, RESIDENTIAL_HALL_ORDER, RETAIL_LOCATION_ORDER } from '@/ordering';
import { useInteractionsContext } from '@/contexts/interactions-context';

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
  if (!appliedDiningHalls || appliedDiningHalls.length === 0) {
    return locations;
  }
  const diningHallsLower = appliedDiningHalls.map((h: any) => String(h).toLowerCase().trim());
  return locations.filter((location) => {
    const locationNameLower = (location.name || '').toLowerCase().trim();
    return diningHallsLower.includes(locationNameLower);
  });
}

function sortMenuItems(menu: any[], sortOption: string) {
  const menuCopy = [...menu];

  if (sortOption === 'Most Liked') {
    menuCopy.sort((a: any, b: any) => {
      const categoryA = String(a.category || '').trim();
      const categoryB = String(b.category || '').trim();
      const catCmp = categoryA.localeCompare(categoryB, undefined, { sensitivity: 'base' });
      if (catCmp !== 0) return catCmp;
      const likeA = a.metrics?.likeCount > 0 ? a.metrics.likeCount : -(a.metrics?.dislikeCount || 0);
      const likeB = b.metrics?.likeCount > 0 ? b.metrics.likeCount : -(b.metrics?.dislikeCount || 0);
      return likeB - likeA;
    });
  } else {
    // Default ('Starred'): sort by category, favorites first within each category
    menuCopy.sort((a: any, b: any) => {
      const categoryA = String(a.category || '').trim();
      const categoryB = String(b.category || '').trim();
      const catCmp = categoryA.localeCompare(categoryB, undefined, { sensitivity: 'base' });
      if (catCmp !== 0) return catCmp;
      const favA = a.userInteraction?.favorited === true ? 0 : 1;
      const favB = b.userInteraction?.favorited === true ? 0 : 1;
      return favA - favB;
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
  appliedDiningHalls,
  appliedAllergens,
  searchTerm,
  pinnedHalls,
  meal,
  sortOption,
}: any) => {
  const { interactions, metrics } = useInteractionsContext();
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
      const filteredMenu = filterMenuItems(location.menu, appliedAllergens, searchTerm);
      const sortedMenu = sortMenuItems(filteredMenu, sortOption);
      return {
        ...location,
        rawMenuCount,
        menu: sortedMenu,
      };
    });

    const filteredLocations = filterLocations(filteredAndSorted, appliedDiningHalls);
    const sortedLocations = sortLocations(filteredLocations, pinnedHalls, RESIDENTIAL_HALL_ORDER);

    const missingDiningHalls = appliedDiningHalls.filter((diningHall: any) => !sortedLocations.some((location: any) => location.name === diningHall));
    const filteredMissingDiningHalls = missingDiningHalls.filter((diningHall: any) => RESIDENTIAL_HALL_ORDER.includes(diningHall));
    const orderedMissingDiningHalls = filteredMissingDiningHalls.sort((a: any, b: any) => {
      return RESIDENTIAL_HALL_ORDER.indexOf(a) - RESIDENTIAL_HALL_ORDER.indexOf(b);
    });
    orderedMissingDiningHalls.forEach((diningHall: any) => {
      sortedLocations.push({
        name: diningHall,
        rawMenuCount: 0,
        menu: [],
      });
    });
    return { displayData: sortedLocations, hasAnyRawLocations: shapedData.length > 0 };
  }, [
    locations,
    residentialMenus,
    menuItems,
    interactions,
    metrics,
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
  appliedDiningHalls,
  appliedAllergens,
  searchTerm,
  pinnedHalls,
  sortOption,
}: any) => {
  const { interactions, metrics } = useInteractionsContext();
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
      const filteredMenu = filterMenuItems(location.menu, appliedAllergens, searchTerm);
      const sortedMenu = sortMenuItems(filteredMenu, sortOption);
      return {
        ...location,
        rawMenuCount,
        menu: sortedMenu,
      };
    });

    const filteredLocations = filterLocations(filteredAndSorted, appliedDiningHalls);
    const sortedLocations = sortLocations(filteredLocations, pinnedHalls, RETAIL_LOCATION_ORDER);

    const missingDiningHalls = appliedDiningHalls.filter((diningHall: any) => !sortedLocations.some((location: any) => location.name === diningHall));
    const filteredMissingDiningHalls = missingDiningHalls.filter((diningHall: any) => RETAIL_LOCATION_ORDER.includes(diningHall));
    const orderedMissingDiningHalls = filteredMissingDiningHalls.sort((a: any, b: any) => {
      return RETAIL_LOCATION_ORDER.indexOf(a) - RETAIL_LOCATION_ORDER.indexOf(b);
    });
    orderedMissingDiningHalls.forEach((diningHall: any) => {
      sortedLocations.push({
        name: diningHall,
        rawMenuCount: 0,
        menu: [],
      });
    });
    return { displayData: sortedLocations, hasAnyRawLocations: shapedData.length > 0 };
  }, [
    locations,
    retailMenus,
    menuItems,
    interactions,
    metrics,
    appliedDiningHalls,
    appliedAllergens,
    searchTerm,
    pinnedHalls,
    sortOption,
  ]);

  return displayData;
};
