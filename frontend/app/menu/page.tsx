/**
 * @overview Menu page component.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Pane,
  Heading,
  Text,
  majorScale,
  minorScale,
  useTheme,
  SearchIcon,
  Spinner,
  Button,
  Checkbox,
  SearchInput,
  Switch,
  UndoIcon,
} from 'evergreen-ui';
import DiningHallCard from '@/app/menu/components/dining-hall-card';
import HallMenuModal from '@/app/menu/components/hall-menu-modal';
import SkeletonDiningHallCard from '@/app/menu/components/dining-hall-card-skeleton';
import FilterSidebar from '@/app/menu/components/filter-sidebar';
import AllergenSidebar from '@/app/menu/components/allergen-sidebar';
import DateMealSelector from '@/app/menu/components/date-meal-selector';
import type { MenuSortOption } from '@/app/menu/components/sort-dropdown';
import { rankMenusForLocations } from '@/lib/next-endpoints';
import { useDate } from '@/hooks/use-date';
import { usePreferencesCache } from '@/hooks/use-preferences-cache';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  useLocationsCache,
  useMenuItemsCache,
  useMenuStructureCache,
} from '@/hooks/use-menu-cache';
import { DINING_HALLS, MEAL_RANGES, DIETARY_TAGS, MEALS } from '@/data';
import {
  MEAL_COLOR_MAP,
  HALL_ICON_MAP,
  DIET_LABEL_MAP,
  ALLERGEN_STYLE_MAP,
  DIET_STYLE_MAP,
} from '@/styles';
import {
  Meal,
  MenusForDateMealAndLocations,
  MenusForLocations,
  MenusForMealAndLocations,
  DiningHall,
  DietaryTag,
  Allergen,
  MenuItemMap,
  ApiId,
  LocationMap,
  MenuItemMetrics,
  MenuItemMetricsMap,
  MenuItemInteractionMap,
} from '@/types/dining';
import { buildDisplayData } from './actions';
import {
  getDiningMenusForLocationsAndDay,
  getDiningMenuItems,
  getAllDiningLocations,
  getMenuItemsMetrics,
  getMenuItemMetrics,
  getUserMenuItemsInteractions,
} from '@/lib/next-endpoints';

/**
 * Fetches menus for a specific date key from the API.
 *
 * @param dateKey - Date string in YYYY-MM-DD format
 * @returns Promise resolving to MenusForMealAndLocations or null
 */
async function fetchMenusForDateKey(dateKey: string): Promise<MenusForMealAndLocations | null> {
  if (!dateKey) return null;
  try {
    const { data } = await getDiningMenusForLocationsAndDay({
      menu_date: dateKey,
    });
    const menusData = data?.data || data;
    if (!menusData) throw new Error('No data received');
    return menusData as MenusForMealAndLocations;
  } catch (error) {
    console.error(`Error fetching menu data for ${dateKey}:`, error);
    return null;
  }
}

/**
 * Fetches menu items from the API backend given a list of API IDs.
 *
 * @param apiIds - Array of menu item API IDs
 * @returns Promise resolving to Record<string, MenuItem> (map/dict) or null if error
 */
async function fetchMenuItemsByApiIds(apiIds: ApiId[]): Promise<MenuItemMap | null> {
  if (!apiIds || apiIds.length === 0) return null;
  try {
    const apiIdsString = apiIds.join(',');
    const { data } = await getDiningMenuItems({ api_ids: apiIdsString });
    const menuItemsData = data?.data || data;
    if (!menuItemsData) throw new Error('No data received');
    return menuItemsData as MenuItemMap;
  } catch (error) {
    console.error(`Error fetching menu items for API IDs ${apiIds.join(',')}:`, error);
    return null;
  }
}

/**
 * Fetches locations from the API backend.
 *
 * @returns Promise resolving to LocationMap or null if error
 */
async function fetchLocationsForMenu(): Promise<LocationMap | null> {
  try {
    const { data } = await getAllDiningLocations();
    const locationsData = data?.data || data;
    if (!locationsData) throw new Error('No data received');
    return locationsData as LocationMap;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return null;
  }
}

/**
 * Fetches menu item metrics from the API backend given a list of API IDs.
 *
 * @param apiIds - Array of menu item API IDs
 * @returns Promise resolving to MenuItemMetricsMap or null if error
 */
