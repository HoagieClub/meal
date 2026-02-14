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
 * @param title - The title for the menu section.
 * @returns The menu section component.
 */
const MenuSection = ({
  items,
  diningHallId,
  title,
}: {
  items: any[];
  diningHallId: string;
  title: string;
}) => {
  const theme = useTheme();

  return (
    <Pane marginTop={majorScale(1)}>
      <Pane overflow='visible'>
        <Pane minWidth={300} className='scrollbar-top' overflow='visible'>
          <Pane
            display='grid'
            gridTemplateColumns='2fr 1fr'
            columnGap={minorScale(2)}
            rowGap={minorScale(1)}
            borderBottom={`1px solid ${theme.colors.green300}`}
            paddingBottom={minorScale(1)}
          >
            <Text size={300} fontWeight={500} textAlign='left' className='my-auto'>
              {title}
            </Text>
            <Pane />
          </Pane>
          {items.length === 0 ? (
            <Text size={300} color='muted' fontStyle='italic' marginTop={minorScale(1)}>
              Nothing available
            </Text>
          ) : (
            <Pane>
              {items.map((item) => (
                <MenuItemRow
                  key={item.id}
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

