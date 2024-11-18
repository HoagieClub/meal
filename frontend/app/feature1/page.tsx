/**
 * @overview Panel display for meal information based on places.
 *
 * Copyright © 2021-2024 Hoagie Club and affiliates.
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

import { Pane, Text, Heading, majorScale } from 'evergreen-ui';
import View from '@/components/View';
import { useGetMenu } from '@/hooks/use-endpoints';

// Sample data for meal categories
const categories = [
  {
    category: 'Main Entree',
    name: 'Orange Beef with Broccoli',
    calories: 250,
    protein: 25,
    icons: ['🍂', '🥜'],
  },
  {
    category: 'Vegetarian + Vegan Entree',
    name: 'Pan-Asian Orange Tofu',
    calories: 200,
    protein: 20,
    icons: ['🥚'],
  },
  {
    category: 'Soups',
    name: 'Cream of Mushroom Soup',
    calories: 150,
    protein: 10,
    icons: ['🥛'],
  },
];

// Data for places with open/closed status
const places: Record<string, string> = {
  'Rocky / Mathey': 'no',
  Forbes: 'no',
  Whitman: 'yes',
  'Yeh / NCW': 'yes',
  // Add more entries as needed
};

export default function MealPanelDisplay() {
  // These are hard-coded for now but they can be parsed from another hook.
  // const locationId = '1088';
  // const menuId = '560027';

  // const { data: menuData } = useGetMenu(locationId, menuId);
  // console.log(menuData);

  return (
    <View>
      <Pane
        display='grid'
        gridTemplateColumns='repeat(auto-fit, minmax(400px, 1fr))' // Ensures each column has a minimum width
        gap={majorScale(4)}
        padding={majorScale(4)}
        maxWidth='1200px' // Restrict maximum width for a more balanced layout on large screens
        marginX='auto' // Center the grid horizontally
      >
        {Object.entries(places).map(([location, status], index) => (
          <Pane
            key={index}
            background='white'
            border='muted'
            padding={majorScale(3)}
            borderRadius={8}
            elevation={2}
            display='flex'
            flexDirection='column'
            justifyContent='space-between'
            minWidth='400px' // Ensures each panel has a minimum width, preventing squishing
          >
            {/* Header with Location and Status */}
            <Pane
              display='flex'
              justifyContent='space-between'
              alignItems='center'
              marginBottom={majorScale(3)}
            >
              <Heading size={900} color='black'>
                {location}
              </Heading>
              <Text size={400} color={status === 'yes' ? 'green' : 'red'} fontWeight='bold'>
                {status === 'yes' ? 'Open' : 'Closed'}
              </Text>
            </Pane>

            {/* Nutritional Headers */}
            <Pane
              display='grid'
              gridTemplateColumns='1fr 100px 100px' // Columns for Meal (empty), Calories, Protein
              gap={majorScale(2)}
              marginBottom={majorScale(2)}
            >
              {/* Empty cell to align with Meal names */}
              <Text></Text>
              <Text
                size={400}
                fontWeight='bold'
                color='black'
                textAlign='center'
                // Adjust vertical alignment if necessary
              >
                Calories
              </Text>
              <Text
                size={400}
                fontWeight='bold'
                color='black'
                textAlign='center'
                // Adjust vertical alignment if necessary
              >
                Protein (g)
              </Text>
            </Pane>

            {/* Meal Categories */}
            <Pane flex='1' overflowY='auto'>
              {categories.map((item, itemIndex) => (
                <Pane key={itemIndex} marginBottom={majorScale(3)}>
                  {/* Category Name */}
                  <Text size={500} fontWeight='bold' color='black' marginBottom={majorScale(1)}>
                    {item.category}
                  </Text>

                  {/* Meal Name and Nutritional Info */}
                  <Pane
                    display='grid'
                    gridTemplateColumns='1fr 100px 100px' // Match the header's gridTemplateColumns
                    gap={majorScale(2)}
                    alignItems='start' // Align items to the top
                  >
                    {/* Meal Name and Icons */}
                    <Pane display='flex' flexDirection='column'>
                      <Text color='green' size={400} textDecoration='underline'>
                        {item.name}
                      </Text>
                      {/* Icons below the meal name */}
                      <Pane display='flex' gap={majorScale(1)} marginTop={4}>
                        {item.icons.map((icon, iconIndex) => (
                          <Text key={iconIndex} fontSize={20}>
                            {icon}
                          </Text>
                        ))}
                      </Pane>
                    </Pane>

                    {/* Calories */}
                    <Text
                      size={400}
                      textAlign='center'
                      marginTop={-majorScale(1)} // Move up slightly
                    >
                      {item.calories}
                    </Text>

                    {/* Protein */}
                    <Text
                      size={400}
                      textAlign='center'
                      marginTop={-majorScale(1)} // Move up slightly
                    >
                      {item.protein}
                    </Text>
                  </Pane>
                </Pane>
              ))}
            </Pane>

            {/* More Details Link */}
            <Pane textAlign='center' marginTop={majorScale(2)}>
              <Text
                color='muted'
                size={400}
                cursor='pointer'
                hover={{ textDecoration: 'underline' }}
              >
                More Details
              </Text>
            </Pane>
          </Pane>
        ))}
      </Pane>
    </View>
  );
}
