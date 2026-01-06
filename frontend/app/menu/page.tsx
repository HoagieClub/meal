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
import { useDate } from '@/hooks/use-date';
import { usePreferencesCache } from '@/hooks/use-preferences-cache';
import {
  useLocationsCache,
  useMenuItemsCache,
  useMenuStructureCache,
} from '@/hooks/use-menu-cache';
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
  Meal,
  MenusForDateMealAndLocations,
  MenusForLocations,
  MenusForMealAndLocations,
  DiningHall,
  DietaryTag,
  Allergen,
  MenuItemMap,
  ApiId,
  LocationMap,
} from '@/types/dining';
import { buildDisplayData } from './actions';
import {
  getDiningMenusForLocationsAndDay,
  getDiningMenuItems,
  getAllDiningLocations,
} from '@/lib/next-endpoints';

/**
 * Fetches menus for a specific date key from the API.
 *
 * @param dateKey - Date string in YYYY-MM-DD format
 * @returns Promise resolving to MenusForMealAndLocations or null
 */
async function fetchMenusForDateKey(dateKey: string): Promise<MenusForMealAndLocations | null> {
  if (!dateKey) return null;
  try {
    const { data } = await getDiningMenusForLocationsAndDay({
      menu_date: dateKey,
    });
    const menusData = data?.data || data;
    if (!menusData) throw new Error('No data received');
    return menusData as MenusForMealAndLocations;
  } catch (error) {
    console.error(`Error fetching menu data for ${dateKey}:`, error);
    return null;
  }
}

/**
 * Fetches menu items from the API backend given a list of API IDs.
 *
 * @param apiIds - Array of menu item API IDs
 * @returns Promise resolving to Record<string, MenuItem> (map/dict) or null if error
 */
async function fetchMenuItemsByApiIds(apiIds: ApiId[]): Promise<MenuItemMap | null> {
  if (!apiIds || apiIds.length === 0) return null;
  try {
    const apiIdsString = apiIds.join(',');
    const { data } = await getDiningMenuItems({ api_ids: apiIdsString });
    const menuItemsData = data?.data || data;
    if (!menuItemsData) throw new Error('No data received');
    return menuItemsData as MenuItemMap;
  } catch (error) {
    console.error(`Error fetching menu items for API IDs ${apiIds.join(',')}:`, error);
    return null;
  }
}

/**
 * Fetches locations from the API backend.
 *
 * @returns Promise resolving to LocationMap or null if error
 */
async function fetchLocationsForMenu(): Promise<LocationMap | null> {
  try {
    const { data } = await getAllDiningLocations();
    const locationsData = data?.data || data;
    if (!locationsData) throw new Error('No data received');
    return locationsData as LocationMap;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return null;
  }
}

/**
 * Menu page component.
 *
 * @returns The menu page component.
 */
