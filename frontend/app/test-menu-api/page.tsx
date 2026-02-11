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
  majorScale,
  minorScale,
  useTheme,
  Tab,
  TabNavigation,
} from 'evergreen-ui';
import { useMenuApi } from '@/hooks/use-menu-api';

interface DataSectionProps {
  title: string;
  content?: any;
  count?: number;
  renderContent?: () => string;
  renderCount?: () => number;
}

function DataSection({ title, content, count, renderContent, renderCount }: DataSectionProps) {
  const displayContent = renderContent ? renderContent() : JSON.stringify(content, null, 2);
  const displayCount = renderCount ? renderCount() : count ?? 0;

  return (
    <Pane
      is='section'
      background='white'
      border
      borderRadius={8}
      padding={majorScale(3)}
      marginBottom={majorScale(3)}
    >
      <Heading size={600} marginBottom={majorScale(2)}>
        {title}
      </Heading>
      <Pane
        borderRadius={4}
        padding={majorScale(2)}
        overflow='auto'
        border
        maxHeight={majorScale(60)}
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
  const fetchAll = useMenuApi();
  const [tabs, setTabs] = useState<Map<string, TabData>>(new Map());
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

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

  return (
    <Pane maxWidth={1200} marginX='auto' paddingX={majorScale(4)} paddingY={majorScale(6)}>
      <Heading size={900} marginBottom={majorScale(4)}>
        Test Menu API Hook
      </Heading>
      <Pane
        background='white'
        border
        borderRadius={8}
        padding={majorScale(3)}
        marginBottom={majorScale(4)}
      >
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
          />

          <DataSection
            title='Menus'
            content={activeTab.data.menus}
            count={Object.keys(activeTab.data.menus || {}).length}
          />

          <DataSection
            title='Unique Menu Item IDs'
            renderContent={() => {
              const menuString = JSON.stringify(activeTab.data.menus);
              const matches = menuString.match(/"\d{6}"/g) || [];
              const ids = Array.from(new Set(matches.map((match) => match.replace(/"/g, '')))).sort();
              return JSON.stringify(ids, null, 2);
            }}
            renderCount={() => {
              const menuString = JSON.stringify(activeTab.data.menus);
              const matches = menuString.match(/"\d{6}"/g) || [];
              return new Set(matches.map((match) => match.replace(/"/g, ''))).size;
            }}
          />

          <DataSection
            title='Menu Items'
            content={activeTab.data.menuItems}
            count={Object.keys(activeTab.data.menuItems || {}).length}
          />

          <DataSection
            title='Failed Menu Items'
            renderContent={() => {
              const menuString = JSON.stringify(activeTab.data.menus);
              const matches = menuString.match(/"\d{6}"/g) || [];
              const menuItemIds = new Set(matches.map((match) => match.replace(/"/g, '')));
              const returnedMenuItemIds = new Set(Object.keys(activeTab.data.menuItems || {}));
              const missingIds = Array.from(menuItemIds)
                .filter((id) => !returnedMenuItemIds.has(id))
                .sort();
              return JSON.stringify(missingIds, null, 2);
            }}
            renderCount={() => {
              const menuString = JSON.stringify(activeTab.data.menus);
              const matches = menuString.match(/"\d{6}"/g) || [];
              const menuItemIds = new Set(matches.map((match) => match.replace(/"/g, '')));
              const returnedMenuItemIds = new Set(Object.keys(activeTab.data.menuItems || {}));
              return Array.from(menuItemIds).filter((id) => !returnedMenuItemIds.has(id)).length;
            }}
          />

          <DataSection
            title='Interactions'
            content={activeTab.data.interactions}
            count={Object.keys(activeTab.data.interactions || {}).length}
          />

          <DataSection
            title='Metrics'
            content={activeTab.data.metrics}
            count={Object.keys(activeTab.data.metrics || {}).length}
          />

          <DataSection
            title='Recommendations'
            content={activeTab.data.recommendations}
            count={Object.keys(activeTab.data.recommendations || {}).length}
          />
        </Pane>
      )}
    </Pane>
  );
}

