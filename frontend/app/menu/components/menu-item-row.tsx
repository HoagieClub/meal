/**
 * @overview Menu item row component.
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

'use client';

import React from 'react';
import { Pane, Text, Link, minorScale, majorScale, useTheme } from 'evergreen-ui';
import { ALLERGEN_EMOJI } from '@/styles';
import { MenuItem } from '@/types/dining';
import { MiniLikeDislikeButtons } from '@/components/mini-like-dislike-button';
import type { Column } from './menu-selection';

/**
 * Props for the MenuItemRow component.
 *
 * @param item - The menu item to display.
 * @param nutritionColumns - The columns to display.
 */
interface MenuItemRowProps {
  item: MenuItem;
  columns: Column[];
  fullMenu?: boolean;
}

/**
 * Menu item row component.
 *
 * @param props - Component props
 * @returns The menu item row component
 */
export default function MenuItemRow({ item, columns, fullMenu }: MenuItemRowProps) {
  const theme = useTheme();

  const menuItemApiId = item?.apiId;
  const calories = item?.nutrition?.calories ?? '';
  const protein = item?.nutrition?.protein ? `${item?.nutrition?.protein} g` : '';
  const sodium = item?.nutrition?.sodium ? `${item?.nutrition?.sodium} mg` : '';
  const totalFat = item?.nutrition?.totalFat ? `${item?.nutrition?.totalFat} g` : '';
  const totalCarbs = item?.nutrition?.totalCarbohydrates
    ? `${item?.nutrition?.totalCarbohydrates} g`
    : '';
  const ingredientCharacterLimit = 120;
  const ingredients =
    item?.ingredients &&
    item?.ingredients.length > 0 &&
    item?.ingredients.join(', ').length > ingredientCharacterLimit
      ? item?.ingredients.join(', ').slice(0, ingredientCharacterLimit) + '...'
      : item?.ingredients?.join(', ') || 'No ingredients';
  const allergenCharacterLimit = 80;
  const allergens =
    item?.allergens &&
    item?.allergens.length > 0 &&
    item?.allergens.join(', ').length > allergenCharacterLimit
      ? item?.allergens.join(', ').slice(0, allergenCharacterLimit) + '...'
      : item?.allergens?.join(', ') || 'No allergens';
  const nutritionLink = `/nutrition?apiId=${menuItemApiId}`;
  const isFavorited = item?.userInteraction?.favorited ?? false;
  const viewCount = item?.metrics?.viewCount ?? 0;

  const COLUMN_VALUES_MAP = {
    Calories: calories,
    Protein: protein,
    Sodium: sodium,
    Fat: totalFat,
    Carbs: totalCarbs,
    Ingredients: ingredients,
    Allergens: allergens,
  };

  /**
   * Helper function to display allergens for a menu item.
   *
   * @param item - The menu item.
   * @param theme - The theme object.
   * @returns JSX element displaying allergens.
   */
  const showAllergens = (item: MenuItem, theme: any) => {
    let itemAllergens = item?.allergens || [];
    if (itemAllergens.length === 0) {
      return (
        <Text color='muted' fontStyle='italic'>
          No allergens
        </Text>
      );
    }

    // Map over all allergens and display them as emojis
    return itemAllergens.map((allergen: string) => (
      <Pane
        key={allergen}
        display='flex'
        alignItems='center'
        justifyContent='center'
        width={26}
        height={26}
        borderRadius={999}
        background={theme.colors.green100}
      >
        <Text>{ALLERGEN_EMOJI[allergen as keyof typeof ALLERGEN_EMOJI]}</Text>
      </Pane>
    ));
  };

  // Render the menu item row
  return (
    <React.Fragment key={menuItemApiId}>
      <Pane
        display='grid'
        gridTemplateColumns={`2fr ${columns.map((column) => (column === 'Ingredients' ? '3fr' : column === 'Allergens' ? '2fr' : '1fr')).join(' ')} ${fullMenu ? '1fr 1fr' : '1fr'}`}
        rowGap={minorScale(1)}
        columnGap={minorScale(2)}
        marginTop={minorScale(1)}
        borderBottom={`0.9px solid ${theme.colors.green300}`}
      >
        <Pane display='flex' flexDirection='column' marginY={majorScale(1)}>
          <Pane display='flex' alignItems='center' gap={minorScale(1)}>
            <Link
              href={nutritionLink}
              style={{ textDecoration: 'none' }}
              className='hover:underline'
            >
              <Text color='green700' fontWeight={500}>
                {item.name}{' '}
                {isFavorited && (
                  <Text fontSize={16} color={theme.colors.yellow800} title='Favorited'>
                    {' '}
                    ⭐
                  </Text>
                )}
              </Text>
            </Link>
          </Pane>
          <Pane display='flex' flexWrap='wrap' gap={minorScale(1)} marginTop={minorScale(1)}>
            {showAllergens(item, theme)}
          </Pane>
        </Pane>
        {columns.map((column) => (
          <Text
            size={300}
            textAlign='right'
            marginY={majorScale(1)}
            display='flex'
            alignItems='center'
            justifyContent='flex-end'
            key={column}
          >
            {COLUMN_VALUES_MAP[column]}
          </Text>
        ))}
        <Pane
          display='flex'
          flexDirection='column'
          alignItems='flex-end'
          justifyContent='center'
          gap={minorScale(1)}
          marginY={majorScale(1)}
        >
          <MiniLikeDislikeButtons item={item} />
        </Pane>
        {fullMenu && (
          <Pane
            display='flex'
            flexDirection='column'
            alignItems='flex-end'
            justifyContent='center'
            gap={minorScale(1)}
            marginY={majorScale(1)}
          >
            <Text size={300} textAlign='right' className='my-auto'>
              {viewCount}
            </Text>
          </Pane>
        )}
      </Pane>
    </React.Fragment>
  );
}
