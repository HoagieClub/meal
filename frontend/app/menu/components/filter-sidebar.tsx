/**
 * @overview Filter sidebar component for menu page.
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
  majorScale,
  minorScale,
  useTheme,
  Checkbox,
  SearchInput,
  Switch,
  UndoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'evergreen-ui';
import { DINING_HALLS, ALLERGENS, DIETARY_TAGS } from '@/data';
import {
  ALLERGEN_EMOJI,
  HALL_ICON_MAP,
  DIET_LABEL_MAP,
  ALLERGEN_STYLE_MAP,
  DIET_STYLE_MAP,
} from '@/styles';
import { DiningHall, DietaryTag, Allergen } from '@/types/dining';
import SortDropdown, { MenuSortOption } from './sort-dropdown';

/**
 * Filter sidebar component props.
 *
 * @param searchTerm - The search term.
 * @param setSearchTerm - The function to set the search term.
 * @param showNutrition - Whether to show nutrition.
 * @param toggleShowNutrition - The function to toggle the show nutrition.
 * @param sortOption - The sort option.
 * @param setSortOption - The function to set the sort option.
 * @param diningHalls - The dining halls.
 * @param dietaryRestrictions - The dietary restrictions.
 * @param allergens - The allergens.
 * @param toggleDiningHall - The function to toggle the dining hall.
 * @param toggleDietaryRestriction - The function to toggle the dietary restriction.
 * @param toggleAllergen - The function to toggle the allergen.
 * @param clearPreferences - The function to clear the preferences.
 * @param variant - The variant.
 */
interface FilterSidebarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showNutrition: boolean;
  toggleShowNutrition: () => void;
  sortOption: MenuSortOption;
  setSortOption: (sort: MenuSortOption) => void;
  diningHalls: DiningHall[];
  dietaryRestrictions: DietaryTag[];
  allergens: Allergen[];
  toggleDiningHall: (hall: DiningHall) => void;
  toggleDietaryRestriction: (tag: DietaryTag) => void;
  toggleAllergen: (allergen: Allergen) => void;
  clearPreferences: () => void;
  variant?: 'sidebar' | 'mobile';
}

/**
 * Filter sidebar component for menu filtering.
 *
 * @param props - Component props
 * @returns The filter sidebar component
 */
