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

import { useState, useEffect, ChangeEvent, useMemo } from 'react'; // IMPORT useCallback
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
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon,
  ChartIcon,
  CogIcon,
  CalendarIcon,
  RocketIcon,
  useTheme,
  FloppyDiskIcon,
} from 'evergreen-ui';
import { toast } from 'sonner';
import NutrientProgressBar from '@/app/goals/components/nutrient-progress-bar';
import { Nutrients, PlanSettings, WeeklyPlan, DailyPlan } from './types';
import { Meal } from '@/types/dining';
import MicronutrientPopover from '@/app/goals/components/micronutrient-popover';
import { SkeletonWeeklySummary, SkeletonDayPlanCard } from '@/app/goals/components/skeletons';
import SavedPlansManager from '@/app/goals/components/saved-plans-manager';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useMediaQuery } from '@/hooks/use-media-query';
import { DEFAULT_NUTRIENTS, DIET_PRESETS } from './data';
import { DINING_HALLS, ALLERGENS } from '@/data';
import { DiningHall } from '@/types/dining';
import { generateDayPlan, handleGeneratePlan } from './actions';
import { MenuItem, MenusForDateMealAndLocations } from '@/types/dining';

const MENU_CACHE_KEY = 'menuCache';

/**
 * Helper to convert string/number to number.
 */
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Converts MenuItem to Nutrients for display purposes.
 */
const menuItemToNutrients = (item: MenuItem): Nutrients => {
  return {
    calories: toNumber(item.calories),
    protein: toNumber(item.protein),
    fat: toNumber(item.totalFat),
    carbohydrates: toNumber(item.totalCarbohydrates),
    fiber: toNumber(item.dietaryFiber),
    sugar: toNumber(item.sugars),
    sodium: toNumber(item.sodium),
    cholesterol: toNumber(item.cholesterol),
    calcium: toNumber(item.calcium),
    iron: toNumber(item.iron),
    potassium: toNumber(item.potassium),
    vitaminD: toNumber(item.vitaminD),
    vitaminA: 0, // Not available in MenuItem
    vitaminC: 0, // Not available in MenuItem
    magnesium: 0, // Not available in MenuItem
    zinc: 0, // Not available in MenuItem
  };
};

