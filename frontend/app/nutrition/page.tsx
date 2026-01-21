/**
 * @overview Nutrition label page component.
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

import React, { useEffect, useState, useRef } from 'react';
import {
  Pane,
  Link,
  Text,
  Spinner,
  majorScale,
  minorScale,
  ChevronLeftIcon,
  useTheme,
  Badge,
} from 'evergreen-ui';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import NutritionTable from './components/nutrition-table';
import LikeDislikeButtons from './components/like-dislike-buttons';
import FavoriteBookmarkButtons from './components/favorite-bookmark-buttons';
import { MenuItem, MenuItemInteraction, MenuItemMetrics } from '@/types/types';
import {
  getDiningMenuItem,
  getMenuItemMetrics,
  getUserMenuItemInteraction,
  recordUserMenuItemView,
} from '@/lib/next-endpoints';
import { useMenuItemsCache } from '@/hooks/use-menu-cache';

/**
 * Nutrition label page component.
 *
 * @returns The nutrition label page component.
 */
const NutritionLabelPage = () => {
  const theme = useTheme();

  // Get the menu item API ID from the search params
  const searchParams = useSearchParams();
  const menuItemApiId = searchParams.get('apiId');

  // Set the page error and loading state
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Create state for the menu item metrics, interaction, and state
  const [menuItemMetricsState, setMenuItemMetricsState] = useState<MenuItemMetrics | null>(null);
  const [menuItemInteractionState, setMenuItemInteractionState] =
    useState<MenuItemInteraction | null>(null);
  const [menuItemState, setMenuItemState] = useState<MenuItem | null>(null);
  const { menuItemsCacheLoading, getMenuItem, setMenuItem } = useMenuItemsCache();

  // Create refs to prevent multiple requests
  const viewRecorded = useRef(false);
  const metricsRetrieved = useRef(false);
  const interactionRetrieved = useRef(false);

  // fetch menu item details when component mounts
  useEffect(() => {
    if (!menuItemApiId) {
      setPageError('No menu item ID provided');
      setPageLoading(false);
      return;
    }
    if (menuItemsCacheLoading) return;
    setPageLoading(true);

    // Check cache first
    const cachedMenuItem = getMenuItem(menuItemApiId);
    if (cachedMenuItem) {
      setMenuItemState(cachedMenuItem);
      setPageLoading(false);
      return;
    }

    // Otherwise, fetch from API
    async function fetchMenuItemDetails() {
      // Fetch menu item details from API
      const { data: menuItem } = (await getDiningMenuItem({
        api_id: menuItemApiId,
      })) as unknown as { data: MenuItem };

      // Set the menu item state
      if (menuItem) {
        setMenuItemState(menuItem);
        setMenuItem(menuItem);
      } else {
        setPageError('Failed to load menu item');
      }
      setPageLoading(false);
    }

    fetchMenuItemDetails();
  }, [menuItemApiId, menuItemsCacheLoading]);

  // fetch menu item metrics and interaction when menu item is loaded
  useEffect(() => {
    if (
      !menuItemState ||
      !menuItemApiId ||
      metricsRetrieved.current ||
      interactionRetrieved.current
    )
      return;

    // Fetch menu item metrics and interaction from API
    async function fetchMenuItemMetricsAndInteraction() {
      // Fetch menu item metrics from API
      const { data: metrics } = (await getMenuItemMetrics({
        menu_item_api_id: menuItemApiId,
      })) as unknown as { data: MenuItemMetrics };
      const { data: interaction } = (await getUserMenuItemInteraction({
        menu_item_api_id: menuItemApiId,
      })) as unknown as { data: MenuItemInteraction };

      // Set the menu item metrics and interaction state
      if (metrics) {
        setMenuItemMetricsState(metrics);
      }
      if (interaction) {
        setMenuItemInteractionState(interaction);
      }

      // Set the refs to true and set the page loading to false
      metricsRetrieved.current = true;
      interactionRetrieved.current = true;
      setPageLoading(false);
    }

    // Record the view count
    async function recordView() {
      await recordUserMenuItemView({ menu_item_api_id: menuItemApiId });
      viewRecorded.current = true;
    }

    recordView();
    fetchMenuItemMetricsAndInteraction();
  }, [menuItemState, menuItemApiId]);

  // Display loading spinner if data is still loading
  if (pageLoading) {
    return (
      <Pane display='flex' alignItems='center' justifyContent='center' height='300'>
        <Spinner />
      </Pane>
    );
  }

  // Display error message if data fails to load
  if (pageError || !menuItemState) {
    return (
      <Pane padding={majorScale(4)}>
        <Text color='red' size={500}>
          {pageError || 'Failed to load menu item data'}
        </Text>
      </Pane>
    );
  }

  // Display the serving size
  const servingSizeDisplay =
    menuItemState.nutrition?.servingSize && menuItemState.nutrition?.servingUnit
      ? `${menuItemState.nutrition.servingSize} ${menuItemState.nutrition.servingUnit}`
      : menuItemState.nutrition?.servingSize?.toString() || '—';

  // Render the nutrition label page
  return (
    <Pane backgroundColor={theme.colors.green100} minHeight='100vh' padding={majorScale(4)}>
      <Pane
        display='grid'
        gap={majorScale(4)}
        padding={majorScale(4)}
        className='sm:grid-cols-3 relative mx-auto max-w-5xl'
      >
        {/* Render the nutrition information container */}
        <Pane>
          <Pane display='flex' flexDirection='column'>
            <Text fontSize={50} fontWeight={800} color='green800' marginBottom={majorScale(4)}>
              NUTRITION
            </Text>
            {menuItemState.apiUrl && (
              <Link
                href={menuItemState.apiUrl}
                target='_blank'
                className='hover:underline text-green-700'
              >
                <Text fontSize={20} fontWeight={800} color='green700'>
                  {menuItemState.name.toUpperCase()}
                </Text>
              </Link>
            )}
            {!menuItemState.apiUrl && (
              <Text fontSize={20} fontWeight={800} color='green700'>
                {menuItemState.name.toUpperCase()}
              </Text>
            )}
          </Pane>
          <Separator height='3px' />

          {/* Render the like/dislike and favorite/bookmark buttons */}
          {menuItemMetricsState && menuItemInteractionState && (
            <>
              <Pane
                display='flex'
                alignItems='center'
                gap={majorScale(2)}
                marginTop={majorScale(2)}
              >
                <LikeDislikeButtons
                  menuItemApiId={menuItemState.apiId}
                  menuItemInteraction={menuItemInteractionState}
                  menuItemMetrics={menuItemMetricsState}
                />
                <FavoriteBookmarkButtons
                  menuItemApiId={menuItemState.apiId}
                  menuItemInteraction={menuItemInteractionState}
                />
              </Pane>
              <Separator height='3px' marginTop={majorScale(2)} />
            </>
          )}

          {/* Render the calories and serving size */}
          <Pane display='grid' className='grid grid-cols-2 h-min'>
            <Pane marginTop={minorScale(3)} paddingBottom={minorScale(2)}>
              <Text fontSize={20} fontWeight={700} color='green700'>
                Calories:{' '}
              </Text>
              <Pane paddingTop={minorScale(1)}>
                <Text fontSize={18} fontWeight={500}>
                  {menuItemState.nutrition?.calories || '—'} Cal
                </Text>
              </Pane>
            </Pane>

            <Pane marginTop={minorScale(3)} paddingBottom={minorScale(2)}>
              <Text fontSize={20} fontWeight={700} color='green700'>
                Serving size:{' '}
              </Text>
              <Pane paddingTop={minorScale(1)}>
                <Text fontSize={18} fontWeight={500}>
                  {servingSizeDisplay}
                </Text>
              </Pane>
            </Pane>

            {/* Render the food image */}
            <Pane
              background='green600'
              style={{ width: 150, height: 150, margin: majorScale(2) }}
              className='rounded-full mx-auto col-span-2'
            >
              <img
                src='https://www.svgrepo.com/show/490734/food-dinner.svg'
                alt='Food'
                className='p-2 rounded-full object-contain'
              />
            </Pane>
          </Pane>
          <Separator height='3px' marginTop={majorScale(0)} />

          {/* Render the ingredients */}
          {menuItemState.ingredients && menuItemState.ingredients.length > 0 && (
            <Pane marginTop={majorScale(2)} display='flex' flexDirection='column'>
              <Text fontWeight={700} color='green700'>
                Ingredients:
              </Text>
              <Text fontWeight={300}>{menuItemState.ingredients.join(', ')}</Text>
            </Pane>
          )}

          {/* Render the allergens */}
          {menuItemState.allergens && menuItemState.allergens.length > 0 && (
            <Pane marginTop={majorScale(1)} display='flex' flexDirection='column'>
              <Text fontWeight={700} color='green700'>
                Allergens:
              </Text>
              <Text fontWeight={300}>{menuItemState.allergens.join(', ')}</Text>
            </Pane>
          )}

          {/* Render the dietary flags */}
          {menuItemState.dietaryFlags && menuItemState.dietaryFlags.length > 0 && (
            <Pane marginTop={majorScale(2)} display='flex' flexDirection='column'>
              <Text fontWeight={700} color='green700'>
                Dietary Classifications:
              </Text>
              <Pane display='flex' flexWrap='wrap' gap={minorScale(2)} marginTop={minorScale(1)}>
                {menuItemState.dietaryFlags.map((tag) => (
                  <Badge key={tag} color='green'>
                    {tag}
                  </Badge>
                ))}
              </Pane>
            </Pane>
          )}
          <Separator height='3px' />
        </Pane>

        {/* Render the nutrition table */}
        <NutritionTable nutrition={menuItemState.nutrition || null} />
      </Pane>
    </Pane>
  );
};

export default NutritionLabelPage;
