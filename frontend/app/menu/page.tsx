'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Pane, Heading, Text, majorScale, minorScale, useTheme, SearchIcon, Spinner } from 'evergreen-ui';
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

const defaultDate = new Date(new Date().setHours(0, 0, 0, 0));
const FILTER_PREFS_KEY = 'diningFilterPrefs';
const PINNED_HALLS_KEY = 'diningPinnedHalls';

export default function Index() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  const [menusByMeal, setMenusByMeal] = useState<{
    Breakfast?: UIVenue[];
    Lunch?: UIVenue[];
    Dinner?: UIVenue[];
    Brunch?: UIVenue[];
  }>({});
  const [menuCache, setMenuCache] = useLocalStorage<Record<string, any>>('menuCache', {});

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [meal, setMeal] = useState(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 11) return 'Breakfast';
    else if (hour < 17) return 'Lunch';
    else return 'Dinner';
  });

  const [searchTerm, setSearchTerm] = useLocalStorage('diningSearchTerm', '');
  const [showNutrition, setShowNutrition] = useLocalStorage('diningShowNutrition', true);

  const PAGE_BG = backgroundByMeal(theme)[meal as MealType];
  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const availableMeals: MealType[] = isWeekend
    ? ['Lunch', 'Dinner']
    : ['Breakfast', 'Lunch', 'Dinner'];

  const prevDay = () =>
    setSelectedDate((d) => {
      const t = new Date(d);
      t.setDate(t.getDate() - 1);
      return t;
    });

  const nextDay = () =>
    setSelectedDate((d) => {
      const t = new Date(d);
      t.setDate(t.getDate() + 1);
      return t;
    });

  const formatMenuId = (date: Date, meal: MealType): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}-${meal}`;
  };

  const [appliedFilterPrefs, setAppliedFilterPrefs] = useLocalStorage(FILTER_PREFS_KEY, {
    halls: initialSelectedHalls,
    dietary: [] as DietKey[],
    allergens: [] as AllergenKey[],
  });
  const {
    halls: appliedHalls,
    dietary: appliedDietary,
    allergens: appliedAllergens,
  } = appliedFilterPrefs;

  const setAppliedHalls = (value: React.SetStateAction<string[]>) => {
    setAppliedFilterPrefs((prev) => ({
      ...prev,
      halls: value instanceof Function ? value(prev.halls) : value,
    }));
  };
  const setAppliedDietary = (value: React.SetStateAction<DietKey[]>) => {
    setAppliedFilterPrefs((prev) => ({
      ...prev,
      dietary: value instanceof Function ? value(prev.dietary) : value,
    }));
  };
  const setAppliedAllergens = (value: React.SetStateAction<AllergenKey[]>) => {
    setAppliedFilterPrefs((prev) => ({
      ...prev,
      allergens: value instanceof Function ? value(prev.allergens) : value,
    }));
  };

  const [profileLoaded, setProfileLoaded] = useState(false);
  const { dietaryRestrictions, allergens, diningHalls } = useUserProfile();
  const profileReady =
    dietaryRestrictions !== undefined && allergens !== undefined && diningHalls !== undefined;

  useEffect(() => {
    if (profileLoaded || !profileReady) return;
    if (
      (dietaryRestrictions && dietaryRestrictions.length > 0) ||
      (allergens && allergens.length > 0) ||
      (diningHalls && diningHalls.length > 0)
    ) {
      console.log('Profile loaded, syncing filters from DB...');
      setAppliedFilterPrefs((prev) => ({
        halls: diningHalls && diningHalls.length > 0 ? diningHalls : prev.halls,
        dietary:
          dietaryRestrictions && dietaryRestrictions.length > 0
            ? dietaryRestrictions
            : prev.dietary,
        allergens: allergens && allergens.length > 0 ? allergens : prev.allergens,
      }));
    }
    setProfileLoaded(true);
  }, [dietaryRestrictions, allergens, diningHalls, setAppliedFilterPrefs]);

  const [modalHall, setModalHall] = useState<UIVenue | null>(null);

  useEffect(() => {
    if (isWeekend && meal === 'Breakfast') {
      setMeal('Lunch');
    }
  }, [isWeekend, meal]); // Dependency simplified

  // ─── Pinned Halls (using useLocalStorage) ───────────────────────────────
  // Store pinned halls as a string array in localStorage
  const [pinnedArray, setPinnedArray] = useLocalStorage<string[]>(PINNED_HALLS_KEY, []);

  // Derive the Set from the array for efficient lookups
  const pinnedHalls = useMemo(() => new Set(pinnedArray), [pinnedArray]);

  // Create a setter that matches the React.Dispatch type
  const setPinnedHalls: React.Dispatch<React.SetStateAction<Set<string>>> = (value) => {
    setPinnedArray((prevArray) => {
      const prevSet = new Set(prevArray);
      const newSet = value instanceof Function ? value(prevSet) : value;
      return Array.from(newSet); // Store the new array
    });
  };

  // This function works as-is with the new setPinnedHalls wrapper
  const togglePin = (hallName: string) => {
    setPinnedHalls((prevPins) => {
      const newPins = new Set(prevPins); // Create a new set to ensure state update
      if (newPins.has(hallName)) {
        newPins.delete(hallName);
      } else {
        newPins.add(hallName);
      }
      return newPins;
    });
  };

  // ─── Data Fetching for Menus ────────────────────────────────────────────

  useEffect(() => {
    if (!profileLoaded || !selectedDate) return;
    let isCurrent = true;
    const checkIsCurrent = () => isCurrent;
    setLoading(true);
    const dateKey = selectedDate.toISOString().split('T')[0];

    async function fetchAllMeals() {
      let baseMeals: MealType[] = isWeekend
        ? ['Lunch', 'Dinner']
        : ['Breakfast', 'Lunch', 'Dinner'];
      const mealsToFetch = [meal, ...baseMeals.filter((m) => m !== meal)];

      const ids = mealsToFetch.map((m) => formatMenuId(selectedDate, m as MealType));
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
  }, [selectedDate, profileLoaded, isWeekend]);

  const venues = menusByMeal[meal as MealType] ?? [];
  const displayData = useMemo(
    () =>
      buildDisplayData({
        venues,
        appliedHalls,
        appliedDietary,
        appliedAllergens,
        searchTerm,
        pinnedHalls,
      }),
    [venues, appliedHalls, appliedDietary, appliedAllergens, searchTerm, pinnedHalls]
  );

  return (
    <Pane
      display='flex'
      className='sm:flex-row overflow-hidden min-h-screen flex-col'
      background={PAGE_BG}
    >
      <FilterSidebar
        profileLoaded={profileLoaded}
        applied={{
          halls: appliedHalls,
          dietary: appliedDietary,
          allergens: appliedAllergens,
          searchTerm,
          showNutrition,
        }}
        onApply={({ halls, dietary, allergens, searchTerm, showNutrition }) => {
          setAppliedHalls(halls);
          setAppliedDietary(dietary);
          setAppliedAllergens(allergens);
          setSearchTerm(searchTerm);
          setShowNutrition(showNutrition);

          fetch('/api/user/update', {
            method: 'POST',
            body: JSON.stringify({
              dietary_restrictions: dietary,
              allergens,
              dining_halls: halls,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log('Preferences saved to DB:', data);
            })
            .catch((error) => console.error('Error updating user preferences:', error));
        }}
      />

      {/* ─── MAIN VIEW ──────────────────────────────────────────────────────── */}

      <Pane flex={1} className='overflow-x-hidden h-full no-scrollbar px-4'>
        <MenuPageHeader
          meal={meal as MealType}
          selectedDate={selectedDate}
          prevDay={prevDay}
          nextDay={nextDay}
          availableMeals={availableMeals}
          setMeal={setMeal}
        />

        {/* Grid of cards */}
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
      <AllergenSidebar
        selected={appliedAllergens}
        setAppliedAllergens={setAppliedAllergens}
        theme={theme}
      />
      <HallMenuModal
        isShown={!!modalHall}
        onClose={() => setModalHall(null)}
        hall={modalHall}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
      />
    </Pane>
  );
}
