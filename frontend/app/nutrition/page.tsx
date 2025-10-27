'use client';

import React, { useEffect, useState } from 'react';
import {
  Pane,
  Link,
  Text,
  Tooltip,
  Spinner,
  majorScale,
  minorScale,
  ChevronLeftIcon,
  useTheme,
  // Tag,
} from 'evergreen-ui';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';

interface NutritionData {
  title: string;
  servingSize: string;
  calories: string;
  ingredients: string;
  allergens: string;
  nutrition: Record<string, string>;
  micros: Record<string, string>;
}

// Keyword lists for dietary classification
const MEAT_KEYWORDS = [
  'chicken',
  'beef',
  'pork',
  'lamb',
  'bacon',
  'ham',
  'turkey',
  'duck',
  'fish',
  'shrimp',
  'crab',
  'lobster',
  'gelatin',
];
const DAIRY_KEYWORDS = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'honey'];
const ALCOHOL_KEYWORDS = ['wine', 'beer', 'whiskey', 'alcohol'];

// Classify dietary tags based on keywords
function classifyDietary(text: string): string[] {
  const t = text.toLowerCase();
  const hasMeat = MEAT_KEYWORDS.some((w) => t.includes(w));
  const hasDairy = DAIRY_KEYWORDS.some((w) => t.includes(w));
  const hasAlcohol = ALCOHOL_KEYWORDS.some((w) => t.includes(w));

  const tags: string[] = [];
  if (!hasMeat) tags.push('Vegetarian');
  if (!hasMeat && !hasDairy) tags.push('Vegan');
  if (!t.includes('pork') && !hasAlcohol) tags.push('Halal');
  if (!t.includes('pork') && !['shrimp', 'crab', 'lobster'].some((w) => t.includes(w))) {
    tags.push('Kosher');
  }

  return tags;
}

const getColorForDV = (value: number) => {
  if (value >= 20) return 'red';
  if (value >= 10) return 'orange';
  return 'green';
};

