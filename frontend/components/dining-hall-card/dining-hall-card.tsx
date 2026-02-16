'use client';

import { majorScale, minorScale, Pane, Text, useTheme } from 'evergreen-ui';
import React from 'react';
import MenuSection from './menu-section';
import { HALL_BANNER_MAP } from '@/styles';
import { DINING_HALL_DISPLAY_NAMES } from '@/data';

interface DiningHallCardProps {
  diningHall: any;
  showNutrition?: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
  sortOption: string;
}

/**
 * Dining hall card component.
 *
 * @returns The dining hall card component
 */
const DiningHallCard = ({ diningHall, isPinned, onPinToggle, sortOption }: DiningHallCardProps) => {
  const theme = useTheme();
  const imageSrc = HALL_BANNER_MAP[diningHall.name as keyof typeof HALL_BANNER_MAP];

  const menuItems = diningHall.menu ?? [];
  const categories: string[] =
    sortOption === 'Category'
      ? ([...new Set(menuItems.map((item: any) => item.category || 'Other'))] as string[])
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
        background={theme.colors.gray100}
        className='py-2 border relative border-gray-300 rounded-md flex items-center'
      >
        <Pane
          display='flex'
          alignItems='center'
          borderRadius={majorScale(1)}
          paddingX={majorScale(2)}
          paddingY={minorScale(1)}
        >
          <Text size={600} fontWeight={600} color={theme.colors.gray900}>
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
      {sortOption === 'Category' ? (
        categories.map((category: string) => {
          const items = menuItems.filter((item: any) => item.category === category);
          return (
            <MenuSection
              key={category}
              items={items}
              diningHallId={diningHall.name}
              title={category}
            />
          );
        })
      ) : (
        <MenuSection items={menuItems} diningHallId={diningHall.name} title='Meal' />
      )}
    </Pane>
  );
};

export default DiningHallCard;
