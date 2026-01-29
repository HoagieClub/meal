import React from 'react';
import {
  Pane,
  Text,
  majorScale,
  minorScale,
  useTheme,
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'evergreen-ui';
import { Meal } from '@/types/types';

/**
 * Date and meal selector component props.
 *
 * @param meal - The current meal.
 * @param setMeal - The function to set the meal.
 * @param formattedDateForDisplay - The formatted date for display.
 * @param goToPreviousDay - The function to go to the previous day.
 * @param goToNextDay - The function to go to the next day.
 */
interface DateMealSelectorProps {
  meal: Meal;
  setMeal: (meal: Meal) => void;
  formattedDateForDisplay: string;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  isWeekend: boolean;
}

/**
 * Date and meal selector component.
 *
 * @param props - The component props.
 * @returns The date and meal selector component.
 */
export default function DateMealSelector({
  meal,
  setMeal,
  formattedDateForDisplay,
  goToPreviousDay,
  goToNextDay,
  isWeekend,
}: DateMealSelectorProps) {
  const theme = useTheme();
  const meals = isWeekend ? ["Lunch", "Dinner"] : ["Breakfast", "Lunch", "Dinner"];

  // Render the date and meal selector.
  return (
    <Pane display='flex' gap={minorScale(2)} className='mx-2 flex-col flex justify-center my-4'>
      {/* Date selector */}
      <Pane display='flex' alignItems='center' justifyContent='center' gap={minorScale(2)} marginBottom={majorScale(1)}>
        {/* Render the button to go to the previous day. */}
        <Button
          background='white'
          border={`1px solid ${theme.colors.gray300}`}
          borderRadius={999}
          appearance='minimal'
          onClick={goToPreviousDay}
          transition='all 0.2s'
          className='p-1 pr-[4px] hover:pr-[9px] pl-[1px] active:scale-90'
        >
          <ChevronLeftIcon size={20} />
        </Button>

        {/* Render the formatted date for display. */}
        <Text className='text-2xl text-center w-[17rem] truncate font-semibold' color={theme.colors.green700}>
          {formattedDateForDisplay}
        </Text>

        {/* Render the button to go to the next day. */}
        <Button
          background='white'
          border={`1px solid ${theme.colors.gray300}`}
          borderRadius={999}
          appearance='minimal'
          onClick={goToNextDay}
          transition='all 0.2s'
          className='p-1 pl-[4px] hover:pl-[9px] pr-[1px] active:scale-90'
        >
          <ChevronRightIcon size={20} />
        </Button>
      </Pane>

      {/* Control which meal is displayed */}
      <Pane
        display='flex'
        borderRadius={999}
        background={theme.colors.green25}
        overflow='hidden'
        boxShadow='0 2px 8px rgba(0,0,0,0.08)'
        position='relative'
      >
        {/* Sliding indicator */}
        <Pane
          position='absolute'
          top={0}
          bottom={0}
          left={`${(meals.indexOf(meal) / meals.length) * 100}%`}
          width={`${100 / meals.length}%`}
          background={theme.colors.green700}
          borderRadius={999}
          className='transition-all duration-300 ease-in-out'
        />
        {/* Render each meal option. */}
        {meals.map((mealOption: string) => {
          const isSelectedMeal = meal === mealOption;
          const textColor = isSelectedMeal ? 'white' : theme.colors.green800;

          // Render the meal option.
          return (
            <Pane
              key={mealOption}
              flex={1}
              textAlign='center'
              paddingY={minorScale(1)}
              cursor='pointer'
              color={textColor}
              className='text-xs px-4 transition-colors duration-300 relative z-10'
              fontWeight={300}
              onClick={() => setMeal(mealOption as string as Meal)}
            >
              {mealOption}
            </Pane>
          );
        })}
      </Pane>
    </Pane>
  );
}
