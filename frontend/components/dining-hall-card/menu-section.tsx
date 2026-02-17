'use client';

import React from 'react';
import { Pane, Text, minorScale, majorScale, useTheme } from 'evergreen-ui';
import MenuItemRow from './menu-item-row';

/**
 * Menu section component.
 *
 * @param items - The items to display in the menu section.
 * @param title - The title for the menu section.
 * @param sortOption - The sort option.
 * @returns The menu section component.
 */
const MenuSection = ({
  items,
  diningHallId,
  title,
  sortOption,
}: {
  items: any[];
  diningHallId: string;
  title: string;
  sortOption: string;
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
            marginBottom={minorScale(1)}
          >
            <Text
              size={400}
              fontWeight={600}
              textAlign='left'
              className='my-auto'
              textTransform='uppercase'
            >
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
                <MenuItemRow key={item.id} item={item} diningHallId={diningHallId} sortOption={sortOption} />
              ))}
            </Pane>
          )}
        </Pane>
      </Pane>
    </Pane>
  );
};

export default MenuSection;