async function fetchMenuItemMetricsByApiIds(apiIds: ApiId[]): Promise<MenuItemMetricsMap | null> {
  if (!apiIds || apiIds.length === 0) return null;
  try {
    const { data } = await getMenuItemsMetrics({ menu_item_api_ids: apiIds.map(Number) });
    const menuItemMetricsData = data?.data || data;
    if (!menuItemMetricsData) throw new Error('No data received');
    return menuItemMetricsData as MenuItemMetricsMap;
  } catch (error) {
    console.error(`Error fetching menu item metrics for API IDs ${apiIds.join(',')}:`, error);
    return null;
  }
}

/**
 * Fetches user menu item interactions from the API backend given a list of API IDs.
 *
 * @param apiIds - Array of menu item API IDs
 * @returns Promise resolving to MenuItemInteractionMap or null if error
 */
async function fetchUserMenuItemInteractionsByApiIds(
  apiIds: ApiId[]
): Promise<MenuItemInteractionMap | null> {
  if (!apiIds || apiIds.length === 0) return null;
  try {
    const { data } = await getUserMenuItemsInteractions({ menu_item_api_ids: apiIds.map(Number) });
    const userMenuItemInteractionsData = data?.data || data;
    if (!userMenuItemInteractionsData) throw new Error('No data received');
    return userMenuItemInteractionsData as MenuItemInteractionMap;
  } catch (error) {
    console.error(
      `Error fetching user menu item interactions for API IDs ${apiIds.join(',')}:`,
      error
    );
    return null;
  }
}

/**
 * Ranks menu items for multiple locations based on user's interaction history.
 *
 * @param menus_for_locations - Dictionary mapping location IDs to arrays of menu item API IDs
 * @returns Promise resolving to Record<string, number[]> or null if error
 */
async function fetchRankedMenusForLocations(
  menus_for_locations: Record<string, number[]>
): Promise<Record<string, number[]> | null> {
  if (!menus_for_locations || Object.keys(menus_for_locations).length === 0) return null;
  try {
    const { data } = await rankMenusForLocations({ menus_for_locations });
    const rankedMenusForLocationsData = data?.data || data;
    if (!rankedMenusForLocationsData) throw new Error('No data received');
    return rankedMenusForLocationsData as Record<string, number[]>;
  } catch (error) {
    console.error(`Error ranking menus for locations: ${error}`);
    return null;
  }
}

/**
 * Menu page component.
 *
 * @returns The menu page component.
 */
