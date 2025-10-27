'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { request } from '@/lib/http';
import { useUser } from '@auth0/nextjs-auth0/client';
import AuthButton from '@/lib/hoagie-ui/AuthButton';
import { classifyVenue, Venue } from '@/utils/places';
import type { VenueType, PlaceStatus } from '@/types/places';
import Link from 'next/link';
import FilterSidebar from '../../components/FilterSidebar';
import {
  Pane,
  Heading,
  Text,
  Checkbox,
  Button,
  Switch,
  majorScale,
  minorScale,
  useTheme,
  Spinner,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Theme,
  SearchIcon,
} from 'evergreen-ui';
import HallMenuModal from '@/components/HallMenuModal';
// import DiningLocations from '@/examples/locations';
// import getDiningLocationsServerSide from '@/examples/locationsServerSide';
// import { useGetMenu } from '@/hooks/use-endpoints';
import DiningHallCard from '@/components/DiningHallCard';
import { AllergenKey, DietKey } from '@/types/dining';
import { useUserProfile } from '@/hooks/use-user-profile';
import useLocalStorage from '@/hooks/useLocalStorage';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

// Interface for what the API provides
interface RawApiMenuItem {
  id: number;
  name: string;
  description: string;
  link: string;
  calories: number;
  protein: number;
}

interface RawVenue {
  name: string;
  menu: { menus?: RawApiMenuItem[] };
}

// Interface for what the UI components use
interface UIMenuItem {
  id: number;
  name: string;
  description: string;
  link: string;
}

interface UIVenue {
  name: string;
  items: Record<'Main Entrée' | 'Vegetarian + Vegan Entrée' | 'Soups', UIMenuItem[]>;
  allergens: Set<string>;
  calories: Record<string, number>;
  protein: Record<string, number>;
}

// ─── Debounce Hook ────────────────────────────────────────────────────────
/**
 * A hook to debounce a value.
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value or delay changes, or if the component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run the effect if value or delay changes

  return debouncedValue;
}

// ─── Constants ────────────────────────────────────────────────────────────

const MEAL_RANGES: Record<MealType, string> = {
  Breakfast: '7:30 AM – 10:30 AM',
  Lunch: '11:30 AM – 2:00 PM',
  Dinner: '5:00 PM – 8:00 PM',
};

const ALLERGEN_EMOJI: Record<string, string> = {
  peanut: '🥜',
  'tree nut': '🌰',
  egg: '🥚',
  milk: '🥛',
  wheat: '🌾',
  soybeans: '🌱',
  crustacean: '🦞',
  alcohol: '🍺',
  gluten: '🍞',
};

function categorize(items: UIMenuItem[]) {
  const out = {
    'Main Entrée': [] as UIMenuItem[],
    'Vegetarian + Vegan Entrée': [] as UIMenuItem[],
    Soups: [] as UIMenuItem[],
  };
  items.forEach((i) => {
    const nm = i.name.toLowerCase();
    const ds = i.description.toLowerCase();
    if (nm.includes('soup')) out.Soups.push(i);
    else if (ds.includes('vegan') || nm.includes('tofu') || nm.includes('vegetable'))
      out['Vegetarian + Vegan Entrée'].push(i);
    else out['Main Entrée'].push(i);
  });
  return out;
}

function extractAllergens(items: UIMenuItem[]) {
  const set = new Set<string>();
  items.forEach((i) => {
    const ds = i.description.toLowerCase();
    [
      'peanut',
      'tree nut',
      'egg',
      'milk',
      'wheat',
      'soybeans',
      'crustacean',
      'alcohol',
      'gluten',
    ].forEach((all) => ds.includes(all) && set.add(all));
  });
  return set;
}

// ─── Skeleton Loading Components ──────────────────────────────────────────
/**
 * A reusable skeleton block with a pulsing animation.
 */
const SkeletonBlock: React.FC<{
  width: string | number;
  height: string | number;
  theme: Theme;
  [key: string]: any;
}> = ({ width, height, theme, ...props }) => (
  <Pane
    width={width}
    height={height}
    background={theme.colors.gray300}
    borderRadius={4}
    className='animate-pulse'
    {...props}
  />
);

/**
 * Skeleton placeholder for a single DiningHallCard.
 */
