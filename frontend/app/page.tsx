/**
 * @overview Menu page component.
 *
 * Copyright © 2021-2026 Hoagie Club and affiliates.
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

import React, { useEffect, useState } from 'react';
import {
  Pane,
  Heading,
  Text,
  majorScale,
  minorScale,
  useTheme,
  FilterListIcon,
} from 'evergreen-ui';
import SplashScreen from '@/components/splash-screen/splash-screen';
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
import { Meal } from '@/types/types';
import { DiningHall, locations as allLocations } from '@/locations';
import { useMenuApi } from '@/hooks/use-menu-api';
import {
  useBuildResidentialDisplayData,
  useBuildRetailDisplayData,
} from '@/hooks/use-build-display-data';
import { setInteractionListener, localInteractions } from '@/hooks/use-menu-item-interactions';
import { useMemo } from 'react';
import { useRecommendations } from '@/hooks/use-recommendations';
import { useUser } from '@auth0/nextjs-auth0/client';
import RecommendedSection from '@/components/recommended-section';

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

const getDisplayedMeal = (meal: Meal, locationType: string, selectedDate: Date): string => {
  if (locationType === 'retail') return 'Retail';
  if (meal === 'Lunch' && isWeekend(selectedDate)) return 'Brunch';
  return meal;
};

// ---------------------------------------------------------------------------
// MenuPage — top-level export, owns date/meal state and data fetching
// ---------------------------------------------------------------------------

export default function MenuPage() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(getToday);
  const [meal, setMeal] = useState<Meal>(getCurrentMeal);

  useEffect(() => {
    const mealColors: Record<string, string> = {
      Breakfast: '#ebf7f2',
      Lunch: '#daefe8',
      Dinner: '#cae6dc',
    };
    const color = mealColors[meal] ?? '#daefe8';
    document.body.style.backgroundColor = color;
    document.documentElement.style.setProperty('--footer-bg', color);
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.removeProperty('--footer-bg');
    };
  }, [meal]);

  const dateKey = getDateKey(selectedDate);
  const { data, loading } = useMenuApi(dateKey);
  const preferences = usePreferencesCache();

  const { user } = useUser();

  // Enrich a raw menu item with interaction, metrics, and dining hall data
  const enrichItem = (item: any) => {
    if (!item) return item;
    return {
      ...item,
      userInteraction: data?.interactions?.[item.id] || null,
      metrics: data?.metrics?.[item.id] || null,
      diningHall: itemDiningHall.get(item.id) || null,
    };
  };

  // Collect menu item IDs for the current meal and map each to its dining hall
  const { currentMealItemIds, itemDiningHall } = useMemo(() => {
    const ids = new Set<string>();
    const hallMap = new Map<string, string>();
    const addItem = (id: string, locId: string) => {
      ids.add(id);
      if (!hallMap.has(id)) hallMap.set(id, allLocations[locId]?.name || locId);
    };
    const menus = data?.residentialMenus;
    if (menus) {
      for (const locId in menus) {
        const mealMenu = menus[locId]?.[meal];
        if (!mealMenu) continue;
        for (const station in mealMenu) {
          for (const id of mealMenu[station] || []) addItem(id, locId);
        }
      }
    }
    const retail = data?.retailMenus;
    if (retail) {
      for (const locId in retail) {
        const locMenu = retail[locId];
        if (!locMenu) continue;
        for (const key in locMenu) {
          const val = locMenu[key];
          if (Array.isArray(val)) { for (const id of val) addItem(id, locId); }
          else if (val && typeof val === 'object') {
            for (const cat in val) {
              if (Array.isArray(val[cat])) { for (const id of val[cat]) addItem(id, locId); }
            }
          }
        }
      }
    }
    return { currentMealItemIds: ids, itemDiningHall: hallMap };
  }, [data?.residentialMenus, data?.retailMenus, meal]);

  const allItemIds = useMemo(() => Array.from(currentMealItemIds), [currentMealItemIds]);

  const { scores, loading: recLoading } = useRecommendations(allItemIds, !!user);

  const topRecommended = useMemo(() => {
    if (!data?.menuItems || !scores || Object.keys(scores).length === 0) return [];

    return Object.entries(scores)
      .filter(([id, score]) => score > 0 && currentMealItemIds.has(id))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => enrichItem(data.menuItems[id]))
      .filter(Boolean);
  }, [scores, data?.menuItems, currentMealItemIds, data?.interactions, data?.metrics]);

  const [interactionVersion, setInteractionVersion] = useState(0);
  useEffect(() => {
    setInteractionListener(() => setInteractionVersion(v => v + 1));
  }, []);

  const popularItems = useMemo(() => {
    if (!data?.menuItems || !data?.metrics) return [];
    return Array.from(currentMealItemIds)
      .map((id) => enrichItem(data.menuItems[id]))
      .filter((item: any) => item && data.metrics[item.id])
      .sort((a: any, b: any) => {
        const aNet = (data.metrics[a.id]?.likeCount ?? 0) - (data.metrics[a.id]?.dislikeCount ?? 0);
        const bNet = (data.metrics[b.id]?.likeCount ?? 0) - (data.metrics[b.id]?.dislikeCount ?? 0);
        return bNet - aNet;
      })
      .slice(0, 3);
  }, [data?.menuItems, data?.metrics, currentMealItemIds]);

  const favoritedItems = useMemo(() => {
    if (!data?.menuItems) return [];
    return Array.from(currentMealItemIds)
      .map((id) => enrichItem(data.menuItems[id]))
      .filter((item: any) => {
        if (!item) return false;
        const local = localInteractions.get(item.id);
        if (local?.favorited !== undefined) return local.favorited;
        const interaction = data.interactions?.[item.id];
        return interaction?.favorited;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.menuItems, data?.interactions, currentMealItemIds, interactionVersion]);

  const [locationType, setLocationType] = useState<'residential' | 'retail'>('residential');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<MenuSortOption>('None');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileScrolled, setMobileScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setMobileScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hideFilterSidebar = useMediaQuery('(max-width: 800px)');
  const stackMenuHeaderMobile = useMediaQuery('(max-width: 763px)');
  const stackMenuHeaderWithSidebar = useMediaQuery('(max-width: 1019px)');
  const stackMenuHeader =
    !hideFilterSidebar && preferences.sidebarOpen ? stackMenuHeaderWithSidebar : stackMenuHeaderMobile;

  const { displayData: residentialDisplayData, hasAnyRawLocations: hasAnyResidentialData } =
    useBuildResidentialDisplayData(data, preferences, searchTerm, meal, sortOption, interactionVersion);

  const { displayData: retailDisplayData, hasAnyRawLocations: hasAnyRetailData } =
    useBuildRetailDisplayData(data, preferences, searchTerm, sortOption, interactionVersion);

  const displayData = locationType === 'retail' ? retailDisplayData : residentialDisplayData;
  const hasAnyRawData = locationType === 'retail' ? hasAnyRetailData : hasAnyResidentialData;

  const filterSidebarProps = {
    locationType,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    diningHalls: preferences.diningHalls,
    allergens: preferences.allergens,
    toggleDiningHall: preferences.toggleDiningHall,
    toggleAllergen: preferences.toggleAllergen,
    clearPreferences: preferences.clearAll,
  };

  return (
    <>
      <SplashScreen />
          <Pane
            display='flex'
            className='sm:flex-row min-h-screen flex-col transition-colors duration-300'
            style={{ overflowX: 'clip' }}
            background={MEAL_COLOR_MAP(theme)[meal]}
          >
            {/* Desktop sidebar */}
            {!hideFilterSidebar && (
              <div
                className='sidebar-slide-wrapper'
                style={{
                  width: preferences.sidebarOpen ? 280 : 0,
                  minWidth: preferences.sidebarOpen ? 280 : 0,
                  transform: `translateX(${preferences.sidebarOpen ? 0 : -280}px)`,
                }}
              >
                <FilterSidebar
                  {...filterSidebarProps}
                  variant='sidebar'
                  onClose={() => preferences.setSidebarOpen(false)}
                />
              </div>
            )}

            <Pane flex={1} className='h-full no-scrollbar' style={{ overflowX: 'clip' }}>
              {/* Mobile header: sticky filter bar + meal title + date selector */}
              {hideFilterSidebar && (
                <>
                  <div
                    className={`sticky top-0 z-50 transition-shadow duration-200${mobileScrolled ? ' shadow-[0px_4px_8px_rgba(0,0,0,0.1)]' : ''}`}
                    style={{ background: MEAL_COLOR_MAP(theme)[meal] }}
                  >
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
                            {...filterSidebarProps}
                            variant='mobile-popover'
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
                  <div className='flex flex-col items-center text-center px-4 pt-2'>
                    <MealTitle meal={meal} locationType={locationType} selectedDate={selectedDate} size='mobile' />
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

              {/* Main content area */}
              <Pane
                paddingRight={majorScale(3)}
                paddingLeft={hideFilterSidebar || !preferences.sidebarOpen ? majorScale(3) : 0}
              >
                <Pane maxWidth={1200} marginX='auto' width='100%'>
                  {/* Desktop header */}
                  {!hideFilterSidebar && (
                    <DesktopHeader
                      meal={meal}
                      setMeal={setMeal}
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      locationType={locationType}
                      setLocationType={setLocationType}
                      sidebarOpen={preferences.sidebarOpen}
                      setSidebarOpen={preferences.setSidebarOpen}
                      stackMenuHeader={stackMenuHeader}
                    />
                  )}

                  {!loading && locationType === 'residential' && (
                    <RecommendedSection items={topRecommended} favoritedItems={favoritedItems} popularItems={popularItems} />
                  )}

                  <MenuCardGrid
                    loading={loading}
                    displayData={displayData}
                    hasAnyRawData={hasAnyRawData}
                    dateKey={dateKey}
                    meal={meal}
                    locationType={locationType}
                    pinnedHalls={preferences.pinnedHalls}
                    togglePinnedHall={preferences.togglePinnedHall}
                    sortOption={sortOption}
                    hideFilterSidebar={hideFilterSidebar}
                  />
                </Pane>
              </Pane>
            </Pane>
          </Pane>
    </>
  );
}

