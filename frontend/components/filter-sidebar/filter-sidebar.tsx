'use client';

import React, { useState } from 'react';
import {
  Pane,
  Text,
  majorScale,
  minorScale,
  useTheme,
  SearchInput,
  UndoIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  CrossIcon,
  Select,
  Switch,
} from 'evergreen-ui';
import { useNutritionAccordion } from '@/contexts/nutrition-accordion-context';
import { Allergen, ALLERGENS, MenuSortOption, MENU_SORT_OPTIONS } from '@/types/types';
import type { DiningHall } from '@/locations';
import { RESIDENTIAL_HALL_ORDER, RETAIL_LOCATION_ORDER } from '@/ordering';
import DiningHallRow from './dining-hall-row';
import AllergenRow from './allergen-row';

interface FilterSidebarProps {
  locationType: 'residential' | 'retail';
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOption: any;
  setSortOption: (sort: any) => void;
  diningHalls: DiningHall[];
  allergens: Allergen[];
  toggleDiningHall: (hall: DiningHall) => void;
  toggleAllergen: (allergen: Allergen) => void;
  clearPreferences: () => void;
  variant?: 'sidebar' | 'mobile' | 'mobile-popover';
  onClose?: () => void;
}

/**
 * Filter sidebar component for menu filtering.
 *
 * @param props - Component props
 * @returns The filter sidebar component
 */
