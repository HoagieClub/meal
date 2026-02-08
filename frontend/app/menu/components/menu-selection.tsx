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
import MenuItemRow from './menu-item-row';

/**
 * Menu section component.
 *
 * @param items - The items to display in the menu section.
 * @param fullMenu - Whether the menu is a full menu.
 * @returns The menu section component.
 */
const MenuSection = ({
  items,
  fullMenu,
  diningHallId,
}: {
  items: any[];
  showNutrition?: boolean;
  fullMenu?: boolean;
  diningHallId?: string;
}) => {
  const theme = useTheme();

  // Render the menu section.
  return (
    <Pane>
      <Pane overflow='visible'>
        <Pane minWidth={300} className='scrollbar-top' overflow='visible'>
          {/* Section header */}
          <Pane
            display='grid'
            gridTemplateColumns='2fr 1fr auto 1fr'
            columnGap={minorScale(2)}
            rowGap={minorScale(1)}
            borderBottom={`1px solid ${theme.colors.green300}`}
            paddingBottom={minorScale(1)}
          >
            <Text size={300} fontWeight={500} textAlign='left' className='my-auto'>
              Meal
            </Text>
            {/* Empty column for favorite/likes buttons (no header) */}
            <Pane />
          </Pane>

          {/* Render the menu items. */}
          {items.length === 0 ? (
            <Text size={300} color='muted' fontStyle='italic' marginTop={minorScale(1)}>
              Nothing available
            </Text>
          ) : (
            <Pane>
              {items.map((item) => (
                <MenuItemRow
                  key={`${diningHallId}-${item.apiId}`}
                  item={item}
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
