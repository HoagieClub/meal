/**
 * @overview Menu page header component.
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

import {
  Pane,
  majorScale,
  minorScale,
  Heading,
  Text,
  Button,
  useTheme,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'evergreen-ui';
import { MEAL_RANGES, MealType } from '@/data';
import { useDate } from '@/hooks/use-date';

interface MenuPageHeaderProps {
  meal: MealType;
  useDateObject: ReturnType<typeof useDate>;
  availableMeals: MealType[];
  setMeal: (meal: MealType) => void;
}

/**
 * Menu page header component.
 *
 * @param meal - The current meal.
 * @param useDateObject - The useDateObject to use.
 * @param availableMeals - The available meals.
 * @param setMeal - The function to set the meal.
 * @returns The menu page header component.
 */
export default function MenuPageHeader({
  meal,
  useDateObject,
  availableMeals,
  setMeal,
}: MenuPageHeaderProps) {
  const theme = useTheme();
  const { goToPreviousDay, goToNextDay, formattedDateForDisplay, isWeekend } = useDateObject;

  const getDisplayMealRange = (m: MealType) => {
    if (isWeekend && m === 'Lunch') return '11:00 AM – 2:00 PM';
    return MEAL_RANGES[m];
  };

  const getMealLabel = (m: MealType) => {
    if (isWeekend && m === 'Lunch') return 'Brunch';
    return m;
  };

  return (
    <Pane
      display='flex'
      alignItems='center'
      justifyContent='space-between'
      marginY={majorScale(3)}
      className='flex-col sm:flex-row text-center sm:text-left'
    >
      <Pane width={240}>
        <Heading className='text-4xl' color={theme.colors.green700} fontWeight={900}>
          {getMealLabel(meal).toUpperCase()}
        </Heading>
        <Text className='text-xl' color={theme.colors.green600} fontWeight={600}>
          {getDisplayMealRange(meal)}
        </Text>
      </Pane>

      <Pane display='flex' gap={minorScale(2)} className='flex-col flex justify-center my-4'>
        <Pane display='flex' alignItems='center' gap={minorScale(2)}>
          <Button
            background='white'
            border={`1px solid ${theme.colors.green700}`}
            borderRadius={999}
            padding={minorScale(1)}
            appearance='minimal'
            onClick={goToPreviousDay}
          >
            <ChevronLeftIcon size={20} />
          </Button>

          <Text className='text-2xl text-center w-[14rem] truncate' color={theme.colors.green700}>
            {formattedDateForDisplay}
          </Text>

          <Button
            background='white'
            border={`1px solid ${theme.colors.green700}`}
            borderRadius={999}
            padding={minorScale(1)}
            appearance='minimal'
            onClick={goToNextDay}
          >
            <ChevronRightIcon size={20} />
          </Button>
        </Pane>

        <Pane display='flex' borderRadius={999} background={theme.colors.green25} overflow='hidden'>
          {availableMeals.map((mealOption) => {
            const isSelectedMeal = meal === mealOption;
            const backgroundColor = isSelectedMeal ? theme.colors.green700 : 'transparent';
            const textColor = isSelectedMeal ? 'white' : theme.colors.green800;
            return (
              <Pane
                key={mealOption}
                flex={1}
                textAlign='center'
                paddingY={minorScale(1)}
                cursor='pointer'
                background={backgroundColor}
                color={textColor}
                className='text-xs px-4'
                fontWeight={300}
                onClick={() => setMeal(mealOption)}
              >
                {getMealLabel(mealOption)}
              </Pane>
            );
          })}
        </Pane>
      </Pane>
      <Pane display='flex' flexDirection='column' gap={majorScale(2)} width={240} />
    </Pane>
  );
}