export default function FilterSidebar({
  locationType,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  diningHalls,
  allergens,
  toggleDiningHall,
  toggleAllergen,
  clearPreferences,
  variant = 'sidebar',
  onClose,
}: FilterSidebarProps) {
  const theme = useTheme();
  const { hideAllergenTags, setHideAllergenTags } = useNutritionAccordion();

  const isSidebar = variant === 'sidebar';
  const isMobilePopover = variant === 'mobile-popover';
  const containerProps = isSidebar
    ? {
        flexDirection: 'column' as const,
        width: 280,
        padding: majorScale(3),
        className: 'max-w-[100%] z-20',
      }
    : {};
  const innerContainerProps = {
    display: 'flex' as const,
    background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderRadius: 12,
    ...(isSidebar
      ? { maxHeight: '100%', className: 'fixed sm:relative overflow-hidden flex-col select-none' }
      : { className: 'flex-col mb-4 select-none', marginBottom: majorScale(2) }),
  };
  const filtersContainerProps = {
    className: 'p-4',
    overflowY: 'auto' as const,
    ...(isSidebar && { height: '100%' as const }),
  };

  // Mobile popover variant — renders just the filter content, no search input, no outer wrapper
  if (isMobilePopover) {
    return (
      <Pane>
        <Pane
          borderTopLeftRadius={0}
          borderTopRightRadius={0}
          background={theme.colors.gray100}
          borderBottom={`1px solid ${theme.colors.gray200}`}
          className='relative flex flex-col p-4 pb-2'
        >
          <Pane display='flex' alignItems='center' justifyContent='space-between'>
            <Pane
              display='flex'
              alignItems='center'
              cursor='pointer'
              onClick={() => {
                clearPreferences();
                setSearchTerm('');
              }}
              background={theme.colors.gray100}
              className='rounded-sm w-fit py-1 px-2 -ml-2 -mt-2 space-x-1 transition-colors duration-200 hover:bg-gray-200'
            >
              <UndoIcon size={14} color={theme.colors.gray700} />
              <Text marginLeft={minorScale(1)} size={300} color={theme.colors.gray700}>
                Reset
              </Text>
            </Pane>
            {onClose && (
              <Pane
                display='flex'
                alignItems='center'
                cursor='pointer'
                onClick={onClose}
                className='rounded-sm py-1 px-2 -mr-2 -mt-2 transition-colors duration-200 hover:bg-gray-200'
              >
                <CrossIcon size={20} color={theme.colors.gray600} />
              </Pane>
            )}
          </Pane>
        </Pane>

        <Pane className='px-4 pt-4'>
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            marginBottom={minorScale(3)}
          >
            <Text size={300} fontWeight={600} color={theme.colors.gray800}>
              Sort/Filter
            </Text>
            <Pane width='65%'>
              <Select
                width='100%'
                value={sortOption}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSortOption(e.target.value as MenuSortOption)
                }
              >
                {MENU_SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Pane>
          </Pane>
          <Pane borderBottom={`1px solid ${theme.colors.gray200}`} />
        </Pane>

        <Pane className='p-4' overflowY='auto'>
          <Text
            size={300}
            fontWeight={600}
            color={theme.colors.gray800}
            marginBottom={minorScale(1)}
          >
            {locationType === 'residential' ? 'Dining Halls' : 'Retail Locations'}
          </Text>
          <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
            {(locationType === 'residential' ? RESIDENTIAL_HALL_ORDER : RETAIL_LOCATION_ORDER).map(
              (diningHall: DiningHall) => (
                <DiningHallRow
                  key={diningHall}
                  diningHall={diningHall}
                  checked={diningHalls.includes(diningHall)}
                  onChange={() => toggleDiningHall(diningHall)}
                />
              )
            )}
          </Pane>
          <Pane borderBottom={`1px solid ${theme.colors.gray200}`} marginBottom={minorScale(2)} />
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            marginBottom={minorScale(1)}
          >
            <Text size={300} fontWeight={600} color={theme.colors.gray800}>
              Allergen Tags
            </Text>
            <Switch
              checked={!hideAllergenTags}
              className='[&_input:checked+div]:!bg-green-700 [&_input:focus+div]:!shadow-none [&_input:focus+div]:!outline-none'
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setHideAllergenTags(!e.target.checked)
              }
              height={20}
            />
          </Pane>
          <span className='text-xs ub-fnt-sze_14px ub-f-wght_400 ub-ln-ht_20px ub-ltr-spc_-0-05px ub-fnt-fam_rbgzyu ub-color_808080 ub-mb_4px ub-box-szg_border-box'>
            Exclude items containing:
          </span>
          <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
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
      </Pane>
    );
  }

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
          {/* Reset Filters button + Hide button row */}
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            marginBottom={minorScale(1)}
          >
            <Pane
              display='flex'
              alignItems='center'
              cursor='pointer'
              onClick={() => {
                clearPreferences();
                setSearchTerm('');
              }}
              background={theme.colors.gray100}
              className='rounded-sm w-fit py-1 px-2 -ml-2 -mt-2 space-x-1 transition-colors duration-200 hover:bg-gray-200'
            >
              <UndoIcon size={14} color={theme.colors.gray700} />
              <Text marginLeft={minorScale(1)} size={300} color={theme.colors.gray700}>
                Reset
              </Text>
            </Pane>
            {isSidebar && onClose && (
              <Pane
                display='flex'
                alignItems='center'
                cursor='pointer'
                onClick={onClose}
                className='rounded-sm py-1 px-2 -mr-2 -mt-2 space-x-1 transition-colors duration-200 hover:bg-gray-200'
              >
                <ChevronLeftIcon size={14} color={theme.colors.gray600} />
                <Text marginLeft={minorScale(1)} size={300} color={theme.colors.gray600}>
                  Hide
                </Text>
              </Pane>
            )}
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
            placeholder='Search for food...'
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
          />
        </Pane>

        <Pane className='px-4 pt-4'>
          {/* Sort dropdown */}
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            marginBottom={minorScale(3)}
          >
            <Text size={300} fontWeight={600} color={theme.colors.gray800}>
              Sort/Filter
            </Text>
            <Pane width='65%'>
              <Select
                width='100%'
                value={sortOption}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSortOption(e.target.value as MenuSortOption)
                }
              >
                {MENU_SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Pane>
          </Pane>
          <Pane borderBottom={`1px solid ${theme.colors.gray200}`} />
        </Pane>

        <Pane {...filtersContainerProps}>
          <Pane className='filter-collapse-inner'>
            {/* Control which dining halls are displayed */}
            <Text
              size={300}
              fontWeight={600}
              color={theme.colors.gray800}
              marginBottom={minorScale(1)}
            >
              {locationType === 'residential' ? 'Dining Halls' : 'Retail Locations'}
            </Text>
            <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
              {(locationType === 'residential'
                ? RESIDENTIAL_HALL_ORDER
                : RETAIL_LOCATION_ORDER
              ).map((diningHall: DiningHall) => (
                <DiningHallRow
                  key={diningHall}
                  diningHall={diningHall}
                  checked={diningHalls.includes(diningHall)}
                  onChange={() => toggleDiningHall(diningHall)}
                />
              ))}
            </Pane>
            <Pane borderBottom={`1px solid ${theme.colors.gray200}`} marginBottom={minorScale(2)} />

            {/* Control which allergens are not displayed */}
            <Pane
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              marginBottom={minorScale(1)}
            >
              <Text size={300} fontWeight={600} color={theme.colors.gray800}>
                Allergen Tags
              </Text>
              <Switch
                checked={!hideAllergenTags}
                className='[&_input:checked+div]:!bg-green-700 [&_input:focus+div]:!shadow-none [&_input:focus+div]:!outline-none'
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setHideAllergenTags(!e.target.checked)
                }
                height={20}
              />
            </Pane>
            <span className='text-xs ub-fnt-sze_14px ub-f-wght_400 ub-ln-ht_20px ub-ltr-spc_-0-05px ub-fnt-fam_rbgzyu ub-color_808080 ub-mb_4px ub-box-szg_border-box'>
              Exclude items containing:
            </span>
            <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
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
        </Pane>
      </Pane>
    </Pane>
  );
}
