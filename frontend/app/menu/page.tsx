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
import { Pane, Heading, Text, majorScale, minorScale, useTheme, SearchIcon } from 'evergreen-ui';
import DiningHallCard from '@/app/menu/components/dining-hall-card';
import HallMenuModal from '@/app/menu/components/hall-menu-modal';
import SkeletonDiningHallCard from '@/app/menu/components/dining-hall-card-skeleton';
import FilterSidebar from '@/app/menu/components/filter-sidebar';
import AllergenSidebar from '@/app/menu/components/allergen-sidebar';
import DateMealSelector from '@/app/menu/components/date-meal-selector';
import { useDate } from '@/hooks/use-date';
import { usePreferencesCache } from '@/hooks/use-preferences-cache';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { MenuSortOption } from '@/types/types';
import {
  useLocationsCache,
  useMenuItemsCache,
  useMenuStructureCache,
} from '@/hooks/use-menu-cache';
import { MEAL_RANGES } from '@/data';
import { MEAL_COLOR_MAP } from '@/styles';
import {
  Meal,
  MenusForLocations,
  DiningHall,
  MenuItemMap,
  ApiId,
  MenuItemScoreMap,
  LocationMap,
  MenuItemMetricsMap,
  MenuItemInteractionMap,
} from '@/types/types';
import {
  buildDisplayData,
  fetchLocationsWithCache,
  fetchMenusForLocations,
  fetchMenuItems,
  fetchMenuItemMetrics,
  fetchUserMenuItemInteractions,
  fetchMenuItemScores,
} from './actions';
import {
  getAllDiningLocations,
} from '@/lib/next-endpoints';

/**
 * Menu page component.
 *
 * @returns The menu page component.
 */
