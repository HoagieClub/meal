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
  Button,
  ChevronDownIcon,
  majorScale,
  minorScale,
  Pane,
  PinIcon,
  Text,
  useTheme,
} from 'evergreen-ui';
import React from 'react';
import MenuSection from './menu-selection';
import { Location } from '@/types/dining';
import { HALL_BANNER_MAP } from '@/styles';

/**
 * Props for the DiningHallCard component.
 *
 * @param diningHall - The dining hall to display
 * @param setModalHall - The function to set the modal hall
 * @param showNutrition - Whether to show nutrition information
 * @param isPinned - Whether the dining hall is pinned
 * @param onPinToggle - The function to call when the pin is toggled
 */
interface DiningHallCardProps {
  diningHall: Location;
  setModalHall: any;
  showNutrition: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
}

/**
 * Dining hall card component.
 *
 * @returns The dining hall card component
 */
const DiningHallCard: React.FC<DiningHallCardProps> = ({
  diningHall,
  setModalHall,
  showNutrition,
  isPinned,
  onPinToggle,
}) => {
  const theme = useTheme();
  const imageSrc = HALL_BANNER_MAP[diningHall.name as keyof typeof HALL_BANNER_MAP];

  // Render the dining hall card.
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
        className='py-4 border relative border-gray-300 rounded-md flex items-center'
      >
        {/* Render the dining hall name. */}
        <Pane
          display='flex'
          alignItems='center'
          borderRadius={majorScale(1)}
          paddingX={majorScale(2)}
          paddingY={minorScale(1)}
        >
          <Text size={700} fontWeight={600} color={theme.colors.gray900}>
            {diningHall.name}
          </Text>
        </Pane>

        {/* Render the pin icon. */}
        <Pane className='flex items-center right-[-1rem] h-[140%] absolute'>
          <Pane
            onClick={onPinToggle}
            cursor='pointer'
            padding={minorScale(1)}
            marginRight={minorScale(1)}
            className='mr-4'
            display='flex'
            alignItems='center'
            title={isPinned ? 'Unpin hall' : 'Pin hall'}
          >
            <PinIcon
              size={16}
              color={isPinned ? theme.colors.green700 : theme.colors.gray700} // Dynamic color
            />
          </Pane>

          {/* Render the dining hall image. */}
          <img src={imageSrc?.src} className='h-full my-auto w-auto' alt={diningHall.name} />
        </Pane>
      </Pane>

      {/* Render the menu section. */}
      <MenuSection items={diningHall.menu ?? []} showNutrition={showNutrition} fullMenu={false} />

      {/* Render the button to show more details. */}
      <Pane display='flex' justifyContent='center' className='mt-auto'>
        <Button
          appearance='minimal'
          iconBefore={<ChevronDownIcon />}
          onClick={() => setModalHall(diningHall)}
          className='w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold'
        >
          {'More Details'}
        </Button>
      </Pane>
    </Pane>
  );
};

export default DiningHallCard;
