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
import { Pane, Text, minorScale, majorScale, useTheme } from 'evergreen-ui';
import { ALLERGEN_ICON_MAP, DIET_ICON_MAP } from '@/data';
import { Allergen, DietaryTag, MenuItem } from '@/types/types';
import { MiniLikeDislikeButtons } from '@/components/mini-like-dislike-button';
import { MiniFavoriteButton } from '@/components/mini-favorite-button';
import { Column } from '@/types/types';
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { useNutritionAccordion } from '@/contexts/nutrition-accordion-context';
import NutritionAccordionContent from './nutrition-accordion-content';

/**
 * Menu item row component.
 *
 * @param item - The menu item to display.
 * @param columns - The columns to display.
 * @param fullMenu - Whether to display the full menu.
 * @returns The menu item row component
 */
export default function MenuItemRow({
  item,
  columns,
  fullMenu,
  diningHallId,
}: {
  item: MenuItem;
  columns: Column[];
  fullMenu?: boolean;
  diningHallId?: string;
}) {
  const theme = useTheme();
  const { expandedItemId, setExpandedItemId } = useNutritionAccordion();

  // Extract all relevant information from the menu item.
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
  const viewCount = item?.metrics?.viewCount ?? 0;

  // Map the columns to their corresponding values.
  const columnValuesMap: Record<Column, string | number | null> = {
    Calories: calories,
    Protein: protein,
    Sodium: sodium,
    Fat: totalFat,
    Carbs: totalCarbs,
    Ingredients: ingredients,
    Allergens: allergens,
  };

  /**
   * Helper function to display dietary flags and allergens for a menu item.
   *
   * @param item - The menu item.
   * @returns JSX element displaying dietary and allergen icons.
   */
  const showIcons = (item: MenuItem) => {
    const itemDietaryFlags = (item?.dietaryFlags as DietaryTag[]) || [];
    const itemAllergens = (item?.allergens as Allergen[]) || [];

    if (itemDietaryFlags.length === 0 && itemAllergens.length === 0) {
      return;
    }

    // Build a case-insensitive lookup for DIET_ICON_MAP since the backend
    // returns lowercase flags (e.g. "vegan") while the map keys are PascalCase.
    const dietIconLookup = Object.fromEntries(
      Object.entries(DIET_ICON_MAP).map(([k, v]) => [k.toLowerCase(), v])
    );

    return (
      <>
        {itemDietaryFlags
          .filter(flag => flag.toLowerCase() !== 'halal' && flag.toLowerCase() !== 'kosher')
          .map((flag) => {
            const icon = dietIconLookup[flag.toLowerCase()];
            return icon ? (
              <img key={flag} src={icon} alt={flag} title={flag} width={14} height={14} style={{ display: 'inline', marginRight: minorScale(1), verticalAlign: 'middle' }} />
            ) : null;
          })}
        {itemAllergens.map((allergen: Allergen) => (
          <img key={allergen} src={ALLERGEN_ICON_MAP[allergen]} alt={allergen} title={allergen} width={14} height={14} style={{ display: 'inline', marginRight: minorScale(1), verticalAlign: 'middle' }} />
        ))}
      </>
    );
  };

  // Toggle accordion when row is clicked
  const handleRowClick = () => {
    const itemValue = `${diningHallId}-${menuItemApiId}`;
    setExpandedItemId(expandedItemId === itemValue ? '' : itemValue);
  };

  // Render the menu item row
  return (
    <Accordion
      type="single"
      collapsible
      value={expandedItemId}
      onValueChange={setExpandedItemId}
      className="border-none"
    >
      <AccordionItem value={`${diningHallId}-${menuItemApiId}`} className="border-none">
        <Pane
          display='grid'
          gridTemplateColumns={`2fr ${columns.map((column) => (column === 'Ingredients' ? '3fr' : column === 'Allergens' ? '2fr' : '1fr')).join(' ')} auto${fullMenu ? ' 1fr' : ''} auto`}
          rowGap={minorScale(1)}
          columnGap={minorScale(2)}
          onClick={handleRowClick}
          cursor="pointer"
        >
          <Pane marginY={majorScale(1)} style={{ fontSize: 14, fontWeight: 500, color: 'black', lineHeight: 1.2 }}>
            {/* Display the menu item name and dietary/allergen icons. */}
            <span style={{ paddingRight: minorScale(1) }}>{item.name}</span>{' '}
            {showIcons(item)}
          </Pane>

          {/* Display the values for the columns. */}
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
              {columnValuesMap[column]}
            </Text>
          ))}

          {/* Display the favorite and like/dislike buttons. */}
          <Pane
            display='flex'
            flexDirection='row'
            alignItems='center'
            justifyContent='flex-end'
            gap={minorScale(1)}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MiniFavoriteButton item={item} />
            <MiniLikeDislikeButtons item={item} />
          </Pane>

          {/* Display the view count if the full menu is displayed. */}
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

          {/* Accordion trigger (chevron) */}
          <AccordionTrigger className="p-0 hover:no-underline [&>svg]:h-4 [&>svg]:w-4 cursor-pointer" />
        </Pane>

        {/* Accordion content with nutrition info */}
        <AccordionContent >
          <NutritionAccordionContent
            nutrition={item.nutrition}
            ingredients={item.ingredients}
            allergens={item.allergens}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