// --- UI COMPONENTS ---
// These are the reusable building blocks for our UI, like progress bars and popovers.

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
  const date = useMemo(() => new Date(day.date), [day.date]);
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday

  // Set the order of meals to display
  const MEALS_ORDER: Meal[] = isWeekend
    ? ['Lunch', 'Dinner'] // On weekends, only show Lunch (as Brunch) and Dinner
    : ['Breakfast', 'Lunch', 'Dinner']; // On weekdays, show all three

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
        {MEALS_ORDER.map((mealType) => {
          // On weekends, if the mealType is 'Lunch', display 'Brunch'
          const mealTitle = isWeekend && mealType === 'Lunch' ? 'Brunch' : mealType;

          return (
            <Pane
              key={mealType}
              border='1px solid #E2E8F0'
              borderRadius={8}
              padding={majorScale(2)}
              display='flex'
              flexDirection='column'
            >
              <Heading size={500} marginBottom={majorScale(2)} color='#334155'>
                {mealTitle} {/* <-- Use the dynamic mealTitle */}
              </Heading>
              {day.meals[mealType]?.length > 0 ? (
                <Pane display='flex' flexDirection='column' gap={majorScale(2)}>
                  {day.meals[mealType].map((item, index) => {
                    const nutrition = menuItemToNutrients(item);
                    const venueName = day.venueMap[item.apiId.toString()];
                    return (
                      <Pane key={`${item.apiId}-${index}`}>
                        <Link
                          href={`/nutrition?apiId=${item.apiId}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          size={400}
                          color='neutral'
                          fontWeight={600}
                        >
                          {item.name}
                        </Link>
                        <Text display='block' size={300} color='#64748B' marginTop={minorScale(1)}>
                          at {venueName || 'Unknown Hall'}{' '}
                        </Text>
                        <Pane
                          display='flex'
                          gap={minorScale(1)}
                          marginTop={majorScale(1)}
                          flexWrap='wrap'
                          alignItems='center'
                        >
                          <Badge color='neutral'>{`${Math.round(nutrition.calories)} cal`}</Badge>
                          <Badge color='teal'>{`${Math.round(nutrition.protein)}g P`}</Badge>
                          <Badge color='orange'>{`${Math.round(nutrition.fat)}g F`}</Badge>
                          <Badge color='red'>{`${Math.round(nutrition.carbohydrates)}g C`}</Badge>
                          <MicronutrientPopover nutrition={nutrition} />
                        </Pane>
                      </Pane>
                    );
                  })}
                </Pane>
              ) : (
                <Text color='#64748B' className='h-full w-full flex items-center justify-center'>
                  No suitable meal found.
                </Text>
              )}
            </Pane>
          );
        })}
      </Pane>
    </Card>
  );
};

// --- DIET PLANNER COMPONENT ---
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

  const [settings, setSettings] = useLocalStorage<PlanSettings>({
    key: 'dietPlannerSettings',
    initialValue: defaultSettings,
  });

  // We also remember the last generated plan.
  const [storedPlan, setStoredPlan] = useLocalStorage<WeeklyPlan | null>({
    key: 'dietPlannerPlan',
    initialValue: null,
  });

  // State for multiple saved plans
  const [savedPlans, setSavedPlans] = useLocalStorage<Record<string, WeeklyPlan>>({
    key: 'dietPlannerSavedPlans',
    initialValue: {},
  });

  // Menu cache for fetching menu data
  const [menuCache, setMenuCache] = useLocalStorage<MenusForDateMealAndLocations>({
    key: MENU_CACHE_KEY,
    initialValue: {},
  });

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
  const [currentDate, setCurrentDate] = useLocalStorage<string>({
    key: 'dietPlannerCurrentDate',
    initialValue: getStartOfWeek(),
  });

  // When we load the plan from localStorage, the dates are just strings.
  // This brings them back to life as real Date objects that we can work with.
  const generatedPlan = useMemo(() => {
    if (!storedPlan) return null;
    return storedPlan.map((day) => ({
      ...day,
      date: new Date(day.date),
    }));
  }, [storedPlan]);

  const currentDateObj = useMemo(() => new Date(currentDate as string), [currentDate]);

  // Automatically load a saved plan if one exists for the current week
  useEffect(() => {
    if (savedPlans[currentDate as string]) {
      setStoredPlan(savedPlans[currentDate as string]);
    } else {
      setStoredPlan(null);
    }
    // We only want this to run when the date changes or the *entire* savedPlans object changes.
    // The stable `setStoredPlan` function is passed, which is now correct.
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
      const regeneratedDay = await generateDayPlan(
        dateToRegenerate,
        settings,
        menuCache,
        setMenuCache
      );
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

  // Lets the user jump between weeks without auto-generating.
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate((dateString) => {
      const newDate = new Date(dateString);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate.toISOString();
    });
    // The useEffect hook will automatically handle loading the new plan or setting it to null
  };

  // Saves the currently displayed plan to the saved plans list
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
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          handleGeneratePlan(
            currentDateObj,
            settings,
            setFormError,
            setLoading,
            setStoredPlan,
            menuCache,
            setMenuCache
          );
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
            onChange={(e) =>
              handleSettingsChange(
                'preferredHall',
                e.target.value as DiningHall | 'Any Available Hall'
              )
            }
          >
            <option value='Any Available Hall'>Any Available Hall</option>
            {DINING_HALLS.map((hallName) => (
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
            <Heading size={400}>Avoid Allergens</Heading>
            <Pane display='grid' className='grid-cols-2 gap-1'>
              {ALLERGENS.map((allergen) => (
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
          {loading ? <Spinner size={16} /> : 'Generate Plan'}
        </Button>
      </Card>
    </Pane>
  );

  const PlanPanel = (
    <Pane>
      <Pane
        marginBottom={majorScale(4)}
        display='flex'
        justifyContent={isMobile ? 'center' : 'space-between'}
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
            size={isMobile ? 400 : 500}
            textAlign={isMobile ? 'center' : 'left'}
          >
            Your personalized weekly meal plan, intelligently generated.
          </Paragraph>
        </Pane>
        <SavedPlansManager
          savedPlans={savedPlans}
          setSavedPlans={setSavedPlans}
          setCurrentDate={setCurrentDate}
          setStoredPlan={setStoredPlan}
        />
      </Pane>
      <Card
        background='white'
        borderRadius={12}
        padding={majorScale(3)}
        marginBottom={majorScale(3)}
        boxShadow='0px 4px 12px rgba(0, 0, 0, 0.05)'
        className='flex'
      >
        <Pane display='flex' alignItems='center' gap={minorScale(2)}>
          <Heading
            size={700}
            display='flex'
            alignItems='center'
            color='#1E293B'
            className='sm:flex hidden'
          >
            <CalendarIcon marginRight={minorScale(2)} />
            Plan for{' '}
            {currentDateObj.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
            })}
            —
            {new Date(currentDateObj.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(
              'en-US',
              {
                month: 'long',
                day: 'numeric',
              }
            )}
          </Heading>
          <Heading
            size={isMobile ? 600 : 700}
            display='flex'
            alignItems='center'
            color='#1E293B'
            className='sm:hidden flex'
          >
            <CalendarIcon marginRight={minorScale(2)} />
            Your Plan
          </Heading>

          {/* --- SAVE BUTTON --- */}
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
        <Pane className='ml-auto'>
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
      </Card>
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
      <Pane>
        {/* Here's our responsive layout magic! */}
        {isMobile ? (
          // On mobile, we use a simple flex column to stack the panels.
          <Pane display='flex' flexDirection='column' gap={majorScale(4)}>
            {PlanPanel}
            {SettingsPanel}
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
