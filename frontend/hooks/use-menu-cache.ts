/**
 * @overview Simple hook for managing menu, location, menu item, interaction, metrics, and recommendation caches in local storage.
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

import { useLocalStorage } from '@/hooks/use-local-storage';

const CACHE_KEYS = {
  RESIDENTIAL_MENUS: 'residentialMenusCache',
  RETAIL_MENUS: 'retailMenusCache',
  LOCATIONS: 'locationsCache',
  MENU_ITEMS: 'menuItemsCache',
  INTERACTIONS: 'interactionsCache',
  METRICS: 'metricsCache',
  RECOMMENDATIONS: 'recommendationsCache',
} as const;

export function useResidentialMenusCache() {
  const [cache, setCache] = useLocalStorage({
    key: CACHE_KEYS.RESIDENTIAL_MENUS,
    initialValue: {},
    expiryInMs: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  const setMenusForDate = (date: any, menus: any) => {
    setCache((prev) => ({
      ...prev,
      [date]: menus,
    }));
  };

  const getMenusForDate = (date: any) => {
    return cache[date as keyof typeof cache];
  };

  const getMenusForDateAndMeal = (date: any, meal: any) => {
    const menus = getMenusForDate(date);
    return menus[meal as keyof typeof menus];
  };

  return {
    residentialMenusCache: cache,
    setResidentialMenusForDate: setMenusForDate,
    getResidentialMenusForDate: getMenusForDate,
    getResidentialMenusForDateAndMeal: getMenusForDateAndMeal,
  };
}

export function useRetailMenusCache() {
  const [cache, setCache] = useLocalStorage({
    key: CACHE_KEYS.RETAIL_MENUS,
    initialValue: {},
    expiryInMs: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  const setMenusForDate = (date: any, menus: any) => {
    setCache((prev) => ({
      ...prev,
      [date]: menus,
    }));
  };

  const getMenusForDate = (date: any) => {
    return cache[date as keyof typeof cache];
  };

  return {
    retailMenusCache: cache,
    setRetailMenusForDate: setMenusForDate,
    getRetailMenusForDate: getMenusForDate,
  };
}

export function useLocationsCache() {
  const [cache, setCache] = useLocalStorage({
    key: CACHE_KEYS.LOCATIONS,
    initialValue: {},
    expiryInMs: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  const setLocations = (locations: any) => {
    setCache((prev) => ({
      ...prev,
      ...locations,
    }));
  };

  const getLocation = (locationId: any) => {
    return cache[locationId as keyof typeof cache];
  };

  const getLocations = (locationIds: any[]) => {
    return locationIds.map((locationId) => getLocation(locationId));
  };

  const getResidentialLocations = () => {
    return Object.values(cache).filter((location: any) => location.category === 'residential');
  };

  const getRetailLocations = () => {
    return Object.values(cache).filter((location: any) => location.category === 'retail');
  };

  return {
    locationsCache: cache,
    setLocations,
    getLocation,
    getLocations,
    getResidentialLocations,
    getRetailLocations,
  };
}

export function useMenuItemsCache() {
  const [cache, setCache] = useLocalStorage({
    key: CACHE_KEYS.MENU_ITEMS,
    initialValue: {},
    expiryInMs: 7 * 24 * 60 * 60 * 1000, // 1 week
  });

  const setMenuItems = (menuItems: any) => {
    setCache((prev) => ({
      ...prev,
      ...menuItems,
    }));
  };

  const getMenuItem = (apiId: any) => {
    return cache[apiId as keyof typeof cache];
  };

  const getMenuItems = (apiIds: any[]) => {
    return apiIds.map((apiId) => getMenuItem(apiId));
  };

  return {
    menuItemsCache: cache,
    setMenuItems,
    getMenuItem,
    getMenuItems,
  };
}

export function useInteractionsCache() {
  const [cache, setCache] = useLocalStorage({
    key: CACHE_KEYS.INTERACTIONS,
    initialValue: {},
    expiryInMs: 30 * 60 * 1000, // 30 minutes
  });

  const setInteractions = (interactions: any) => {
    setCache((prev) => ({
      ...prev,
      ...interactions,
    }));
  };

  const getInteraction = (interactionId: any) => {
    return cache[interactionId as keyof typeof cache];
  };

  const getInteractions = (interactionIds: any[]) => {
    return interactionIds.map((interactionId) => getInteraction(interactionId));
  };

  return {
    interactionsCache: cache,
    setInteractions,
    getInteraction,
    getInteractions,
  };
}

export function useMetricsCache() {
  const [cache, setCache] = useLocalStorage({
    key: CACHE_KEYS.METRICS,
    initialValue: {},
    expiryInMs: 30 * 60 * 1000, // 30 minutes
  });

  const setMetrics = (metrics: any) => {
    setCache((prev) => ({
      ...prev,
      ...metrics,
    }));
  };

  const getMetric = (metricId: any) => {
    return cache[metricId as keyof typeof cache];
  };

  const getMetrics = (metricIds: any[]) => {
    return metricIds.map((metricId) => getMetric(metricId));
  };

  return {
    metricsCache: cache,
    setMetrics,
    getMetric,
    getMetrics,
  };
}

export function useRecommendationsCache() {
  const [cache, setCache] = useLocalStorage({
    key: CACHE_KEYS.RECOMMENDATIONS,
    initialValue: {},
    expiryInMs: 30 * 60 * 1000, // 30 minutes
  });

  const setRecommendations = (recommendations: any) => {
    setCache((prev) => ({
      ...prev,
      ...recommendations,
    }));
  };

  const getRecommendation = (recommendationId: any) => {
    return cache[recommendationId as keyof typeof cache];
  };

  const getRecommendations = (recommendationIds: any[]) => {
    return recommendationIds.map((recommendationId) => getRecommendation(recommendationId));
  };

  return {
    recommendationsCache: cache,
    setRecommendations,
    getRecommendation,
    getRecommendations,
  };
}
