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
  Select,
} from 'evergreen-ui';
import {
  DiningHall,
  Allergen,
  DINING_HALLS,
  ALLERGENS,
  MenuSortOption,
  MENU_SORT_OPTIONS,
} from '@/types/types';
import DiningHallRow from './dining-hall-row';
import AllergenRow from './allergen-row';

interface FilterSidebarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOption: any;
  setSortOption: (sort: any) => void;
  diningHalls: DiningHall[];
  allergens: Allergen[];
  toggleDiningHall: (hall: DiningHall) => void;
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
  sortOption,
  setSortOption,
  diningHalls,
  allergens,
  toggleDiningHall,
  toggleAllergen,
  clearPreferences,
  variant = 'sidebar',
}: FilterSidebarProps) {
  const theme = useTheme();
  const [filtersOpen, setFiltersOpen] = useState(false);

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
          className: 'fixed sm:relative overflow-hidden flex-col select-none',
          borderRadius: 12,
        }
      : {
          display: 'flex' as const,
          background: 'white',
          className: 'flex-col mb-4 select-none',
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
            marginBottom={minorScale(1)}
            className='rounded-sm w-fit py-1 px-2 -ml-2 -mt-2 space-x-1 transition-colors duration-200 hover:bg-gray-200'
          >
            <UndoIcon size={14} color={theme.colors.gray700} />
            <Text marginLeft={minorScale(1)} size={300} color={theme.colors.gray700}>
              Reset
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
              Sort By
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
            <ChevronDownIcon
              size={16}
              color='gray700'
              className={`transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
            />
          </Pane>

          <Pane
            borderBottom={filtersOpen ? `1px solid ${theme.colors.gray200}` : undefined}
            marginBottom={minorScale(2)}
          />

          {/* Render the filters with collapse animation */}
          <div className='filter-collapse-wrapper' data-state={filtersOpen ? 'open' : 'closed'}>
            <Pane className='filter-collapse-inner'>
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

              {/* Control which allergens are not displayed */}
              <Text size={300} fontWeight={600} color={theme.colors.gray800}>
                Allergen Tags
              </Text>
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
          </div>
        </Pane>
      </Pane>
    </Pane>
  );
}
