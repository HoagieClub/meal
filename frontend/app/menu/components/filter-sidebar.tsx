/**
 * @overview Filter sidebar component.
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

import React, { useState } from 'react';
import {
  Pane,
  Text,
  Checkbox,
  SearchInput,
  Switch,
  UndoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  majorScale,
  minorScale,
  useTheme,
  Button,
} from 'evergreen-ui';
import {
  HALL_ICON_MAP,
  DIET_LABEL_MAP,
  ALLERGEN_STYLE_MAP,
  DIET_STYLE_MAP,
  ALLERGEN_EMOJI,
} from '@/styles';
import { DINING_HALLS, ALLERGENS, DIETARY_TAGS, AllergenType, DietaryTagType } from '@/data';
import { DiningHallType } from '@/data';
import { DEFAULT_PREFERENCES } from '@/hooks/use-preferences';

/**
 * Filter sidebar component.
 *
 * @param usePreferencesObject - The usePreferencesObject to use.
 * @param searchTerm - The search term to use.
 * @param setSearchTerm - The function to set the search term.
 * @returns The filter sidebar component.
 */
export default function FilterSidebar({
  usePreferencesObject,
  searchTerm,
  setSearchTerm,
}: {
  usePreferencesObject: any;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
}) {
  const theme = useTheme();
  const dietStyles = DIET_STYLE_MAP(theme);
  const allergenStyles = ALLERGEN_STYLE_MAP(theme);
  const ICON_SIZE = 20;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    preferences,
    setPreferences,
    setDiningHalls,
    setDietaryRestrictions,
    setAllergens,
    setShowNutrition,
  } = usePreferencesObject;

  /**
   * Render the dining hall row.
   *
   * @param diningHall - The dining hall to render.
   * @returns The dining hall row.
   */
  const renderDiningHallRow = (diningHall: DiningHallType) => {
    const diningHallText = diningHall.replace(' College', '');
    const checked = preferences.diningHalls.includes(diningHall);

    const handleDiningHallToggle = () => {
      setDiningHalls(
        preferences.diningHalls.includes(diningHall)
          ? preferences.diningHalls.filter((h: DiningHallType) => h !== diningHall)
          : [...preferences.diningHalls, diningHall]
      );
    };

    return (
      <Pane key={diningHall} display='flex' alignItems='center' marginBottom='2px'>
        <Checkbox checked={checked} onChange={handleDiningHallToggle} />
        <Pane marginX={minorScale(2)}>
          <img
            src={HALL_ICON_MAP[diningHall]}
            alt={diningHall}
            width={ICON_SIZE}
            height={ICON_SIZE}
          />
        </Pane>
        <Text size={300} color={theme.colors.gray900}>
          {diningHallText}
        </Text>
      </Pane>
    );
  };

  /**
   * Render the dietary row.
   *
   * @param dietKey - The dietary tag to render.
   * @returns The dietary row.
   */
  const renderDietaryRow = (dietKey: DietaryTagType) => {
    const style = dietStyles[dietKey];
    const checked = preferences.dietaryRestrictions.includes(dietKey as DietaryTagType);

    const handleDietaryToggle = () => {
      setDietaryRestrictions(
        preferences.dietaryRestrictions.includes(dietKey)
          ? preferences.dietaryRestrictions.filter((d: DietaryTagType) => d !== dietKey)
          : [...preferences.dietaryRestrictions, dietKey]
      );
    };

    return (
      <Pane key={dietKey} display='flex' alignItems='center' marginBottom={minorScale(1)}>
        <Checkbox checked={checked} onChange={handleDietaryToggle} />
        <Pane
          width={ICON_SIZE}
          height={ICON_SIZE}
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
  };

  /**
   * Render the allergen row.
   *
   * @param allergen - The allergen to render.
   * @returns The allergen row.
   */
  const renderAllergenRow = (allergen: AllergenType) => {
    const style = allergenStyles[allergen];
    const checked = preferences.allergens.includes(allergen as AllergenType);
    const emoji = ALLERGEN_EMOJI[allergen as AllergenType];

    const handleAllergenToggle = () => {
      setAllergens(
        preferences.allergens.includes(allergen)
          ? preferences.allergens.filter((a: AllergenType) => a !== allergen)
          : [...preferences.allergens, allergen]
      );
    };

    return (
      <Pane key={allergen} display='flex' alignItems='center' marginBottom={minorScale(1)}>
        <Checkbox checked={checked} onChange={handleAllergenToggle} />
        <Pane
          width={ICON_SIZE}
          height={ICON_SIZE}
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
  };

  /**
   * Render the show nutrition row.
   *
   * @returns The show nutrition row.
   */
  const renderShowNutritionRow = () => {
    const checked = preferences.showNutrition;

    const handleShowNutritionToggle = () => {
      setShowNutrition(!preferences.showNutrition);
    };

    return (
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
          <Switch checked={checked} onChange={handleShowNutritionToggle} />
        </Pane>
        <Pane borderBottom={`1px solid ${theme.colors.gray200}`} />
      </Pane>
    );
  };

  return (
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

        {renderShowNutritionRow()}

        <Pane className='p-4' overflowY='auto' height='100%'>
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
              <Text
                size={300}
                fontWeight={600}
                color={theme.colors.gray800}
                marginBottom={minorScale(1)}
              >
                Dining Halls
              </Text>
              <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
                {DINING_HALLS.map(renderDiningHallRow)}
              </Pane>

              <Pane
                borderBottom={`1px solid ${theme.colors.gray200}`}
                marginBottom={minorScale(2)}
              />
              <Text
                size={300}
                fontWeight={600}
                color={theme.colors.gray800}
                marginBottom={minorScale(1)}
              >
                Dietary Tags
              </Text>
              <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
                {DIETARY_TAGS.map(renderDietaryRow)}
              </Pane>

              <Pane
                borderBottom={`1px solid ${theme.colors.gray200}`}
                marginBottom={minorScale(2)}
              />
              <Text
                size={300}
                fontWeight={600}
                color={theme.colors.gray800}
                marginBottom={minorScale(1)}
              >
                Allergen Tags
              </Text>
              <Pane display='flex' flexDirection='column'>
                {ALLERGENS.map(renderAllergenRow)}
              </Pane>
            </Pane>
          )}
        </Pane>
      </Pane>
    </Pane>
  );
}
