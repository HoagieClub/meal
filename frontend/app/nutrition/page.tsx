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
import { StarIcon, ArrowUpIcon } from 'evergreen-ui';
import { MenuItem, MenuItemDetails } from '@/data';
import { api } from '@/hooks/use-next-api';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MenusForDateMealAndLocations } from '@/types/dining';

const GET_MENU_ITEM_DETAILS_URL = '/api/menu-items/details/';
const GET_MENU_ITEM_RATINGS_URL = '/api/menu-items/ratings/';
const FAVORITE_MENU_ITEM_URL = '/api/menu-items/favorite/';

const MENU_CACHE_KEY = 'menuCache';

/**
 * Nutrition label page component.
 *
 * @returns The nutrition label page component.
 */
const NutritionLabelPage = () => {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const menuItemApiId = searchParams.get('id');

  const [pageError, setPageError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [menuCache, setMenuCache, menuCacheLoading] = useLocalStorage<MenusForDateMealAndLocations>(
    {
      key: MENU_CACHE_KEY,
      initialValue: {},
    }
  );

  //   // fetch menu item upvotes and bookmarks from backend
  //   const getMenuItemRatings = async () => {
  //     setLoading((prev) => ({ ...prev, upvotesBookmarks: false }));
  //     return;
  //     const { data, error } = await api.get(`${GET_MENU_ITEM_RATINGS_URL}${menuItemApiId}`);

  //     if (error) {
  //       console.error('Error fetching menu item ratings:', error);
  //       setError(error.message || 'Failed to load menu item ratings');
  //       setUpvotes(0);
  //       setUpvoted(false);
  //       setBookmarked(false);
  //     } else {
  //       console.log('Menu item ratings data:', data);
  //     }

  //     if (error) {
  //       console.error('Error fetching upvotes and bookmarks:', error);
  //       setError(error.message || 'Failed to load upvotes and bookmarks');
  //       setUpvotes(0);
  //       setUpvoted(false);
  //       setBookmarked(false);
  //     } else {
  //       console.log('Upvotes and bookmarks data:', data);

  //       const { upvotes, bookmarks, hasUserUpvoted, hasUserBookmarked }: any = data;

  //       setUpvotes(upvotes);
  //       setUpvoted(hasUserUpvoted);
  //       setBookmarked(hasUserBookmarked);
  //     }

  //     setLoading((prev) => ({ ...prev, upvotesBookmarks: false }));
  //   };

  //   // post menu item upvotes and bookmarks to backend
  //   const postMenuItemUpvotesBookmarks = async ({ action }: { action: 'upvote' | 'bookmark' }) => {
  //     return;
  //     const { error, data } = await api.post(
  //       `${GET_MENU_ITEM_UPVOTES_BOOKMARKS_URL}${menuItemApiId}`,
  //       {
  //         action,
  //       }
  //     );

  //     if (error) {
  //       console.error('Error posting upvotes and bookmarks:', error);
  //     } else {
  //       console.log('Upvotes and bookmarks updated:', data);
  //     }
  //   };

  // fetch menu item details when component mounts
  useEffect(() => {
    if (!menuItemApiId) {
      setPageError('No menu item ID provided');
      setPageLoading(false);
      return;
    }
    if (menuCacheLoading) return;

    // Check cache first
    const cachedMenus = menuCache[dateKey];


    const getMenuItemDetails = async () => {
      const { data, error } = await api.get(`${GET_MENU_ITEM_DETAILS_URL}${menuItemApiId}`);

      if (error) {
        console.error('Error fetching menu item:', error);
        setError(error.message || 'Failed to load menu item');
        setData(null);
      } else {
        setData(data as any);
        console.log('Fetched menu item data:', data);
      }

      setLoading(false);
    };

    getMenuItemDetails();
  }, [menuItemApiId, menuCacheLoading]);

  // display loading spinner if data is still loading
  if (loading) {
    return (
      <Pane display='flex' alignItems='center' justifyContent='center' height='300'>
        <Spinner />
      </Pane>
    );
  }

  // display error message if data fails to load
  if (error || !data) {
    return (
      <Pane padding={majorScale(4)}>
        <Text color='red' size={500}>
          {error || 'Failed to load menu item data'}
        </Text>
      </Pane>
    );
  }

  // get dietary badges
  const dietaryBadges: string[] = [];
  if (data.isVegan) dietaryBadges.push('Vegan');
  if (data.isVegetarian && !data.isVegan) dietaryBadges.push('Vegetarian');
  if (data.isHalal) dietaryBadges.push('Halal');
  if (data.isKosher) dietaryBadges.push('Kosher');

  // get nutrient information
  const nutrient = data.nutrientInfo;
  const servingSizeDisplay =
    nutrient?.servingSize && nutrient?.servingUnit
      ? `${nutrient.servingSize} ${nutrient.servingUnit}`
      : nutrient?.servingSize || '—';

  return (
    <Pane backgroundColor={theme.colors.green100} minHeight='100vh' padding={majorScale(4)}>
      <Pane
        display='grid'
        gap={majorScale(4)}
        padding={majorScale(4)}
        className='sm:grid-cols-3 relative mx-auto max-w-5xl'
      >
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

        <Pane>
          <Pane display='flex' flexDirection='column'>
            <Text fontSize={50} fontWeight={800} color='green800' marginBottom={majorScale(4)}>
              NUTRITION
            </Text>
            <Link href={data.link} target='_blank'>
              <Text fontSize={20} fontWeight={800} color='green700'>
                {data.name.toUpperCase()}
              </Text>
            </Link>
            {data.description && (
              <Text fontSize={14} color='gray700' marginTop={minorScale(2)}>
                {data.description}
              </Text>
            )}
          </Pane>

          <Separator height='3px' />
          <Pane display='grid' className='grid grid-cols-2 h-min'>
            <Pane marginTop={minorScale(3)} paddingBottom={minorScale(2)}>
              <Text fontSize={20} fontWeight={700} color='green700'>
                Calories:{' '}
              </Text>
              <Pane paddingTop={minorScale(1)}>
                <Text fontSize={18} fontWeight={500}>
                  {nutrient?.calories || '—'} Cal
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
          {data.ingredients.length > 0 && (
            <Pane marginTop={majorScale(2)} display='flex' flexDirection='column'>
              <Text fontWeight={700} color='green700'>
                Ingredients:
              </Text>
              <Text fontWeight={300}>{data.ingredients.join(', ')}</Text>
            </Pane>
          )}

          {data.allergens.length > 0 && (
            <Pane marginTop={majorScale(1)} display='flex' flexDirection='column'>
              <Text fontWeight={700} color='green700'>
                Allergens:
              </Text>
              <Text fontWeight={300}>{data.allergens.join(', ')}</Text>
            </Pane>
          )}

          {dietaryBadges.length > 0 && (
            <Pane marginTop={majorScale(2)} display='flex' flexDirection='column'>
              <Text fontWeight={700} color='green700'>
                Dietary Classifications:
              </Text>
              <Pane display='flex' flexWrap='wrap' gap={minorScale(2)} marginTop={minorScale(1)}>
                {dietaryBadges.map((tag) => (
                  <Badge key={tag} color='green'>
                    {tag}
                  </Badge>
                ))}
              </Pane>
            </Pane>
          )}

          {data?.averageRating !== null && (
            <Pane marginTop={majorScale(2)}>
              <Text fontWeight={700} color='green700'>
                Rating:
              </Text>
              <Text fontWeight={300}>
                {data.averageRating?.toFixed(1)} / 5.0 ({data.ratingCount} reviews)
              </Text>
            </Pane>
          )}

          <Separator height='3px' />
          <Pane marginTop={majorScale(2)} display='flex' flexDirection='row' gap={minorScale(2)}>
            <Pane
              display='flex'
              alignItems='center'
              gap={minorScale(2)}
              cursor='pointer'
              onClick={() => {
                // setUpvotes((upvotes) => (upvoted ? upvotes - 1 : upvotes + 1));
                // setUpvoted(!upvoted);
                // postMenuItemUpvotesBookmarks({ action: 'upvote' });
              }}
            >
              {/* <ArrowUpIcon
                color={upvoted ? theme.colors.orange500 : theme.colors.green700}
                size={16}
              />
              <Text fontWeight={600} color={theme.colors.green700} fontSize={14}>
                {upvotes}
              </Text> */}
            </Pane>

            <Pane
              display='flex'
              alignItems='center'
              gap={minorScale(2)}
              paddingX={majorScale(3)}
              cursor='pointer'
              onClick={() => {
                // setBookmarked(!bookmarked);
                // postMenuItemUpvotesBookmarks({ action: 'bookmark' });
              }}
            >
              {/* <StarIcon
                color={theme.colors.green700}
                size={16}
              />
              <Text fontWeight={600} color={theme.colors.green700} fontSize={14}>
                {bookmarks}
              </Text> */}
            </Pane>
          </Pane>
        </Pane>
        <NutritionTable nutrient={nutrient} />
      </Pane>
    </Pane>
  );
};

export default NutritionLabelPage;
