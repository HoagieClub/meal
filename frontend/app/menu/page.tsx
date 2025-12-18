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
  Theme,
} from 'evergreen-ui';
import DiningHallCard from '@/components/dining-hall-card';
import HallMenuModal from '@/components/hall-menu-modal';
import AllergenSidebar from '@/app/menu/components/allergen-sidebar';
import FilterSidebar from '@/app/menu/components/filter-sidebar';
import MenuPageHeader from '@/app/menu/components/menu-header';
import SkeletonDiningHallCard from '@/app/menu/components/dining-hall-card-skeleton';
import { UIVenue } from './types';
import useLocalStorage from '@/hooks/use-local-storage';
import { buildDisplayData, fetchMenuData } from './actions';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDate } from '@/hooks/use-date';
import { usePinnedHalls } from '@/hooks/use-pinned-halls';
import { usePreferences } from '@/hooks/use-preferences';
import { DINING_HALLS, MealType } from '@/data';
import { MEAL_COLOR_MAP } from '@/styles';

export default function Index() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading, error: authError } = useUser();

  const { selectedDate, isWeekend, currentMeal, goToNextDay, goToPreviousDay } = useDate();

  const [menusByMeal, setMenusByMeal] = useState<{
    [key in MealType]?: UIVenue[];
  }>({});
  const [menuCache, setMenuCache] = useLocalStorage<Record<string, any>>('menuCache', {});
  const [meal, setMeal] = useState<MealType>(currentMeal as MealType);

  const usePreferencesObject = usePreferences();
  const {
    setAllergens,
    dietaryRestrictions,
    allergens,
    diningHalls,
    showNutrition,
    loading: preferencesLoading,
  } = usePreferencesObject;

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
        appliedDiningHalls: diningHalls ?? DINING_HALLS,
        appliedDietaryRestrictions: dietaryRestrictions ?? [],
        appliedAllergens: allergens ?? [],
        searchTerm,
        pinnedHalls: pinnedHalls ?? new Set(),
        showNutrition,
      }),
    [venues, diningHalls, dietaryRestrictions, allergens, searchTerm, pinnedHalls, showNutrition]
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
          selectedDate={selectedDate}
          availableMeals={availableMeals}
          setMeal={setMeal}
          goToNextDay={goToNextDay}
          goToPreviousDay={goToPreviousDay}
        />

        {loading ? (
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
                <SkeletonDiningHallCard key={i} theme={theme} />
              ))}
          </Pane>
        ) : displayData.length === 0 ? (
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
            gridTemplateColumns='repeat(auto-fill,minmax(340px,1fr))'
            gap={majorScale(1)}
            className='h-full no-scrollbar'
          >
            {displayData.map((diningHall) => (
              <DiningHallCard
                key={diningHall.name}
                diningHall={diningHall}
                setModalHall={setModalHall}
                showNutrition={showNutrition}
                isPinned={pinnedHalls.has(diningHall.name)}
                onPinToggle={() => togglePin(diningHall.name)}
              />
            ))}
          </Pane>
        )}
      </Pane>
      <AllergenSidebar selected={allergens} setAppliedAllergens={setAllergens} />
      <HallMenuModal
        modalHall={modalHall}
        setModalHall={setModalHall}
        showNutrition={showNutrition}
      />
    </Pane>
  );
}
