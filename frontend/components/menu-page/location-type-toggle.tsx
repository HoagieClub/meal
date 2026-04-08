/**
 * @overview Toggle component for switching between residential and retail dining locations.
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

import React from 'react';
import { Pane, useTheme } from 'evergreen-ui';

interface LocationTypeToggleProps {
  locationType: 'residential' | 'retail';
  setLocationType: (type: 'residential' | 'retail') => void;
  vertical?: boolean;
}

const options = [
  {
    type: 'residential' as const,
    label: 'Dining Halls',
    selectedIcon: '/images/icons/dhall-inactive.svg',  // white fill for dark bg
    defaultIcon: '/images/icons/dhall-active.svg',     // dark fill for light bg
    iconWidth: 20,
    iconHeight: 18,
  },
  {
    type: 'retail' as const,
    label: 'Retail Cafes',
    selectedIcon: '/images/icons/retail-inactive.svg', // white fill for dark bg
    defaultIcon: '/images/icons/retail-active.svg',    // dark fill for light bg
    iconWidth: 14,
    iconHeight: 18,
  },
] as const;
export default function LocationTypeToggle({ locationType, setLocationType, vertical }: LocationTypeToggleProps) {
  const theme = useTheme();
  const activeIndex = locationType === 'retail' ? 1 : 0;

  return (
    <div
      className={`flex ${vertical ? 'flex-col rounded-[20px]' : 'rounded-full'} relative overflow-hidden bg-[#a3d4b8]`}
    >
      <div
        className='absolute rounded-full transition-transform duration-300 ease-in-out'
        style={vertical
          ? { left: 0, right: 0, height: '50%', background: theme.colors.green700, transform: `translateY(${activeIndex * 100}%)` }
          : { top: 0, bottom: 0, width: '50%', background: theme.colors.green700, transform: `translateX(${activeIndex * 100}%)` }
        }
      />
      {options.map(({ type, label, selectedIcon, defaultIcon, iconWidth, iconHeight }) => {
        const isActive = locationType === type;
        return (
          <button
            key={type}
            onClick={() => setLocationType(type)}
            className='relative z-10 flex flex-1 items-center justify-center gap-1.5 px-5 py-2 cursor-pointer'
          >
            <Pane position='relative' width={iconWidth} height={iconHeight}>
              <Pane
                position='absolute'
                top={0} left={0} right={0} bottom={0}
                opacity={isActive ? 0 : 1}
                className='transition-opacity duration-300 ease-in-out'
              >
                <img src={defaultIcon} alt='' width={iconWidth} height={iconHeight} />
              </Pane>
              <Pane
                position='absolute'
                top={0} left={0} right={0} bottom={0}
                opacity={isActive ? 1 : 0}
                className='transition-opacity duration-300 ease-in-out'
              >
                <img src={selectedIcon} alt='' width={iconWidth} height={iconHeight} />
              </Pane>
            </Pane>
            <span className={`font-bold select-none whitespace-nowrap transition-all duration-300 ease-in-out ${isActive ? 'text-white' : 'text-[#156534]'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
