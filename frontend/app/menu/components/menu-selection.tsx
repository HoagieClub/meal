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
import { useMediaQuery } from '@/hooks/use-media-query';

// Dummy data for likes/dislikes - will be replaced with real data later
const getDummyLikesDislikes = (apiId: number | null) => {
  if (!apiId) return { likes: 0, dislikes: 0 };
  // Generate consistent dummy data based on apiId
  const seed = apiId % 100;
  return {
    likes: Math.floor(seed * 1.5) + 10,
    dislikes: Math.floor(seed * 0.3) + 2,
  };
};

// Dummy function to check if item is favorited - will be replaced with real data later
const getDummyIsFavorited = (apiId: number | null): boolean => {
  if (!apiId) return false;
  // Generate consistent favorite status based on apiId (roughly 30% favorited)
  return apiId % 10 < 3;
};

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
  const displayItems = limitItems ? items.slice(0, 2).reverse() : items;
  // Enable horizontal scrolling when width is too small (below 600px)
  const enableScroll = useMediaQuery('(max-width: 800px)');

  // Show allergens if they are present in the menu item
  const showAllergens = (item: MenuItem) => {
    let itemAllergens = item?.allergens || [];

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
    const calories = item?.nutrition?.calories ?? '';
    const protein = item?.nutrition?.protein ? `${item?.nutrition?.protein} g` : '';
    const sodium = item?.nutrition?.sodium ? `${item?.nutrition?.sodium} mg` : '';
    const totalFat = item?.nutrition?.totalFat ? `${item?.nutrition?.totalFat} g` : '';
    const totalCarbs = item?.nutrition?.totalCarbohydrates
      ? `${item?.nutrition?.totalCarbohydrates} g`
      : '';
    const apiId = item?.apiId;
    const nutritionLink = `/nutrition?apiId=${apiId}`;

    // Get dummy likes/dislikes data
    const { likes, dislikes } = getDummyLikesDislikes(apiId);

    // Get dummy favorite status
    const isFavorited = getDummyIsFavorited(apiId);

    // Render the menu item row
    return (
      <React.Fragment key={apiId}>
        <Pane
          display='grid'
          gridTemplateColumns={
            showNutrition
              ? limitItems
                ? '2fr 1fr 1fr 1fr 1fr'
                : '2fr 1fr 1fr 1fr 1fr 1fr 1fr'
              : '1fr'
          }
          rowGap={minorScale(1)}
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
            <Pane display='flex' gap={minorScale(1)} marginTop={minorScale(1)}>
              {showAllergens(item)}
            </Pane>
          </Pane>

          {/* Show the macronutrients if the nutrition is enabled */}
          {showNutrition && (
            <>
              <Text
                size={300}
                textAlign='right'
                marginY={majorScale(1)}
                display='flex'
                alignItems='center'
                justifyContent='flex-end'
              >
                {calories}
              </Text>
              <Text
                size={300}
                textAlign='right'
                marginY={majorScale(1)}
                display='flex'
                alignItems='center'
                justifyContent='flex-end'
              >
                {protein}
              </Text>
              <Text
                size={300}
                textAlign='right'
                marginY={majorScale(1)}
                display='flex'
                alignItems='center'
                justifyContent='flex-end'
              >
                {sodium}
              </Text>
              {!limitItems && (
                <>
                  <Text
                    size={300}
                    textAlign='right'
                    marginY={majorScale(1)}
                    display='flex'
                    alignItems='center'
                    justifyContent='flex-end'
                  >
                    {totalFat}
                  </Text>
                  <Text
                    size={300}
                    textAlign='right'
                    marginY={majorScale(1)}
                    display='flex'
                    alignItems='center'
                    justifyContent='flex-end'
                  >
                    {totalCarbs}
                  </Text>
                </>
              )}
              <Pane
                display='flex'
                flexDirection='column'
                alignItems='flex-end'
                justifyContent='center'
                gap={minorScale(1)}
                marginY={majorScale(1)}
              >
                <Pane display='flex' alignItems='center' gap={minorScale(1)}>
                  <Text size={300}>{likes}</Text>
                  <Text fontSize={16}>👍</Text>
                </Pane>
                <Pane display='flex' alignItems='center' gap={minorScale(1)}>
                  <Text size={300}>{dislikes}</Text>
                  <Text fontSize={16}>👎</Text>
                </Pane>
              </Pane>
            </>
          )}
        </Pane>
      </React.Fragment>
    );
  };

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
                <MenuItemRow key={item.apiId} item={item} />
              ))}
            </Pane>
          )}
        </Pane>
      </Pane>
    </Pane>
  );
};

export default MenuSection;
