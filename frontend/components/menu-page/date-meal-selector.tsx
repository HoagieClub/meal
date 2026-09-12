import {
  ChevronLeftIcon,
  ChevronRightIcon,
  majorScale,
  minorScale,
  Pane,
  Text,
  useTheme,
} from 'evergreen-ui';
import { mealLabel } from '@/lib/menus';
import { toDateKey, upcomingDates } from '@/lib/utils';
import type { LocationType, Meal } from '@/types';

interface DateMealSelectorProps {
  meal: Meal;
  setMeal: (meal: Meal) => void;
  /** Meals served on the selected day, in display order. */
  meals: Meal[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  locationType: LocationType;
}

const ARROW_CLASS =
  'w-10 h-10 sm:w-8 sm:h-8 flex-none transition-all hover:scale-110 active:scale-95 hover:brightness-95';

/** Previous/next day arrows, a week of quick-pick days, and meal tabs for residential halls. */
export default function DateMealSelector({
  meal,
  setMeal,
  meals,
  selectedDate,
  setSelectedDate,
  locationType,
}: DateMealSelectorProps) {
  const theme = useTheme();
  const activeIndex = meals.indexOf(meal);

  const shiftDay = (delta: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + delta);
    setSelectedDate(date);
  };

  const arrow = (label: string, delta: number, Icon: typeof ChevronLeftIcon) => (
    <Pane
      is='button'
      type='button'
      aria-label={label}
      display='flex'
      alignItems='center'
      justifyContent='center'
      borderRadius={999}
      background={theme.colors.green25}
      cursor='pointer'
      onClick={() => shiftDay(delta)}
      className={ARROW_CLASS}
    >
      <Icon size={16} color={theme.colors.green700} />
    </Pane>
  );

  return (
    <Pane display='flex' gap={minorScale(2)} className='mx-2 my-4 flex flex-col justify-center'>
      <Pane display='flex' alignItems='center' justifyContent='center' gap={minorScale(2)}>
        {arrow('Previous day', -1, ChevronLeftIcon)}
        <Text
          className='w-[17rem] min-w-0 truncate text-center text-3xl font-semibold sm:text-2xl'
          color={theme.colors.green700}
        >
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        {arrow('Next day', 1, ChevronRightIcon)}
      </Pane>

      <Pane display='flex' justifyContent='center' gap={majorScale(2)} marginBottom={minorScale(2)}>
        {upcomingDates(7).map((date) => {
          const selected = toDateKey(date) === toDateKey(selectedDate);
          return (
            <Text
              is='button'
              type='button'
              key={date.toISOString()}
              aria-pressed={selected}
              cursor='pointer'
              color={theme.colors.green700}
              fontWeight={selected ? 600 : 400}
              className={`text-base transition-all sm:text-sm ${selected ? 'underline underline-offset-4' : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
          );
        })}
      </Pane>

      {locationType === 'residential' && meals.length > 0 && (
        <Pane
          display='flex'
          borderRadius={999}
          background={theme.colors.green25}
          overflow='hidden'
          boxShadow='0 2px 8px rgba(0,0,0,0.08)'
          position='relative'
          role='tablist'
          aria-label='Meal'
        >
          {/* Sliding highlight behind the selected meal. */}
          {activeIndex >= 0 && (
            <Pane
              position='absolute'
              top={0}
              bottom={0}
              left={`${(activeIndex / meals.length) * 100}%`}
              width={`${100 / meals.length}%`}
              background={theme.colors.green700}
              borderRadius={999}
              className='transition-all duration-300 ease-in-out'
            />
          )}
          {meals.map((option) => (
            <Pane
              is='button'
              type='button'
              key={option}
              flex={1}
              textAlign='center'
              cursor='pointer'
              color={meal === option ? 'white' : theme.colors.green800}
              className='relative z-10 px-4 py-2 text-sm transition-colors duration-300'
              fontWeight={500}
              onClick={() => setMeal(option)}
              role='tab'
              aria-selected={meal === option}
            >
              {mealLabel(option, selectedDate)}
            </Pane>
          ))}
        </Pane>
      )}
    </Pane>
  );
}
