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
import { Pane, Text, Link, minorScale, majorScale, useTheme } from 'evergreen-ui';
import { ALLERGENS } from '@/data';
import { ALLERGEN_EMOJI } from '@/styles';
import { MenuItem } from '@/types/dining';

/**
 * Props for the MenuSection component.
 *
 * @param label - The label for the menu section.
 * @param items - The items to display in the menu section.
 * @param showNutrition - Whether to show nutrition information.
 * @param limitItems - Whether to limit the number of items displayed.
 * @param menuId - The menu ID to use for the menu section.
 */
interface MenuSectionProps {
  label: string;
  items: MenuItem[];
  showNutrition?: boolean;
  limitItems?: boolean;
  menuId: string;
}

/**
 * Menu section component.
 *
 * @param label - The label for the menu section.
 * @param items - The items to display in the menu section.
 * @param showNutrition - Whether to show nutrition information.
 * @param limitItems - Whether to limit the number of items displayed.
 * @param menuId - The menu ID to use for the menu section.
 */
const MenuSection = ({ label, items, showNutrition, limitItems, menuId }: MenuSectionProps) => {
  const theme = useTheme();
  const displayItems = limitItems ? items.slice(0, 2).reverse() : items;

  // Show allergens if they are present in the menu item
  const showAllergens = (item: MenuItem) => {
    let itemAllergens = item?.allergens || [];
    if (itemAllergens.length === 0) {
      itemAllergens = Array.from(ALLERGENS).filter((a) =>
        item?.description?.toLowerCase().includes(a.toLowerCase())
      );
    }

    // Display "No allergens" if there are no allergens
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
        display='inline-flex'
        alignItems='center'
        justifyContent='center'
        width={24}
        height={24}
        borderRadius={12}
        background={theme.colors.green100}
        border={`1px solid ${theme.colors.green700}`}
      >
        <Text>{ALLERGEN_EMOJI[allergen as keyof typeof ALLERGEN_EMOJI]}</Text>
      </Pane>
    ));
  };

  // Component to display a menu item row
  const MenuItemRow = ({ item }: { item: MenuItem }) => {
    // Get the macronutrients for the menu item
    const calories = item?.calories ?? '';
    const protein = item?.protein ? `${item?.protein} g` : '';
    const sodium = item?.sodium ? `${item?.sodium} mg` : '';
    const totalFat = item?.totalFat ? `${item?.totalFat} g` : '';
    const totalCarbs = item?.totalCarbohydrates ? `${item?.totalCarbohydrates} g` : '';
    const apiId = item?.apiId;
    const nutritionLink = `/nutrition?apiId=${apiId}&menuId=${menuId}`;

    // Render the menu item row
    return (
      <React.Fragment key={apiId}>
        <Pane
          display='grid'
          gridTemplateColumns={
            showNutrition ? (limitItems ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 1fr 1fr') : '1fr'
          }
          rowGap={minorScale(1)}
          marginTop={minorScale(1)}
          borderBottom={`0.9px solid ${theme.colors.green300}`}
        >
          <Pane display='flex' flexDirection='column' marginY={majorScale(1)}>
            <Link href={nutritionLink}>
              <Text color='green700' fontWeight={500}>
                {item.name}
              </Text>
            </Link>
            <Pane display='flex' gap={minorScale(1)} marginTop={minorScale(1)}>
              {showAllergens(item)}
            </Pane>
          </Pane>

          {/* Show the macronutrients if the nutrition is enabled */}
          {showNutrition && (
            <>
              <Text size={300} textAlign='right' marginY={majorScale(1)}>
                {calories}
              </Text>
              <Text size={300} textAlign='right' marginY={majorScale(1)}>
                {protein}
              </Text>
              <Text size={300} textAlign='right' marginY={majorScale(1)}>
                {sodium}
              </Text>
              {!limitItems && (
                <>
                  <Text size={300} textAlign='right' marginY={majorScale(1)}>
                    {totalFat}
                  </Text>
                  <Text size={300} textAlign='right' marginY={majorScale(1)}>
                    {totalCarbs}
                  </Text>
                </>
              )}
            </>
          )}
        </Pane>
      </React.Fragment>
    );
  };

  // Render the menu section
  return (
    <Pane marginBottom={majorScale(3)}>
      {/* Section header */}
      <Pane
        display='grid'
        gridTemplateColumns={
          showNutrition ? (limitItems ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 1fr 1fr') : '1fr'
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
            <MenuItemRow key={item.apiId} item={item} />
          ))}
        </Pane>
      )}
    </Pane>
  );
};

export default MenuSection;
