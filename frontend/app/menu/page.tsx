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
  ChevronLeftIcon,
  ChevronRightIcon,
  Checkbox,
  SearchInput,
  Switch,
  UndoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'evergreen-ui';
import DiningHallCard from '@/components/dining-hall-card';
import HallMenuModal from '@/components/hall-menu-modal';
import SkeletonDiningHallCard from '@/app/menu/components/dining-hall-card-skeleton';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useDate } from '@/hooks/use-date';
import { usePinnedHalls } from '@/hooks/use-pinned-halls';
import { DINING_HALLS, MEAL_RANGES, ALLERGENS, DIETARY_TAGS, MEALS } from '@/data';
import {
  MEAL_COLOR_MAP,
  ALLERGEN_EMOJI,
  HALL_ICON_MAP,
  DIET_LABEL_MAP,
  ALLERGEN_STYLE_MAP,
  DIET_STYLE_MAP,
} from '@/styles';
import {
  DiningVenue,
  Meal,
  MenusForDateMealAndLocations,
  MenusForLocations,
  MenusForMealAndLocations,
  DiningHall,
  DietaryTag,
  Allergen,
} from '@/types/dining';
import { buildDisplayData } from './actions';
import { formatMenuId } from '@/utils/dining';
import { DiningPreferences } from '@/types/dining';
import { getDiningMenusForDay } from '@/lib/next-endpoints';

const MENU_CACHE_KEY = 'menuCache';
const PREFERENCES_KEY = 'diningPreferences';
const DEFAULT_PREFERENCES: DiningPreferences = {
  diningHalls: DINING_HALLS,
  dietaryRestrictions: [],
  allergens: [],
  showNutrition: true,
};

/**
 * Menu page component.
 *
 * @returns The menu page component.
 */