export default function MenuPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState({
    menusForLocations: true,
    menuItems: true,
    locations: true,
  });

  const {
    selectedDate,
    currentMeal,
    dateKey,
    formattedDateForDisplay,
    goToPreviousDay,
    goToNextDay,
  } = useDate();

  const {
    diningHalls,
    dietaryRestrictions,
    allergens,
    pinnedHalls,
    showNutrition,
    addDiningHall,
    addDietaryRestriction,
    addAllergen,
    addPinnedHall,
    removeDiningHall,
    removeDietaryRestriction,
    removeAllergen,
    removePinnedHall,
    toggleShowNutrition,
    toggleDiningHall,
    toggleDietaryRestriction,
    toggleAllergen,
    togglePinnedHall,
    clearAll: clearPreferences,
    loading: preferencesLoading,
  } = usePreferencesCache();

  const {
    menuStructureCacheLoading,
    getApiIdsForMenusForLocations,
    setApiIdsForMenusForLocations,
    setApiIdsForMenusForMealsLocations,
  } = useMenuStructureCache();
  const { menuItemsCache, menuItemsCacheLoading, getMenuItems, setMenuItems } = useMenuItemsCache();
  const { locationsCache, locationsCacheLoading, getAllLocations, setLocations } =
    useLocationsCache();

  const [menusForLocationsState, setMenusForLocationsState] = useState<MenusForLocations>({});
  const [menuItemsState, setMenuItemsState] = useState<MenuItemMap>({});
  const [locationsState, setLocationsState] = useState<LocationMap>({});
  const [meal, setMeal] = useState<Meal>(currentMeal as Meal);

  const [searchTerm, setSearchTerm] = useState('');
  const [modalHall, setModalHall] = useState<Location | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const cacheLoading =
    preferencesLoading ||
    menuStructureCacheLoading ||
    menuItemsCacheLoading ||
    locationsCacheLoading;

  // Fetch menu data for the selected date
  useEffect(() => {
    if (cacheLoading || !meal || !dateKey) return;
    setLoading((prev) => ({ ...prev, menusForLocations: true }));

    // Check cache first
    const menusForLocations = getApiIdsForMenusForLocations(dateKey, meal);
    console.log('menusForLocations (cache)', menusForLocations);
    if (menusForLocations && Object.keys(menusForLocations).length > 0) {
      setMenusForLocationsState(menusForLocations);
      setLoading((prev) => ({ ...prev, menusForLocations: false }));
      return;
    }

    // Otherwise, fetch from API
    async function fetchMenuData() {
      const menusForDateMealAndLocations = await fetchMenusForDateKey(dateKey);
      console.log('menusForDateMealAndLocations (API)', menusForDateMealAndLocations);
      if (menusForDateMealAndLocations && Object.keys(menusForDateMealAndLocations).length > 0) {
        setApiIdsForMenusForMealsLocations(dateKey, menusForDateMealAndLocations);

        const menusForLocations = menusForDateMealAndLocations[meal];
        console.log('menusForLocations (API)', menusForLocations);
        if (menusForLocations && Object.keys(menusForLocations).length > 0) {
          setMenusForLocationsState(menusForLocations);
        }
      }
      setLoading((prev) => ({ ...prev, menusForLocations: false }));
      return;
    }

    fetchMenuData();
  }, [dateKey, cacheLoading, meal]);

  // Fetch menu items for the found menu
  useEffect(() => {
    if (cacheLoading) return;
    setLoading((prev) => ({ ...prev, menuItems: true }));

    // Extract all unique API IDs from the menus for locations
    const apiIdsSet = new Set<ApiId>(Object.values(menusForLocationsState).flatMap((menu) => menu));
    const apiIds = Array.from(apiIdsSet);
    if (apiIds.length === 0) return;

    // Check cache first
    const menuItems = getMenuItems(apiIds);
    console.log('menuItems (cache)', menuItems);
    const cachedApiIds = Object.keys(menuItems);
    const missingApiIds = apiIds.filter((apiId) => !cachedApiIds.includes(String(apiId)));
    if (missingApiIds.length === 0) {
      setMenuItemsState(menuItems);
      setLoading((prev) => ({ ...prev, menuItems: false }));
      return;
    }

    // Otherwise, fetch from API
    async function fetchMenuItems(cachedMenuItems: MenuItemMap, missingApiIds: ApiId[]) {
      const menuItems = await fetchMenuItemsByApiIds(missingApiIds);
      console.log('menuItems (API)', menuItems);
      if (menuItems && Object.keys(menuItems).length > 0) {
        setMenuItems(menuItems);
        setMenuItemsState({ ...cachedMenuItems, ...menuItems });
      }
      setLoading((prev) => ({ ...prev, menuItems: false }));
      return;
    }

    fetchMenuItems(menuItems, missingApiIds);
  }, [cacheLoading, meal, menusForLocationsState]);

  // Fetch locations
  useEffect(() => {
    if (cacheLoading) return;
    setLoading((prev) => ({ ...prev, locations: true }));

    // Check cache first
    const locations = getAllLocations();
    console.log('locations (cache)', locations);
    if (locations && Object.keys(locations).length > 0) {
      setLocationsState(locations);
      setLoading((prev) => ({ ...prev, locations: false }));
      return;
    }

    // Otherwise, fetch from API
    async function fetchLocations() {
      const locations = await fetchLocationsForMenu();
      console.log('locations (API)', locations);
      if (locations && Object.keys(locations).length > 0) {
        setLocations(locations);
        setLocationsState(locations);
      }
      setLoading((prev) => ({ ...prev, locations: false }));
      return;
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
        appliedDiningHalls: diningHalls,
        appliedDietaryRestrictions: dietaryRestrictions,
        appliedAllergens: allergens,
        searchTerm,
        pinnedHalls: pinnedHalls,
      }),
    [
      menusForLocationsState,
      locationsState,
      menuItemsState,
      diningHalls,
      dietaryRestrictions,
      allergens,
      searchTerm,
      pinnedHalls,
      meal,
      dateKey,
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
                clearPreferences();
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
              <Switch checked={showNutrition} onChange={toggleShowNutrition} />
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
                    const diningHallText = diningHall
                      .replace(' Colleges', '')
                      .replace(' College', '');
                    const checked = diningHalls.includes(diningHall);
                    const onChange = () => {
                      toggleDiningHall(diningHall);
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
                    const checked = dietaryRestrictions.includes(dietKey);
                    const onChange = () => {
                      toggleDietaryRestriction(dietKey);
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
                    const checked = allergens.includes(allergen);
                    const emoji = ALLERGEN_EMOJI[allergen as Allergen];
                    const onChange = () => {
                      toggleAllergen(allergen);
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
          {loading.menusForLocations || loading.menuItems || loading.locations ? (
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
            const selected = allergens;
            const isSelected = selected.includes(allergen);
            const emojiForAllergen = ALLERGEN_EMOJI[allergen as Allergen];
            const backgroundColor = isSelected ? theme.colors.red100 : theme.colors.gray100;
            const title = isSelected
              ? `Hiding items containing ${allergen}`
              : `Click to hide items containing ${allergen}`;
            const onChange = () => {
              toggleAllergen(allergen);
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
        showNutrition={showNutrition}
      />
    </Pane>
  );
}
