'use client';

import { useMemo } from 'react';

function buildLocationMenuShape(
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
      const itemAllergens = (menuItem.allergens || []).map((a: any) => a.toLowerCase().trim());
      const hasBlockedAllergen = itemAllergens.some((a: any) => allergensLower.includes(a));
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
  const diningHallsLower = appliedDiningHalls.map((h: any) => h.toLowerCase().trim());
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

function sortLocations(locations: any[], pinnedHalls: string[]) {
  const locationsCopy = [...locations];

  locationsCopy.sort((a: any, b: any) => {
    const aName = String(a.name || '').trim();
    const bName = String(b.name || '').trim();
    const aPinned = pinnedHalls && pinnedHalls.length > 0 && pinnedHalls.includes(aName);
    const bPinned = pinnedHalls && pinnedHalls.length > 0 && pinnedHalls.includes(bName);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
  });

  return locationsCopy;
}

export const useBuildDisplayData = ({
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
    const shapedData = buildLocationMenuShape(
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
    const sortedLocations = sortLocations(filteredLocations, pinnedHalls);
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