export default function MenuPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  // Date logic from the useDate hook
  const {
    selectedDate,
    currentMeal,
    dateKey,
    formattedDateForDisplay,
    goToPreviousDay,
    goToNextDay,
  } = useDate();

  // State for currently selected meal, menus, menu cache, and current menu ID
  const [meal, setMeal] = useState<Meal>(currentMeal as Meal);
  const [menusForLocations, setMenusForLocations] = useState<MenusForLocations>([]);
  const [menuCache, setMenuCache, menuCacheLoading] = useLocalStorage<MenusForDateMealAndLocations>(
    { key: MENU_CACHE_KEY, initialValue: {} }
  );
  const menuId = formatMenuId(selectedDate, meal);

  // Local storage state for dining preferences
  const [preferences, setPreferences, preferencesLoading] = useLocalStorage<DiningPreferences>({
    key: PREFERENCES_KEY,
    initialValue: DEFAULT_PREFERENCES,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Controls pinned halls, modal, and filter open state
  const [modalHall, setModalHall] = useState<DiningVenue | null>(null);
  const { pinnedHalls, togglePin } = usePinnedHalls();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch menu data for the selected date
  useEffect(() => {
    if (preferencesLoading || menuCacheLoading || !selectedDate || !dateKey) return;
    setLoading(true);

    // Check cache first
    const cachedMenus = menuCache[dateKey];
    if (cachedMenus) {
      setMenusForLocations(cachedMenus[meal] ?? []);
      setLoading(false);
      console.log('Found menus in cache for date:', dateKey, cachedMenus);
      return;
    }

    // Otherwise, fetch from API
    async function fetchMenuData() {
      try {
        const menusRoute = `${FETCH_MENU_DATA_URL}?menu_date=${dateKey}`;
        const { data, error } = await api.get<MenusForMealAndLocations>(menusRoute);
        if (error) throw new Error(error);
        if (!data) throw new Error('No data received');
        const menuData = data.data || data;
        if (!menuData || (typeof menuData === 'object' && Object.keys(menuData).length === 0)) {
          throw new Error('No menu data found');
        }

        console.log('Fetched menus for date:', dateKey, menuData);
        const menusData = menuData as MenusForMealAndLocations;
        setMenusForLocations(menusData[meal] ?? []);
        setMenuCache({ ...menuCache, [dateKey]: menusData as MenusForDateMealAndLocations });
        setLoading(false);
        return;
      } catch (error) {
        console.error(`Error fetching menu data for ${dateKey}:`, error);
        setLoading(false);
        setMenusForLocations([]);
        return;
      } finally {
        setLoading(false);
      }
    }

    fetchMenuData();
  }, [selectedDate, dateKey, preferencesLoading, menuCache]);

  // Build display data for the current meal
  const displayMenusForLocations = useMemo(
    () =>
      buildDisplayData({
        menusForLocations,
        appliedDiningHalls: preferences.diningHalls ?? DINING_HALLS,
        appliedDietaryRestrictions: preferences.dietaryRestrictions ?? [],
        appliedAllergens: preferences.allergens ?? [],
        searchTerm,
        pinnedHalls: pinnedHalls ?? new Set(),
      }),
    [
      menusForLocations,
      meal,
      preferences.diningHalls,
      preferences.dietaryRestrictions,
      preferences.allergens,
      searchTerm,
      pinnedHalls,
    ]
  );

  // Render loading state
  if (preferencesLoading) {
    return (
      <Pane display='flex' alignItems='center' justifyContent='center' height='300'>
        <Spinner />
      </Pane>
    );
  }

  // Render skeleton cards while loading
  const DiningHallSkeletonCards = () => {
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
        gridTemplateColumns='repeat(auto-fill,minmax(340px,1fr))'
        gap={majorScale(2)}
        className='h-full no-scrollbar'
      >
        {displayMenusForLocations.map((diningHall) => {
          const isPinned = pinnedHalls.has(diningHall.name as DiningHall);
          const onPinToggle = () => togglePin(diningHall.name as DiningHall);
          return (
            <DiningHallCard
              key={diningHall.name}
              diningHall={diningHall}
              setModalHall={setModalHall}
              showNutrition={preferences.showNutrition}
              isPinned={isPinned}
              onPinToggle={onPinToggle}
              menuId={menuId}
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
      {/* Filter sidebar */}
      <Pane
        flexDirection='column'
        width={280}
        padding={majorScale(3)}
        className='max-w-[100%] hidden sm:inline z-20'
      >
        <Pane
          display='flex'
          background='white'
          borderRadius={12}
          maxHeight='100%'
          boxShadow='0 2px 12px rgba(0,0,0,0.06)'
          className='fixed sm:relative overflow-hidden flex-col'
        >
          <Pane
            background={theme.colors.gray100}
            borderBottom={`1px solid ${theme.colors.gray200}`}
            className='relative flex flex-col p-4'
          >
            {/* Reset Filters button */}
            <Pane
              display='flex'
              alignItems='center'
              cursor='pointer'
              onClick={() => {
                setPreferences(DEFAULT_PREFERENCES);
                setSearchTerm('');
              }}
              background={theme.colors.gray100}
              marginBottom={minorScale(2)}
            >
              <UndoIcon size={14} color={theme.colors.gray700} />
              <Text marginLeft={minorScale(1)} size={300} color={theme.colors.gray700}>
                Reset Filters
              </Text>
            </Pane>

            <Pane borderBottom={`1px solid ${theme.colors.gray200}`} marginBottom={minorScale(2)} />

            {/* Search Food input */}
            <Text
              size={300}
              fontWeight={600}
              color={theme.colors.gray800}
              marginBottom={minorScale(1)}
            >
              Search Food
            </Text>
            <SearchInput
              placeholder='Type to filter...'
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
            />
          </Pane>

          {/* Show Nutrition Toggle */}
          <Pane className='px-4 pt-4'>
            <Pane
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              marginBottom={minorScale(3)}
            >
              <Text size={300} fontWeight={600} color={theme.colors.gray800}>
                Show Nutrition
              </Text>
              <Switch
                checked={preferences.showNutrition}
                onChange={() =>
                  setPreferences((prev) => ({ ...prev, showNutrition: !prev.showNutrition }))
                }
              />
            </Pane>
            <Pane borderBottom={`1px solid ${theme.colors.gray200}`} />
          </Pane>

          <Pane className='p-4' overflowY='auto' height='100%'>
            {/* Open and hide filters */}
            <Pane
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              cursor='pointer'
              onClick={() => setFiltersOpen((prev) => !prev)}
              marginBottom={filtersOpen ? minorScale(2) : 0}
            >
              <Text size={300} color={theme.colors.gray700}>
                {filtersOpen ? 'Hide Filters' : 'Filter By'}
              </Text>
              {filtersOpen ? (
                <ChevronUpIcon size={16} color='green600' />
              ) : (
                <ChevronDownIcon size={16} color='green600' />
              )}
            </Pane>

            <Pane
              borderBottom={filtersOpen ? `1px solid ${theme.colors.gray200}` : undefined}
              marginBottom={minorScale(2)}
            />

            {filtersOpen && (
              <Pane>
                {/* Control which dining halls are displayed */}
                <Text
                  size={300}
                  fontWeight={600}
                  color={theme.colors.gray800}
                  marginBottom={minorScale(1)}
                >
                  Dining Halls
                </Text>
                <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
                  {DINING_HALLS.map((diningHall: DiningHall) => {
                    const diningHallText = diningHall.replace(' College', '');
                    const checked = preferences.diningHalls.includes(diningHall);
                    const onChange = () => {
                      setPreferences((prev) => ({
                        ...prev,
                        diningHalls: prev.diningHalls.includes(diningHall)
                          ? prev.diningHalls.filter((h: DiningHall) => h !== diningHall)
                          : [...prev.diningHalls, diningHall],
                      }));
                    };

                    return (
                      <Pane key={diningHall} display='flex' alignItems='center' marginBottom='2px'>
                        <Checkbox checked={checked} onChange={onChange} />
                        <Pane marginX={minorScale(2)}>
                          <img
                            src={HALL_ICON_MAP[diningHall]}
                            alt={diningHall}
                            width={20}
                            height={20}
                          />
                        </Pane>
                        <Text size={300} color={theme.colors.gray900}>
                          {diningHallText}
                        </Text>
                      </Pane>
                    );
                  })}
                </Pane>

                <Pane
                  borderBottom={`1px solid ${theme.colors.gray200}`}
                  marginBottom={minorScale(2)}
                />

                {/* Control which dietary tags are displayed */}
                <Text
                  size={300}
                  fontWeight={600}
                  color={theme.colors.gray800}
                  marginBottom={minorScale(1)}
                >
                  Dietary Tags
                </Text>
                <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
                  {DIETARY_TAGS.map((dietKey: DietaryTag) => {
                    const style = DIET_STYLE_MAP(theme)[dietKey as DietaryTag];
                    const checked = preferences.dietaryRestrictions.includes(dietKey);
                    const onChange = () => {
                      setPreferences((prev) => ({
                        ...prev,
                        dietaryRestrictions: prev.dietaryRestrictions.includes(dietKey)
                          ? prev.dietaryRestrictions.filter((d: DietaryTag) => d !== dietKey)
                          : [...prev.dietaryRestrictions, dietKey],
                      }));
                    };

                    return (
                      <Pane
                        key={dietKey}
                        display='flex'
                        alignItems='center'
                        marginBottom={minorScale(1)}
                      >
                        <Checkbox checked={checked} onChange={onChange} />
                        <Pane
                          width={20}
                          height={20}
                          borderRadius={3}
                          background={style?.bg}
                          display='flex'
                          alignItems='center'
                          justifyContent='center'
                          marginX={minorScale(2)}
                          className='p-1'
                        >
                          <Text className='text-xs' color={style?.color} fontWeight={600}>
                            {DIET_LABEL_MAP[dietKey]}
                          </Text>
                        </Pane>
                        <Text size={300} color={theme.colors.gray900}>
                          {dietKey}
                        </Text>
                      </Pane>
                    );
                  })}
                </Pane>

                <Pane
                  borderBottom={`1px solid ${theme.colors.gray200}`}
                  marginBottom={minorScale(2)}
                />

                {/* Control which allergens are not displayed */}
                <Text
                  size={300}
                  fontWeight={600}
                  color={theme.colors.gray800}
                  marginBottom={minorScale(1)}
                >
                  Allergen Tags
                </Text>
                <Pane display='flex' flexDirection='column'>
                  {ALLERGENS.map((allergen: Allergen) => {
                    const style = ALLERGEN_STYLE_MAP(theme)[allergen as Allergen];
                    const checked = preferences.allergens.includes(allergen);
                    const emoji = ALLERGEN_EMOJI[allergen as Allergen];
                    const onChange = () => {
                      setPreferences((prev) => ({
                        ...prev,
                        allergens: prev.allergens.includes(allergen)
                          ? prev.allergens.filter((a: Allergen) => a !== allergen)
                          : [...prev.allergens, allergen],
                      }));
                    };

                    return (
                      <Pane
                        key={allergen}
                        display='flex'
                        alignItems='center'
                        marginBottom={minorScale(1)}
                      >
                        <Checkbox checked={checked} onChange={onChange} />
                        <Pane
                          width={20}
                          height={20}
                          borderRadius={999}
                          background={style?.bg}
                          display='flex'
                          alignItems='center'
                          justifyContent='center'
                          marginX={minorScale(2)}
                        >
                          <Text className='text-xs' color={style?.color}>
                            {emoji}
                          </Text>
                        </Pane>
                        <Text size={300} color={theme.colors.gray900}>
                          {allergen}
                        </Text>
                      </Pane>
                    );
                  })}
                </Pane>
              </Pane>
            )}
          </Pane>
        </Pane>
      </Pane>

      <Pane flex={1} className='overflow-x-hidden h-full no-scrollbar px-4'>
        {/* Header for the menu page */}
        <Pane>
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            marginY={majorScale(3)}
            className='flex-col sm:flex-row text-center sm:text-left'
          >
            <Pane width={240}>
              <Heading className='text-4xl' color={theme.colors.green700} fontWeight={900}>
                {meal.toUpperCase()}
              </Heading>
              <Text className='text-xl' color={theme.colors.green600} fontWeight={600}>
                {MEAL_RANGES[meal as Meal as keyof typeof MEAL_RANGES]}
              </Text>
            </Pane>

            <Pane display='flex' gap={minorScale(2)} className='flex-col flex justify-center my-4'>
              {/* Date and meal selector */}
              <Pane display='flex' alignItems='center' gap={minorScale(2)}>
                <Button
                  background='white'
                  border={`1px solid ${theme.colors.green700}`}
                  borderRadius={999}
                  padding={minorScale(1)}
                  appearance='minimal'
                  onClick={goToPreviousDay}
                >
                  <ChevronLeftIcon size={20} />
                </Button>

                <Text
                  className='text-2xl text-center w-[14rem] truncate'
                  color={theme.colors.green700}
                >
                  {formattedDateForDisplay}
                </Text>

                <Button
                  background='white'
                  border={`1px solid ${theme.colors.green700}`}
                  borderRadius={999}
                  padding={minorScale(1)}
                  appearance='minimal'
                  onClick={goToNextDay}
                >
                  <ChevronRightIcon size={20} />
                </Button>
              </Pane>

              {/* Control which meal is displayed */}
              <Pane
                display='flex'
                borderRadius={999}
                background={theme.colors.green25}
                overflow='hidden'
              >
                {MEALS.map((mealOption: Meal) => {
                  const isSelectedMeal = meal === mealOption;
                  const backgroundColor = isSelectedMeal ? theme.colors.green700 : 'transparent';
                  const textColor = isSelectedMeal ? 'white' : theme.colors.green800;

                  return (
                    <Pane
                      key={mealOption}
                      flex={1}
                      textAlign='center'
                      paddingY={minorScale(1)}
                      cursor='pointer'
                      background={backgroundColor}
                      color={textColor}
                      className='text-xs px-4'
                      fontWeight={300}
                      onClick={() => setMeal(mealOption as Meal)}
                    >
                      {mealOption}
                    </Pane>
                  );
                })}
              </Pane>
            </Pane>
            <Pane display='flex' flexDirection='column' gap={majorScale(2)} width={240} />
          </Pane>

          {/* Render the appropriate content based on the loading state and the number of menu items */}
          {loading ? (
            <DiningHallSkeletonCards />
          ) : displayMenusForLocations.length === 0 ? (
            <NoMenusFoundCard />
          ) : (
            <DiningHallCards />
          )}
        </Pane>
      </Pane>

      {/* Allergens sidebar for filtering by allergens */}
      <Pane
        className='hidden sm:flex'
        flexDirection='column'
        width={200}
        padding={majorScale(3)}
        overflowY='auto'
        zIndex={2}
      >
        <Heading size={600} color={theme.colors.green900}>
          Allergens to Avoid
        </Heading>
        <Pane marginTop={majorScale(2)} display='flex' flexDirection='column' gap={majorScale(2)}>
          {ALLERGENS.map((allergen: Allergen) => {
            const selected = preferences.allergens;
            const isSelected = selected.includes(allergen);
            const emojiForAllergen = ALLERGEN_EMOJI[allergen as Allergen];
            const backgroundColor = isSelected ? theme.colors.red100 : theme.colors.gray100;
            const title = isSelected
              ? `Hiding items containing ${allergen}`
              : `Click to hide items containing ${allergen}`;
            const onChange = () => {
              setPreferences((prev) => ({
                ...prev,
                allergens: prev.allergens.includes(allergen as Allergen)
                  ? prev.allergens.filter((a: Allergen) => a !== allergen)
                  : [...prev.allergens, allergen],
              }));
            };

            return (
              <Pane
                key={allergen}
                display='flex'
                alignItems='center'
                cursor='pointer'
                opacity={isSelected ? 1.0 : 0.6}
                onClick={onChange}
                title={title}
              >
                <Pane
                  width={28}
                  height={28}
                  display='inline-flex'
                  alignItems='center'
                  justifyContent='center'
                  borderRadius={14}
                  background={backgroundColor}
                  marginRight={minorScale(1)}
                >
                  <Text size={200}>{emojiForAllergen}</Text>
                </Pane>
                <Text size={400} color={theme.colors.green900} fontWeight={isSelected ? 600 : 400}>
                  {allergen}
                </Text>
              </Pane>
            );
          })}
        </Pane>
      </Pane>

      <HallMenuModal
        modalHall={modalHall}
        setModalHall={setModalHall}
        showNutrition={preferences.showNutrition}
        menuId={menuId}
      />
    </Pane>
  );
}
