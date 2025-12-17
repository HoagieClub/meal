// frontend/app/nutrition/page.tsx

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
import { MenuItemDetails } from './types';
import NutritionTable from './components/nutrition-table';
import { StarIcon, ArrowUpIcon } from 'evergreen-ui';

const NutritionLabelPage: React.FC = () => {
  const [data, setData] = useState<MenuItemDetails | null>(null);
  const [loading, setLoading] = useState({
    details: true,
    upvotesBookmarks: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [upvoted, setUpvoted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const theme = useTheme();
  const searchParams = useSearchParams();
  const menuItemApiId = searchParams.get('id');

  // fetch menu item details from backend
  const getMenuItemDetails = async () => {
    try {
      const response = await fetch(`/api/menu-items/details/${menuItemApiId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const itemData = await response.json();
      setData(itemData);
      console.log('Fetched menu item data:', itemData);
    } catch (error: any) {
      console.error('Error fetching menu item:', error);
      setError(error.message || 'Failed to load menu item');
      setData(null);
    } finally {
      setLoading((prev) => ({ ...prev, details: false }));
    }
  };

  const getMenuItemUpvotesBookmarks = async () => {
    try {
      const response = await fetch(`/api/menu-items/upvotes-bookmarks/${menuItemApiId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const body = await response.json();
      console.log('Upvotes and bookmarks data:', body);
      const { upvotes, bookmarks, hasUserUpvoted, hasUserBookmarked } = body;

      setUpvotes(upvotes);
      setUpvoted(hasUserUpvoted);
      setBookmarked(hasUserBookmarked);
    } catch (error: any) {
      console.error('Error fetching upvotes and bookmarks:', error);
      setError(error.message || 'Failed to load upvotes and bookmarks');
      setUpvotes(0);
      setUpvoted(false);
      setBookmarked(false);
    } finally {
      setLoading((prev) => ({ ...prev, upvotesBookmarks: false }));
    }
  };

  const postMenuItemUpvotesBookmarks = async ({ action }: { action: 'upvote' | 'bookmark' }) => {
    try {
      const response = await fetch(`/api/menu-items/upvotes-bookmarks/${menuItemApiId}`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const body = await response.json();
      console.log('Upvotes and bookmarks data:', body);
    } catch (error: any) {
      console.error('Error posting upvotes and bookmarks:', error);
    }
  };

  // fetch menu item details when component mounts
  useEffect(() => {
    if (!menuItemApiId) {
      setError('No menu item ID provided');
      setLoading({ ...loading, details: false, upvotesBookmarks: false });
      return;
    }
    setLoading((prev) => ({ ...prev, details: true, upvotesBookmarks: true }));
    setError(null);
    getMenuItemDetails();
    getMenuItemUpvotesBookmarks();
  }, [menuItemApiId]);

  // display loading spinner if data is still loading
  if (loading.details || loading.upvotesBookmarks) {
    return (
      <Pane display='flex' alignItems='center' justifyContent='center' height='300'>
        <Spinner />
      </Pane>
    );
    // display error message if data fails to load
  } else if (error || !data) {
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

        {/* display nutrition label */}
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
                setUpvotes((upvotes) => (upvoted ? upvotes - 1 : upvotes + 1));
                setUpvoted(!upvoted);
                postMenuItemUpvotesBookmarks({ action: 'upvote' });
              }}
            >
              <ArrowUpIcon
                color={upvoted ? theme.colors.orange500 : theme.colors.green700}
                size={16}
              />
              <Text fontWeight={600} color={theme.colors.green700} fontSize={14}>
                {upvotes}
              </Text>
            </Pane>
            <Pane
              display='flex'
              alignItems='center'
              gap={minorScale(2)}
              paddingX={majorScale(3)}
              cursor='pointer'
              onClick={() => {
                setBookmarked(!bookmarked);
                postMenuItemUpvotesBookmarks({ action: 'bookmark' });
              }}
            >
              <StarIcon
                color={bookmarked ? theme.colors.orange500 : theme.colors.green700}
                size={16}
              />
              <Text fontWeight={600} color={theme.colors.green700} fontSize={14}>
                {bookmarked ? 'Favorited' : 'Favorite'}
              </Text>
            </Pane>
          </Pane>
        </Pane>

        <NutritionTable nutrient={nutrient} />
      </Pane>
    </Pane>
  );
};

export default NutritionLabelPage;