const SkeletonDiningHallCard: React.FC<{ theme: Theme }> = ({ theme }) => (
  <Pane
    background='white'
    borderRadius={12}
    padding={majorScale(2)}
    border={`1px solid ${theme.colors.green300}`}
    display='flex'
    flexDirection='column'
    gap={majorScale(2)}
  >
    <SkeletonBlock width='70%' height={24} theme={theme} />
    <Pane display='flex' gap={minorScale(1)}>
      <SkeletonBlock width={24} height={24} borderRadius={999} theme={theme} />
      <SkeletonBlock width={24} height={24} borderRadius={999} theme={theme} />
      <SkeletonBlock width={24} height={24} borderRadius={999} theme={theme} />
    </Pane>

    <Pane>
      <SkeletonBlock width='50%' height={18} theme={theme} marginBottom={majorScale(1)} />
      <SkeletonBlock width='90%' height={14} theme={theme} marginBottom={minorScale(1)} />
      <SkeletonBlock width='80%' height={14} theme={theme} marginBottom={minorScale(1)} />
    </Pane>

    <Pane>
      <SkeletonBlock width='60%' height={18} theme={theme} marginBottom={majorScale(1)} />
      <SkeletonBlock width='85%' height={14} theme={theme} marginBottom={minorScale(1)} />
    </Pane>
  </Pane>
);

// ─── Defaults & Constants for LocalStorage ────────────────────────────────

const getDefaultDate = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

const defaultMeal: MealType = 'Breakfast';
const defaultDate = getDefaultDate();
// 2 hours in milliseconds
const PREF_EXPIRY_MS = 2 * 60 * 60 * 1000;
const PREFS_KEY = 'diningPrefs';
const FILTER_PREFS_KEY = 'diningFilterPrefs';
const PINNED_HALLS_KEY = 'diningPinnedHalls';

// ─── Main Page Component ──────────────────────────────────────────────────

