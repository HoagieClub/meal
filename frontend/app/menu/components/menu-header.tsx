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

interface MenuPageHeaderProps {
  meal: MealType;
  selectedDate: Date;
  availableMeals: MealType[];
  setMeal: (meal: MealType) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
}

export default function MenuPageHeader({
  meal,
  selectedDate,
  availableMeals,
  setMeal,
  goToPreviousDay,
  goToNextDay,
}: MenuPageHeaderProps) {
  const theme = useTheme();
  const formattedDate = selectedDate.toLocaleString('en-US', {
    weekday: 'long',
    month: 'numeric',
    day: 'numeric',
  });
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;

  const getDisplayMealRange = (m: MealType) => {
    if (isWeekend && m === 'Lunch') {
      return '11:00 AM – 2:00 PM';
    }
    return MEAL_RANGES[m];
  };

  const getMealLabel = (m: MealType) => {
    if (isWeekend && m === 'Lunch') {
      return 'Brunch';
    }
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
            {formattedDate}
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

        <Pane
          display='flex'
          borderRadius={999}
          background={theme.colors.green25}
          overflow='hidden'
        >
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
