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
import DiningHallCard from '@/components/dining-hall-card/dining-hall-card';
import SkeletonDiningHallCard from '@/components/dining-hall-card/dining-hall-card-skeleton';
import FilterSidebar from '@/components/filter-sidebar/filter-sidebar';
import DateMealSelector from '@/components/menu-page/date-meal-selector';
import { usePreferencesCache } from '@/hooks/use-preferences-cache';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { MenuSortOption } from '@/types/types';
import { MEAL_RANGES } from '@/data';
import { MEAL_COLOR_MAP } from '@/styles';
import { Meal, DiningHall } from '@/types/types';
import { NutritionAccordionProvider } from '@/contexts/nutrition-accordion-context';
import { useMenuApi } from '@/hooks/use-menu-api';
import { useBuildResidentialDisplayData, useBuildRetailDisplayData } from '@/hooks/use-build-display-data';

const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getCurrentMeal = (): Meal => {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 11) {
    return 'Breakfast';
  } else if (hour < 17) {
    return 'Lunch';
  } else {
    return 'Dinner';
  }
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/**
 * Menu page component.
 *
 * @returns The menu page component.
 */
export default function MenuPage() {
  const theme = useTheme();

  const [selectedDate, setSelectedDate] = useState<Date>(getToday());
  const dateKey = getDateKey(selectedDate);
  const currentMeal = getCurrentMeal();
  const [locations, setLocations] = useState<any>({});
  const [residentialMenus, setResidentialMenus] = useState<any>({});
  const [retailMenus, setRetailMenus] = useState<any>({});
  const [menuItems, setMenuItems] = useState<any>({});
  const [interactions, setInteractions] = useState<any>({});
  const [metrics, setMetrics] = useState<any>({});
  const [recommendations, setRecommendations] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { fetchAll } = useMenuApi();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchAll(dateKey);
        setLocations(result.locations || {});
        setResidentialMenus(result.residentialMenus || {});
        setRetailMenus(result.retailMenus || {});
        setMenuItems(result.menuItems || {});
        setInteractions(result.interactions || {});
        setMetrics(result.metrics || {});
        setRecommendations(result.recommendations || {});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateKey]);

  const {
    diningHalls,
    allergens,
    pinnedHalls,
    toggleDiningHall,
    toggleAllergen,
    togglePinnedHall,
    clearAll: clearPreferences,
  } = usePreferencesCache();

  const [meal, setMeal] = useState<Meal>(currentMeal as Meal);
  const [locationType, setLocationType] = useState<'residential' | 'retail'>('residential');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<MenuSortOption>('Category');
  const hideSidebar = useMediaQuery('(min-width: 1080px)');
  const hideFilterSidebar = useMediaQuery('(max-width: 800px)');
  const stackMenuHeader = useMediaQuery('(max-width: 880px)');

  const residentialDisplayData = useBuildResidentialDisplayData({
    locations,
    residentialMenus,
    menuItems,
    interactions,
    metrics,
    recommendations,
    appliedDiningHalls: diningHalls,
    appliedAllergens: allergens,
    searchTerm,
    pinnedHalls: pinnedHalls,
    meal,
    sortOption,
  });

  const retailDisplayData = useBuildRetailDisplayData({
    locations,
    retailMenus,
    menuItems,
    interactions,
    metrics,
    recommendations,
    appliedDiningHalls: diningHalls,
    appliedAllergens: allergens,
    searchTerm,
    pinnedHalls: pinnedHalls,
    sortOption,
  });

  const displayMenusForLocations = locationType === 'retail' ? retailDisplayData : residentialDisplayData;

  return (
    <NutritionAccordionProvider>
      <Pane
        display='flex'
        className='sm:flex-row overflow-hidden min-h-screen flex-col transition-colors duration-300'
        background={MEAL_COLOR_MAP(theme)[meal]}
      >
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
          <Pane>
            <Pane
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              marginY={majorScale(1)}
              className={`flex-col ${stackMenuHeader ? 'flex-col' : 'flex-row'} text-center sm:text-left`}
            >
              <Pane width={240}>
                <Heading className='text-5xl' color={theme.colors.green700} fontWeight={900}>
                  {locationType === 'retail'
                    ? 'Retail'
                    : meal === 'Lunch' && isWeekend(selectedDate)
                      ? 'Brunch'
                      : meal}
                </Heading>
                <Text className='text-xl' color={theme.colors.green600} fontWeight={600}>
                  {locationType === 'retail' ? 'All day' : MEAL_RANGES[meal]}
                </Text>
              </Pane>
              <DateMealSelector
                meal={meal}
                setMeal={setMeal}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                locationType={locationType}
                setLocationType={setLocationType}
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

            {loading ? (
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
            ) : displayMenusForLocations.length === 0 ? (
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
            ) : (
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
                      sortOption={sortOption}
                    />
                  );
                })}
              </Pane>
            )}
          </Pane>
        </Pane>
      </Pane>
    </NutritionAccordionProvider>
  );
}