export default function Index() {
  const theme = useTheme();
  const { user, error, isLoading } = useUser();

  const backgroundByMeal: Record<MealType, string> = {
    Breakfast: theme.colors.green100,
    Lunch: theme.colors.green200,
    Dinner: theme.colors.green400,
  };

  // ─── Date + Meal ─────────────────────────────────────────────────────────
  // Use the hook to store date (as string) and meal in one object
  const [prefs, setPrefs] = useLocalStorage(
    PREFS_KEY,
    { date: defaultDate.toISOString(), meal: defaultMeal },
    PREF_EXPIRY_MS
  );

  // Derive Date object and meal from the stored preferences
  const selectedDate = useMemo(() => new Date(prefs.date), [prefs.date]);
  const meal = prefs.meal;

  // Create setters that update the object in localStorage
  const setSelectedDate = (value: Date | ((val: Date) => Date)) => {
    const newDate = value instanceof Function ? value(selectedDate) : value;
    setPrefs((prev) => ({ ...prev, date: newDate.toISOString() }));
  };

  const setMeal = (value: MealType | ((val: MealType) => MealType)) => {
    const newMeal = value instanceof Function ? value(meal) : value;
    setPrefs((prev) => ({ ...prev, meal: newMeal }));
  };

  // ─── Filters (Not from DB) ──────────────────────────────────────────────
  // Use the hook for searchTerm and showNutrition
  const [searchTerm, setSearchTerm] = useLocalStorage('diningSearchTerm', '');
  const [showNutrition, setShowNutrition] = useLocalStorage('diningShowNutrition', true);

  const FRONTEND_URL = process.env.HOAGIE_URL;
  const PAGE_BG = backgroundByMeal[meal];

  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday

  const availableMeals: MealType[] = isWeekend
    ? ['Lunch', 'Dinner']
    : ['Breakfast', 'Lunch', 'Dinner'];

  const prevDay = () =>
    setSelectedDate((d) => {
      const t = new Date(d);
      t.setDate(t.getDate() - 1);
      return t;
    });
  const nextDay = () =>
    setSelectedDate((d) => {
      const t = new Date(d);
      t.setDate(t.getDate() + 1);
      return t;
    });

  function formatMenuId(date: Date, meal: MealType): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}-${meal}`;
  } // ─── Filters (From DB) ────────────────────────────────────────────────

  const initialHalls = [
    'Forbes College',
    'Mathey College',
    'Rockefeller College',
    'Whitman & Butler Colleges',
    'Yeh College & New College West',
    'Center for Jewish Life',
    'Graduate College',
  ];
  const [halls] = useState<string[]>(initialHalls);
  const DIETARY: DietKey[] = ['Vegetarian', 'Vegan', 'Halal', 'Kosher'];
  const ALLERGENS: AllergenKey[] = [
    'Peanut',
    'Tree nut',
    'Egg',
    'Milk',
    'Wheat',
    'Soybeans',
    'Crustacean',
    'Alcohol',
    'Gluten',
  ];

  const [appliedHalls, setAppliedHalls] = useState<string[]>(initialHalls);
  const [appliedDietary, setAppliedDietary] = useState<string[]>([...DIETARY]);
  const [appliedAllergens, setAppliedAllergens] = useState<string[]>([...ALLERGENS]);
  const [nutritionKey, setNutritionKey] = useState<'calories' | 'protein'>('calories');

  // temporary UI selections
  const [tempHalls, setTempHalls] = useState<string[]>([...initialHalls]);
  const [tempDietary, setTempDietary] = useState<DietKey[]>([...DIETARY]);
  const [tempAllergens, setTempAllergens] = useState<AllergenKey[]>([...ALLERGENS]);

  // *** NEW STATE ***
  // This flag tracks if the user's profile settings have been processed
  const [profileLoaded, setProfileLoaded] = useState(false);

  const { dietaryRestrictions, allergens, diningHalls } = useUserProfile();

  useEffect(() => {
    if (dietaryRestrictions.length > 0) {
      setAppliedDietary(dietaryRestrictions);
      setTempDietary(dietaryRestrictions);
    }
    if (allergens.length > 0) {
      setAppliedAllergens(allergens);
      setTempAllergens(allergens);
    }
    if (diningHalls.length > 0) {
      setAppliedHalls(diningHalls);
      setTempHalls(diningHalls);
    }
    // Mark the profile as loaded so the menu fetch can proceed
    setProfileLoaded(true);
  }, [dietaryRestrictions, allergens, diningHalls]);

  const [filterOpen, setFilterOpen] = useState(true);
  const [modalHall, setModalHall] = useState<UIVenue | null>(null);

  const toggle = <T,>(val: T, arr: T[], setter: React.Dispatch<React.SetStateAction<T[]>>) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const toggleQuickAllergen = (allergen: string) => {
    toggle(allergen, appliedAllergens, setAppliedAllergens);
    toggle(allergen, tempAllergens, setTempAllergens);
  };

  const resetTemp = () => {
    setTempHalls([...halls]);
    setTempDietary([...DIETARY]);
    setTempAllergens([...ALLERGENS]);
  };

  // ─── Load & Transform Data ───────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<UIVenue[]>([]);

  useEffect(() => {
    if (isWeekend && meal === 'Breakfast') {
      setMeal('Lunch');
    }
  }, [isWeekend, meal]); // Dependency simplified

  useEffect(() => {
    // Fetch dining locations
    fetch('http://localhost:8000/api/dining/locations')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const classifiedVenues = data.map((venue: { name: string }) => ({
          name: venue.name,
          category: classifyVenue(venue.name),
        }));
      })
      .catch((error) => console.error('Error fetching BASE venues (/dining/locations):', error));
  }, []);

  // ─── Pinned Halls (using useLocalStorage) ───────────────────────────────
  // Store pinned halls as a string array in localStorage
  const [pinnedArray, setPinnedArray] = useLocalStorage<string[]>(PINNED_HALLS_KEY, []);

  // Derive the Set from the array for efficient lookups
  const pinnedHalls = useMemo(() => new Set(pinnedArray), [pinnedArray]);

  // Create a setter that matches the React.Dispatch type
  const setPinnedHalls: React.Dispatch<React.SetStateAction<Set<string>>> = (value) => {
    setPinnedArray((prevArray) => {
      const prevSet = new Set(prevArray);
      const newSet = value instanceof Function ? value(prevSet) : value;
      return Array.from(newSet); // Store the new array
    });
  };

  // This function works as-is with the new setPinnedHalls wrapper
  const togglePin = (hallName: string) => {
    setPinnedHalls((prevPins) => {
      const newPins = new Set(prevPins); // Create a new set to ensure state update
      if (newPins.has(hallName)) {
        newPins.delete(hallName);
      } else {
        newPins.add(hallName);
      }
      return newPins;
    });
  };

  // ─── Data Fetching for Menus ────────────────────────────────────────────
  // Create debounced versions of the date and meal
  const debouncedDate = useDebounce(selectedDate, 1000); // 1 second delay
  const debouncedMeal = useDebounce(meal, 1000); // 1 second delay

  useEffect(() => {
    // Only run this fetch if the user's profile has been loaded
    if (!profileLoaded) return;

    setLoading(true);
    // ** Use the debounced values to format the menu ID **
    const menuId = formatMenuId(debouncedDate, debouncedMeal);

    fetch(`http://localhost:8000/api/dining/locations/with-menus/?menu_id=${menuId}`, {
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error fetching menu! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: { locations: { location: RawVenue[] } }) => {
        const ui = data.locations.location.map((raw) => {
          const items = (raw.menu.menus || []).map((x) => ({
            id: x.id,
            name: x.name,
            description: x.description,
            link: x.link,
            calories: x.calories,
            protein: x.protein,
          }));
          const uiItems: UIMenuItem[] = items.map((x) => ({
            id: x.id,
            name: x.name,
            description: x.description,
            link: x.link,
          }));
          return {
            name: raw.name,
            items: categorize(uiItems),
            allergens: extractAllergens(uiItems),
            calories: Object.fromEntries(items.map((i) => [i.name, i.calories || 0])),
            protein: Object.fromEntries(items.map((i) => [i.name, i.protein || 0])),
          } as UIVenue;
        });
        setVenues(ui);
      })
      .catch((error) => {
        console.error(`Error fetching menu data for ${menuId}:`, error);
        setVenues([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedDate, debouncedMeal, profileLoaded]); // ** Depend on the debounced values **

  // ─── Filtering Logic ────────────────────────────────────────────────────

  const displayData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const isDietFilterActive = appliedDietary.length < DIETARY.length;
    const isAllergenFilterActive = appliedAllergens.length < ALLERGENS.length;
    const isSearchActive = term !== '';

    const sortFn = (a: UIVenue, b: UIVenue) => {
      const aIsPinned = pinnedHalls.has(a.name);
      const bIsPinned = pinnedHalls.has(b.name);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    };

    if (!isDietFilterActive && !isAllergenFilterActive && !isSearchActive) {
      return appliedHalls
        .map((h) => venues.find((v) => v.name === h))
        .filter((v): v is UIVenue => !!v)
        .sort(sortFn);
    }

    return appliedHalls
      .map((hallName) => {
        const venue = venues.find((v) => v.name === hallName);
        if (!venue) return null;

        const items: UIVenue['items'] = {
          'Main Entrée': [],
          'Vegetarian + Vegan Entrée': [],
          Soups: [],
        };
        let hasAny = false;

        for (const cat of Object.keys(venue.items) as (keyof typeof venue.items)[]) {
          items[cat] = venue.items[cat].filter((dish) => {
            const text = (dish.name + ' ' + dish.description).toLowerCase();

            if (isDietFilterActive) {
              if (!appliedDietary.includes('Vegetarian') && text.includes('vegetarian')) {
                return false;
              }
              if (!appliedDietary.includes('Vegan') && text.includes('vegan')) {
                return false;
              }
            }

            if (isAllergenFilterActive) {
              for (const a of ALLERGENS) {
                if (!appliedAllergens.includes(a) && text.includes(a.toLowerCase())) {
                  return false;
                }
              }
            }

            if (isSearchActive && !text.includes(term)) {
              return false;
            }

            hasAny = true;
            return true;
          });
        }

        if (!hasAny) return null;
        return { ...venue, items } as UIVenue;
      })
      .filter((v): v is UIVenue => v !== null)
      .sort(sortFn);
  }, [
    venues,
    appliedHalls,
    appliedDietary,
    appliedAllergens,
    searchTerm,
    DIETARY,
    ALLERGENS,
    pinnedHalls, // Now a dependency
  ]);

  const getMealLabel = (m: MealType) => {
    if (isWeekend && m === 'Lunch') {
      return 'Brunch';
    }
    return m;
  };

  const getDisplayMealRange = (m: MealType) => {
    if (isWeekend && m === 'Lunch') {
      return '11:00 AM – 2:00 PM';
    }
    return MEAL_RANGES[m];
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Pane
      display='flex'
      className='sm:flex-row overflow-hidden min-h-screen flex-col'
      background={PAGE_BG}
    >
      {/* ─── FILTER SIDEBAR ───────────────────────────────────────────── */}

      <FilterSidebar
        initialHalls={initialHalls}
        tempHalls={tempHalls}
        toggleHall={(h) => toggle(h, tempHalls, setTempHalls)}
        DIETARY={DIETARY}
        tempDietary={tempDietary}
        toggleDietary={(d) => toggle(d, tempDietary, setTempDietary)}
        ALLERGENS={ALLERGENS}
        tempAllergens={tempAllergens}
        toggleAllergen={(a) => toggle(a, tempAllergens, setTempAllergens)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showNutrition={showNutrition}
        setShowNutrition={setShowNutrition}
        onReset={resetTemp}
        onApply={() => {
          setAppliedHalls(tempHalls);
          setAppliedDietary(tempDietary);
          setAppliedAllergens(tempAllergens);

          fetch('/api/user/update', {
            method: 'POST',
            body: JSON.stringify({
              dietary_restrictions: tempDietary,
              allergens: tempAllergens,
              dining_halls: tempHalls,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(data);
            })
            .catch((error) => console.error('Error updating dietary restrictions:', error));
        }}
      />
      {/* ─── MAIN VIEW ──────────────────────────────────────────────────────── */}
      <Pane flex={1} className='overflow-x-hidden h-full no-scrollbar px-4'>
        {/* Header */}
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

              <Text
                className='text-2xl text-center w-[14rem] truncate'
                color={theme.colors.green700}
              >
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

        {/* Grid of cards */}
        {loading ? (
          <Pane
            display='grid'
            overflowY='auto'
            paddingBottom={majorScale(6)}
            gridTemplateColumns='repeat(auto-fill,minmax(340px,1fr))'
            gap={majorScale(1)}
            className='h-full no-scrollbar'
          >
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <SkeletonDiningHallCard key={i} theme={theme} />
              ))}
          </Pane>
        ) : displayData.length === 0 ? (
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='center'
            paddingY={majorScale(8)}
            flexDirection='column'
            width='100%'
            background={theme.colors.gray100}
            borderRadius={12}
            border={`2px dashed ${theme.colors.green400}`}
            marginTop={majorScale(2)}
            className='h-full'
          >
            <SearchIcon color={theme.colors.gray600} size={32} marginBottom={majorScale(2)} />

            <Heading size={500} color={theme.colors.gray800} marginBottom={minorScale(1)}>
              No Dishes Found
            </Heading>
            <Text size={400} color='muted' textAlign='center'>
              Try adjusting your search terms or filters.
            </Text>
          </Pane>
        ) : (
          <Pane
            display='grid'
            overflowY='auto'
            paddingBottom={majorScale(6)}
            gridTemplateColumns='repeat(auto-fill,minmax(340px,1fr))'
            gap={majorScale(1)}
            className='h-full no-scrollbar'
          >
            {displayData.map((hall) => (
              <DiningHallCard
                key={hall.name}
                hall={hall}
                setModalHall={setModalHall}
                ALLERGEN_EMOJI={ALLERGEN_EMOJI}
                theme={theme}
                showNutrition={showNutrition}
                isPinned={pinnedHalls.has(hall.name)}
                onPinToggle={() => togglePin(hall.name)}
              />
            ))}
          </Pane>
        )}
      </Pane>
      {/* ─── RIGHT SIDEBAR (desktop only) ─────────────────────────────────── */}
      <Pane
        className='hidden sm:flex'
        flexDirection='column'
        width={200}
        padding={majorScale(3)}
        overflowY='auto'
        zIndex={2}
      >
        <Heading size={600} color={theme.colors.green900}>
          Allergens
        </Heading>

        <Pane marginTop={majorScale(2)} display='flex' flexDirection='column' gap={majorScale(2)}>
          {ALLERGENS.map((a) => {
            const isSelected = appliedAllergens.includes(a);
            return (
              <Pane
                key={a}
                display='flex'
                alignItems='center'
                cursor='pointer'
                onClick={() => toggleQuickAllergen(a)}
                opacity={isSelected ? 1.0 : 0.6}
                title={isSelected ? `Filtering out ${a}` : `Click to filter out ${a}`}
              >
                <Pane
                  width={28}
                  height={28}
                  display='inline-flex'
                  alignItems='center'
                  justifyContent='center'
                  borderRadius={14}
                  background={isSelected ? theme.colors.green300 : theme.colors.gray300}
                  marginRight={minorScale(1)}
                >
                  <Text size={200}>{ALLERGEN_EMOJI[a.toLowerCase()]}</Text>
                </Pane>

                <Text size={400} color={theme.colors.green900} fontWeight={isSelected ? 600 : 400}>
                  {a}
                </Text>
              </Pane>
            );
          })}
        </Pane>
      </Pane>

      {/* Modal */}

      <HallMenuModal
        isShown={!!modalHall}
        onClose={() => setModalHall(null)}
        hall={modalHall}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
      />
    </Pane>
  );
}
