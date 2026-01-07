/**
 * @overview Menu section component.
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

import React from 'react';
import { Pane, Text, minorScale, majorScale, useTheme } from 'evergreen-ui';
import { MenuItem } from '@/types/dining';
import { useMediaQuery } from '@/hooks/use-media-query';
import MenuItemRow from './menu-item-row';

/**
 * Props for the MenuSection component.
 *
 * @param label - The label for the menu section.
 * @param items - The items to display in the menu section.
 * @param showNutrition - Whether to show nutrition information.
 * @param limitItems - Whether to limit the number of items displayed.
 */
interface MenuSectionProps {
  label: string;
  items: MenuItem[];
  showNutrition?: boolean;
  limitItems?: boolean;
}

/**
 * Menu section component.
 *
 * @param label - The label for the menu section.
 * @param items - The items to display in the menu section.
 * @param showNutrition - Whether to show nutrition information.
 * @param limitItems - Whether to limit the number of items displayed.
 */
const MenuSection = ({ label, items, showNutrition, limitItems }: MenuSectionProps) => {
  const theme = useTheme();
  const NUMBER_LIMITED_ITEMS = 4;
  const displayItems = limitItems ? items.slice(0, NUMBER_LIMITED_ITEMS).reverse() : items;
  const enableScroll = useMediaQuery('(max-width: 800px)');

  // Render the menu section
  const minWidth = enableScroll ? (showNutrition ? (limitItems ? 600 : 800) : 300) : undefined;

  return (
    <Pane marginBottom={majorScale(3)}>
      {/* Scrollable container for small screens */}
      <Pane
        className={
          enableScroll
            ? 'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'
            : ''
        }
        overflowX={enableScroll ? 'auto' : 'hidden'}
      >
        {/* Content wrapper with minimum width */}
        <Pane minWidth={minWidth}>
          {/* Section header */}
          <Pane
            display='grid'
            gridTemplateColumns={
              showNutrition
                ? limitItems
                  ? '2fr 1fr 1fr 1fr 1fr'
                  : '2fr 1fr 1fr 1fr 1fr 1fr 1fr'
                : '1fr'
            }
            borderBottom={`1px solid ${theme.colors.green300}`}
            paddingBottom={minorScale(1)}
          >
            <Text fontSize={14} fontWeight={600} className='my-auto'>
              {label}
            </Text>

            {/* Show the macronutrients header if the nutrition is enabled */}
            {showNutrition && (
              <>
                <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                  Calories
                </Text>
                <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                  Protein
                </Text>
                <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                  Sodium
                </Text>
                {!limitItems && (
                  <>
                    <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                      Fat
                    </Text>
                    <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                      Carbs
                    </Text>
                  </>
                )}
                <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                  Likes
                </Text>
              </>
            )}
          </Pane>

          {/* Display the menu items */}
          {displayItems.length === 0 ? (
            <Text size={300} color='muted' fontStyle='italic' marginTop={minorScale(1)}>
              Nothing available
            </Text>
          ) : (
            <Pane marginTop={minorScale(1)}>
              {displayItems.map((item) => (
                <MenuItemRow
                  key={item.apiId}
                  item={item}
                  showNutrition={showNutrition}
                  limitItems={limitItems}
                />
              ))}
            </Pane>
          )}
        </Pane>
      </Pane>
    </Pane>
  );
};

export default MenuSection;
