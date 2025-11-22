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
import { Meal as MealType } from '@/types/dining';

interface MenuPageHeaderProps {
  meal: MealType;
  selectedDate: Date;
  prevDay: () => void;
  nextDay: () => void;
  getMealLabel: (meal: MealType) => string;
  getDisplayMealRange: (meal: MealType) => string;
  availableMeals: MealType[];
  setMeal: (meal: MealType) => void;
}

export default function MenuPageHeader({
  meal,
  selectedDate,
  prevDay,
  nextDay,
  getMealLabel,
  getDisplayMealRange,
  availableMeals,
  setMeal,
}: MenuPageHeaderProps) {
  const theme = useTheme();
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
      {/* Date + arrows */}
      <Pane display='flex' gap={minorScale(2)} className='flex-col flex justify-center my-4'>
        <Pane display='flex' alignItems='center' gap={minorScale(2)}>
          <Button
            background='white'
            border={`1px solid ${theme.colors.green700}`}
            borderRadius={999}
            padding={minorScale(1)}
            appearance='minimal'
            onClick={prevDay}
          >
            <ChevronLeftIcon size={20} />
          </Button>

          <Text className='text-2xl text-center w-[14rem] truncate' color={theme.colors.green700}>
            {selectedDate.toLocaleString('en-US', {
              weekday: 'long',
              month: 'numeric',
              day: 'numeric',
            })}
          </Text>

          <Button
            background='white'
            border={`1px solid ${theme.colors.green700}`}
            borderRadius={999}
            padding={minorScale(1)}
            appearance='minimal'
            onClick={nextDay}
          >
            <ChevronRightIcon size={20} />
          </Button>
        </Pane>
        {/* ── Meal tabs ────────────────────────────── */}
        <Pane
          display='flex'
          border={`1px solid ${theme.colors.green700}`}
          borderRadius={999}
          background={theme.colors.green25}
          overflow='hidden'
        >
          {availableMeals.map((m) => (
            <Pane
              key={m}
              flex={1}
              textAlign='center'
              paddingY={minorScale(1)}
              cursor='pointer'
              background={meal === m ? theme.colors.green700 : 'transparent'}
              color={meal === m ? 'white' : theme.colors.green800}
              className='text-xs px-4'
              fontWeight={300}
              onClick={() => setMeal(m)}
            >
              {getMealLabel(m)}
            </Pane>
          ))}
        </Pane>
      </Pane>
      <Pane display='flex' flexDirection='column' gap={majorScale(2)} width={240}>
        {/* This pane is a spacer to maintain the 3-column header alignment. */}
      </Pane>
    </Pane>
  );
}
