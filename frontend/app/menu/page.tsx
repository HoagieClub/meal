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
} from 'evergreen-ui';
import DiningHallCard from '@/components/dining-hall-card';
import HallMenuModal from '@/components/hall-menu-modal';
import AllergenSidebar from '@/app/menu/components/allergen-sidebar';
import FilterSidebar from '@/app/menu/components/filter-sidebar';
import MenuPageHeader from '@/app/menu/components/menu-header';
import SkeletonDiningHallCard from '@/app/menu/components/dining-hall-card-skeleton';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { buildDisplayData, fetchMenuData } from './actions';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDate } from '@/hooks/use-date';
import { usePinnedHalls } from '@/hooks/use-pinned-halls';
import { usePreferences } from '@/hooks/use-preferences';
import { DINING_HALLS, DiningHallType, MealType, UIVenue } from '@/data';
import { MEAL_COLOR_MAP } from '@/styles';

const MENU_CACHE_KEY = 'menuCache';

/**
 * Menu page component.
 *
 * @returns The menu page component.
 */
export default function MenuPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const { isLoading: authLoading, error: authError } = useUser();

  const useDateObject = useDate();
  const { selectedDate, isWeekend, currentMeal } = useDateObject;

  const [menusByMeal, setMenusByMeal] = useState<{ [key in MealType]?: UIVenue[] }>({});
  const [meal, setMeal] = useState<MealType>(currentMeal as MealType);
  const [menuCache, setMenuCache] = useLocalStorage<Record<string, any>>({
    key: MENU_CACHE_KEY,
    initialValue: {},
  });

  const usePreferencesObject = usePreferences();
  const { setAllergens, preferences, loading: preferencesLoading } = usePreferencesObject;

  const [searchTerm, setSearchTerm] = useState('');
  const availableMeals: MealType[] = isWeekend
    ? ['Lunch', 'Dinner']
    : ['Breakfast', 'Lunch', 'Dinner'];
  const [modalHall, setModalHall] = useState<UIVenue | null>(null);
  const { pinnedHalls, togglePin } = usePinnedHalls();

  useEffect(() => {
    if (preferencesLoading || !selectedDate || !meal) return;
    let isCurrent = true;

    const checkIsCurrent = () => isCurrent;
    setLoading(true);
    const dateKey = selectedDate.toISOString().split('T')[0];

    async function fetchAllMeals() {
      let baseMeals: MealType[] = isWeekend
        ? ['Lunch', 'Dinner']
        : ['Breakfast', 'Lunch', 'Dinner'];
      const mealsToFetch = [meal, ...baseMeals.filter((m) => m !== meal)];

      const ids = mealsToFetch.map((m) => `${dateKey}-${m as MealType}`);
      const results = await Promise.all(ids.map((id) => fetchMenuData(id, checkIsCurrent)));
      if (!checkIsCurrent()) return;

      const combined: any = {};
      results.forEach((res, i) => {
        combined[mealsToFetch[i] as MealType] = res ?? [];
      });

      const noData = Object.values(combined as Record<MealType, UIVenue[]>).every(
        (items: UIVenue[]) => items.length === 0
      );
      if (!noData) {
        setMenuCache((prev) => ({
          ...prev,
          [dateKey]: combined,
        }));
      }
      setMenusByMeal(combined);
      setLoading(false);
    }

    if (menuCache[dateKey]) {
      console.log(menuCache[dateKey]);
      setMenusByMeal(menuCache[dateKey]);
      setLoading(false);
    } else {
      fetchAllMeals();
    }

    return () => {
      isCurrent = false;
    };
  }, [selectedDate, preferencesLoading, isWeekend, meal, menuCache, setMenusByMeal]);

  const venues = menusByMeal[meal as MealType] ?? [];
  const displayData = useMemo(
    () =>
      buildDisplayData({
        venues,
        appliedDiningHalls: preferences.diningHalls ?? DINING_HALLS,
        appliedDietaryRestrictions: preferences.dietaryRestrictions ?? [],
        appliedAllergens: preferences.allergens ?? [],
        searchTerm,
        pinnedHalls: pinnedHalls ?? new Set(),
        showNutrition: preferences.showNutrition ?? true,
      }),
    [
      venues,
      preferences.diningHalls,
      preferences.dietaryRestrictions,
      preferences.allergens,
      preferences.showNutrition,
      searchTerm,
      pinnedHalls,
    ]
  );

  if (authLoading || preferencesLoading) {
    return (
      <Pane display='flex' alignItems='center' justifyContent='center' height='300'>
        <Spinner />
      </Pane>
    );
  } else if (authError) {
    return (
      <Pane padding={majorScale(4)}>
        <Text color='red' size={500}>
          {authError?.message || 'Failed to load user profile'}
        </Text>
      </Pane>
    );
  }

  /**
   * Render the skeleton dining hall cards.
   *
   * @returns The skeleton dining hall cards.
   */
  const renderSkeletonDiningHallCards = () => {
    return (
      <Pane
        display='grid'
        overflowY='auto'
        paddingBottom={majorScale(6)}
        gridTemplateColumns='repeat(auto-fill,minmax(340px,1fr))'
        gap={majorScale(1)}
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

  /**
   * Render the no dishes found.
   *
   * @returns The no dishes found.
   */
  const renderNoDishesFound = () => {
    return (
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
  };

  /**
   * Render the dining hall cards.
   *
   * @returns The dining hall cards.
   */
  const renderDiningHallCards = () => {
    return (
      <Pane
        display='grid'
        overflowY='auto'
        paddingBottom={majorScale(6)}
        gridTemplateColumns='repeat(auto-fill,minmax(340px,1fr))'
        gap={majorScale(2)}
        className='h-full no-scrollbar'
      >
        {displayData.map((diningHall) => (
          <DiningHallCard
            key={diningHall.name}
            diningHall={diningHall}
            setModalHall={setModalHall}
            showNutrition={preferences.showNutrition ?? true}
            isPinned={pinnedHalls.has(diningHall.name as DiningHallType)}
            onPinToggle={() => togglePin(diningHall.name as DiningHallType)}
          />
        ))}
      </Pane>
    );
  };

  return (
    <Pane
      display='flex'
      className='sm:flex-row overflow-hidden min-h-screen flex-col'
      background={MEAL_COLOR_MAP(theme)[meal as MealType]}
    >
      <FilterSidebar
        usePreferencesObject={usePreferencesObject}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <Pane flex={1} className='overflow-x-hidden h-full no-scrollbar px-4'>
        <MenuPageHeader
          meal={meal as MealType}
          availableMeals={availableMeals}
          setMeal={setMeal}
          useDateObject={useDateObject}
        />

        {loading
          ? renderSkeletonDiningHallCards()
          : displayData.length === 0
            ? renderNoDishesFound()
            : renderDiningHallCards()}
      </Pane>
      <AllergenSidebar selected={preferences.allergens ?? []} setAppliedAllergens={setAllergens} />
      <HallMenuModal
        modalHall={modalHall}
        setModalHall={setModalHall}
        showNutrition={preferences.showNutrition ?? true}
      />
    </Pane>
  );
}