// ---------------------------------------------------------------------------
// MealTitle — displays the current meal name and hours
// ---------------------------------------------------------------------------

function MealTitle({
  meal,
  locationType,
  selectedDate,
  size = 'desktop',
}: {
  meal: Meal;
  locationType: string;
  selectedDate: Date;
  size?: 'desktop' | 'mobile';
}) {
  const theme = useTheme();
  const displayedMeal = getDisplayedMeal(meal, locationType, selectedDate);
  const headingClass = size === 'mobile' ? 'text-4xl meal-title-enter p-0' : 'text-5xl meal-title-enter';
  const hoursText = locationType === 'retail' ? 'Hours vary' : MEAL_RANGES[meal];

  if (size === 'mobile') {
    return (
      <Text key={displayedMeal} className='text-xl meal-title-enter' color={theme.colors.green700} fontWeight={700}>
        {displayedMeal}: {hoursText}
      </Text>
    );
  }

  return (
    <>
      <Heading
        key={displayedMeal}
        className={headingClass}
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
        {hoursText}
      </Text>
    </>
  );
}

// ---------------------------------------------------------------------------
// DesktopHeader — meal title, date selector, location toggle, sidebar button
// ---------------------------------------------------------------------------

function DesktopHeader({
  meal,
  setMeal,
  selectedDate,
  setSelectedDate,
  locationType,
  setLocationType,
  sidebarOpen,
  setSidebarOpen,
  stackMenuHeader,
}: {
  meal: Meal;
  setMeal: (m: Meal) => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  locationType: 'residential' | 'retail';
  setLocationType: (t: 'residential' | 'retail') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  stackMenuHeader: boolean;
}) {
  return (
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
        <MealTitle meal={meal} locationType={locationType} selectedDate={selectedDate} size='desktop' />
        <SidebarToggleButton sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
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
  );
}

