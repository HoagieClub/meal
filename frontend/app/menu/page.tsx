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
import { AllergenKey, DietKey, UIVenue, Meal as MealType } from './types';
import { useUserProfile } from '@/hooks/use-user-profile';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ALLERGEN_EMOJI, initialSelectedHalls, backgroundByMeal } from '@/app/menu/data';
import { buildDisplayData, fetchMenuData } from './actions';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDate } from '@/hooks/use-date';
import { usePinnedHalls } from '@/hooks/use-pinned-halls';
import { usePreferences } from '@/hooks/use-preferences';

const FILTER_PREFS_KEY = 'diningFilterPrefs';

export default function Index() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading, error: authError } = useUser();

  const [menusByMeal, setMenusByMeal] = useState<{
    Breakfast?: UIVenue[];
    Lunch?: UIVenue[];
    Dinner?: UIVenue[];
    Brunch?: UIVenue[];
  }>({});
  const [menuCache, setMenuCache] = useLocalStorage<Record<string, any>>('menuCache', {});

  const { selectedDate, isWeekend, currentMeal, goToNextDay, goToPreviousDay } = useDate();
  const [meal, setMeal] = useState(currentMeal);

  const [searchTerm, setSearchTerm] = useState('');

  const PAGE_BG = backgroundByMeal(theme)[meal as MealType];
  const availableMeals: MealType[] = isWeekend
    ? ['Lunch', 'Dinner']
    : ['Breakfast', 'Lunch', 'Dinner'];

  const {
    setPreferences,
    setAllergens,
    dietary,
    allergens,
    halls,
    showNutrition,
    loading: preferencesLoading,
  } = usePreferences();

  const [modalHall, setModalHall] = useState<UIVenue | null>(null);

  useEffect(() => {
    if (isWeekend && meal === 'Breakfast') {
      setMeal('Lunch');
    }
  }, [isWeekend, meal]); // Dependency simplified

  const { pinnedHalls, togglePin } = usePinnedHalls();

  // ─── Data Fetching for Menus ────────────────────────────────────────────

  useEffect(() => {
    if (preferencesLoading || !selectedDate) return;
    let isCurrent = true;
    const checkIsCurrent = () => isCurrent;
    setLoading(true);
    const dateKey = selectedDate.toISOString().split('T')[0];

    async function fetchAllMeals() {
      let baseMeals: MealType[] = isWeekend
        ? ['Lunch', 'Dinner']
        : ['Breakfast', 'Lunch', 'Dinner'];
      const mealsToFetch = [meal, ...baseMeals.filter((m) => m !== meal)];

      const ids = mealsToFetch.map((m) => `${dateKey}-${m}`);
      const results = await Promise.all(ids.map((id) => fetchMenuData(id, checkIsCurrent)));
      if (!checkIsCurrent()) return;

      const combined: any = {};
      results.forEach((res, i) => {
        combined[mealsToFetch[i]] = res ?? [];
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
      console.log('Menu cache hit for date:', dateKey);
      console.log(menuCache[dateKey]);
      setMenusByMeal(menuCache[dateKey]);
      setLoading(false);
    } else {
      fetchAllMeals();
    }

    return () => {
      isCurrent = false;
    };
  }, [selectedDate, preferencesLoading, isWeekend]);

  const venues = menusByMeal[meal as MealType] ?? [];
  const displayData = useMemo(
    () =>
      buildDisplayData({
        venues,
        appliedHalls: halls,
        appliedDietary: dietary,
        appliedAllergens: allergens,
        searchTerm,
        pinnedHalls,
        showNutrition,
      }),
    [venues, halls, dietary, allergens, searchTerm, pinnedHalls, showNutrition]
  );

  if (authLoading) {
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
      background={PAGE_BG}
    >
      <FilterSidebar
        profileLoaded={!preferencesLoading}
        applied={{
          halls,
          dietary,
          allergens,
          searchTerm,
          showNutrition,
        }}
        onApply={({ halls, dietary, allergens, searchTerm, showNutrition }) => {
          setPreferences({ halls, dietary, allergens, showNutrition });
          setSearchTerm(searchTerm);

          fetch('/api/user/update', {
            method: 'POST',
            body: JSON.stringify({
              dietary_restrictions: dietary,
              allergens,
              dining_halls: halls,
              show_nutrition: showNutrition,
            }),
          })
            .then((response) => response.json())
            .catch((error) => console.error('Error updating user preferences:', error));
        }}
      />

      {/* ─── MAIN VIEW ──────────────────────────────────────────────────────── */}

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
            {displayData.map((hall) => (
              <DiningHallCard
                key={hall.name}
                hall={hall}
                setModalHall={setModalHall}
                ALLERGEN_EMOJI={ALLERGEN_EMOJI}
                theme={theme}
                showNutrition={showNutrition}
                isPinned={pinnedHalls.has(hall.name)}
                onPinToggle={() => togglePin(hall.name)}
              />
            ))}
          </Pane>
        )}
      </Pane>
      <AllergenSidebar selected={allergens} setAppliedAllergens={setAllergens} theme={theme} />
      <HallMenuModal
        isShown={!!modalHall}
        onClose={() => setModalHall(null)}
        hall={modalHall}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
      />
    </Pane>
  );
}
