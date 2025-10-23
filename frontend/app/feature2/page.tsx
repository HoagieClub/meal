/**
 * @overview Modern Diet Planner dashboard for the Hoagie Meal app.
 * @description This app helps you plan your weekly meals by intelligently picking food from dining halls to meet your diet goals.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 * https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import {
  Pane,
  Heading,
  Text,
  Paragraph,
  Button,
  TextInputField,
  SelectField,
  Alert,
  Spinner,
  majorScale,
  minorScale,
  Card,
  Checkbox,
  Link,
  Badge,
  Tablist,
  Tab,
  IconButton,
  Popover,
  Position,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon,
  ChartIcon,
  CogIcon,
  CalendarIcon,
  RocketIcon,
  MoreIcon,
  useTheme,
  FloppyDiskIcon,
  BookmarkIcon,
  TrashIcon,
  Theme,
} from 'evergreen-ui';
import { toast } from 'sonner';

// --- HELPER HOOKS ---

// This custom hook is like useState, but it automatically saves the data to the browser's localStorage.
// Super handy for remembering user preferences!
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // We can't use localStorage on the server, so we check if `window` is defined first.
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      // If we find something in localStorage, we use that. Otherwise, we use the initial value.
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// A simple hook to check if the screen is mobile-sized.
// This helps us make the layout responsive.
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      const listener = () => setMatches(media.matches);
      // Listen for changes in the screen size
      media.addEventListener('change', listener);
      // Clean up the listener when the component unmounts
      return () => media.removeEventListener('change', listener);
    }
  }, [matches, query]);

  return matches;
}

// --- DATA SHAPES ---
// Here we define the "shapes" of our data, like what a "Meal" or "Nutrients" object looks like.

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

interface Nutrients {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  calcium: number;
  iron: number;
  potassium: number;
  vitaminD: number;
  vitaminA: number;
  vitaminC: number;
  magnesium: number;
  zinc: number;
}

interface FoodItem {
  name: string;
  location: string;
  description: string;
  link: string;
  nutrition: Nutrients;
}

interface DailyPlan {
  date: Date | string; // We allow string here for when we first load it from localStorage
  meals: { Breakfast: FoodItem[]; Lunch: FoodItem[]; Dinner: FoodItem[] };
  totals: Nutrients;
}

type WeeklyPlan = DailyPlan[];

interface PlanSettings {
  preset: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  allergens: string[];
  preferredHall: string;
}

// --- APP CONSTANTS ---
// These are the constants we use throughout the app. Think of them as our app's configuration.

const DAILY_VALUES: Omit<Nutrients, 'calories' | 'protein' | 'fat' | 'carbohydrates'> = {
  fiber: 28,
  sugar: 50,
  sodium: 2300,
  cholesterol: 300,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
  vitaminD: 20,
  vitaminA: 900,
  vitaminC: 90,
  magnesium: 420,
  zinc: 11,
};

const DINING_HALLS: Record<string, number> = {
  'Any Available Hall': 5,
  'Frist Campus Center': 1,
  RoMa: 2,
  'Whitman College': 3,
  'Forbes College': 4,
  'Butler College': 6,
};

const DIET_PRESETS: Record<string, Omit<PlanSettings, 'preset' | 'allergens' | 'preferredHall'>> = {
  custom: { calories: 2200, protein: 40, fat: 70, carbohydrates: 280 },
  balanced: { calories: 2000, protein: 30, fat: 65, carbohydrates: 250 },
  'high-protein': { calories: 2500, protein: 40, fat: 80, carbohydrates: 280 },
  'low-carb': { calories: 1800, protein: 20, fat: 100, carbohydrates: 100 },
};

const ALLERGENS_LIST = [
  'Peanut',
  'Tree Nut',
  'Egg',
  'Milk',
  'Wheat',
  'Soybeans',
  'Crustacean',
  'Gluten',
];

const DEFAULT_NUTRIENTS: Nutrients = {
  calories: 0,
  protein: 0,
  fat: 0,
  carbohydrates: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  cholesterol: 0,
  calcium: 0,
  iron: 0,
  potassium: 0,
  vitaminD: 0,
  vitaminA: 0,
  vitaminC: 0,
  magnesium: 0,
  zinc: 0,
};

// --- NUTRITION SCRAPER ---
// This is some nifty, but complex, logic to scrape nutrition data from a dining hall URL.

const parseNutrientValue = (value: string | null | undefined): number => {
  if (!value) return 0;
  return parseFloat(value) || 0;
};

// Maps the messy labels from the website to our clean, predictable nutrient keys.
const NUTRITION_KEY_MAP: Record<string, keyof Nutrients> = {
  'total fat': 'fat',
  'tot. carb.': 'carbohydrates',
  'dietary fiber': 'fiber',
  sugars: 'sugar',
  protein: 'protein',
  cholesterol: 'cholesterol',
  sodium: 'sodium',
  calcium: 'calcium',
  iron: 'iron',
  potassium: 'potassium',
  'vitamin d': 'vitaminD',
  'vitamin a': 'vitaminA',
  'vitamin c': 'vitaminC',
  magnesium: 'magnesium',
  zinc: 'zinc',
};

async function fetchAndParseNutrition(url: string): Promise<Nutrients> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ...DEFAULT_NUTRIENTS };
    }
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const nutrients: Nutrients = { ...DEFAULT_NUTRIENTS };
    doc.querySelectorAll('#facts2').forEach((el) => {
      const text = el.textContent || '';
      if (text.includes('Calories') && !text.includes('from Fat')) {
        nutrients.calories = parseNutrientValue(text.replace('Calories', '').trim());
      }
    });
    doc.querySelectorAll('#facts4').forEach((el) => {
      const text = el.textContent?.replace(/\u00a0/g, ' ').trim() || '';
      const match = text.match(/^(.+?)\s([\d\.]+[a-zA-Z]*)$/);
      if (match) {
        const key = match[1].trim().toLowerCase();
        const nutrientKey = NUTRITION_KEY_MAP[key];
        if (nutrientKey) {
          nutrients[nutrientKey] = parseNutrientValue(match[2].trim());
        }
      }
    });
    return nutrients;
  } catch (error) {
    console.error(`Error parsing nutrition for ${url}:`, error);
    return { ...DEFAULT_NUTRIENTS };
  }
}

// --- UI COMPONENTS ---
// These are the reusable building blocks for our UI, like progress bars and popovers.

const NutrientProgressBar = ({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) => {
  const theme = useTheme();
  const p = target > 0 ? (value / target) * 100 : 0;
  const fillPercent = Math.min(p, 100);
  const overflowPercent = Math.max(0, p - 100);

  // We set a color based on how close we are to the target.
  const isUnder = p < 85;
  const isOver = p > 115;

  let fillColor: string;
  if (isOver) {
    fillColor = theme.colors.blue500; // A little over might be fine, so we use blue.
  } else if (isUnder) {
    fillColor = theme.colors.orange500; // Yellow is a friendly "hey, you're under" nudge.
  } else {
    fillColor = theme.colors.green500; // Green means you're right on track!
  }

  return (
    <Pane>
      <Pane
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        marginBottom={minorScale(1)}
      >
        <Text size={300} fontWeight={600} color='#334155'>
          {label}
        </Text>
        <Text size={300} color='#64748b' fontWeight={500}>
          {Math.round(value)} / {target} {unit}
        </Text>
      </Pane>
      <Pane
        position='relative'
        height={6}
        background={theme.colors.gray300}
        borderRadius={8}
        overflow='hidden'
        className='shadow-inner'
      >
        <Pane
          height='100%'
          width={`${fillPercent}%`}
          backgroundColor={fillColor}
          borderRadius={8}
          transition='width 0.5s ease-in-out'
        />
        {/* If you go way over, we show a red overflow bar. */}
        {overflowPercent > 0 && (
          <Pane
            position='absolute'
            left={`${fillPercent}%`}
            top={0}
            height='100%'
            width={`${Math.min(overflowPercent, 100)}%`}
            backgroundColor={theme.colors.red500}
          />
        )}
      </Pane>
    </Pane>
  );
};

