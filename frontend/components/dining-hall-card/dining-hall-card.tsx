'use client';

import { majorScale, minorScale, Pane, Text, useTheme } from 'evergreen-ui';
import React from 'react';
import MenuSection from './menu-section';
import { HALL_BANNER_MAP } from '@/styles';
import { DINING_HALL_DISPLAY_NAMES } from '@/data';
import { SECTION_TITLE_ORDER, canonicalIndex } from '@/ordering';

interface DiningHallCardProps {
  diningHall: any;
  showNutrition?: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
  sortOption: string;
  filtersActive?: boolean;
}

/**
 * Dining hall card component.
 *
 * @returns The dining hall card component
 */
const DiningHallCard = ({ diningHall, isPinned, onPinToggle, sortOption, filtersActive }: DiningHallCardProps) => {
  const theme = useTheme();
  const imageSrc = HALL_BANNER_MAP[diningHall.name as keyof typeof HALL_BANNER_MAP];

  const menuItems = diningHall.menu ?? [];
  const categories: string[] =
    sortOption === 'Category'
      ? ([...new Set(menuItems.map((item: any) => item.category || 'Other'))] as string[]).sort(
          (a, b) => {
            const diff = canonicalIndex(a, SECTION_TITLE_ORDER) - canonicalIndex(b, SECTION_TITLE_ORDER);
            return diff !== 0 ? diff : a.localeCompare(b);
          }
        )
      : [];

  return (
    <Pane
      key={diningHall.name}
      background='white'
      borderRadius={15}
      boxShadow='0 2px 8px rgba(0,0,0,0.08)'
      padding={majorScale(3)}
      display='flex'
      flexDirection='column'
      height='100%'
    >
      <Pane
        display='flex'
        alignItems='center'
        marginBottom={majorScale(1)}
        background={theme.colors.gray200}
        className='py-2 border relative border-gray-300 rounded-md flex items-center'
      >
        <Pane
          display='flex'
          alignItems='center'
          borderRadius={majorScale(1)}
          paddingX={majorScale(2)}
          paddingY={minorScale(1)}
        >
          <Text size={700} fontWeight={600} color={theme.colors.gray900}>
            {DINING_HALL_DISPLAY_NAMES[diningHall.name as keyof typeof DINING_HALL_DISPLAY_NAMES] ??
              diningHall.name}
          </Text>
        </Pane>
        <Pane className='flex items-center right-[-1rem] h-[140%] absolute'>
          <Pane
            onClick={onPinToggle}
            cursor='pointer'
            padding={minorScale(1)}
            marginRight={minorScale(1)}
            className='transition-transform duration-200 hover:scale-95 active:scale-85'
            display='flex'
            alignItems='center'
            title={isPinned ? 'Unpin hall' : 'Pin hall'}
          >
            <img
              src={isPinned ? '/images/icons/pinned.svg' : '/images/icons/unpinned.svg'}
              width={16}
              height={16}
              alt={isPinned ? 'Unpin hall' : 'Pin hall'}
            />
          </Pane>
          <img src={imageSrc?.src} className='h-full my-auto w-auto' alt={diningHall.name} />
        </Pane>
      </Pane>
      {menuItems.length === 0 ? (
        <Pane
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          paddingTop={majorScale(2)}
          paddingBottom={majorScale(1)}
          paddingX={majorScale(2)}
          textAlign='center'
        >
          {filtersActive ? (
            <img src='/images/icons/funnel-x.svg' width={40} height={40} alt='Filtered out'/>
          ) : (
            <img src='/images/icons/no-food.svg' width={52} height={52} alt='Nothing today' />
          )}
          <Text
            size={400}
            fontWeight={600}
            color={theme.colors.gray700}
            marginTop={minorScale(3)}
          >
            {filtersActive ? 'Filtered out' : 'Nothing here'}
          </Text>
          <Text size={300} color={theme.colors.gray500} marginTop={minorScale(1)}>
            {filtersActive
              ? 'Try adjusting your search or filters'
              : 'We couldn\'t find any items for this meal'}
          </Text>
        </Pane>
      ) : sortOption === 'Category' ? (
        categories.map((category: string) => {
          const items = menuItems.filter((item: any) => item.category === category);
          return (
            <MenuSection
              key={category}
              items={items}
              diningHallId={diningHall.name}
              title={category}
              sortOption={sortOption}
            />
          );
        })
      ) : (
        <MenuSection
          items={menuItems}
          diningHallId={diningHall.name}
          title='Meal'
          sortOption={sortOption}
        />
      )}
    </Pane>
  );
};

export default DiningHallCard;
