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
  Button,
  Spinner,
  TextInput,
  Select,
  majorScale,
  minorScale,
  useTheme,
  Tab,
  TabNavigation,
} from 'evergreen-ui';
import { useMenuApi } from '@/hooks/use-menu-api';
import { useBuildResidentialDisplayData, useBuildRetailDisplayData } from '@/hooks/use-build-display-data';
import { MenuSortOption } from '@/types/types';

interface DataSectionProps {
  title: string;
  content?: any;
  count?: number;
  renderContent?: () => string;
  renderCount?: () => number;
  fileName?: string;
}

function DataSection({
  title,
  content,
  count,
  renderContent,
  renderCount,
  fileName,
}: DataSectionProps) {
  const displayContent = renderContent ? renderContent() : JSON.stringify(content, null, 2);
  const displayCount = renderCount ? renderCount() : (count ?? 0);

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

interface TabData {
  date: string;
  data: any;
  loading: boolean;
  error: string | null;
}

export default function TestMenuApiPage() {
  const theme = useTheme();
  const { fetchAll } = useMenuApi();
  const [tabs, setTabs] = useState<Map<string, TabData>>(new Map());
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [meal, setMeal] = useState<string>('Lunch');
  const [sortOption, setSortOption] = useState<MenuSortOption>('Best');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleFetch = async () => {
    setTabs((prev) => {
      const newTabs = new Map(prev);
      newTabs.set(date, {
        date,
        data: null,
        loading: true,
        error: null,
      });
      return newTabs;
    });
    setActiveDate(date);

    try {
      const result = await fetchAll(date);
      setTabs((prev) => {
        const newTabs = new Map(prev);
        newTabs.set(date, {
          date,
          data: result,
          loading: false,
          error: null,
        });
        return newTabs;
      });
    } catch (err) {
      setTabs((prev) => {
        const newTabs = new Map(prev);
        newTabs.set(date, {
          date,
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'An error occurred',
        });
        return newTabs;
      });
    }
  };

  const activeTab = activeDate ? tabs.get(activeDate) : null;
  const tabDates = Array.from(tabs.keys()).sort();

  const builtResidentialDisplayData = useBuildResidentialDisplayData({
    locations: activeTab?.data?.locations || {},
    residentialMenus: activeTab?.data?.residentialMenus || {},
    menuItems: activeTab?.data?.menuItems || {},
    interactions: activeTab?.data?.interactions || {},
    metrics: activeTab?.data?.metrics || {},
    recommendations: activeTab?.data?.recommendations || {},
    appliedDiningHalls: [],
    appliedAllergens: [],
    searchTerm,
    pinnedHalls: [],
    meal,
    sortOption,
  });

  const builtRetailDisplayData = useBuildRetailDisplayData({
    locations: activeTab?.data?.locations || {},
    retailMenus: activeTab?.data?.retailMenus || {},
    menuItems: activeTab?.data?.menuItems || {},
    interactions: activeTab?.data?.interactions || {},
    metrics: activeTab?.data?.metrics || {},
    recommendations: activeTab?.data?.recommendations || {},
    appliedDiningHalls: [],
    appliedAllergens: [],
    searchTerm,
    pinnedHalls: [],
    sortOption,
  });

  return (
    <Pane maxWidth={1200} marginX='auto' paddingX={majorScale(4)} paddingY={majorScale(6)}>
      <Heading size={900} marginBottom={majorScale(4)}>
        Test Menu API/Cache + Build Display Data
      </Heading>
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
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                width='100%'
              />
            </Pane>
            <Pane marginTop={majorScale(3)}>
              <Button
                appearance='primary'
                onClick={handleFetch}
                disabled={tabs.get(date)?.loading || false}
                background={theme.colors.green600}
              >
                {tabs.get(date)?.loading ? 'Loading...' : 'Fetch Data'}
              </Button>
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
                <option value='Best'>Best</option>
                <option value='Recommended'>Recommended</option>
                <option value='Most Liked'>Most Liked</option>
                <option value='Category'>Category</option>
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

      {tabDates.length > 0 && (
        <Pane marginBottom={majorScale(3)}>
          <TabNavigation>
            {tabDates.map((tabDate) => (
              <Tab
                key={tabDate}
                id={tabDate}
                isSelected={activeDate === tabDate}
                onSelect={() => setActiveDate(tabDate)}
              >
                {tabDate}
              </Tab>
            ))}
          </TabNavigation>
        </Pane>
      )}

      {/* Error display */}
      {activeTab?.error && (
        <Pane
          background='redTint'
          border
          borderColor='red500'
          borderRadius={4}
          padding={majorScale(3)}
          marginBottom={majorScale(3)}
        >
          <Text color='red700' fontWeight={600}>
            Error: {activeTab.error}
          </Text>
        </Pane>
      )}

      {/* Loading display */}
      {activeTab?.loading && (
        <Pane display='flex' flexDirection='column' alignItems='center' paddingY={majorScale(8)}>
          <Spinner size={32} />
          <Text size={400} color='muted' marginTop={majorScale(2)}>
            Fetching data...
          </Text>
        </Pane>
      )}

      {/* Data display */}
      {activeTab?.data && (
        <Pane>
          <DataSection
            title='Locations'
            content={activeTab.data.locations}
            count={Object.keys(activeTab.data.locations || {}).length}
            fileName={`locations-${activeDate || 'data'}.txt`}
          />

          <DataSection
            title='Residential Menus'
            content={activeTab.data.residentialMenus}
            count={Object.keys(activeTab.data.residentialMenus || {}).length}
            fileName={`residential-menus-${activeDate || 'data'}.txt`}
          />

          <DataSection
            title='Retail Menus'
            content={activeTab.data.retailMenus}
            count={Object.keys(activeTab.data.retailMenus || {}).length}
            fileName={`retail-menus-${activeDate || 'data'}.txt`}
          />

          <DataSection
            title='Unique Menu Item IDs'
            renderContent={() => {
              const menuString = JSON.stringify(activeTab.data.menus);
              const matches = menuString.match(/"\d{6}"/g) || [];
              const ids = Array.from(
                new Set(matches.map((match) => match.replace(/"/g, '')))
              ).sort();
              return JSON.stringify(ids, null, 2);
            }}
            renderCount={() => {
              const menuString = JSON.stringify(activeTab.data.menus);
              const matches = menuString.match(/"\d{6}"/g) || [];
              return new Set(matches.map((match) => match.replace(/"/g, ''))).size;
            }}
            fileName={`unique-menu-item-ids-${activeDate || 'data'}.txt`}
          />

          <DataSection
            title='Menu Items'
            content={activeTab.data.menuItems}
            count={Object.keys(activeTab.data.menuItems || {}).length}
            fileName={`menu-items-${activeDate || 'data'}.txt`}
          />

          <DataSection
            title='Interactions'
            content={activeTab.data.interactions}
            count={Object.keys(activeTab.data.interactions || {}).length}
            fileName={`interactions-${activeDate || 'data'}.txt`}
          />

          <DataSection
            title='Metrics'
            content={activeTab.data.metrics}
            count={Object.keys(activeTab.data.metrics || {}).length}
            fileName={`metrics-${activeDate || 'data'}.txt`}
          />

          <DataSection
            title='Recommendations'
            content={activeTab.data.recommendations}
            count={Object.keys(activeTab.data.recommendations || {}).length}
            fileName={`recommendations-${activeDate || 'data'}.txt`}
          />

          <DataSection
            title='Full Local Storage Data'
            renderContent={() => {
              const cacheKeys = [
                'residentialMenusCache',
                'retailMenusCache',
                'locationsCache',
                'menuItemsCache',
                'interactionsCache',
                'metricsCache',
                'recommendationsCache',
              ];

              const localStorageData: any = {};
              for (const key of cacheKeys) {
                try {
                  const item = localStorage.getItem(key);
                  if (item) {
                    localStorageData[key] = JSON.parse(item);
                  }
                } catch (e) {
                  localStorageData[key] = `Error parsing: ${e}`;
                }
              }

              return JSON.stringify(localStorageData, null, 2);
            }}
            renderCount={() => {
              const cacheKeys = [
                'residentialMenusCache',
                'retailMenusCache',
                'locationsCache',
                'menuItemsCache',
                'interactionsCache',
                'metricsCache',
                'recommendationsCache',
              ];
              let totalKeys = 0;
              for (const key of cacheKeys) {
                try {
                  const item = localStorage.getItem(key);
                  if (item) {
                    const parsed = JSON.parse(item);
                    if (typeof parsed === 'object' && parsed !== null) {
                      totalKeys += Object.keys(parsed).length;
                    }
                  }
                } catch (e) {}
              }
              return totalKeys;
            }}
            fileName={`full-local-storage-data-${activeDate || 'data'}.txt`}
          />
        </Pane>
      )}

      {activeTab?.data && (
        <Pane>
          <DataSection
            title='Built Residential Display Data'
            renderContent={() => {
              if (!activeTab?.data) {
                return 'No data available';
              }

              return JSON.stringify(builtResidentialDisplayData, null, 2);
            }}
            renderCount={() => {
              if (!activeTab?.data) {
                return 0;
              }

              const totalMenuItems = builtResidentialDisplayData.reduce((sum: number, location: any) => {
                return sum + (location.menu?.length || 0);
              }, 0);

              return totalMenuItems;
            }}
            fileName={`built-residential-display-data-${activeDate || 'data'}-${meal.toLowerCase()}.txt`}
          />

          <DataSection
            title='Displayed Retail Menu Data'
            renderContent={() => {
              if (!activeTab?.data) {
                return 'No data available';
              }

              return JSON.stringify(builtRetailDisplayData, null, 2);
            }}
            renderCount={() => {
              if (!activeTab?.data) {
                return 0;
              }

              const totalMenuItems = builtRetailDisplayData.reduce((sum: number, location: any) => {
                return sum + (location.menu?.length || 0);
              }, 0);

              return totalMenuItems;
            }}
            fileName={`displayed-retail-menu-data-${activeDate || 'data'}.txt`}
          />
        </Pane>
      )}
    </Pane>
  );
}