const MicronutrientPopover = ({ nutrition }: { nutrition: Nutrients }) => {
  const MICRONUTRIENTS_MAP: { key: keyof Nutrients; name: string; unit: string }[] = [
    { key: 'calcium', name: 'Calcium', unit: 'mg' },
    { key: 'iron', name: 'Iron', unit: 'mg' },
    { key: 'potassium', name: 'Potassium', unit: 'mg' },
    { key: 'vitaminD', name: 'Vitamin D', unit: 'mcg' },
    { key: 'vitaminA', name: 'Vitamin A', unit: 'mcg' },
    { key: 'vitaminC', name: 'Vitamin C', unit: 'mg' },
    { key: 'magnesium', name: 'Magnesium', unit: 'mg' },
    { key: 'zinc', name: 'Zinc', unit: 'mg' },
    { key: 'sodium', name: 'Sodium', unit: 'mg' },
    { key: 'cholesterol', name: 'Cholesterol', unit: 'mg' },
    { key: 'fiber', name: 'Fiber', unit: 'g' },
    { key: 'sugar', name: 'Sugar', unit: 'g' },
  ];

  const availableMicros = MICRONUTRIENTS_MAP.filter(
    (micro) => nutrition[micro.key] !== undefined && nutrition[micro.key] > 0
  );

  if (availableMicros.length === 0) {
    return null; // If there's no data, we don't show anything.
  }

  return (
    <Popover
      position={Position.BOTTOM_RIGHT}
      content={
        <Pane
          padding={majorScale(2)}
          width={240}
          display='flex'
          flexDirection='column'
          gap={minorScale(2)}
        >
          <Heading size={400}>Nutrition Details</Heading>
          {availableMicros.map((micro) => (
            <Pane key={micro.key} display='flex' justifyContent='space-between'>
              <Text size={300}>{micro.name}</Text>
              <Text size={300} color='muted'>
                {Math.round(nutrition[micro.key])} {micro.unit}
              </Text>
            </Pane>
          ))}
        </Pane>
      }
    >
      <IconButton icon={MoreIcon} appearance='minimal' height={24} title='View Micronutrients' />
    </Popover>
  );
};

