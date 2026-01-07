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

export type Column =
  | 'Calories'
  | 'Protein'
  | 'Sodium'
  | 'Fat'
  | 'Carbs'
  | 'Ingredients'
  | 'Allergens';

export const COLUMNS: Column[] = [
  'Calories',
  'Protein',
  'Sodium',
  'Fat',
  'Carbs',
  'Ingredients',
  'Allergens',
];

/**
 * Props for the MenuSection component.
 *
 * @param items - The items to display in the menu section.
 * @param showNutrition - Whether to show nutrition information.
 * @param fullMenu - Whether the menu is a full menu.
 * @param toggledColumns - The columns to display.
 */
interface MenuSectionProps {
  items: MenuItem[];
  showNutrition?: boolean;
  fullMenu?: boolean;
  toggledColumns?: Column[];
}

/**
 * Menu section component.
 *
 * @returns The menu section component.
 */
const MenuSection = ({ items, showNutrition, fullMenu, toggledColumns }: MenuSectionProps) => {
  const theme = useTheme();

  let columns: Column[] | undefined;
  if (fullMenu) {
    columns = toggledColumns;
  } else {
    if (showNutrition) {
      columns = ['Protein', 'Sodium', 'Calories'];
    } else {
      columns = [];
    }
  }

  let displayItems = items;
  if (!fullMenu && items.length > 4) {
    displayItems = displayItems.slice(0, 4);
  }

  const minWidth =
    columns?.reduce((acc, column) => {
      if (column === 'Ingredients') {
        return acc + 300;
      } else if (column === 'Allergens') {
        return acc + 200;
      } else {
        return acc + 100;
      }
    }, 0) ?? 0;

  return (
    <Pane marginBottom={majorScale(3)}>
      <Pane overflowX='auto'>
        <Pane minWidth={minWidth} className='overflow-x-auto scrollbar-top'>
          {/* Section header */}
          <Pane
            display='grid'
            gridTemplateColumns={`2fr ${columns?.map((column) => (column === 'Ingredients' ? '3fr' : column === 'Allergens' ? '2fr' : '1fr')).join(' ')} ${fullMenu ? '1fr 1fr' : '1fr'}`}
            columnGap={minorScale(2)}
            rowGap={minorScale(1)}
            borderBottom={`1px solid ${theme.colors.green300}`}
            paddingBottom={minorScale(1)}
          >
            <Text size={300} fontWeight={500} textAlign='left' className='my-auto'>
              Meal
            </Text>
            {columns?.map((column) => (
              <Text size={300} fontWeight={500} textAlign='right' className='my-auto' key={column}>
                {column}
              </Text>
            ))}
            <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
              Likes
            </Text>
            {fullMenu && (
              <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                Views
              </Text>
            )}
          </Pane>

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
                  columns={columns ?? []}
                  fullMenu={fullMenu}
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
