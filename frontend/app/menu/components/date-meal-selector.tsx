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
import { MEALS } from '@/data';
import { Meal } from '@/types/dining';

interface DateMealSelectorProps {
  meal: Meal;
  setMeal: (meal: Meal) => void;
  formattedDateForDisplay: string;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
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
}: DateMealSelectorProps) {
  const theme = useTheme();

  return (
    <Pane
      display='flex'
      gap={minorScale(2)}
      className='mx-2 flex-col flex justify-center my-4'
    >
      {/* Date selector */}
      <Pane
        display='flex'
        alignItems='center'
        gap={minorScale(2)}
        marginBottom={majorScale(1)}
      >
        <Button
          background='white'
          border={`1px solid ${theme.colors.gray300}`}
          borderRadius={999}
          padding={minorScale(1)}
          appearance='minimal'
          onClick={goToPreviousDay}
        >
          <ChevronLeftIcon size={20} />
        </Button>

        <Text
          className='text-2xl text-center w-[14rem] truncate'
          color={theme.colors.green700}
        >
          {formattedDateForDisplay}
        </Text>

        <Button
          background='white'
          border={`1px solid ${theme.colors.gray300}`}
          borderRadius={999}
          padding={minorScale(1)}
          appearance='minimal'
          onClick={goToNextDay}
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
      >
        {MEALS.map((mealOption: Meal) => {
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
              onClick={() => setMeal(mealOption as Meal)}
            >
              {mealOption}
            </Pane>
          );
        })}
      </Pane>
    </Pane>
  );
}