const WeeklySummary = ({ plan, settings }: { plan: WeeklyPlan; settings: PlanSettings }) => {
  const summary = useMemo(() => {
    if (!plan || plan.length === 0) return { ...DEFAULT_NUTRIENTS };
    const total = plan.reduce(
      (acc, day) => {
        Object.keys(acc).forEach((key) => {
          acc[key as keyof Nutrients] += day.totals[key as keyof Nutrients];
        });
        return acc;
      },
      { ...DEFAULT_NUTRIENTS }
    );
    // Calculate the average for each nutrient over the week.
    return Object.fromEntries(
      Object.entries(total).map(([key, val]) => [key, val / plan.length])
    ) as unknown as Nutrients;
  }, [plan]);

  return (
    <Card
      background='white'
      borderRadius={12}
      padding={majorScale(3)}
      marginBottom={majorScale(3)}
      boxShadow='0px 4px 12px rgba(0, 0, 0, 0.05)'
    >
      <Heading display='flex' alignItems='center' size={600} marginBottom={majorScale(2)}>
        <ChartIcon marginRight={minorScale(2)} /> Weekly Averages
      </Heading>
      <Pane
        display='grid'
        gridTemplateColumns='repeat(auto-fit, minmax(200px, 1fr))'
        gap={majorScale(2)}
      >
        <NutrientProgressBar
          label='Calories'
          value={summary.calories}
          target={settings.calories}
          unit='kcal'
        />
        <NutrientProgressBar
          label='Protein'
          value={summary.protein}
          target={settings.protein}
          unit='g'
        />
        <NutrientProgressBar label='Fat' value={summary.fat} target={settings.fat} unit='g' />
        <NutrientProgressBar
          label='Carbs'
          value={summary.carbohydrates}
          target={settings.carbohydrates}
          unit='g'
        />
      </Pane>
    </Card>
  );
};

