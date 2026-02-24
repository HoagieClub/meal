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

const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

interface DateMealSelectorProps {
  meal: Meal;
  setMeal: (meal: Meal) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  locationType?: string;
  setLocationType?: any;
}

// Generate the next 7 days starting from today
const getNext7Days = (): Date[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });
};

// Format a date to 3-letter day abbreviation
const formatDayAbbrev = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// Check if two dates are the same day
const isSameDay = (a: Date, b: Date): boolean => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

/**
 * Date and meal selector component.
 *
 * @param props - The component props.
 * @returns The date and meal selector component.
 */
export default function DateMealSelector({
  meal,
  setMeal,
  selectedDate,
  setSelectedDate,
  locationType = 'residential',
  setLocationType,
}: DateMealSelectorProps) {
  const theme = useTheme();
  const formattedDateForDisplay = formatDateForDisplay(selectedDate);
  const isWeekendDay = isWeekend(selectedDate);
  const meals = isWeekendDay ? ['Lunch', 'Dinner'] : ['Breakfast', 'Lunch', 'Dinner'];
  const next7Days = getNext7Days();

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    if (isWeekend(newDate) && meal === 'Breakfast') {
      setMeal('Lunch');
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    handleDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    handleDateChange(newDate);
  };

  const goToDate = (date: Date) => {
    handleDateChange(date);
  };

  // Render the date and meal selector.
  return (
    <Pane display='flex' gap={minorScale(2)} className='mx-2 flex-col flex justify-center my-4'>
      <Pane display='flex' alignItems='center' justifyContent='center' gap={minorScale(2)}>
        <Button
          background='white'
          border={`1px solid ${theme.colors.gray300}`}
          borderRadius={999}
          appearance='minimal'
          onClick={goToPreviousDay}
          transition='all 0.2s'
          className='p-1 pl-[1px] hover:scale-110 active:scale-100'
        >
          <ChevronLeftIcon size={20} />
        </Button>

        <Text
          className='text-2xl text-center w-[17rem] truncate font-semibold'
          color={theme.colors.green700}
        >
          {formattedDateForDisplay}
        </Text>
        <Button
          background='white'
          border={`1px solid ${theme.colors.gray300}`}
          borderRadius={999}
          appearance='minimal'
          onClick={goToNextDay}
          transition='all 0.2s'
          className='p-1 pr-[1px] hover:scale-110 active:scale-100'
        >
          <ChevronRightIcon size={20} />
        </Button>
      </Pane>

      <Pane display='flex' justifyContent='center' gap={majorScale(2)} marginBottom={minorScale(2)}>
        {next7Days.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          return (
            <Text
              key={date.toISOString()}
              cursor='pointer'
              color={theme.colors.green700}
              fontWeight={isSelected ? 600 : 400}
              className={`text-sm transition-all ${isSelected ? 'underline underline-offset-4' : ''}`}
              onClick={() => goToDate(date)}
            >
              {formatDayAbbrev(date)}
            </Text>
          );
        })}
      </Pane>

      {/* Residential / Retail tab */}
      <Pane
        display='flex'
        borderRadius={999}
        background={theme.colors.green25}
        overflow='hidden'
        boxShadow='0 2px 8px rgba(0,0,0,0.08)'
        position='relative'
        marginBottom={majorScale(1)}
      >
        <Pane
          position='absolute'
          top={0}
          bottom={0}
          left={`${(locationType === 'retail' ? 1 : 0) * 50}%`}
          width='50%'
          background={theme.colors.green700}
          borderRadius={999}
          className='transition-all duration-300 ease-in-out'
        />
        {(['residential', 'retail'] as const).map((type) => {
          const isSelected = locationType === type;
          const label = type.charAt(0).toUpperCase() + type.slice(1);
          const textColor = isSelected ? 'white' : theme.colors.green800;
          return (
            <Pane
              key={type}
              flex={1}
              textAlign='center'
              paddingY={minorScale(1)}
              cursor={setLocationType ? 'pointer' : 'default'}
              color={textColor}
              className='text-xs px-4 transition-colors duration-300 relative z-10'
              fontWeight={300}
              onClick={() => setLocationType?.(type)}
            >
              {label}
            </Pane>
          );
        })}
      </Pane>

      {/* Meal tabs - only show when residential is selected */}
      {locationType === 'residential' && (
        <Pane
          display='flex'
          borderRadius={999}
          background={theme.colors.green25}
          overflow='hidden'
          boxShadow='0 2px 8px rgba(0,0,0,0.08)'
          position='relative'
        >
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
          {meals.map((mealOption: string) => {
            const isSelectedMeal = meal === mealOption;
            const textColor = isSelectedMeal ? 'white' : theme.colors.green800;
            const displayLabel = isWeekendDay && mealOption === 'Lunch' ? 'Brunch' : mealOption;
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
                {displayLabel}
              </Pane>
            );
          })}
        </Pane>
      )}
    </Pane>
  );
}