export default function FilterSidebar({
  searchTerm,
  setSearchTerm,
  showNutrition,
  toggleShowNutrition,
  sortOption,
  setSortOption,
  diningHalls,
  dietaryRestrictions,
  allergens,
  toggleDiningHall,
  toggleDietaryRestriction,
  toggleAllergen,
  clearPreferences,
  variant = 'sidebar',
}: FilterSidebarProps) {
  const theme = useTheme();
  const [filtersOpen, setFiltersOpen] = useState(false);

  /**
   * Dining hall row component.
   *
   * @param diningHall - The dining hall to display
   * @param checked - Whether the dining hall is checked
   * @param onChange - The function to call when the dining hall is changed
   * @returns The dining hall row component
   */
  const DiningHallRow = ({
    diningHall,
    checked,
    onChange,
  }: {
    diningHall: DiningHall;
    checked: boolean;
    onChange: () => void;
  }) => {
    const diningHallText = diningHall.replace(' Colleges', '').replace(' College', '');

    // Render the dining hall row.
    return (
      <Pane display='flex' alignItems='center' marginBottom='2px'>
        <Checkbox checked={checked} onChange={onChange} />
        <Pane marginX={minorScale(2)}>
          <img src={HALL_ICON_MAP[diningHall]} alt={diningHall} width={20} height={20} />
        </Pane>
        <Text size={300} color={theme.colors.gray900}>
          {diningHallText}
        </Text>
      </Pane>
    );
  };

  /**
   * Dietary tag row component.
   *
   * @param dietKey - The dietary tag to display
   * @param checked - Whether the dietary tag is checked
   * @param onChange - The function to call when the dietary tag is changed
   * @returns The dietary tag row component
   */
  const DietaryTagRow = ({
    dietKey,
    checked,
    onChange,
  }: {
    dietKey: DietaryTag;
    checked: boolean;
    onChange: () => void;
  }) => {
    const style = DIET_STYLE_MAP(theme)[dietKey as DietaryTag];

    // Render the dietary tag row.
    return (
      <Pane display='flex' alignItems='center' marginBottom={minorScale(1)}>
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
  };

  /**
   * Allergen row component.
   *
   * @param allergen - The allergen to display
   * @param checked - Whether the allergen is checked
   * @param onChange - The function to call when the allergen is changed
   * @returns The allergen row component
   */
  const AllergenRow = ({
    allergen,
    checked,
    onChange,
  }: {
    allergen: Allergen;
    checked: boolean;
    onChange: () => void;
  }) => {
    const style = ALLERGEN_STYLE_MAP(theme)[allergen as Allergen];
    const emoji = ALLERGEN_EMOJI[allergen as Allergen];

    // Render the allergen row.
    return (
      <Pane display='flex' alignItems='center' marginBottom={minorScale(1)}>
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
  };

  // Determine container styles based on variant
  const containerProps =
    variant === 'sidebar'
      ? {
          flexDirection: 'column' as const,
          width: 280,
          padding: majorScale(3),
          className: 'max-w-[100%] hidden sm:inline z-20',
        }
      : {};

  // Determine inner container styles based on variant
  const innerContainerProps =
    variant === 'sidebar'
      ? {
          display: 'flex' as const,
          background: 'white',
          maxHeight: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          className: 'fixed sm:relative overflow-hidden flex-col',
          borderRadius: 12,
        }
      : {
          display: 'flex' as const,
          background: 'white',
          className: 'flex-col mb-4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: majorScale(2),
          borderRadius: 12,
        };

  // Determine filters container styles based on variant
  const filtersContainerProps =
    variant === 'sidebar'
      ? {
          className: 'p-4',
          overflowY: 'auto' as const,
          height: '100%' as const,
        }
      : {
          className: 'p-4',
          overflowY: 'auto' as const,
        };

  // Render the filter sidebar.
  return (
    <Pane {...containerProps}>
      <Pane {...innerContainerProps}>
        <Pane
          borderTopLeftRadius={12}
          borderTopRightRadius={12}
          background={theme.colors.gray100}
          borderBottom={`1px solid ${theme.colors.gray200}`}
          className='relative flex flex-col p-4 border-radius-12'
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

          {/* Sort dropdown */}
          <Pane marginBottom={minorScale(3)}>
            <SortDropdown sortOption={sortOption} setSortOption={setSortOption} />
          </Pane>
          <Pane borderBottom={`1px solid ${theme.colors.gray200}`} />
        </Pane>

        <Pane {...filtersContainerProps}>
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

          {/* Render the filters if the filters are open. */}
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
                {DINING_HALLS.map((diningHall: DiningHall) => (
                  <DiningHallRow
                    key={diningHall}
                    diningHall={diningHall}
                    checked={diningHalls.includes(diningHall)}
                    onChange={() => toggleDiningHall(diningHall)}
                  />
                ))}
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
                {DIETARY_TAGS.map((dietKey: DietaryTag) => (
                  <DietaryTagRow
                    key={dietKey}
                    dietKey={dietKey}
                    checked={dietaryRestrictions.includes(dietKey)}
                    onChange={() => toggleDietaryRestriction(dietKey)}
                  />
                ))}
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
                {ALLERGENS.map((allergen: Allergen) => (
                  <AllergenRow
                    key={allergen}
                    allergen={allergen}
                    checked={allergens.includes(allergen)}
                    onChange={() => toggleAllergen(allergen)}
                  />
                ))}
              </Pane>
            </Pane>
          )}
        </Pane>
      </Pane>
    </Pane>
  );
}
