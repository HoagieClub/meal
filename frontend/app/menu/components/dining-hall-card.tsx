/**
 * @overview Dining hall card component.
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

import {
  majorScale,
  minorScale,
  Pane,
  Text,
  useTheme,
} from 'evergreen-ui';
import React from 'react';
import MenuSection from './menu-selection';
import { HALL_BANNER_MAP } from '@/styles';
import { DINING_HALL_DISPLAY_NAMES } from '@/data';

/**
 * Props for the DiningHallCard component.
 *
 * @param diningHall - The dining hall to display
 * @param showNutrition - Whether to show nutrition information
 * @param isPinned - Whether the dining hall is pinned
 * @param onPinToggle - The function to call when the pin is toggled
 */
interface DiningHallCardProps {
  diningHall: any;
  showNutrition: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
}

/**
 * Dining hall card component.
 *
 * @returns The dining hall card component
 */
const DiningHallCard = ({
  diningHall,
  showNutrition,
  isPinned,
  onPinToggle,
}: DiningHallCardProps) => {
  const theme = useTheme();
  const imageSrc = HALL_BANNER_MAP[diningHall.name as keyof typeof HALL_BANNER_MAP];

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
        marginBottom={majorScale(2)}
        background={theme.colors.gray100}
        className='py-2 border relative border-gray-300 rounded-md flex items-center'
      >
        {/* Render the dining hall name. */}
        <Pane
          display='flex'
          alignItems='center'
          borderRadius={majorScale(1)}
          paddingX={majorScale(2)}
          paddingY={minorScale(1)}
        >
          <Text size={600} fontWeight={600} color={theme.colors.gray900}>
            {DINING_HALL_DISPLAY_NAMES[diningHall.name as keyof typeof DINING_HALL_DISPLAY_NAMES] ?? diningHall.name}
          </Text>
        </Pane>

        {/* Render the pin icon. */}
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
      <MenuSection items={diningHall.menu ?? []} showNutrition={showNutrition} diningHallId={diningHall.name} />
    </Pane>
  );
};

export default DiningHallCard;