const NutritionLabelPage: React.FC = () => {
  const [data, setData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const searchParams = useSearchParams();
  const url = searchParams.get('url') ?? '';

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((r) => r.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const title = doc.querySelector('h2')?.textContent?.trim() || 'Item';
        const facts2 = Array.from(doc.querySelectorAll('#facts2'));
        let servingSize = '';
        let calories = '';
        facts2.forEach((el) => {
          const text = el.textContent || '';
          if (text.includes('Serving Size')) {
            servingSize = text.split('Serving Size')[1].trim();
          }
          if (text.includes('Calories') && !text.includes('from Fat')) {
            calories = text.replace('Calories', '').trim();
          }
        });

        const nutrition: Record<string, string> = {};
        const facts4 = Array.from(doc.querySelectorAll('#facts4'));
        facts4.forEach((el) => {
          const text = el.textContent?.replace(/\u00a0/g, ' ').trim() || '';
          const match = text.match(/^(.+?)\s([\d\.]+[a-zA-Z]*)$/);
          if (match) {
            const key = match[1].trim();
            const val = match[2].trim();
            nutrition[key] = val;
          }
        });

        const micros: Record<string, string> = {};
        doc.querySelectorAll('li').forEach((li) => {
          const lines = li.innerText.trim().split('\n');
          if (lines.length === 2) {
            const nutrient = lines[0].trim();
            const value = lines[1].trim();
            micros[nutrient] = value;
          }
        });

        const ingredients = doc.querySelector('.labelingredientsvalue')?.textContent?.trim() || '—';
        const allergens = doc.querySelector('.labelallergensvalue')?.textContent?.trim() || '—';

        setData({ title, servingSize, calories, nutrition, micros, ingredients, allergens });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading || !data) {
    return (
      <Pane display='flex' alignItems='center' justifyContent='center' height='300'>
        <Spinner />
      </Pane>
    );
  }

  // Compute dietary tags
  const dietaryTags = classifyDietary(`${data.ingredients} ${data.allergens}`);

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
            <Link href={url}>
              <Text fontSize={20} fontWeight={800} color='green700'>
                {data.title.toUpperCase()}
              </Text>
            </Link>
          </Pane>

          <Separator height='3px' />

          <Pane display='grid' className='grid grid-cols-2 h-min'>
            <Pane marginTop={minorScale(3)} paddingBottom={minorScale(2)}>
              <Text fontSize={20} fontWeight={700} color='green700'>
                Calories:{' '}
              </Text>
              <Pane paddingTop={minorScale(1)}>
                <Text fontSize={18} fontWeight={500}>
                  {data.calories || '—'} Cal
                </Text>
              </Pane>
            </Pane>
            <Pane marginTop={minorScale(3)} paddingBottom={minorScale(2)}>
              <Text fontSize={20} fontWeight={700} color='green700'>
                Serving size:{' '}
              </Text>
              <Pane paddingTop={minorScale(1)}>
                <Text fontSize={18} fontWeight={500}>
                  {data.servingSize || '—'}
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

          <Pane marginTop={majorScale(2)} display='flex' flexDirection='column'>
            <Text fontWeight={700} color='green700'>
              Ingredients:
            </Text>
            <Text fontWeight={300}>{data.ingredients}</Text>
          </Pane>

          <Pane marginTop={majorScale(1)} display='flex' flexDirection='column'>
            <Text fontWeight={700} color='green700'>
              Allergens:
            </Text>
            <Text fontWeight={300}>{data.allergens}</Text>
          </Pane>

          {/* Dietary Tags */}
          <Pane marginTop={majorScale(2)} display='flex' flexDirection='column'>
            <Text fontWeight={700} color='green700'>
              Dietary Tags:
            </Text>
            <Pane display='flex' className='flex-col' gap={minorScale(1)} marginTop={minorScale(1)}>
              {dietaryTags.map((tag) => (
                <Text fontWeight={300}>{tag}</Text>
              ))}
            </Pane>
          </Pane>
        </Pane>

        {/* Right columns: Macronutrients & Micronutrients */}
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
            {Object.entries(data.nutrition).map(([key, val]) => {
              const amountNum = parseFloat(val);
              let dv = 0;
              if (key.toLowerCase().includes('fat')) dv = Math.round((amountNum / 78) * 100);
              else if (key.toLowerCase().includes('sodium'))
                dv = Math.round((amountNum / 2300) * 100);
              else if (key.toLowerCase().includes('cholesterol'))
                dv = Math.round((amountNum / 300) * 100);
              else if (key.toLowerCase().includes('carb')) dv = Math.round((amountNum / 275) * 100);
              else if (key.toLowerCase().includes('fiber')) dv = Math.round((amountNum / 28) * 100);
              else if (key.toLowerCase().includes('protein'))
                dv = Math.round((amountNum / 50) * 100);

              const color = getColorForDV(dv);
              return (
                <React.Fragment key={key}>
                  <Pane display='grid' gridTemplateColumns='2fr 1fr 1fr' alignItems='center'>
                    <Text fontWeight={500}>{key}</Text>
                    <Text textAlign='right'>{val}</Text>
                    <Tooltip content='Approximate % Daily Value based on 2,000-cal diet'>
                      <Text textAlign='right' color={color} fontWeight={600}>{`${dv}%`}</Text>
                    </Tooltip>
                  </Pane>
                  <Separator height='1px' marginTop={0} />
                </React.Fragment>
              );
            })}
          </Pane>

          {Object.keys(data.micros).length > 0 && (
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
                {Object.entries(data.micros).map(([key, val]) => (
                  <React.Fragment key={key}>
                    <Pane display='grid' gridTemplateColumns='2fr 1fr' alignItems='center'>
                      <Text fontWeight={500}>{key}</Text>
                      <Text textAlign='right' color='green700' fontWeight={600}>
                        {val}
                      </Text>
                    </Pane>
                    <Separator height='1px' marginTop={0} />
                  </React.Fragment>
                ))}
              </Pane>
            </>
          )}
        </Pane>
      </Pane>
    </Pane>
  );
};

export default NutritionLabelPage;
