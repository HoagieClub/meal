/**
 * @overview Test page for the Menu API hook.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import { useState } from 'react';
import {
  Pane,
  Heading,
  Text,
  Spinner,
  TextInput,
  Select,
  majorScale,
  minorScale,
} from 'evergreen-ui';
import { useMenuApi } from '@/hooks/use-menu-api';
import { useBuildResidentialDisplayData, useBuildRetailDisplayData } from '@/hooks/use-build-display-data';
import { MenuSortOption, MENU_SORT_OPTIONS } from '@/types/types';

interface DataSectionProps {
  title: string;
  content?: any;
  count?: number;
  fileName?: string;
}

function DataSection({ title, content, count, fileName }: DataSectionProps) {
  const displayContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const displayCount = count ?? 0;

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const blob = new Blob([displayContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <Pane
      is='section'
      background='white'
      border
      borderRadius={8}
      padding={majorScale(3)}
      marginBottom={majorScale(3)}
    >
      <Pane display='flex' alignItems='center' gap={minorScale(2)} marginBottom={majorScale(2)}>
        <Heading size={600}>{title}</Heading>
        <Pane
          onClick={handleOpenInNewTab}
          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          title='Open full data in new tab'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            style={{ display: 'block' }}
          >
            <path
              d='M10 2H14V6M14 2L8 8M14 2V6H10'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M6 2H4C3.44772 2 3 2.44772 3 3V12C3 12.5523 3.44772 13 4 13H12C12.5523 13 13 12.5523 13 12V10'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </Pane>
      </Pane>
      <Pane
        borderRadius={4}
        padding={majorScale(2)}
        overflow='auto'
        border
        maxHeight={majorScale(40)}
      >
        <Text size={300} fontFamily='mono'>
          <pre style={{ margin: 0, fontSize: '12px' }}>{displayContent}</pre>
        </Text>
      </Pane>
      <Text size={400} color='muted' marginTop={majorScale(1)}>
        Count: {displayCount}
      </Text>
    </Pane>
  );
}

export default function TestMenuApiPage() {
  const [dateKey, setDateKey] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [meal, setMeal] = useState<string>('Lunch');
  const [sortOption, setSortOption] = useState<MenuSortOption>('Category');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data, loading } = useMenuApi(dateKey);

  const residentialLocations = data?.residentialLocations ?? {};
  const retailLocations = data?.retailLocations ?? {};
  const residentialMenus = data?.residentialMenus ?? {};
  const retailMenus = data?.retailMenus ?? {};
  const menuItems = data?.menuItems ?? {};
  const interactions = data?.interactions ?? {};
  const metrics = data?.metrics ?? {};

  const builtResidentialDisplayData = useBuildResidentialDisplayData({
    locations: residentialLocations,
    residentialMenus,
    menuItems,
    interactions,
    metrics,
    appliedDiningHalls: [],
    appliedAllergens: [],
    searchTerm,
    pinnedHalls: [],
    meal,
    sortOption,
  });

  const builtRetailDisplayData = useBuildRetailDisplayData({
    locations: retailLocations,
    retailMenus,
    menuItems,
    interactions,
    metrics,
    appliedDiningHalls: [],
    appliedAllergens: [],
    searchTerm,
    pinnedHalls: [],
    sortOption,
  });

  return (
    <Pane maxWidth={1200} marginX='auto' paddingX={majorScale(4)} paddingY={majorScale(6)}>
      <Heading size={900} marginBottom={majorScale(4)}>
        Test Menu API + Build Display Data
      </Heading>

      {/* Controls */}
      <Pane
        background='white'
        border
        borderRadius={8}
        padding={majorScale(3)}
        marginBottom={majorScale(4)}
      >
        <Pane display='flex' flexDirection='column' gap={majorScale(3)}>
          <Pane display='flex' alignItems='flex-end' gap={majorScale(2)}>
            <Pane flex={1}>
              <Text size={400} fontWeight={500} marginBottom={minorScale(1)} display='block'>
                Date (YYYY-MM-DD)
              </Text>
              <TextInput
                type='date'
                value={dateKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateKey(e.target.value)}
                width='100%'
              />
            </Pane>
          </Pane>
          <Pane display='flex' gap={majorScale(2)}>
            <Pane flex={1}>
              <Text size={400} fontWeight={500} marginBottom={minorScale(1)} display='block'>
                Meal
              </Text>
              <Select
                value={meal}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMeal(e.target.value)}
                width='100%'
              >
                <option value='Breakfast'>Breakfast</option>
                <option value='Lunch'>Lunch</option>
                <option value='Dinner'>Dinner</option>
              </Select>
            </Pane>
            <Pane flex={1}>
              <Text size={400} fontWeight={500} marginBottom={minorScale(1)} display='block'>
                Sort Option
              </Text>
              <Select
                value={sortOption}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSortOption(e.target.value as MenuSortOption)
                }
                width='100%'
              >
                {MENU_SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Pane>
            <Pane flex={1}>
              <Text size={400} fontWeight={500} marginBottom={minorScale(1)} display='block'>
                Search Term
              </Text>
              <TextInput
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                placeholder='Search...'
                width='100%'
              />
            </Pane>
          </Pane>
        </Pane>
      </Pane>

      {/* Loading */}
      {loading && (
        <Pane display='flex' flexDirection='column' alignItems='center' paddingY={majorScale(8)}>
          <Spinner size={32} />
          <Text size={400} color='muted' marginTop={majorScale(2)}>
            Fetching data for {dateKey}...
          </Text>
        </Pane>
      )}

      {/* Raw data sections */}
      {data && (
        <Pane>
          <Heading size={700} marginBottom={majorScale(3)}>
            Raw API Data — {dateKey}
          </Heading>

          <DataSection
            title='Residential Locations'
            content={residentialLocations}
            count={Object.keys(residentialLocations).length}
            fileName={`residential-locations-${dateKey}.txt`}
          />

          <DataSection
            title='Retail Locations'
            content={retailLocations}
            count={Object.keys(retailLocations).length}
            fileName={`retail-locations-${dateKey}.txt`}
          />

          <DataSection
            title='Residential Menus'
            content={residentialMenus}
            count={Object.keys(residentialMenus).length}
            fileName={`residential-menus-${dateKey}.txt`}
          />

          <DataSection
            title='Retail Menus'
            content={retailMenus}
            count={Object.keys(retailMenus).length}
            fileName={`retail-menus-${dateKey}.txt`}
          />

          <DataSection
            title='Menu Items'
            content={menuItems}
            count={Object.keys(menuItems).length}
            fileName={`menu-items-${dateKey}.txt`}
          />

          <DataSection
            title='Interactions'
            content={interactions}
            count={Object.keys(interactions).length}
            fileName={`interactions-${dateKey}.txt`}
          />

          <DataSection
            title='Metrics'
            content={metrics}
            count={Object.keys(metrics).length}
            fileName={`metrics-${dateKey}.txt`}
          />

          <Heading size={700} marginTop={majorScale(4)} marginBottom={majorScale(3)}>
            Built Display Data — {dateKey} / {meal}
          </Heading>

          <DataSection
            title='Residential Display Data'
            content={builtResidentialDisplayData}
            count={builtResidentialDisplayData.reduce(
              (sum: number, loc: any) => sum + (loc.menu?.length || 0),
              0
            )}
            fileName={`residential-display-${dateKey}-${meal.toLowerCase()}.txt`}
          />

          <DataSection
            title='Retail Display Data'
            content={builtRetailDisplayData}
            count={builtRetailDisplayData.reduce(
              (sum: number, loc: any) => sum + (loc.menu?.length || 0),
              0
            )}
            fileName={`retail-display-${dateKey}.txt`}
          />
        </Pane>
      )}
    </Pane>
  );
}