export default function MenuPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState({
    menusForLocations: true,
    menuItems: true,
    locations: true,
    menuItemMetrics: true,
    userMenuItemInteractions: true,
  });

  const {
    selectedDate,
    currentMeal,
    dateKey,
    formattedDateForDisplay,
    goToPreviousDay,
    goToNextDay,
  } = useDate();

  const {
    diningHalls,
    dietaryRestrictions,
    allergens,
    pinnedHalls,
    showNutrition,
    addDiningHall,
    addDietaryRestriction,
    addAllergen,
    addPinnedHall,
    removeDiningHall,
    removeDietaryRestriction,
    removeAllergen,
    removePinnedHall,
    toggleShowNutrition,
    toggleDiningHall,
    toggleDietaryRestriction,
    toggleAllergen,
    togglePinnedHall,
    clearAll: clearPreferences,
    loading: preferencesLoading,
  } = usePreferencesCache();

  const {
    menuStructureCacheLoading,
    getApiIdsForMenusForLocations,
    setApiIdsForMenusForLocations,
    setApiIdsForMenusForMealsLocations,
  } = useMenuStructureCache();
  const { menuItemsCache, menuItemsCacheLoading, getMenuItems, setMenuItems } = useMenuItemsCache();
  const { locationsCache, locationsCacheLoading, getAllLocations, setLocations } =
    useLocationsCache();

  const [menusForLocationsState, setMenusForLocationsState] = useState<MenusForLocations>({});
  const [menuItemsState, setMenuItemsState] = useState<MenuItemMap>({});
  const [menuItemMetricsState, setMenuItemMetricsState] = useState<MenuItemMetricsMap>({});
  const [userMenuItemInteractionsState, setUserMenuItemInteractionsState] =
    useState<MenuItemInteractionMap>({});
  const [locationsState, setLocationsState] = useState<LocationMap>({});
  

  const [meal, setMeal] = useState<Meal>(currentMeal as Meal);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalHall, setModalHall] = useState<Location | null>(null);
  const [sortOption, setSortOption] = useState<MenuSortOption>('best');

  // Media query flags
  const hideSidebar = useMediaQuery('(min-width: 1080px)');
  const hideFilterSidebar = useMediaQuery('(max-width: 800px)');
  const stackMenuHeader = useMediaQuery('(max-width: 880px)');

  const cacheLoading =
    preferencesLoading ||
    menuStructureCacheLoading ||
    menuItemsCacheLoading ||
    locationsCacheLoading;

  // Fetch menu data for the selected date
  useEffect(() => {
    if (cacheLoading || !meal || !dateKey) return;
    setLoading((prev) => ({ ...prev, menusForLocations: true }));

    // Check cache first
    const menusForLocations = getApiIdsForMenusForLocations(dateKey, meal);
    console.log('menusForLocations (cache)', menusForLocations);
    if (menusForLocations && Object.keys(menusForLocations).length > 0) {
      setMenusForLocationsState(menusForLocations);
      setLoading((prev) => ({ ...prev, menusForLocations: false }));
      return;
    }

    // Otherwise, fetch from API
    async function fetchMenuData() {
      const menusForDateMealAndLocations = await fetchMenusForDateKey(dateKey);
      console.log('menusForDateMealAndLocations (API)', menusForDateMealAndLocations);
      if (menusForDateMealAndLocations && Object.keys(menusForDateMealAndLocations).length > 0) {
        setApiIdsForMenusForMealsLocations(dateKey, menusForDateMealAndLocations);

        const menusForLocations = menusForDateMealAndLocations[meal];
        console.log('menusForLocations (API)', menusForLocations);
        if (menusForLocations && Object.keys(menusForLocations).length > 0) {
          setMenusForLocationsState(menusForLocations);
        }
      }
      setLoading((prev) => ({ ...prev, menusForLocations: false }));
      return;
    }

    fetchMenuData();
  }, [dateKey, cacheLoading, meal]);

  // Fetch menu items for the found menu
  useEffect(() => {
    if (cacheLoading) return;
    setLoading((prev) => ({ ...prev, menuItems: true }));

    // Extract all unique API IDs from the menus for locations
    const apiIdsSet = new Set<ApiId>(Object.values(menusForLocationsState).flatMap((menu) => menu));
    const apiIds = Array.from(apiIdsSet);
    if (apiIds.length === 0) return;

    // Check cache first
    const menuItems = getMenuItems(apiIds);
    console.log('menuItems (cache)', menuItems);
    const cachedApiIds = Object.keys(menuItems);
    const missingApiIds = apiIds.filter((apiId) => !cachedApiIds.includes(String(apiId)));
    if (missingApiIds.length === 0) {
      setMenuItemsState(menuItems);
      setLoading((prev) => ({ ...prev, menuItems: false }));
      return;
    }

    // Otherwise, fetch from API
    async function fetchMenuItems(cachedMenuItems: MenuItemMap, missingApiIds: ApiId[]) {
      const menuItems = await fetchMenuItemsByApiIds(missingApiIds);
      console.log('menuItems (API)', menuItems);
      if (menuItems && Object.keys(menuItems).length > 0) {
        setMenuItems(menuItems);
        setMenuItemsState({ ...cachedMenuItems, ...menuItems });
      }
      setLoading((prev) => ({ ...prev, menuItems: false }));
      return;
    }

    fetchMenuItems(menuItems, missingApiIds);
  }, [cacheLoading, menusForLocationsState]);

  // Fetch menu item metrics and user menu item interactions for the found menu
  useEffect(() => {
    if (cacheLoading) return;
    setLoading((prev) => ({ ...prev, menuItemMetrics: true, userMenuItemInteractions: true }));

    // Extract all unique API IDs from the menus for locations
    const apiIdsSet = new Set<ApiId>(Object.values(menusForLocationsState).flatMap((menu) => menu));
    const apiIds = Array.from(apiIdsSet);
    if (apiIds.length === 0) return;

    // Fetch menu item metrics from API
    async function fetchMenuItemMetrics() {
      const menuItemMetrics = await fetchMenuItemMetricsByApiIds(apiIds);
      console.log('menuItemMetrics (API)', menuItemMetrics);
      if (menuItemMetrics && Object.keys(menuItemMetrics).length > 0) {
        setMenuItemMetricsState(menuItemMetrics);
      }
      setLoading((prev) => ({ ...prev, menuItemMetrics: false }));
      return;
    }

    // Fetch user menu item interactions from API
    async function fetchUserMenuItemInteractions() {
      const userMenuItemInteractions = await fetchUserMenuItemInteractionsByApiIds(apiIds);
      console.log('userMenuItemInteractions (API)', userMenuItemInteractions);
      if (userMenuItemInteractions && Object.keys(userMenuItemInteractions).length > 0) {
        setUserMenuItemInteractionsState(userMenuItemInteractions);
      }
      setLoading((prev) => ({ ...prev, userMenuItemInteractions: false }));
      return;
    }

    fetchMenuItemMetrics();
    fetchUserMenuItemInteractions();
  }, [cacheLoading, menusForLocationsState]);

  // Fetch locations
  useEffect(() => {
    if (cacheLoading) return;
    setLoading((prev) => ({ ...prev, locations: true }));

    // Check cache first
    const locations = getAllLocations();
    console.log('locations (cache)', locations);
    if (locations && Object.keys(locations).length > 0) {
      setLocationsState(locations);
      setLoading((prev) => ({ ...prev, locations: false }));
      return;
    }

    // Otherwise, fetch from API
    async function fetchLocations() {
      const locations = await fetchLocationsForMenu();
      console.log('locations (API)', locations);
      if (locations && Object.keys(locations).length > 0) {
        setLocations(locations);
        setLocationsState(locations);
      }
      setLoading((prev) => ({ ...prev, locations: false }));
      return;
    }

    fetchLocations();
  }, [cacheLoading]);

  // Build display data for the current meal
  const displayMenusForLocations = useMemo(
    () =>
      buildDisplayData({
        menusForLocations: menusForLocationsState,
        locationItems: locationsState,
        menuItems: menuItemsState,
        menuItemMetrics: menuItemMetricsState,
        userMenuItemInteractions: userMenuItemInteractionsState,
        appliedDiningHalls: diningHalls,
        appliedDietaryRestrictions: dietaryRestrictions,
        appliedAllergens: allergens,
        searchTerm,
        pinnedHalls: pinnedHalls,
      }),
    [
      menusForLocationsState,
      locationsState,
      menuItemsState,
      menuItemMetricsState,
      userMenuItemInteractionsState,
      diningHalls,
      dietaryRestrictions,
      allergens,
      searchTerm,
      pinnedHalls,
      meal,
      dateKey,
    ]
  );

  // Render skeleton cards while loading
  const DiningHallSkeletonCards = () => {
    return (
      <Pane
        display='grid'
        overflowY='auto'
        paddingBottom={majorScale(6)}
        gridTemplateColumns='repeat(auto-fill,minmax(340px,1fr))'
        gap={majorScale(2)}
        className='h-full no-scrollbar'
      >
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonDiningHallCard key={i} />
          ))}
      </Pane>
    );
  };

  // Render empty state if no menu items are found
  const NoMenusFoundCard = () => (
    <Pane
      display='flex'
      alignItems='center'
      justifyContent='center'
      paddingY={majorScale(8)}
      flexDirection='column'
      width='100%'
      background={theme.colors.gray100}
      borderRadius={12}
      border={`2px dashed ${theme.colors.green400}`}
      marginTop={majorScale(2)}
      className='h-full'
    >
      <SearchIcon color={theme.colors.gray600} size={32} marginBottom={majorScale(2)} />
      <Heading size={500} color={theme.colors.gray800} marginBottom={minorScale(1)}>
        No Dishes Found
      </Heading>
      <Text size={400} color='muted' textAlign='center'>
        Try adjusting your search terms or filters.
      </Text>
    </Pane>
  );

  // Render dining hall cards
  const DiningHallCards = () => {
    return (
      <Pane
        display='grid'
        overflowY='auto'
        paddingBottom={majorScale(6)}
        gridTemplateColumns='repeat(auto-fill,minmax(400px,1fr))'
        gap={majorScale(2)}
        className='h-full no-scrollbar'
      >
        {displayMenusForLocations.map((diningHall) => {
          const isPinned = pinnedHalls.includes(diningHall.name as DiningHall);
          return (
            <DiningHallCard
              key={diningHall.name}
              diningHall={diningHall}
              setModalHall={setModalHall}
              showNutrition={showNutrition}
              isPinned={isPinned}
              onPinToggle={() => togglePinnedHall(diningHall.name as DiningHall)}
            />
          );
        })}
      </Pane>
    );
  };

  // Render the menu page
  return (
    <Pane
      display='flex'
      className='sm:flex-row overflow-hidden min-h-screen flex-col'
      background={MEAL_COLOR_MAP(theme)[meal]}
    >
      {/* Filter sidebar for desktop*/}
      {!hideFilterSidebar && (
        <FilterSidebar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showNutrition={showNutrition}
          toggleShowNutrition={toggleShowNutrition}
          sortOption={sortOption}
          setSortOption={setSortOption}
          diningHalls={diningHalls}
          dietaryRestrictions={dietaryRestrictions}
          allergens={allergens}
          toggleDiningHall={toggleDiningHall}
          toggleDietaryRestriction={toggleDietaryRestriction}
          toggleAllergen={toggleAllergen}
          clearPreferences={clearPreferences}
          variant='sidebar'
        />
      )}

      <Pane
        flex={1}
        className={`overflow-x-hidden h-full no-scrollbar`}
        paddingRight={hideSidebar ? 0 : majorScale(3)}
        paddingLeft={hideFilterSidebar ? majorScale(3) : 0}
      >
        {/* Header for the menu page */}
        <Pane>
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            marginY={majorScale(3)}
            className={`flex-col ${stackMenuHeader ? 'flex-col' : 'flex-row'} text-center sm:text-left`}
          >
            <Pane width={240}>
              <Heading className='text-4xl' color={theme.colors.green700} fontWeight={900}>
                {meal.toUpperCase()}
              </Heading>
              <Text className='text-xl' color={theme.colors.green600} fontWeight={600}>
                {MEAL_RANGES[meal as Meal as keyof typeof MEAL_RANGES]}
              </Text>
            </Pane>

            <DateMealSelector
              meal={meal}
              setMeal={setMeal}
              formattedDateForDisplay={formattedDateForDisplay}
              goToPreviousDay={goToPreviousDay}
              goToNextDay={goToNextDay}
            />

            <Pane
              display='flex'
              flexDirection='column'
              gap={majorScale(2)}
              width={240}
              alignItems='flex-end'
              justifyContent='flex-start'
            ></Pane>
          </Pane>

          {/* Filter sidebar for mobile */}
          {hideFilterSidebar && (
            <FilterSidebar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              showNutrition={showNutrition}
              toggleShowNutrition={toggleShowNutrition}
              sortOption={sortOption}
              setSortOption={setSortOption}
              diningHalls={diningHalls}
              dietaryRestrictions={dietaryRestrictions}
              allergens={allergens}
              toggleDiningHall={toggleDiningHall}
              toggleDietaryRestriction={toggleDietaryRestriction}
              toggleAllergen={toggleAllergen}
              clearPreferences={clearPreferences}
              variant='mobile'
            />
          )}

          {/* Render skeleton cards while loading */}
          {loading.menusForLocations ||
          loading.menuItems ||
          loading.locations ||
          loading.menuItemMetrics ||
          loading.userMenuItemInteractions ? (
            <DiningHallSkeletonCards />
          ) : displayMenusForLocations.length === 0 ? (
            <NoMenusFoundCard />
          ) : (
            <DiningHallCards />
          )}
        </Pane>
      </Pane>

      {hideSidebar && <AllergenSidebar allergens={allergens} toggleAllergen={toggleAllergen} />}

      <HallMenuModal
        modalHall={modalHall}
        setModalHall={setModalHall}
        showNutrition={showNutrition}
      />
    </Pane>
  );
}