const DayPlanCard = ({
  day,
  settings,
  onRegenerate,
}: {
  day: DailyPlan;
  settings: PlanSettings;
  onRegenerate: () => void;
}) => {
  const MEALS_ORDER: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];

  return (
    <Card
      background='white'
      borderRadius={12}
      padding={majorScale(3)}
      transition='box-shadow 0.2s'
      hoverElevation={2}
      boxShadow='0px 4px 12px rgba(0, 0, 0, 0.05)'
    >
      <Pane
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        marginBottom={majorScale(2)}
      >
        <Heading size={600} color='#1E293B'>
          {(day.date as Date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Heading>
        <IconButton
          icon={RefreshIcon}
          onClick={onRegenerate}
          appearance='minimal'
          title="Regenerate this day's plan"
        />
      </Pane>

      <Card
        background='#F8FAFC'
        border='1px solid #E2E8F0'
        padding={majorScale(2)}
        marginBottom={majorScale(3)}
        borderRadius={8}
      >
        <Heading size={400} marginBottom={majorScale(2)} color='#1E293B'>
          Daily Summary
        </Heading>
        <Pane
          display='grid'
          gridTemplateColumns='repeat(auto-fit, minmax(150px, 1fr))'
          gap={majorScale(2)}
        >
          <NutrientProgressBar
            label='Calories'
            value={day.totals.calories}
            target={settings.calories}
            unit='kcal'
          />
          <NutrientProgressBar
            label='Protein'
            value={day.totals.protein}
            target={settings.protein}
            unit='g'
          />
          <NutrientProgressBar label='Fat' value={day.totals.fat} target={settings.fat} unit='g' />
          <NutrientProgressBar
            label='Carbs'
            value={day.totals.carbohydrates}
            target={settings.carbohydrates}
            unit='g'
          />
        </Pane>
      </Card>

      <Pane
        display='grid'
        gridTemplateColumns='repeat(auto-fit, minmax(250px, 1fr))'
        gap={majorScale(2)}
      >
        {MEALS_ORDER.map((mealType) => (
          <Pane
            key={mealType}
            border='1px solid #E2E8F0'
            borderRadius={8}
            padding={majorScale(2)}
            display='flex'
            flexDirection='column'
          >
            <Heading size={500} marginBottom={majorScale(2)} color='#334155'>
              {mealType}
            </Heading>
            {day.meals[mealType]?.length > 0 ? (
              <Pane display='flex' flexDirection='column' gap={majorScale(2)}>
                {day.meals[mealType].map((item, index) => (
                  <Pane key={`${item.name}-${index}`}>
                    <Link
                      href={`/feature4?url=${item.link}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      size={400}
                      color='neutral'
                      fontWeight={600}
                    >
                      {item.name}
                    </Link>
                    <Text display='block' size={300} color='#64748B' marginTop={minorScale(1)}>
                      at {item.location}
                    </Text>
                    <Pane
                      display='flex'
                      gap={minorScale(1)}
                      marginTop={majorScale(1)}
                      flexWrap='wrap'
                      alignItems='center'
                    >
                      <Badge color='neutral'>{`${Math.round(item.nutrition.calories)} cal`}</Badge>
                      <Badge color='teal'>{`${Math.round(item.nutrition.protein)}g P`}</Badge>
                      <Badge color='orange'>{`${Math.round(item.nutrition.fat)}g F`}</Badge>
                      <Badge color='red'>{`${Math.round(item.nutrition.carbohydrates)}g C`}</Badge>
                      <MicronutrientPopover nutrition={item.nutrition} />
                    </Pane>
                  </Pane>
                ))}
              </Pane>
            ) : (
              <Text color='#64748B' marginTop='auto'>
                No suitable meal found.
              </Text>
            )}
          </Pane>
        ))}
      </Pane>
    </Card>
  );
};

// --- NEW SAVED PLANS COMPONENT ---

const SavedPlansManager = ({
  savedPlans,
  setSavedPlans,
  setCurrentDate,
  setStoredPlan,
}: {
  savedPlans: Record<string, WeeklyPlan>;
  setSavedPlans: (value: Record<string, WeeklyPlan>) => void;
  setCurrentDate: (value: string) => void;
  setStoredPlan: (value: WeeklyPlan | null) => void;
}) => {
  const theme = useTheme();

  const loadPlan = (dateString: string, plan: WeeklyPlan) => {
    setCurrentDate(dateString);
    setStoredPlan(plan);
    toast.success(
      `Loaded plan for week of ${new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`
    );
  };

  const deletePlan = (dateString: string) => {
    setSavedPlans(
      Object.fromEntries(Object.entries(savedPlans).filter(([key]) => key !== dateString))
    );
    toast.success('Saved plan deleted.');
  };

  return (
    <Popover
      position={Position.BOTTOM_RIGHT}
      content={({ close }) => (
        <Pane
          padding={majorScale(2)}
          width={320}
          display='flex'
          flexDirection='column'
          gap={minorScale(2)}
        >
          <Heading size={400} marginBottom={majorScale(1)}>
            Saved Plans
          </Heading>
          <Pane
            maxHeight={300}
            overflowY='auto'
            display='flex'
            flexDirection='column'
            gap={minorScale(2)}
          >
            {Object.keys(savedPlans).length === 0 ? (
              <Text color='muted'>You have no saved plans.</Text>
            ) : (
              Object.entries(savedPlans).map(([dateString, plan]) => (
                <Pane
                  key={dateString}
                  display='flex'
                  justifyContent='space-between'
                  alignItems='center'
                  gap={minorScale(2)}
                >
                  <Button
                    flex={1}
                    justifyContent='flex-start'
                    onClick={() => {
                      loadPlan(dateString, plan);
                      close();
                    }}
                  >
                    Week of{' '}
                    {new Date(dateString).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Button>
                  <IconButton
                    icon={TrashIcon}
                    intent='danger'
                    appearance='minimal'
                    onClick={() => deletePlan(dateString)}
                  />
                </Pane>
              ))
            )}
          </Pane>
        </Pane>
      )}
    >
      <IconButton
        icon={BookmarkIcon}
        appearance='minimal'
        height={32}
        title='View Saved Plans'
        background={'white'}
      />
    </Popover>
  );
};

const SkeletonBlock: React.FC<{
  width: string | number;
  height: string | number;
  theme: Theme;
  [key: string]: any;
}> = ({ width, height, theme, ...props }) => (
  <Pane
    width={width}
    height={height}
    background={theme.colors.green100} // Use theme color
    borderRadius={4}
    className='pulse'
    {...props}
  />
);

const SkeletonNutrientProgressBar: React.FC<{ theme: Theme }> = ({ theme }) => (
  <Pane>
    <Pane
      display='flex'
      justifyContent='space-between'
      alignItems='center'
      marginBottom={minorScale(1)}
    >
      <SkeletonBlock width='40%' height={16} theme={theme} />
      <SkeletonBlock width='30%' height={16} theme={theme} />
    </Pane>
    <SkeletonBlock width='100%' height={6} theme={theme} borderRadius={8} />
  </Pane>
);

const SkeletonWeeklySummary: React.FC<{ theme: Theme }> = ({ theme }) => (
  <Card
    background='white'
    borderRadius={12}
    padding={majorScale(3)}
    marginBottom={majorScale(3)}
    boxShadow='0px 4px 12px rgba(0, 0, 0, 0.05)'
  >
    <SkeletonBlock width='30%' height={24} theme={theme} marginBottom={majorScale(2)} />
    <Pane
      display='grid'
      gridTemplateColumns='repeat(auto-fit, minmax(200px, 1fr))'
      gap={majorScale(2)}
    >
      <SkeletonNutrientProgressBar theme={theme} />
      <SkeletonNutrientProgressBar theme={theme} />
      <SkeletonNutrientProgressBar theme={theme} />
      <SkeletonNutrientProgressBar theme={theme} />
    </Pane>
  </Card>
);

const SkeletonDayPlanCard: React.FC<{ theme: Theme }> = ({ theme }) => (
  <Card
    background='white'
    borderRadius={12}
    padding={majorScale(3)}
    boxShadow='0px 4px 12px rgba(0, 0, 0, 0.05)'
  >
    <Pane
      display='flex'
      justifyContent='space-between'
      alignItems='center'
      marginBottom={majorScale(2)}
    >
      <SkeletonBlock width='40%' height={28} theme={theme} />
    </Pane>

    <Card
      background='#F8FAFC'
      border='1px solid #E2E8F0'
      padding={majorScale(2)}
      marginBottom={majorScale(3)}
      borderRadius={8}
    >
      <SkeletonBlock width='25%' height={20} theme={theme} marginBottom={majorScale(2)} />
      <Pane
        display='grid'
        gridTemplateColumns='repeat(auto-fit, minmax(150px, 1fr))'
        gap={majorScale(2)}
      >
        <SkeletonNutrientProgressBar theme={theme} />
        <SkeletonNutrientProgressBar theme={theme} />
        <SkeletonNutrientProgressBar theme={theme} />
        <SkeletonNutrientProgressBar theme={theme} />
      </Pane>
    </Card>

    <Pane
      display='grid'
      gridTemplateColumns='repeat(auto-fit, minmax(250px, 1fr))'
      gap={majorScale(2)}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Pane
          key={i}
          border='1px solid #E2E8F0'
          borderRadius={8}
          padding={majorScale(2)}
          display='flex'
          flexDirection='column'
          gap={majorScale(2)}
        >
          <SkeletonBlock width='30%' height={24} theme={theme} />
          <SkeletonBlock width='80%' height={20} theme={theme} />
          <SkeletonBlock width='60%' height={16} theme={theme} />
          <SkeletonBlock width='90%' height={20} theme={theme} />
          <SkeletonBlock width='50%' height={16} theme={theme} />
        </Pane>
      ))}
    </Pane>
  </Card>
);

// --- DIET PLANNER COMPONENT ---
// And here's the star of the show: the main DietPlanner component that ties everything together!

export default function DietPlanner() {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 800px)');

  // This state helps us prevent hydration errors by waiting until the component has mounted on the client.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Let's keep track of a few other things...
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [settingsTabIndex, setSettingsTabIndex] = useState(0);

  const defaultSettings: PlanSettings = {
    preset: 'balanced',
    ...DIET_PRESETS['balanced'],
    allergens: [],
    preferredHall: 'Any Available Hall',
  };

  const [settings, setSettings] = useState<PlanSettings>(defaultSettings);
  // useLocalStorage<PlanSettings>(
  //   'dietPlannerSettings',
  //   defaultSettings
  // );

  // We also remember the last generated plan.
  const [storedPlan, setStoredPlan] = useLocalStorage<WeeklyPlan | null>('dietPlannerPlan', null);

  // --- NEW ---: State for multiple saved plans
  const [savedPlans, setSavedPlans] = useLocalStorage<Record<string, WeeklyPlan>>(
    'dietPlannerSavedPlans',
    {}
  );

  // We'll make the default date the start of the current week to be helpful.
  const getStartOfWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ...
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0); // Set to the beginning of the day
    return monday.toISOString();
  };

  // And we remember which week the user was looking at.
  const [currentDate, setCurrentDate] = useLocalStorage('dietPlannerCurrentDate', getStartOfWeek());

  // When we load the plan from localStorage, the dates are just strings.
  // This brings them back to life as real Date objects that we can work with.
  const generatedPlan = useMemo(() => {
    if (!storedPlan) return null;
    return storedPlan.map((day) => ({
      ...day,
      date: new Date(day.date),
    }));
  }, [storedPlan]);

  const currentDateObj = useMemo(() => new Date(currentDate), [currentDate]);

  // --- NEW ---: Automatically load a saved plan if one exists for the current week
  useEffect(() => {
    if (savedPlans[currentDate]) {
      setStoredPlan(savedPlans[currentDate]);
    } else {
      setStoredPlan(null);
    }
  }, [currentDate, savedPlans, setStoredPlan]); // Runs when date or saved plans change

  // This effect ensures that when a user selects a preset, the calorie/protein/fat values update automatically.
  useEffect(() => {
    if (settings.preset !== 'custom') {
      setSettings((s) => ({ ...s, ...DIET_PRESETS[s.preset] }));
    }
  }, [settings.preset, setSettings]);

  const handleSettingsChange = (field: keyof PlanSettings, value: string | number | string[]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleAllergenToggle = (allergen: string) => {
    const newAllergens = settings.allergens.includes(allergen)
      ? settings.allergens.filter((a) => a !== allergen)
      : [...settings.allergens, allergen];
    handleSettingsChange('allergens', newAllergens);
  };

  // Time to fetch the menu data from our API for a specific date, meal, and location.
  const fetchMenuFor = async (
    date: Date,
    meal: MealType,
    locationId: number
  ): Promise<FoodItem[]> => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const menuId = `${yyyy}-${mm}-${dd}-${meal}`;
    try {
      const response = await fetch(
        `http://localhost:8000/api/dining/menu/?location_id=${locationId}&menu_id=${menuId}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      const preliminaryItems: Omit<FoodItem, 'nutrition'>[] = [];
      data.menus.forEach((item: any) => {
        if (item.link) {
          preliminaryItems.push({
            name: item.name,
            location: item.name,
            description: item.description,
            link: item.link,
          });
        }
      });
      if (preliminaryItems.length === 0) return [];
      // Once we have the items, we need to fetch the nutrition for each one.
      const nutritionPromises = preliminaryItems.map((item) => fetchAndParseNutrition(item.link));
      const resolvedNutrients = await Promise.all(nutritionPromises);
      return preliminaryItems
        .map((item, index) => ({ ...item, nutrition: resolvedNutrients[index] }))
        .filter((item) => item.nutrition.calories > 0);
    } catch (error) {
      console.error(`Failed to fetch menu for ${menuId}:`, error);
      return [];
    }
  };

  // This is our secret sauce for picking the best combination of foods to meet the user's goals.
  const findBestMealCombination = (
    availableFoods: FoodItem[],
    targetCalories: number,
    targetProtein: number,
    targetFat: number,
    targetCarbohydrates: number,
    maxItems = 3
  ): FoodItem[] => {
    if (availableFoods.length === 0) return [];
    let mealCombination: FoodItem[] = [];
    let currentTotals: Nutrients = { ...DEFAULT_NUTRIENTS };
    let remainingFoods = [...availableFoods];
    for (let i = 0; i < maxItems; i++) {
      if (currentTotals.calories > targetCalories * 0.85 || remainingFoods.length === 0) break;
      let bestFood: FoodItem | null = null;
      let bestScore = Infinity;
      let bestFoodIndex = -1;
      // We loop through our available foods to find the one that gets us closest to our targets.
      remainingFoods.forEach((food, index) => {
        const newCalories = currentTotals.calories + food.nutrition.calories;
        const newProtein = currentTotals.protein + food.nutrition.protein;
        const newFat = currentTotals.fat + food.nutrition.fat;
        const newCarbs = currentTotals.carbohydrates + food.nutrition.carbohydrates;

        if (newCalories > targetCalories * 1.25) return; // Don't go too far over the target.
        const calError = (newCalories - targetCalories) / (targetCalories || 1);
        const proError = (newProtein - targetProtein) / (targetProtein || 1);
        const fatError = (newFat - targetFat) / (targetFat || 1);
        const carbError = (newCarbs - targetCarbohydrates) / (targetCarbohydrates || 1);
        const score = calError ** 2 + proError ** 2 + fatError ** 2 + carbError ** 2;

        if (score < bestScore) {
          bestScore = score;
          bestFood = food;
          bestFoodIndex = index;
        }
      });
      if (bestFood && bestFoodIndex > -1) {
        mealCombination.push(bestFood);
        Object.keys(bestFood.nutrition).forEach((key) => {
          currentTotals[key as keyof Nutrients] += bestFood!.nutrition[key as keyof Nutrients];
        });
        remainingFoods.splice(bestFoodIndex, 1);
      } else {
        break;
      }
    }
    return mealCombination;
  };

  // This function generates the full plan for a single day.
  const generateDayPlan = async (date: Date): Promise<DailyPlan> => {
    const locationId = DINING_HALLS[settings.preferredHall];
    const [breakfastMenu, lunchMenu, dinnerMenu] = await Promise.all([
      fetchMenuFor(date, 'Breakfast', locationId),
      fetchMenuFor(date, 'Lunch', locationId),
      fetchMenuFor(date, 'Dinner', locationId),
    ]);
    const filterByAllergen = (items: FoodItem[]) =>
      settings.allergens.length === 0
        ? items
        : items.filter(
            (item) =>
              !settings.allergens.some((allergen) =>
                item.description.toLowerCase().includes(allergen.toLowerCase())
              )
          );
    const dailyPlan: DailyPlan = {
      date,
      meals: {
        Breakfast: findBestMealCombination(
          filterByAllergen(breakfastMenu),
          settings.calories * 0.25,
          settings.protein * 0.25,
          settings.fat * 0.25,
          settings.carbohydrates * 0.25
        ),
        Lunch: findBestMealCombination(
          filterByAllergen(lunchMenu),
          settings.calories * 0.4,
          settings.protein * 0.4,
          settings.fat * 0.4,
          settings.carbohydrates * 0.4
        ),
        Dinner: findBestMealCombination(
          filterByAllergen(dinnerMenu),
          settings.calories * 0.35,
          settings.protein * 0.35,
          settings.fat * 0.35,
          settings.carbohydrates * 0.35
        ),
      },
      totals: { ...DEFAULT_NUTRIENTS },
    };
    // Finally, we add up all the nutrients for the day.
    const allMealItemsForDay = Object.values(dailyPlan.meals).flat();
    dailyPlan.totals = allMealItemsForDay.reduce(
      (acc, meal) => {
        Object.keys(meal.nutrition).forEach((key) => {
          acc[key as keyof Nutrients] += meal.nutrition[key as keyof Nutrients];
        });
        return acc;
      },
      { ...DEFAULT_NUTRIENTS }
    );
    return dailyPlan;
  };

  // This kicks off the whole process of generating a 7-day plan.
  const handleGeneratePlan = async (startDate: Date) => {
    if (
      settings.calories <= 0 ||
      settings.protein <= 0 ||
      settings.fat <= 0 ||
      settings.carbohydrates <= 0
    ) {
      setFormError('Nutritional values must be positive.');
      return;
    }
    setFormError('');
    setLoading(true);
    setStoredPlan(null); // Clear old plan first
    toast.loading('Crafting your weekly plan...');
    try {
      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return date;
      });
      const newPlan = await Promise.all(weekDates.map((date) => generateDayPlan(date)));
      setStoredPlan(newPlan);
      toast.dismiss();
      toast.success('Your weekly diet plan is ready!');
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error('Oh no! Something went wrong while generating the plan.');
    } finally {
      setLoading(false);
    }
  };

  // If the user doesn't like a day's plan, they can regenerate just that day.
  const handleRegenerateDay = async (dayIndex: number) => {
    if (!generatedPlan) return;
    const dateToRegenerate = generatedPlan[dayIndex].date as Date;
    toast.loading(
      `Rethinking the plan for ${dateToRegenerate.toLocaleDateString('en-US', {
        weekday: 'long',
      })}...`
    );
    try {
      const regeneratedDay = await generateDayPlan(dateToRegenerate);
      setStoredPlan((plan) => {
        const updatedPlan = [...(plan || [])];
        updatedPlan[dayIndex] = regeneratedDay;
        return updatedPlan;
      });
      toast.dismiss();
      toast.success(
        `Got a fresh plan for ${dateToRegenerate.toLocaleDateString('en-US', {
          weekday: 'long',
        })}!`
      );
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error('Oops, could not regenerate that day.');
    }
  };

  // --- UPDATED ---: Lets the user jump between weeks without auto-generating.
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate((dateString) => {
      const newDate = new Date(dateString);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate.toISOString();
    });
    // setStoredPlan(null); // No longer clearing the plan here
  };

  // --- NEW ---: Saves the currently displayed plan to the saved plans list
  const handleSavePlan = () => {
    if (!storedPlan) {
      toast.error('No plan to save. Please generate a plan first.');
      return;
    }
    setSavedPlans({ ...savedPlans, [currentDate]: storedPlan });
    toast.success(
      `Plan for week of ${currentDateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} saved!`
    );
  };

  // Before the component is mounted in the browser, we show a spinner to avoid hydration errors.
  if (!isMounted) {
    return (
      <Pane
        display='flex'
        alignItems='center'
        justifyContent='center'
        height='100vh'
        background={theme.colors.green100}
      >
        <Spinner />
      </Pane>
    );
  }

  // We define our two main layout sections here to keep the return statement clean.
  const SettingsPanel = (
    <Pane position={isMobile ? 'relative' : 'sticky'} top={isMobile ? 0 : majorScale(4)}>
      <Card
        is='form'
        borderRadius={16}
        padding={majorScale(3)}
        backgroundColor='white'
        boxShadow='0px 10px 15px -3px rgba(0,0,0,0.07), 0px 4px 6px -2px rgba(0,0,0,0.05)'
        onSubmit={(e) => {
          e.preventDefault();
          handleGeneratePlan(currentDateObj);
        }}
      >
        <Heading
          size={700}
          marginBottom={majorScale(2)}
          display='flex'
          alignItems='center'
          color='#1E293B'
        >
          <CogIcon marginRight={minorScale(2)} /> Plan Settings
        </Heading>
        <Tablist marginBottom={majorScale(3)}>
          {['Goals', 'Preferences'].map((tab, index) => (
            <Tab
              key={tab}
              isSelected={settingsTabIndex === index}
              onSelect={() => setSettingsTabIndex(index)}
              appearance='primary'
            >
              {tab}
            </Tab>
          ))}
        </Tablist>
        <Pane display={settingsTabIndex === 0 ? 'block' : 'none'}>
          <SelectField
            label='Diet Presets'
            description='Start with a preset or customize your own.'
            value={settings.preset}
            onChange={(e) => handleSettingsChange('preset', e.target.value)}
            marginBottom={majorScale(2)}
          >
            <option value='balanced'>Balanced Diet</option>
            <option value='high-protein'>High Protein</option>
            <option value='low-carb'>Low Carb</option>
            <option value='custom'>Custom</option>
          </SelectField>
        </Pane>
        <Pane display={settingsTabIndex === 1 ? 'block' : 'none'}>
          <SelectField
            label='Preferred Dining Hall'
            value={settings.preferredHall}
            onChange={(e) => handleSettingsChange('preferredHall', e.target.value)}
          >
            {Object.keys(DINING_HALLS).map((hallName) => (
              <option key={hallName} value={hallName}>
                {hallName}
              </option>
            ))}
          </SelectField>
          <Pane
            borderTop={`1px solid ${theme.colors.gray300}`}
            marginTop={majorScale(3)}
            paddingTop={majorScale(3)}
          >
            <Heading size={400} marginBottom={majorScale(2)}>
              Avoid Allergens
            </Heading>
            <Pane display='grid' gridTemplateColumns='1fr 1fr' gap={majorScale(1)}>
              {ALLERGENS_LIST.map((allergen) => (
                <Checkbox
                  key={allergen}
                  label={allergen}
                  checked={settings.allergens.includes(allergen)}
                  onChange={() => handleAllergenToggle(allergen)}
                />
              ))}
            </Pane>
          </Pane>
        </Pane>
        <Pane borderTop={`1px solid ${theme.colors.gray300}`} paddingTop={majorScale(2)}>
          {settings.preset === 'custom' ? (
            <Alert intent='info' title="You're in control!" marginBottom={majorScale(2)}>
              Adjust your daily targets below. Your plan will be tailored to these numbers.
            </Alert>
          ) : (
            <Alert
              intent='none'
              title={`Using the "${settings.preset}" preset`}
              marginBottom={majorScale(2)}
            >
              To set your own targets, choose the "Custom" preset above.
            </Alert>
          )}

          <TextInputField
            label='Daily Calories (kcal)'
            type='number'
            value={settings.calories}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleSettingsChange('calories', parseInt(e.target.value, 10) || 0)
            }
            disabled={settings.preset !== 'custom'}
            min={0}
            marginBottom={majorScale(2)}
          />
          <Pane display='grid' gridTemplateColumns='1fr 1fr 1fr' gap={majorScale(2)}>
            <TextInputField
              label='Protein (g)'
              type='number'
              value={settings.protein}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleSettingsChange('protein', parseInt(e.target.value, 10) || 0)
              }
              min={0}
              disabled={settings.preset !== 'custom'}
              marginBottom={majorScale(1)}
            />
            <TextInputField
              label='Fat (g)'
              type='number'
              value={settings.fat}
              min={0}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleSettingsChange('fat', parseInt(e.target.value, 10) || 0)
              }
              disabled={settings.preset !== 'custom'}
              marginBottom={majorScale(1)}
            />
            <TextInputField
              label='Carbs (g)'
              type='number'
              value={settings.carbohydrates}
              min={0}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleSettingsChange('carbohydrates', parseInt(e.target.value, 10) || 0)
              }
              disabled={settings.preset !== 'custom'}
              marginBottom={majorScale(1)}
            />
          </Pane>
        </Pane>
        {formError && <Alert intent='danger' title={formError} />}
        <Button
          type='submit'
          appearance='primary'
          intent='success'
          width='100%'
          marginTop={majorScale(2)}
          height={majorScale(5)}
          disabled={loading}
          className='rounded-lg'
        >
          {loading ? <Spinner /> : 'Generate Plan'}
        </Button>
      </Card>
    </Pane>
  );

  const PlanPanel = (
    <Pane>
      <Pane
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        marginBottom={majorScale(3)}
      >
        <Pane display='flex' alignItems='center' gap={minorScale(2)}>
          <Heading size={700} display='flex' alignItems='center' color='#1E293B'>
            <CalendarIcon marginRight={minorScale(2)} /> Your Weekly Plan
          </Heading>
          {/* --- NEW SAVE BUTTON --- */}
          {generatedPlan && !loading && (
            <IconButton
              icon={FloppyDiskIcon}
              appearance='minimal'
              title='Save this plan'
              onClick={handleSavePlan}
              background={'white'}
            />
          )}
        </Pane>
        <Pane>
          <IconButton
            icon={ChevronLeftIcon}
            onClick={() => navigateWeek('prev')}
            disabled={loading}
            marginRight={minorScale(1)}
          />
          <IconButton
            icon={ChevronRightIcon}
            onClick={() => navigateWeek('next')}
            disabled={loading}
          />
        </Pane>
      </Pane>
      {/* --- NEW LOADING SKELETON --- */}
      {loading ? (
        <Pane>
          <SkeletonWeeklySummary theme={theme} />
          <Pane display='grid' gridTemplateColumns='1fr' gap={majorScale(3)}>
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonDayPlanCard key={i} theme={theme} />
            ))}
          </Pane>
        </Pane>
      ) : !generatedPlan ? (
        <Card
          background='white'
          borderRadius={12}
          padding={majorScale(5)}
          display='flex'
          justifyContent='center'
          alignItems='center'
          flexDirection='column'
          minHeight={majorScale(57)}
          boxShadow='0px 4px 12px rgba(0, 0, 0, 0.05)'
        >
          <Pane
            background={theme.colors.green200}
            padding={majorScale(2)}
            borderRadius='50%'
            display='inline-flex'
            marginBottom={majorScale(2)}
          >
            <RocketIcon color={theme.colors.green700} size={32} />
          </Pane>
          <Heading size={600} color='#1E293B'>
            Ready to Launch Your Plan?
          </Heading>
          <Text color='#64748b' marginTop={minorScale(2)} textAlign='center' maxWidth={400}>
            You are viewing the week of{' '}
            <Text fontWeight={600} color='#334155'>
              {currentDateObj.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            .
          </Text>
          <Text color='#64748b' marginTop={minorScale(1)} textAlign='center'>
            Configure your diet settings and click 'Generate Plan' to start.
          </Text>
        </Card>
      ) : (
        <>
          <WeeklySummary plan={generatedPlan} settings={settings} />
          <Pane display='grid' gridTemplateColumns='1fr' gap={majorScale(3)}>
            {generatedPlan.map((day, index) => (
              <DayPlanCard
                key={(day.date as Date).toISOString()}
                day={day}
                settings={settings}
                onRegenerate={() => handleRegenerateDay(index)}
              />
            ))}
          </Pane>
        </>
      )}
    </Pane>
  );

  return (
    <Pane
      padding={isMobile ? majorScale(2) : majorScale(4)}
      minHeight='100vh'
      background={theme.colors.green100}
    >
      {/* --- NEW PULSE ANIMATION --- */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              background-color: ${theme.colors.green100};
            }
            50% {
              background-color: ${theme.colors.green200};
            }
          }
          .pulse {
            animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>
      <Pane maxWidth={1400} marginX='auto' className='max-w-7xl'>
        {/* --- UPDATED HEADER --- */}
        <Pane
          marginBottom={majorScale(4)}
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          flexWrap='wrap'
          gap={majorScale(1)}
        >
          <Pane>
            <Heading
              is='h1'
              size={isMobile ? 800 : 900}
              fontWeight={900}
              color='#047857'
              textAlign={isMobile ? 'center' : 'left'}
            >
              DIET PLANNER
            </Heading>
            <Paragraph
              color='#475569'
              marginTop={minorScale(1)}
              size={500}
              textAlign={isMobile ? 'center' : 'left'}
            >
              Your personalized weekly meal plan, intelligently generated.
            </Paragraph>
          </Pane>
          {/* --- NEW SAVED PLANS MANAGER --- */}
          <SavedPlansManager
            savedPlans={savedPlans}
            setSavedPlans={setSavedPlans}
            setCurrentDate={setCurrentDate}
            setStoredPlan={setStoredPlan}
          />
        </Pane>

        {/* Here's our responsive layout magic! */}
        {isMobile ? (
          // On mobile, we use a simple flex column to stack the panels.
          <Pane display='flex' flexDirection='column' gap={majorScale(4)}>
            {SettingsPanel}
            {PlanPanel}
          </Pane>
        ) : (
          // On desktop, we use a grid for the classic sidebar layout.
          <Pane
            display='grid'
            gridTemplateColumns='320px 1fr'
            gap={majorScale(4)}
            alignItems='flex-start'
          >
            {SettingsPanel}
            {PlanPanel}
          </Pane>
        )}
      </Pane>
    </Pane>
  );
}
