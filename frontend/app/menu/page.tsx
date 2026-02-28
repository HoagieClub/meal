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
  FilterListIcon,
} from 'evergreen-ui';
import DiningHallCard from '@/components/dining-hall-card/dining-hall-card';
import SkeletonDiningHallCard from '@/components/dining-hall-card/dining-hall-card-skeleton';
import FilterSidebar from '@/components/filter-sidebar/filter-sidebar';
import DateMealSelector from '@/components/menu-page/date-meal-selector';
import LocationTypeToggle from '@/components/menu-page/location-type-toggle';
import MobileFilterBar from '@/components/menu-page/mobile-filter-bar';
import { usePreferencesCache } from '@/hooks/use-preferences-cache';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { MenuSortOption } from '@/types/types';
import { MEAL_RANGES } from '@/data';
import { MEAL_COLOR_MAP } from '@/styles';
import { Meal, DiningHall } from '@/types/types';
import { NutritionAccordionProvider } from '@/contexts/nutrition-accordion-context';
import { useMenuApi } from '@/hooks/use-menu-api';
import {
  useBuildResidentialDisplayData,
  useBuildRetailDisplayData,
} from '@/hooks/use-build-display-data';

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
  const [residentialLocations, setResidentialLocations] = useState<any>({});
  const [retailLocations, setRetailLocations] = useState<any>({});
  const [residentialMenus, setResidentialMenus] = useState<any>({});
  const [retailMenus, setRetailMenus] = useState<any>({});
  const [menuItems, setMenuItems] = useState<any>({});
  const [interactions, setInteractions] = useState<any>({});
  const [metrics, setMetrics] = useState<any>({});
  const [recommendations, setRecommendations] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { fetchAll } = useMenuApi();

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchAll(dateKey);
        if (cancelled) return;
        setResidentialLocations(result.residentialLocations || {});
        setRetailLocations(result.retailLocations || {});
        setResidentialMenus(result.residentialMenus || {});
        setRetailMenus(result.retailMenus || {});
        setMenuItems(result.menuItems || {});
        setInteractions(result.interactions || {});
        setMetrics(result.metrics || {});
        setRecommendations(result.recommendations || {});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileScrolled, setMobileScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setMobileScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const hideSidebar = useMediaQuery('(min-width: 1080px)');
  const hideFilterSidebar = useMediaQuery('(max-width: 800px)');
  const stackMenuHeaderMobile = useMediaQuery('(max-width: 763px)');
  const stackMenuHeaderWithSidebar = useMediaQuery('(max-width: 1019px)');
  const stackMenuHeader =
    !hideFilterSidebar && sidebarOpen ? stackMenuHeaderWithSidebar : stackMenuHeaderMobile;

  const residentialDisplayData = useBuildResidentialDisplayData({
    locations: residentialLocations,
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
    locations: retailLocations,
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

  const displayMenusForLocations =
    locationType === 'retail' ? retailDisplayData : residentialDisplayData;

  return (
    <NutritionAccordionProvider>
      <Pane
        display='flex'
        className='sm:flex-row sm:overflow-hidden min-h-screen flex-col transition-colors duration-300'
        background={MEAL_COLOR_MAP(theme)[meal]}
      >
        {!hideFilterSidebar && (
          <div
            className='sidebar-slide-wrapper'
            style={{
              width: sidebarOpen ? 280 : 0,
              minWidth: sidebarOpen ? 280 : 0,
              transform: `translateX(${sidebarOpen ? 0 : -280}px)`,
            }}
          >
            <FilterSidebar
              locationType={locationType}
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
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )}

        <Pane flex={1} className='h-full no-scrollbar' style={{ overflowX: 'clip' }}>
          {/* Mobile: sticky search/filter bar only */}
          {hideFilterSidebar && (
            <>
              <div
                className={`sticky top-0 z-50 transition-shadow duration-200${mobileScrolled ? ' shadow-[0px_4px_8px_rgba(0,0,0,0.1)]' : ''}`}
                style={{ background: MEAL_COLOR_MAP(theme)[meal] }}
              >
                {/* Filter popover — slides down from top of sticky bar, overlays content */}
                <div
                  className='absolute top-0 left-0 right-0 z-[60]'
                  style={{ pointerEvents: mobileFilterOpen ? 'auto' : 'none' }}
                >
                  <div
                    className='mobile-filter-popover'
                    data-state={mobileFilterOpen ? 'open' : 'closed'}
                  >
                    <div className='mobile-filter-popover-inner bg-white rounded-b-[20px] shadow-[0px_4px_8px_rgba(0,0,0,0.15)] max-h-[100dvh] overflow-y-auto'>
                      <FilterSidebar
                        variant='mobile-popover'
                        locationType={locationType}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        sortOption={sortOption}
                        setSortOption={setSortOption}
                        diningHalls={diningHalls}
                        allergens={allergens}
                        toggleDiningHall={toggleDiningHall}
                        toggleAllergen={toggleAllergen}
                        clearPreferences={clearPreferences}
                        onClose={() => setMobileFilterOpen(false)}
                      />
                    </div>
                  </div>
                </div>
                <MobileFilterBar
                  locationType={locationType}
                  setLocationType={setLocationType}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterOpen={mobileFilterOpen}
                  setFilterOpen={setMobileFilterOpen}
                />
              </div>
              {/* Non-sticky: meal title + date selector scroll with page */}
              <div className='flex flex-col items-center text-center px-4 pt-2'>
                {(() => {
                  const displayedMeal =
                    locationType === 'retail'
                      ? 'Retail'
                      : meal === 'Lunch' && isWeekend(selectedDate)
                        ? 'Brunch'
                        : meal;
                  return (
                    <>
                      <Heading
                        key={displayedMeal}
                        className='text-4xl meal-title-enter p-0'
                        color={theme.colors.green700}
                        fontWeight={900}
                      >
                        {displayedMeal}
                      </Heading>
                      <Text
                        key={`hours-${displayedMeal}`}
                        className='text-xl meal-title-enter'
                        color={theme.colors.green600}
                        fontWeight={600}
                        style={{ animationDelay: '30ms' }}
                      >
                        {locationType === 'retail' ? 'Hours vary' : MEAL_RANGES[meal]}
                      </Text>
                    </>
                  );
                })()}
              </div>
              <div className='mx-4'>
                <DateMealSelector
                  meal={meal}
                  setMeal={setMeal}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  locationType={locationType}
                />
              </div>
            </>
          )}

          <Pane
            paddingRight={majorScale(3)}
            paddingLeft={hideFilterSidebar || !sidebarOpen ? majorScale(3) : 0}
          >
            <Pane maxWidth={1200} marginX='auto' width='100%'>
              {/* Desktop: non-sticky header with meal title, date selector, location toggle */}
              {!hideFilterSidebar && (
                <Pane
                  display='flex'
                  alignItems='center'
                  justifyContent='space-between'
                  marginY={majorScale(1)}
                  minHeight={160}
                  className={stackMenuHeader ? 'flex-col' : 'flex-row'}
                >
                  <Pane
                    width={stackMenuHeader ? undefined : 240}
                    className={`flex flex-col ${stackMenuHeader ? 'items-center text-center pt-5' : 'items-start'} justify-start`}
                  >
                    {(() => {
                      const displayedMeal =
                        locationType === 'retail'
                          ? 'Retail'
                          : meal === 'Lunch' && isWeekend(selectedDate)
                            ? 'Brunch'
                            : meal;
                      return (
                        <>
                          <Heading
                            key={displayedMeal}
                            className='text-5xl meal-title-enter'
                            color={theme.colors.green700}
                            fontWeight={900}
                          >
                            {displayedMeal}
                          </Heading>
                          <Text
                            key={`hours-${displayedMeal}`}
                            className='text-xl meal-title-enter'
                            color={theme.colors.green600}
                            fontWeight={600}
                            style={{ animationDelay: '30ms' }}
                          >
                            {locationType === 'retail' ? 'Hours vary' : MEAL_RANGES[meal]}
                          </Text>
                        </>
                      );
                    })()}
                    <Pane
                      display='inline-flex'
                      alignItems='center'
                      gap={minorScale(2)}
                      cursor={sidebarOpen ? 'default' : 'pointer'}
                      onClick={sidebarOpen ? undefined : () => setSidebarOpen(true)}
                      borderRadius={999}
                      className='select-none bg-[#A2D4B8]/50'
                      style={{
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        opacity: sidebarOpen ? 0 : 1,
                        maxWidth: sidebarOpen ? 0 : 200,
                        height: sidebarOpen ? 0 : 28,
                        marginTop: sidebarOpen ? 0 : 12,
                        paddingLeft: sidebarOpen ? 0 : 12,
                        paddingRight: sidebarOpen ? 0 : 12,
                        pointerEvents: sidebarOpen ? 'none' : 'auto',
                        transition:
                          'max-width 250ms ease, padding 250ms ease, height 250ms ease, margin-top 250ms ease, opacity 150ms ease',
                      }}
                    >
                      <FilterListIcon size={12} className='text-[#156534]' />
                      <Text fontSize={12} className='text-[#156534]' fontWeight={600}>
                        Search & Filter
                      </Text>
                    </Pane>
                  </Pane>
                  <DateMealSelector
                    meal={meal}
                    setMeal={setMeal}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    locationType={locationType}
                  />
                  <Pane
                    display='flex'
                    flexDirection='column'
                    gap={majorScale(2)}
                    width={stackMenuHeader ? undefined : 240}
                    alignItems={stackMenuHeader ? 'center' : 'flex-end'}
                    justifyContent='flex-start'
                    className={stackMenuHeader ? 'order-last pt-2 pb-4' : undefined}
                  >
                    <LocationTypeToggle
                      locationType={locationType}
                      setLocationType={setLocationType}
                      vertical={!stackMenuHeader}
                    />
                  </Pane>
                </Pane>
              )}

              {loading ? (
                <Pane
                  display='grid'
                  overflowY='auto'
                  paddingBottom={majorScale(6)}
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
      </Pane>
    </NutritionAccordionProvider>
  );
}
