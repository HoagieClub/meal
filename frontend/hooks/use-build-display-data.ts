'use client';

import { useMemo } from 'react';

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

    const searchLower = (searchTerm || '').toLowerCase().trim();
    const diningHallsLower = (appliedDiningHalls || []).map((h: any) => h.toLowerCase().trim());
    const allergensLower = (appliedAllergens || []).map((a: any) => a.toLowerCase().trim());
    const hasSearch = searchLower.length > 0;
    const hasAllergenFilter = allergensLower.length > 0;
    const hasDiningHallFilter = diningHallsLower.length > 0;

    const result: any[] = [];

    for (const locationId in residentialMenus) {
      const location = locations[locationId];

      if (!location || location.category !== 'residential') {
        continue;
      }

      if (hasDiningHallFilter) {
        const locationNameLower = (location.name || '').toLowerCase().trim();
        if (!diningHallsLower.includes(locationNameLower)) {
          continue;
        }
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

          if (hasAllergenFilter) {
            const itemAllergens = (menuItem.allergens || []).map((a: any) => a.toLowerCase().trim());
            const hasBlockedAllergen = itemAllergens.some((a: any) => allergensLower.includes(a));
            if (hasBlockedAllergen) {
              continue;
            }
          }

          if (hasSearch) {
            const searchText = `${menuItem.name} ${(menuItem.allergens || []).join(' ')} ${(menuItem.ingredients || []).join(' ')}`.toLowerCase();
            if (!searchText.includes(searchLower)) {
              continue;
            }
          }

          menu.push({
            ...menuItem,
            category: station,
            metrics: metrics?.[menuItemId] || null,
            userInteraction: interactions?.[menuItemId] || null,
          });
        }
      }

      if (menu.length === 0) {
        continue;
      }

      if (sortOption === 'Category') {
        menu.sort((a: any, b: any) => (a.category || '').localeCompare(b.category || ''));
      } else if (sortOption === 'Recommended') {
        menu.sort((a: any, b: any) => {
          const scoreA = recommendations?.[a.id] || 0;
          const scoreB = recommendations?.[b.id] || 0;
          return scoreB - scoreA;
        });
      } else if (sortOption === 'Most Liked') {
        menu.sort((a: any, b: any) => {
          const likeA = a.metrics?.likeCount > 0 ? a.metrics.likeCount : -(a.metrics?.dislikeCount || 0);
          const likeB = b.metrics?.likeCount > 0 ? b.metrics.likeCount : -(b.metrics?.dislikeCount || 0);
          return likeB - likeA;
        });
      } else if (sortOption === 'Best') {
        menu.sort((a: any, b: any) => {
          const scoreA = a.metrics?.averageLikeScore || 0;
          const scoreB = b.metrics?.averageLikeScore || 0;
          return scoreB - scoreA;
        });
      }

      result.push({
        ...location,
        menu,
      });
    }

    result.sort((a: any, b: any) => {
      const aPinned = pinnedHalls.includes(a.name);
      const bPinned = pinnedHalls.includes(b.name);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      return (a.name || '').localeCompare(b.name || '');
    });

    return result;
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

