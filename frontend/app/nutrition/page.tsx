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
import { MenuItem, ApiId, MenuItemInteraction, MenuItemMetrics } from '@/types/dining';
import {
  getDiningMenuItem,
  getMenuItemMetrics,
  getUserMenuItemInteraction,
  recordUserMenuItemView,
} from '@/lib/next-endpoints';
import { useMenuItemsCache } from '@/hooks/use-menu-cache';

/**
 * Fetches a menu item by API ID.
 *
 * @param apiId - The API ID of the menu item.
 * @returns Promise resolving to MenuItem or null if error
 */
const fetchMenuItemByApiId = async (apiId: ApiId): Promise<MenuItem | null> => {
  try {
    const { data } = await getDiningMenuItem({ api_id: apiId });
    const menuItemData = data?.data || data;
    if (!menuItemData) throw new Error('No menu item data received');
    return menuItemData as MenuItem;
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }
};

/**
 * Records a menu item view in the database.
 *
 * @param apiId - The API ID of the menu item.
 * @returns Promise resolving to void.
 */
const recordMenuItemView = async (apiId: ApiId): Promise<void> => {
  try {
    await recordUserMenuItemView({
      menu_item_api_id: Number(apiId),
    });
  } catch (error) {
    console.error('Error recording view:', error);
  }
};

/**
 * Fetches menu item metrics.
 *
 * @param apiId - The API ID of the menu item.
 * @returns Promise resolving to MenuItemMetrics or null if error
 */
const fetchMenuItemMetrics = async (apiId: ApiId): Promise<MenuItemMetrics | null> => {
  try {
    const { data } = await getMenuItemMetrics({ menu_item_api_id: Number(apiId) });
    const metricsData = data?.data || data;
    if (!metricsData) throw new Error('No metrics data received');
    return metricsData as MenuItemMetrics;
  } catch (error) {
    console.error('Error fetching menu item metrics:', error);
    return null;
  }
};

/**
 * Fetches menu item interaction.
 *
 * @param apiId - The API ID of the menu item.
 * @returns Promise resolving to MenuItemInteraction or null if error
 */
const fetchMenuItemInteraction = async (apiId: ApiId): Promise<MenuItemInteraction | null> => {
  try {
    const { data } = await getUserMenuItemInteraction({ menu_item_api_id: Number(apiId) });
    const interactionData = data?.data || data;
    if (!interactionData) throw new Error('No interaction data received');
    return interactionData as MenuItemInteraction;
  } catch (error) {
    console.error('Error fetching menu item interaction:', error);
    return null;
  }
};

/**
 * Nutrition label page component.
 *
 * @returns The nutrition label page component.
 */
const NutritionLabelPage = () => {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const menuItemApiId = searchParams.get('apiId');

  const [pageError, setPageError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [menuItemMetricsState, setMenuItemMetricsState] = useState<MenuItemMetrics | null>(null);
  const [menuItemInteractionState, setMenuItemInteractionState] =
    useState<MenuItemInteraction | null>(null);
  const [menuItemState, setMenuItemState] = useState<MenuItem | null>(null);
  const { menuItemsCacheLoading, getMenuItem, setMenuItem } = useMenuItemsCache();

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
    const cachedMenuItem = getMenuItem(Number(menuItemApiId));
    if (cachedMenuItem) {
      setMenuItemState(cachedMenuItem);
      setPageLoading(false);
      return;
    }

    // Otherwise, fetch from API
    async function fetchMenuItemDetails() {
      const menuItem = await fetchMenuItemByApiId(Number(menuItemApiId));
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

    async function fetchMenuItemMetricsAndInteraction() {
      const metrics = await fetchMenuItemMetrics(Number(menuItemApiId));
      const interaction = await fetchMenuItemInteraction(Number(menuItemApiId));
      if (metrics) {
        setMenuItemMetricsState(metrics);
      }
      if (interaction) {
        setMenuItemInteractionState(interaction);
      }
      metricsRetrieved.current = true;
      interactionRetrieved.current = true;
      setPageLoading(false);
    }

    fetchMenuItemMetricsAndInteraction();
  }, [menuItemState, menuItemApiId]);

  // Record view count when menu item is loaded
  useEffect(() => {
    if (!menuItemState || !menuItemApiId || pageLoading || viewRecorded.current) return;

    const recordView = async () => {
      await recordMenuItemView(Number(menuItemApiId));
      viewRecorded.current = true;
    };

    recordView();
  }, [menuItemState, menuItemApiId, pageLoading]);

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
        {/* Render the back button */}
        <Link
          href='/menu'
          position='absolute'
          top={majorScale(2)}
          left={majorScale(4)}
          fontWeight={600}
          zIndex={10}
          className='hover:opacity-80 ml-[-3rem] sm:ml-[-5rem] sm:bg-white p-3 transition-opacity rounded-full'
        >
          <ChevronLeftIcon className='h-6 w-6' color='green600' />
        </Link>

        {/* Render the nutrition information */}
        <Pane>
          <Pane display='flex' flexDirection='column'>
            <Text fontSize={50} fontWeight={800} color='green800' marginBottom={majorScale(4)}>
              NUTRITION
            </Text>
            {menuItemState.apiUrl && (
              <Link href={menuItemState.apiUrl} target='_blank'>
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
            {/* Like/Dislike and Favorite/Bookmark buttons */}
            <Pane marginTop={majorScale(2)} display='flex' alignItems='center' gap={majorScale(2)}>
              {menuItemMetricsState && menuItemInteractionState && (
                <LikeDislikeButtons
                  menuItemApiId={Number(menuItemState.apiId)}
                  menuItemInteraction={menuItemInteractionState}
                  menuItemMetrics={menuItemMetricsState}
                />
              )}
              {menuItemInteractionState && (
                <FavoriteBookmarkButtons
                  menuItemApiId={Number(menuItemState.apiId)}
                  menuItemInteraction={menuItemInteractionState}
                />
              )}
            </Pane>
          </Pane>

          <Separator height='3px' />

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

        <NutritionTable nutrition={menuItemState.nutrition || null} />
      </Pane>
    </Pane>
  );
};

export default NutritionLabelPage;