export default function MenuPage() {
  const theme = useTheme();

  // Create page loading states for all data fetching operations
  const [loading, setLoading] = useState({
    menusForLocations: true,
    menuItems: false,
    locations: false,
    menuItemMetrics: false,
    userMenuItemInteractions: false,
    menuItemScores: false,
  });

  // Get the date related information from the useDate hook
  const { currentMeal, dateKey, formattedDateForDisplay, goToPreviousDay, goToNextDay, isWeekend } = useDate();

  // Get the preferences for the menu page from local storage
  const {
    diningHalls,
    dietaryRestrictions,
    allergens,
    pinnedHalls,
    showNutrition,
    toggleShowNutrition,
    toggleDiningHall,
    toggleDietaryRestriction,
    toggleAllergen,
    togglePinnedHall,
    clearAll: clearPreferences,
    loading: preferencesLoading,
  } = usePreferencesCache();

  // Get menu, menu items, and location cache
  const {
    menuStructureCacheLoading,
    getApiIdsForMenusForLocations,
    setApiIdsForMenusForMealsLocations,
  } = useMenuStructureCache();
  const { menuItemsCacheLoading, getMenuItems, setMenuItems } = useMenuItemsCache();
  const { locationsCacheLoading, getAllLocations, setLocations } = useLocationsCache();

  // Create a loading state for the cache
  const cacheLoading =
    preferencesLoading ||
    menuStructureCacheLoading ||
    menuItemsCacheLoading ||
    locationsCacheLoading;

  // Create state to store the data that will be rendered/operated on
  const [menusForLocationsState, setMenusForLocationsState] = useState<MenusForLocations>({});
  const [menuItemsState, setMenuItemsState] = useState<MenuItemMap>({});
  const [menuItemMetricsState, setMenuItemMetricsState] = useState<MenuItemMetricsMap>({});
  const [userMenuItemInteractionsState, setUserMenuItemInteractionsState] =
    useState<MenuItemInteractionMap>({});
  const [menuItemScoresState, setMenuItemScoresState] = useState<MenuItemScoreMap>({});
  const [locationsState, setLocationsState] = useState<LocationMap>({});

  // Create state for the meal, search term, modal hall, and sort option
  const [meal, setMeal] = useState<Meal>(currentMeal as Meal);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalHall, setModalHall] = useState<Location | null>(null);
  const [sortOption, setSortOption] = useState<MenuSortOption>('Best');

  // Media query flags
  const hideSidebar = useMediaQuery('(min-width: 1080px)');
  const hideFilterSidebar = useMediaQuery('(max-width: 800px)');
  const stackMenuHeader = useMediaQuery('(max-width: 880px)');

  // Fetch menu data for the selected date
  useEffect(() => {
    if (cacheLoading || !meal || !dateKey) return;
    setLoading((prev) => ({ ...prev, menusForLocations: true }));

    async function fetchMenuData() {
      const menusForLocations = await fetchMenusForLocations(
        dateKey,
        meal,
        getApiIdsForMenusForLocations,
        setApiIdsForMenusForMealsLocations
      );
      setMenusForLocationsState(menusForLocations);
      setLoading((prev) => ({ ...prev, menusForLocations: false }));
    }

    fetchMenuData();
  }, [dateKey, cacheLoading, meal]);

  // Fetch menu items for the found menu
  useEffect(() => {
    if (cacheLoading) return;
    if (!menusForLocationsState || Object.keys(menusForLocationsState).length === 0) {
      setLoading((prev) => ({ ...prev, menuItems: false }));
      return;
    }

    setLoading((prev) => ({ ...prev, menuItems: true }));

    async function fetchMenuItemsData() {
      const menuItems = await fetchMenuItems(menusForLocationsState, getMenuItems, setMenuItems);
      setMenuItemsState(menuItems);
      setLoading((prev) => ({ ...prev, menuItems: false }));
    }

    fetchMenuItemsData();
  }, [cacheLoading, menusForLocationsState]);

  // Fetch menu item metrics, user menu item interactions, and menu item scores for the found menu
  useEffect(() => {
    if (cacheLoading) return;
    if (!menusForLocationsState || Object.keys(menusForLocationsState).length === 0) {
      setLoading((prev) => ({ ...prev, menuItemMetrics: false, userMenuItemInteractions: false, menuItemScores: false }));
      return;
    }

    setLoading((prev) => ({
      ...prev,
      menuItemMetrics: true,
      userMenuItemInteractions: true,
      menuItemScores: true,
    }));

    async function fetchAllMenuItemData() {
      const [menuItemMetrics, userMenuItemInteractions, menuItemScores] = await Promise.all([
        fetchMenuItemMetrics(menusForLocationsState),
        fetchUserMenuItemInteractions(menusForLocationsState),
        fetchMenuItemScores(menusForLocationsState),
      ]);

      setMenuItemMetricsState(menuItemMetrics);
      setUserMenuItemInteractionsState(userMenuItemInteractions);
      setMenuItemScoresState(menuItemScores);

      setLoading((prev) => ({
        ...prev,
        menuItemMetrics: false,
        userMenuItemInteractions: false,
        menuItemScores: false,
      }));
    }

    fetchAllMenuItemData();
  }, [cacheLoading, menusForLocationsState]);

  // Fetch locations
  useEffect(() => {
    if (cacheLoading) return;
    setLoading((prev) => ({ ...prev, locations: true }));

    async function fetchLocations() {
      const locations = await fetchLocationsWithCache(getAllLocations, setLocations);
      setLocationsState(locations);
      setLoading((prev) => ({ ...prev, locations: false }));
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
        menuItemScores: menuItemScoresState,
        appliedDiningHalls: diningHalls,
        appliedDietaryRestrictions: dietaryRestrictions,
        appliedAllergens: allergens,
        searchTerm,
        pinnedHalls: pinnedHalls,
        sortOption,
      }),
    [
      menusForLocationsState,
      locationsState,
      menuItemsState,
      menuItemMetricsState,
      userMenuItemInteractionsState,
      menuItemScoresState,
      diningHalls,
      dietaryRestrictions,
      allergens,
      searchTerm,
      pinnedHalls,
      meal,
      dateKey,
      sortOption,
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
            {/* Render the meal header */}
            <Pane width={240}>
              <Heading className='text-4xl' color={theme.colors.green700} fontWeight={900}>
                {meal.toUpperCase()}
              </Heading>
              <Text className='text-xl' color={theme.colors.green600} fontWeight={600}>
                {/* {MEAL_RANGES[meal as Meal as keyof typeof MEAL_RANGES]} */}
              </Text>
            </Pane>

            {/* Render the date and meal selector */}
            <DateMealSelector
              meal={meal}
              setMeal={setMeal}
              formattedDateForDisplay={formattedDateForDisplay}
              goToPreviousDay={goToPreviousDay}
              goToNextDay={goToNextDay}
              isWeekend={isWeekend}
            />

            {/* Render the sort and filter options */}
            <Pane
              display='flex'
              flexDirection='column'
              gap={majorScale(2)}
              width={240}
              alignItems='flex-end'
              justifyContent='flex-start'
            ></Pane>
          </Pane>

          {/* Render the filter sidebar for mobile */}
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

          {/* Render the correct content depending on the loading/data states */}
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

      {/* Render the allergen sidebar for mobile */}
      {hideSidebar && <AllergenSidebar allergens={allergens} toggleAllergen={toggleAllergen} />}

      {/* Render the hall menu modal */}
      <HallMenuModal
        modalHall={modalHall}
        setModalHall={setModalHall}
        showNutrition={showNutrition}
      />
    </Pane>
  );
}
