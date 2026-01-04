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

import React, { useEffect, useState } from 'react';
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
import { api } from '@/hooks/use-next-api';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MenusForDateMealAndLocations, MenuItem } from '@/types/dining';

const GET_MENU_ITEM_DETAILS_URL = '/api/dining/menu/item';
const MENU_CACHE_KEY = 'menuCache';

/**
 * Nutrition label page component.
 *
 * @returns The nutrition label page component.
 */
const NutritionLabelPage = () => {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const menuItemApiId = searchParams.get('apiId');
  const menuId = searchParams.get('menuId');
  const meal = menuId?.split('-').slice(-1)[0];
  const dateKey = menuId?.split('-').slice(0, -1).join('-');

  const [pageError, setPageError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [menuCache, setMenuCache, menuCacheLoading] = useLocalStorage<MenusForDateMealAndLocations>(
    {
      key: MENU_CACHE_KEY,
      initialValue: {},
    }
  );

  // fetch menu item details when component mounts
  useEffect(() => {
    if (!menuItemApiId) {
      setPageError('No menu item ID provided');
      setPageLoading(false);
      return;
    }
    if (menuCacheLoading) return;

    // Check cache first - search through all venues from passed menu ID
    if (dateKey && meal) {
      const cachedMenus = menuCache[dateKey] || {};
      if (cachedMenus) {
        const mealMenus = cachedMenus?.[meal as keyof typeof cachedMenus];
        if (mealMenus) {
          // Search through all venues in the meal
          for (const venue of mealMenus) {
            const foundItem = venue.menu?.find(
              (item: MenuItem) => Number(item.apiId) === Number(menuItemApiId)
            );
            if (foundItem) {
              console.log('Found menu item in cache:', foundItem);
              setMenuItem(foundItem);
              setPageLoading(false);
              return;
            }
          }
        }
      }
    }

    // If not in cache, fetch from API
    const getMenuItemDetails = async () => {
      try {
        const { data, error } = await api.get(
          `${GET_MENU_ITEM_DETAILS_URL}?api_id=${menuItemApiId}`
        );

        if (error) {
          console.error('Error fetching menu item:', error);
          setPageError(error.message || 'Failed to load menu item');
          setMenuItem(null);
        } else {
          const itemData = data?.data || data;
          if (itemData) {
            setMenuItem(itemData as MenuItem);
            console.log('Fetched menu item data:', itemData);
          } else {
            setPageError('No menu item data received');
            setMenuItem(null);
          }
        }
      } catch (err) {
        console.error('Error fetching menu item:', err);
        setPageError('Failed to load menu item');
        setMenuItem(null);
      } finally {
        setPageLoading(false);
      }
    };

    getMenuItemDetails();
  }, [menuItemApiId, menuCacheLoading, dateKey, meal]);

  // Display loading spinner if data is still loading
  if (pageLoading) {
    return (
      <Pane display='flex' alignItems='center' justifyContent='center' height='300'>
        <Spinner />
      </Pane>
    );
  }

  // Display error message if data fails to load
  if (pageError || !menuItem) {
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
    menuItem.servingSize && menuItem.servingUnit
      ? `${menuItem.servingSize} ${menuItem.servingUnit}`
      : menuItem.servingSize?.toString() || '—';

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
            {menuItem.link && (
              <Link href={menuItem.link} target='_blank'>
                <Text fontSize={20} fontWeight={800} color='green700'>
                  {menuItem.name.toUpperCase()}
                </Text>
              </Link>
            )}
            {!menuItem.link && (
              <Text fontSize={20} fontWeight={800} color='green700'>
                {menuItem.name.toUpperCase()}
              </Text>
            )}
            {menuItem.description && (
              <Text fontSize={14} color='gray700' marginTop={minorScale(2)}>
                {menuItem.description}
              </Text>
            )}
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
                  {menuItem.calories || '—'} Cal
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
          {menuItem.ingredients && menuItem.ingredients.length > 0 && (
            <Pane marginTop={majorScale(2)} display='flex' flexDirection='column'>
              <Text fontWeight={700} color='green700'>
                Ingredients:
              </Text>
              <Text fontWeight={300}>{menuItem.ingredients.join(', ')}</Text>
            </Pane>
          )}

          {/* Render the allergens */}
          {menuItem.allergens && menuItem.allergens.length > 0 && (
            <Pane marginTop={majorScale(1)} display='flex' flexDirection='column'>
              <Text fontWeight={700} color='green700'>
                Allergens:
              </Text>
              <Text fontWeight={300}>{menuItem.allergens.join(', ')}</Text>
            </Pane>
          )}

          {/* Render the dietary flags */}
          {menuItem.dietaryFlags && menuItem.dietaryFlags.length > 0 && (
            <Pane marginTop={majorScale(2)} display='flex' flexDirection='column'>
              <Text fontWeight={700} color='green700'>
                Dietary Classifications:
              </Text>
              <Pane display='flex' flexWrap='wrap' gap={minorScale(2)} marginTop={minorScale(1)}>
                {menuItem.dietaryFlags.map((tag) => (
                  <Badge key={tag} color='green'>
                    {tag}
                  </Badge>
                ))}
              </Pane>
            </Pane>
          )}
          <Separator height='3px' />
        </Pane>
        <NutritionTable menuItem={menuItem} />
      </Pane>
    </Pane>
  );
};

export default NutritionLabelPage;
