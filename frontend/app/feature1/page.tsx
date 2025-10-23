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
} from 'evergreen-ui';
import HallMenuModal from '@/components/HallMenuModal';
import DiningLocations from '@/examples/locations';
import getDiningLocationsServerSide from '@/examples/locationsServerSide';
import { useGetMenu } from '@/hooks/use-endpoints';
import DiningHallCard from '@/components/DiningHallCard';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

interface RawVenue {
  name: string;
  menu: { menus?: Array<{ name: string; description: string; link: string }> };
}

interface UIMenuItem {
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
    background={theme.colors.green300}
    borderRadius={4}
    className='pulse'
    {...props}
  />
);

/**
 * Skeleton placeholder for the FilterSidebar.
 */
const SkeletonFilterSidebar: React.FC<{ theme: Theme }> = ({ theme }) => (
  <Pane
    width={240} // Assumed width for the sidebar
    padding={majorScale(3)}
    margin={majorScale(3)}
    background='white'
    borderRight={`1px solid ${theme.colors.green400}`}
    display='flex'
    flexDirection='column'
    gap={majorScale(4)}
    height='min-content' // Full height minus margins
    borderRadius={12}
  >
    <SkeletonBlock width='100%' height={36} theme={theme} borderRadius={8} />
    <Pane>
      <SkeletonBlock width='60%' height={20} theme={theme} marginBottom={majorScale(2)} />
      <Pane display='flex' flexDirection='column' gap={majorScale(1)}>
        <SkeletonBlock width='100%' height={16} theme={theme} />
        <SkeletonBlock width='100%' height={16} theme={theme} />
        <SkeletonBlock width='100%' height={16} theme={theme} />
        <SkeletonBlock width='100%' height={16} theme={theme} />
      </Pane>
    </Pane>
    <Pane>
      <SkeletonBlock width='50%' height={20} theme={theme} marginBottom={majorScale(2)} />
      <Pane display='flex' flexDirection='column' gap={majorScale(1)}>
        <SkeletonBlock width='100%' height={16} theme={theme} />
        <SkeletonBlock width='100%' height={16} theme={theme} />
        <SkeletonBlock width='100%' height={16} theme={theme} />
      </Pane>
    </Pane>
  </Pane>
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

/**
 * Skeleton placeholder for the right AllergenSidebar.
 */
const SkeletonAllergenSidebar: React.FC<{ theme: Theme }> = ({ theme }) => (
  <Pane flexDirection='column' width={200} padding={majorScale(3)} overflowY='auto'>
    <SkeletonBlock width='60%' height={24} theme={theme} marginBottom={majorScale(2)} />
    <Pane display='flex' flexDirection='column' gap={majorScale(2)}>
      {Array(8)
        .fill(0)
        .map((_, i) => (
          <Pane key={i} display='flex' alignItems='center' gap={minorScale(1)}>
            <SkeletonBlock width={28} height={28} borderRadius={14} theme={theme} />
            <SkeletonBlock width='100px' height={16} theme={theme} />
          </Pane>
        ))}
    </Pane>
  </Pane>
);

/**
 * The main loading skeleton component that mimics the entire page layout.
 */
const LoadingSkeleton: React.FC<{ theme: Theme }> = ({ theme }) => (
  <>
    <style>
      {`
        @keyframes pulse {
          0%, 100% {
            background-color: ${theme.colors.gray300};
          }
          50% {
            background-color: ${theme.colors.gray400};
          }
        }
        .pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}
    </style>
    <Pane
      display='flex'
      className='sm:h-[calc(100vh)] sm:flex-row flex-col'
      background={theme.colors.green300} // Use a base theme color for loading
    >
      {/* 1. Skeleton Filter Sidebar */}
      <SkeletonFilterSidebar theme={theme} />

      {/* 2. Skeleton Main View */}
      <Pane flex={1} className='overflow-x-hidden no-scrollbar px-4'>
        {/* Skeleton Header */}
        <Pane
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          marginY={majorScale(3)}
          className='flex-col sm:flex-row text-left'
        >
          <Pane width={240}>
            <SkeletonBlock width='70%' height={36} theme={theme} marginBottom={minorScale(1)} />
            <SkeletonBlock width='50%' height={20} theme={theme} />
          </Pane>

          {/* Skeleton Date + arrows */}
          <Pane display='flex' gap={minorScale(2)} className='flex-col flex justify-center my-4'>
            <Pane display='flex' alignItems='center' gap={minorScale(2)}>
              <SkeletonBlock width={28} height={28} borderRadius={999} theme={theme} />
              <SkeletonBlock width={224} height={28} theme={theme} />
              <SkeletonBlock width={28} height={28} borderRadius={999} theme={theme} />
            </Pane>

            {/* Skeleton Meal tabs */}
            <SkeletonBlock width='100%' height={30} borderRadius={999} theme={theme} />
          </Pane>

          {/* Spacer to match original layout's right header pane */}
          <Pane display='flex' flexDirection='column' gap={majorScale(2)} width={240} />
        </Pane>

        {/* Skeleton Grid of cards */}
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
      </Pane>

      {/* 3. Skeleton Allergen Sidebar */}
      <SkeletonAllergenSidebar theme={theme} />
      <Pane
        position='absolute'
        top={0}
        left={0}
        right={0}
        bottom={0}
        display='flex'
        alignItems='center'
        justifyContent='center'
        flexDirection='column'
        background='rgba(241, 248, 233, 0.6)' // green100 at 60% opacity
        zIndex={10}
      >
        <Spinner />
        <Text color={theme.colors.green700} style={{ fontWeight: 600, marginTop: majorScale(2) }}>
          Fetching menus...
        </Text>
      </Pane>
    </Pane>
  </>
);

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
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [meal, setMeal] = useState<MealType>('Breakfast');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNutrition, setShowNutrition] = useState(true);
  const FRONTEND_URL = process.env.HOAGIE_URL;
  const PAGE_BG = backgroundByMeal[meal];

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
  }

  // ─── Filters ─────────────────────────────────────────────────────────────
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
  const DIETARY = ['Vegetarian', 'Vegan', 'Halal', 'Kosher'];
  const ALLERGENS = [
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

  // what actually drives filtering
  const [appliedHalls, setAppliedHalls] = useState<string[]>(initialHalls);
  const [appliedDietary, setAppliedDietary] = useState<string[]>([...DIETARY]);
  const [appliedAllergens, setAppliedAllergens] = useState<string[]>([...ALLERGENS]);
  const [nutritionKey, setNutritionKey] = useState<'calories' | 'protein'>('calories');

  // temporary UI selections
  const [tempHalls, setTempHalls] = useState<string[]>(initialHalls);
  const [tempDietary, setTempDietary] = useState<string[]>([...DIETARY]);
  const [tempAllergens, setTempAllergens] = useState<string[]>([...ALLERGENS]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [modalHall, setModalHall] = useState<UIVenue | null>(null);

  const toggle = (
    val: string,
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  // reset only the temp selections
  const resetTemp = () => {
    setTempHalls([...halls]);
    setTempDietary([...DIETARY]);
    setTempAllergens([...ALLERGENS]);
  };

  // ─── Load & Transform Data ───────────────────────────────────────────────
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [venues, setVenues] = useState<UIVenue[]>([]);

  useEffect(() => {
    setLoading(true);
    const menuId = formatMenuId(selectedDate, meal);

    fetch(`http://localhost:8000/api/dining/locations/with-menus/?menu_id=${menuId}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data: { locations: { location: RawVenue[] } }) => {
        console.log(data);
        const ui = data.locations.location.map((raw) => {
          const items = (raw.menu.menus || []).map((x) => ({
            name: x.name,
            description: x.description,
            link: x.link,
          }));
          console.log(items);
          return {
            name: raw.name,
            items: categorize(items),
            allergens: extractAllergens(items),
            calories: Object.fromEntries(
              items.map((i) => [i.name, 100 + Math.floor(Math.random() * 200)])
            ),
            protein: Object.fromEntries(
              items.map((i) => [i.name, 5 + Math.floor(Math.random() * 15)])
            ),
          } as UIVenue;
        });
        setVenues(ui);
      })
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [selectedDate, meal]);

  useEffect(() => {
    // Fetch dining locations
    fetch('/dining/locations')
      .then((response) => response.json())
      .then((data) => {
        const classifiedVenues = data.map((venue: { name: string }) => ({
          name: venue.name,
          category: classifyVenue(venue.name),
        }));
        // Note: This setVenues call might conflict with the one in the other useEffect.
        // You might want to merge this logic or ensure it doesn't overwrite menu data.
        // For now, I'll assume the menu-based fetch is the primary one.
        // setVenues(classifiedVenues); // Commenting out to avoid race condition
        console.log(classifiedVenues);
      })
      .catch((error) => console.error('Error fetching venues:', error));
  }, []);

  // ─── Prepare Display ─────────────────────────────────────────────────────
  const displayData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // Have they narrowed by diet or allergen?
    const isDietFilterActive = appliedDietary.length < DIETARY.length;
    const isAllergenFilterActive = appliedAllergens.length < ALLERGENS.length;

    // Only apply text‐search if there actually is a non‐empty term
    const isSearchActive = term !== '';

    // If _no_ dietary/allergen/search filters, return every applied hall, unfiltered:
    if (!isDietFilterActive && !isAllergenFilterActive && !isSearchActive) {
      return appliedHalls
        .map((h) => venues.find((v) => v.name === h))
        .filter((v): v is UIVenue => !!v);
    }

    // Otherwise, filter each hall’s dishes
    return appliedHalls
      .map((hallName) => {
        const venue = venues.find((v) => v.name === hallName);
        if (!venue) return null;

        // New items object where we'll push matching dishes
        const items: UIVenue['items'] = {
          'Main Entrée': [],
          'Vegetarian + Vegan Entrée': [],
          Soups: [],
        };
        let hasAny = false;

        for (const cat of Object.keys(venue.items) as (keyof typeof venue.items)[]) {
          items[cat] = venue.items[cat].filter((dish) => {
            const text = (dish.name + ' ' + dish.description).toLowerCase();

            // 1) dietary filter
            if (isDietFilterActive) {
              if (!appliedDietary.includes('Vegetarian') && text.includes('vegetarian')) {
                return false;
              }
              if (!appliedDietary.includes('Vegan') && text.includes('vegan')) {
                return false;
              }
              // Note: Halal/Kosher logic would need to be added if descriptions contain it
            }

            // 2) allergen filter
            if (isAllergenFilterActive) {
              for (const a of ALLERGENS) {
                if (!appliedAllergens.includes(a) && text.includes(a.toLowerCase())) {
                  return false;
                }
              }
            }

            // 3) text search filter
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
      .filter((v): v is UIVenue => v !== null);
  }, [venues, appliedHalls, appliedDietary, appliedAllergens, searchTerm, DIETARY, ALLERGENS]);

  // const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // UPDATED LOADING STATE
  if (loading) {
    return <LoadingSkeleton theme={theme} />;
  }

  return (
    <Pane display='flex' className='sm:h-[calc(100vh)] sm:flex-row flex-col' background={PAGE_BG}>
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
        }}
      />

      {/* ─── MAIN VIEW ──────────────────────────────────────────────────────── */}
      <Pane flex={1} className='overflow-x-hidden no-scrollbar px-4'>
        {/* Header */}
        <Pane
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          marginY={majorScale(3)}
          className='flex-col sm:flex-row text-left'
        >
          <Pane width={240}>
            <Heading className='text-4xl' color={theme.colors.green700} fontWeight={900}>
              {meal.toUpperCase()}
            </Heading>
            <Text className='text-xl' color={theme.colors.green600} fontWeight={600}>
              {MEAL_RANGES[meal]}
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
                {selectedDate.toLocaleDateString('en-US', {
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
              // width={240}
              border={`1px solid ${theme.colors.green700}`}
              borderRadius={999}
              background={theme.colors.green25}
              overflow='hidden'
            >
              {(['Breakfast', 'Lunch', 'Dinner'] as MealType[]).map((m) => (
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
                  {m}
                </Pane>
              ))}
            </Pane>
          </Pane>

          {/* Meal tabs + nutrition */}
          <Pane display='flex' flexDirection='column' gap={majorScale(2)} width={240}>
            {/* This pane seems to be a spacer in the original layout, 
                but I've adjusted the skeleton to match the 240 width.
                The original layout had commented-out code here.
                I'll leave this spacer pane to maintain the 3-column header alignment. */}
          </Pane>
        </Pane>

        {/* Grid of cards */}
        {displayData.length === 0 ? (
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='center'
            paddingY={majorScale(8)}
            flexDirection='column'
            width='100%'
          >
            <Text size={500} color='muted' fontStyle='italic'>
              Nothing found. Try adjusting your filters or search.
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
              />
            ))}
          </Pane>
        )}
      </Pane>

      {/* ─── RIGHT SIDEBAR (desktop only) ─────────────────────────────────── */}
      <Pane
        // display={['none', 'flex']} // This was commented out in original
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
          {ALLERGENS.map((a) => (
            <Pane key={a} display='flex' alignItems='center'>
              <Pane
                width={28}
                height={28}
                display='inline-flex'
                alignItems='center'
                justifyContent='center'
                borderRadius={14}
                background={theme.colors.green300}
                border={`1px solid ${theme.colors.green700}`}
                marginRight={minorScale(1)}
              >
                <Text size={200}>{ALLERGEN_EMOJI[a.toLowerCase()]}</Text>
              </Pane>
              <Text size={400} color={theme.colors.green900}>
                {a}
              </Text>
            </Pane>
          ))}
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
