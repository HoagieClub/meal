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
import { MenuItemDetails } from '@/types/nutrition';
import { MacronutrientRow, MicronutrientRow } from './components/NutrientRow';

const NutritionLabelPage: React.FC = () => {
  const [data, setData] = useState<MenuItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const searchParams = useSearchParams();

  // Get the menu item API ID from the URL (instead of scraping URL)
  const menuItemApiId = searchParams.get('id');

  useEffect(() => {
    if (!menuItemApiId) {
      setError('No menu item ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch from backend API instead of scraping
    fetch(`/api/menu-items/details/${menuItemApiId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((itemData) => {
        setData(itemData);
        console.log('Fetched menu item data:', itemData);
      })
      .catch((err) => {
        console.error('Error fetching menu item:', err);
        setError(err.message || 'Failed to load menu item');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [menuItemApiId]);

  if (loading) {
    return (
      <Pane display='flex' alignItems='center' justifyContent='center' height='300'>
        <Spinner />
      </Pane>
    );
  }

  if (error || !data) {
    return (
      <Pane padding={majorScale(4)}>
        <Text color='red' size={500}>
          {error || 'Failed to load menu item data'}
        </Text>
      </Pane>
    );
  }

  // Extract dietary tags
  const dietaryBadges: string[] = [];
  if (data.isVegan) dietaryBadges.push('Vegan');
  if (data.isVegetarian && !data.isVegan) dietaryBadges.push('Vegetarian');
  if (data.isHalal) dietaryBadges.push('Halal');
  if (data.isKosher) dietaryBadges.push('Kosher');

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

        {/* Left column */}
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

          {/* Dietary Tags */}
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
          {/* Ratings */}
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
        </Pane>

        {/* Right columns: Macronutrients */}
        <Pane className='col-span-2'>
          <Pane display='grid' gridTemplateColumns='2fr 1fr 1fr' fontWeight={600}>
            <Text fontWeight={500} fontSize={15} color='green800'>
              Macronutrients
            </Text>
            <Text textAlign='right'>Amount</Text>
            <Text textAlign='right'>Est. %DV</Text>
          </Pane>
          <Separator height='3px' />
          <Pane
            marginTop={minorScale(1)}
            paddingTop={minorScale(1)}
            display='grid'
            rowGap={minorScale(2)}
          >
            {nutrient && (
              <>
                <MacronutrientRow
                  label='Total Fat'
                  amount={nutrient.totalFat}
                  unit='g'
                  dvPercent={Math.round((nutrient.totalFat / 78) * 100)}
                />
                <MacronutrientRow label='Saturated Fat' amount={nutrient.saturatedFat} unit='g' />
                <MacronutrientRow
                  label='Cholesterol'
                  amount={nutrient.cholesterol}
                  unit='mg'
                  dvPercent={Math.round((nutrient.cholesterol / 300) * 100)}
                />
                <MacronutrientRow
                  label='Sodium'
                  amount={nutrient.sodium}
                  unit='mg'
                  dvPercent={Math.round((nutrient.sodium / 2300) * 100)}
                />
                <MacronutrientRow
                  label='Total Carbohydrates'
                  amount={nutrient.totalCarbohydrates}
                  unit='g'
                  dvPercent={Math.round((nutrient.totalCarbohydrates / 275) * 100)}
                />
                <MacronutrientRow
                  label='Dietary Fiber'
                  amount={nutrient.dietaryFiber}
                  unit='g'
                  dvPercent={Math.round((nutrient.dietaryFiber / 28) * 100)}
                />
                <MacronutrientRow label='Sugars' amount={nutrient.sugars} unit='g' />
                <MacronutrientRow
                  label='Protein'
                  amount={nutrient.protein}
                  unit='g'
                  dvPercent={Math.round((nutrient.protein / 50) * 100)}
                />
              </>
            )}
          </Pane>

          {nutrient && (
            <>
              <Pane
                display='grid'
                gridTemplateColumns='2fr 1fr'
                fontWeight={600}
                marginTop={majorScale(3)}
              >
                <Text fontWeight={500} fontSize={15} color='green800'>
                  Micronutrients
                </Text>
                <Text textAlign='right'>% Daily Value</Text>
              </Pane>
              <Separator height='3px' />
              <Pane
                marginTop={minorScale(1)}
                paddingTop={minorScale(1)}
                display='grid'
                rowGap={minorScale(2)}
              >
                <MicronutrientRow label='Vitamin D' dv={nutrient.vitaminD} />
                <MicronutrientRow label='Calcium' dv={nutrient.calcium} />
                <MicronutrientRow label='Iron' dv={nutrient.iron} />
                <MicronutrientRow label='Potassium' dv={nutrient.potassium} />
              </Pane>
            </>
          )}
        </Pane>
      </Pane>
    </Pane>
  );
};

export default NutritionLabelPage;