// ---------------------------------------------------------------------------
// SidebarToggleButton — the "Search & Filter" pill that appears when sidebar is closed
// ---------------------------------------------------------------------------

function SidebarToggleButton({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
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
  );
}

// ---------------------------------------------------------------------------
// MenuCardGrid — loading skeletons, empty state, or the card grid
// ---------------------------------------------------------------------------

function MenuCardGrid({
  loading,
  displayData,
  hasAnyRawData,
  dateKey,
  meal,
  locationType,
  pinnedHalls,
  togglePinnedHall,
  sortOption,
  hideFilterSidebar,
}: {
  loading: boolean;
  displayData: any[];
  hasAnyRawData: boolean;
  dateKey: string;
  meal: Meal;
  locationType: string;
  pinnedHalls: DiningHall[];
  togglePinnedHall: (hall: DiningHall) => void;
  sortOption: MenuSortOption;
  hideFilterSidebar: boolean;
}) {
  const theme = useTheme();

  if (loading) {
    return (
      <Pane
        display='grid'
        paddingBottom={majorScale(6)}
        gridTemplateColumns='repeat(auto-fill,minmax(350px,1fr))'
        gap={majorScale(2)}
        className='skeleton-grid-enter'
      >
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonDiningHallCard key={i} />
          ))}
      </Pane>
    );
  }

  if (displayData.length === 0) {
    return (
      <Pane
        display='flex'
        alignItems='center'
        justifyContent='center'
        paddingY={majorScale(8)}
        flexDirection='column'
        width='100%'
        marginTop={majorScale(2)}
        className='h-full'
      >
        {hasAnyRawData ? (
          <img src='/images/icons/funnel-x-dark.svg' width={50} height={50} alt='Filtered out' />
        ) : (
          <img src='/images/icons/no-food-dark.svg' width={70} height={70} alt='No menus available' />
        )}
        <Heading
          size={500}
          color={theme.colors.gray800}
          marginTop={majorScale(2)}
          marginBottom={minorScale(1)}
        >
          {hasAnyRawData ? 'Filtered out' : 'Nothing today!'}
        </Heading>
        <Text size={400} color='black' opacity={0.4} textAlign='center' maxWidth={320}>
          {hasAnyRawData
            ? 'Try adjusting your search or filters'
            : "We couldn't find any menus for this meal. Check back later."}
        </Text>
      </Pane>
    );
  }

  return (
    <Pane
      key={`${dateKey}-${meal}-${locationType}`}
      display='grid'
      paddingBottom={majorScale(6)}
      gridTemplateColumns='repeat(auto-fill,minmax(350px,1fr))'
      gap={majorScale(2)}
    >
      {displayData.map((diningHall, i) => {
        const isPinned = pinnedHalls.includes(diningHall.name as DiningHall);
        return (
          <DiningHallCard
            key={diningHall.name}
            diningHall={diningHall}
            isPinned={isPinned}
            onPinToggle={() => togglePinnedHall(diningHall.name as DiningHall)}
            sortOption={sortOption}
            filtersActive={diningHall.rawMenuCount > 0}
            index={i}
            stickyTop={hideFilterSidebar ? 48 : 0}
          />
        );
      })}
    </Pane>
  );
}

