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
import { Column, MenuItem } from '@/types/types';
import MenuItemRow from './menu-item-row';

/**
 * Menu section component.
 *
 * @param items - The items to display in the menu section.
 * @param showNutrition - Whether to show nutrition information.
 * @param fullMenu - Whether the menu is a full menu.
 * @param toggledColumns - The columns to display.
 * @returns The menu section component.
 */
const MenuSection = ({
  items,
  showNutrition,
  fullMenu,
  toggledColumns,
  diningHallId,
}: {
  items: MenuItem[];
  showNutrition?: boolean;
  fullMenu?: boolean;
  toggledColumns?: Column[];
  diningHallId?: string;
}) => {
  const theme = useTheme();

  // Determine the columns to display based on the full menu and toggled columns.
  let columns: Column[] | undefined;
  if (fullMenu) {
    columns = toggledColumns;
  } else {
    columns = [];
  }

  // Determine the items to display.
  const displayItems = items;

  // Determine the minimum width of the menu section based on the columns.
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

  // Render the menu section.
  return (
    <Pane>
      <Pane overflow='visible'>
        <Pane minWidth={minWidth} className='scrollbar-top' overflow='visible'>
          {/* Section header */}
          <Pane
            display='grid'
            gridTemplateColumns={`2fr ${columns?.map((column) => (column === 'Ingredients' ? '3fr' : column === 'Allergens' ? '2fr' : '1fr')).join(' ')} auto${fullMenu ? ' 1fr' : ''}`}
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
            {/* Empty column for favorite/likes buttons (no header) */}
            <Pane />
            {fullMenu && (
              <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                Views
              </Text>
            )}
          </Pane>

          {/* Render the menu items. */}
          {displayItems.length === 0 ? (
            <Text size={300} color='muted' fontStyle='italic' marginTop={minorScale(1)}>
              Nothing available
            </Text>
          ) : (
            <Pane>
              {displayItems.map((item) => (
                <MenuItemRow
                  key={`${diningHallId}-${item.apiId}`}
                  item={item}
                  columns={columns ?? []}
                  fullMenu={fullMenu}
                  diningHallId={diningHallId}
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
