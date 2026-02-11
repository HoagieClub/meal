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
import SkeletonDiningHallCard from '@/app/menu/components/dining-hall-card-skeleton';
import FilterSidebar from '@/app/menu/components/filter-sidebar';
import DateMealSelector from '@/app/menu/components/date-meal-selector';
import { useDate } from '@/hooks/use-date';
import { usePreferencesCache } from '@/hooks/use-preferences-cache';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { MenuSortOption } from '@/types/types';
import {
  useMenusCache,
} from '@/hooks/use-menu-cache';
import { MEAL_RANGES } from '@/data';
import { MEAL_COLOR_MAP } from '@/styles';
import {
  Meal,
  DiningHall,
} from '@/types/types';
import { NutritionAccordionProvider } from '@/contexts/nutrition-accordion-context';

/**
 * Menu page component.
 *
 * @returns The menu page component.
 */
export default function MenuPage() {
  const theme = useTheme();

  // Get the date related information from the useDate hook
  const { currentMeal, dateKey, formattedDateForDisplay, goToPreviousDay, goToNextDay, isWeekend, selectedDate, goToDate } = useDate();

  // Get the preferences for the menu page from local storage
  const {
    diningHalls,
    allergens,
    pinnedHalls,
    toggleDiningHall,
    toggleAllergen,
    togglePinnedHall,
    clearAll: clearPreferences,
    loading: preferencesLoading,
  } = usePreferencesCache();

  // Create state for the meal, search term, modal hall, and sort option
  const [meal, setMeal] = useState<Meal>(currentMeal as Meal);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<MenuSortOption>('Best');

  // Media query flags
  const hideSidebar = useMediaQuery('(min-width: 1080px)');
  const hideFilterSidebar = useMediaQuery('(max-width: 800px)');
  const stackMenuHeader = useMediaQuery('(max-width: 880px)');

  // Build display data for the current meal
  const displayMenusForLocations = useMemo(
    () =>
      buildDisplayData({
        appliedDiningHalls: diningHalls,
        appliedAllergens: allergens,
        searchTerm,
        pinnedHalls: pinnedHalls,
        sortOption,
      }),
    [
      diningHalls,
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
        paddingRight={majorScale(3)}
        gridTemplateColumns='repeat(auto-fill,minmax(350px,1fr))'
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
        paddingRight={majorScale(3)}
        gridTemplateColumns='repeat(auto-fill,minmax(350px,1fr))'
        gap={majorScale(2)}
        className='h-full no-scrollbar'
      >
        {displayMenusForLocations.map((diningHall) => {
          const isPinned = pinnedHalls.includes(diningHall.name as DiningHall);
          return (
            <DiningHallCard
              key={diningHall.name}
              diningHall={diningHall}
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
    <NutritionAccordionProvider>
      <Pane
        display='flex'
        className='sm:flex-row overflow-hidden min-h-screen flex-col transition-colors duration-300'
        background={MEAL_COLOR_MAP(theme)[meal]}
      >
        {/* Filter sidebar for desktop*/}
        {!hideFilterSidebar && (
          <FilterSidebar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOption={sortOption}
            setSortOption={setSortOption}
            diningHalls={diningHalls}
            allergens={allergens}
            toggleDiningHall={toggleDiningHall}
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
              marginY={majorScale(1)}
              className={`flex-col ${stackMenuHeader ? 'flex-col' : 'flex-row'} text-center sm:text-left`}
            >
              {/* Render the meal header */}
              <Pane width={240}>
                <Heading className='text-5xl' color={theme.colors.green700} fontWeight={900}>
                  {meal.toUpperCase()}
                </Heading>
                <Text className='text-xl' color={theme.colors.green600} fontWeight={600}>
                  {MEAL_RANGES[meal]}
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
                selectedDate={selectedDate}
                goToDate={goToDate}
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
                sortOption={sortOption}
                setSortOption={setSortOption}
                diningHalls={diningHalls}
                allergens={allergens}
                toggleDiningHall={toggleDiningHall}
                toggleAllergen={toggleAllergen}
                clearPreferences={clearPreferences}
                variant='mobile'
              />
            )}

            {/* Render the correct content depending on the loading/data states */}
            {preferencesLoading ? (
              <DiningHallSkeletonCards />
            ) : displayMenusForLocations.length === 0 ? (
              <NoMenusFoundCard />
            ) : (
              <DiningHallCards />
            )}
          </Pane>
        </Pane>
      </Pane>
    </NutritionAccordionProvider>
  );
}
