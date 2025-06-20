// pages/index.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { request } from '@/lib/http';
import { useUser } from '@auth0/nextjs-auth0/client';
import AuthButton from '@/lib/hoagie-ui/AuthButton';
import { classifyVenue, Venue } from '@/utils/places';
import type { VenueType, PlaceStatus } from '@/types/places';
import Link from 'next/link';
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
} from 'evergreen-ui';
import Modal from '@/components/Modal';
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

  //     status: 'yes',
  //     busyness: 'High',
  //     currentMeal: 'Dinner',
  //     hours: '5:00 PM - 8:00 PM',
  //     popular: ['Wood-Fired Pizza', 'Mediterranean Bowl'],
  //     dietaryOptions: ['Vegetarian', 'Vegan', 'Halal'],
  //     category: 'residential',
  //   },
  //   {
  //     name: 'Cafe',
  //     status: 'yes',
  //     busyness: 'High',
  //     currentMeal: 'Dinner',
  //     hours: '5:00 PM - 8:00 PM',
  //     popular: ['Wood-Fired Pizza', 'Mediterranean Bowl'],
  //     dietaryOptions: ['Vegetarian', 'Vegan', 'Halal'],
  //     category: 'cafe',
  //   },
  //   {
  //     name: 'Specialty',
  //     status: 'yes',
  //     busyness: 'High',
  //     currentMeal: 'Dinner',
  //     hours: '5:00 PM - 8:00 PM',
  //     popular: ['Wood-Fired Pizza', 'Mediterranean Bowl'],
  //     dietaryOptions: ['Vegetarian', 'Vegan', 'Halal'],
  //     category: 'specialty',
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
  dairy: '🥛',
  wheat: '🌾',
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
    ['peanut', 'tree nut', 'egg', 'dairy', 'wheat'].forEach(
      (all) => ds.includes(all) && set.add(all)
    );
  });
  return set;
}

export default function Index() {
  const theme = useTheme();
  const { user, error, isLoading } = useUser();

  const backgroundByMeal: Record<MealType, string> = {
    Breakfast: theme.colors.green100,
    Lunch: theme.colors.green200,
    Dinner: theme.colors.green400,
  };

  // ─── Date + Meal ─────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date('2025-05-14'));
  const [meal, setMeal] = useState<MealType>('Breakfast');
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
  const DIETARY = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free'];
  const ALLERGENS = ['Peanut', 'Tree nut', 'Egg', 'Dairy', 'Wheat'];

  // what actually drives filtering
  const [appliedHalls, setAppliedHalls] = useState<string[]>(initialHalls);
  const [appliedDietary, setAppliedDietary] = useState<string[]>([...DIETARY]);
  const [appliedAllergens, setAppliedAllergens] = useState<string[]>([...ALLERGENS]);

  // temporary UI selections
  const [tempHalls, setTempHalls] = useState<string[]>(initialHalls);
  const [tempDietary, setTempDietary] = useState<string[]>([...DIETARY]);
  const [tempAllergens, setTempAllergens] = useState<string[]>([...ALLERGENS]);

  const [filterOpen, setFilterOpen] = useState(true);
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
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<UIVenue[]>([]);

  useEffect(() => {
    setLoading(true);
    const menuId = formatMenuId(selectedDate, meal);

    fetch(`http://localhost:8000/api/dining/menu/?location_id=5&menu_id=${menuId}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data: { locations: { location: RawVenue[] } }) => {
        const ui = data.locations.location.map((raw) => {
          const items = (raw.menu.menus || []).map((x) => ({
            name: x.name,
            description: x.description,
            link: x.link,
          }));
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
        setVenues(classifiedVenues);
        console.log(classifiedVenues);
      })
      .catch((error) => console.error('Error fetching venues:', error));
  }, []);

  // ─── Prepare Display ─────────────────────────────────────────────────────
  const displayData = useMemo(() => {
    return appliedHalls.map((name) => {
      const v = venues.find((v) => v.name === name);
      if (!v) {
        return {
          name,
          items: {
            'Main Entrée': [],
            'Vegetarian + Vegan Entrée': [],
            Soups: [],
          },
          allergens: new Set<string>(),
          calories: {},
          protein: {},
        } as UIVenue;
      }
      const items = {} as UIVenue['items'];
      (Object.keys(v.items) as (keyof typeof v.items)[]).forEach((cat) => {
        items[cat] = v.items[cat].filter((i) => {
          const ds = i.description.toLowerCase();
          if (!appliedDietary.includes('Vegetarian') && ds.includes('vegetarian')) return false;
          if (!appliedDietary.includes('Vegan') && ds.includes('vegan')) return false;
          for (const a of ALLERGENS)
            if (!appliedAllergens.includes(a) && ds.includes(a.toLowerCase())) return false;
          return true;
        });
      });
      return { ...v, items };
    });
  }, [venues, appliedHalls, appliedDietary, appliedAllergens]);

  // const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <Pane height='100vh' display='flex' alignItems='center' justifyContent='center'>
        <Spinner />
      </Pane>
    );
  }

  return (
    <Pane display='flex' height='100vh' background={PAGE_BG}>
      {/* ─── FILTER SIDEBAR ───────────────────────────────────────────── */}
      <Pane
        // display={['none', 'flex']}
        flexDirection='column'
        width={280}
        padding={majorScale(3)}
        // overflowY='auto'
        // maxHeight='calc(100vh - 60px)'
      >
        <Pane
          display='flex'
          flexDirection='column'
          background='white'
          borderRadius={8}
          padding={majorScale(3)}
          maxHeight='100%'
          boxShadow='0 2px 12px rgba(0,0,0,0.06)'
        >
          {/* Toggle */}
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            cursor='pointer'
            onClick={() => setFilterOpen((o) => !o)}
            marginBottom={filterOpen ? majorScale(3) : 0}
          >
            <Text size={500} fontWeight={600} color={theme.colors.gray700}>
              {filterOpen ? 'Hide Filters' : 'Show Filters'}
            </Text>
            {filterOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Pane>

          <Pane overflowY='auto' marginBottom={majorScale(3)}>
            {filterOpen && (
              <>
                {/* Dining Halls */}
                <Text
                  size={400}
                  fontWeight={600}
                  marginBottom={minorScale(1)}
                  color={theme.colors.gray800}
                >
                  Dining Halls
                </Text>
                <Pane
                  display='flex'
                  flexWrap='wrap'
                  gap={minorScale(1)}
                  marginBottom={majorScale(3)}
                >
                  {initialHalls.map((hall) => (
                    <Checkbox
                      key={hall}
                      label={hall}
                      checked={tempHalls.includes(hall)}
                      onChange={() => toggle(hall, tempHalls, setTempHalls)}
                      color={theme.colors.green700}
                      marginRight={minorScale(1)}
                      marginBottom={minorScale(1)}
                    />
                  ))}
                </Pane>

                {/* Dietary */}
                <Text
                  size={400}
                  fontWeight={600}
                  marginBottom={minorScale(1)}
                  color={theme.colors.gray800}
                >
                  Dietary
                </Text>
                <Pane
                  display='flex'
                  flexWrap='wrap'
                  gap={minorScale(1)}
                  marginBottom={majorScale(3)}
                >
                  {DIETARY.map((diet) => (
                    <Checkbox
                      key={diet}
                      label={diet}
                      checked={tempDietary.includes(diet)}
                      onChange={() => toggle(diet, tempDietary, setTempDietary)}
                      color={theme.colors.green700}
                      marginRight={minorScale(1)}
                      marginBottom={minorScale(1)}
                    />
                  ))}
                </Pane>

                {/* Allergens */}
                <Text
                  size={400}
                  fontWeight={600}
                  marginBottom={minorScale(1)}
                  color={theme.colors.gray800}
                >
                  Allergens
                </Text>
                <Pane
                  display='flex'
                  flexWrap='wrap'
                  gap={minorScale(1)}
                  marginBottom={majorScale(4)}
                >
                  {ALLERGENS.map((allergen) => (
                    <Checkbox
                      key={allergen}
                      label={`${ALLERGEN_EMOJI[allergen.toLowerCase()]} ${allergen}`}
                      checked={tempAllergens.includes(allergen)}
                      onChange={() => toggle(allergen, tempAllergens, setTempAllergens)}
                      color={theme.colors.green700}
                      marginRight={minorScale(1)}
                      marginBottom={minorScale(1)}
                    />
                  ))}
                </Pane>
              </>
            )}
          </Pane>
          {/* Actions */}
          <Pane display='flex' justifyContent='space-between'>
            <Button
              onClick={() => {
                const resetHalls = [...halls];
                const resetDietary = [...DIETARY];
                const resetAllergens = [...ALLERGENS];

                // Reset temp
                setTempHalls(resetHalls);
                setTempDietary(resetDietary);
                setTempAllergens(resetAllergens);

                // Apply immediately
                setAppliedHalls(resetHalls);
                setAppliedDietary(resetDietary);
                setAppliedAllergens(resetAllergens);
              }}
            >
              Reset
            </Button>
            <Button
              appearance='primary'
              intent='success'
              onClick={() => {
                setAppliedHalls(tempHalls);
                setAppliedDietary(tempDietary);
                setAppliedAllergens(tempAllergens);
              }}
            >
              Apply
            </Button>
          </Pane>
        </Pane>
      </Pane>

      {/* ─── MAIN VIEW ──────────────────────────────────────────────────────── */}
      <Pane flex={1} overflowY='auto' padding={majorScale(6)}>
        {/* Header */}
        <Pane
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          marginBottom={majorScale(5)}
        >
          <Pane>
            <Heading size={900} color={theme.colors.green700} fontWeight={900}>
              {meal.toUpperCase()}
            </Heading>
            <Text size={500} color={theme.colors.green600} fontWeight={600}>
              {MEAL_RANGES[meal]}
            </Text>
          </Pane>

          {/* Date + arrows */}
          <Pane display='flex' alignItems='center' gap={minorScale(2)}>
            <Button
              background='white'
              border={`1px solid ${theme.colors.green700}`}
              borderRadius={999}
              padding={minorScale(1)}
              appearance='minimal'
              display='flex'
              alignItems='center'
              justifyContent='center'
              onClick={prevDay}
            >
              <ChevronLeftIcon size={16} />
            </Button>

            <Text size={600} color={theme.colors.green700}>
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
              display='flex'
              alignItems='center'
              justifyContent='center'
              onClick={nextDay}
            >
              <ChevronRightIcon size={16} />
            </Button>
          </Pane>

          {/* Meal tabs + nutrition */}
          <Pane display='flex' alignItems='center' gap={majorScale(2)}>
            <Pane
              display='flex'
              border={`1px solid ${theme.colors.green700}`}
              borderRadius={999}
              background={theme.colors.green25}
              overflow='hidden'
            >
              {(['Breakfast', 'Lunch', 'Dinner'] as MealType[]).map((m) => (
                <Pane
                  key={m}
                  paddingX={majorScale(3)}
                  paddingY={minorScale(1)}
                  background={meal === m ? theme.colors.green700 : 'transparent'}
                  fontSize={13}
                  fontWeight={600}
                  color={meal === m ? 'white' : theme.colors.green800}
                  cursor='pointer'
                  onClick={() => setMeal(m)}
                >
                  {m}
                </Pane>
              ))}
            </Pane>
            <Pane display='flex' alignItems='center'>
              <Text size={400} marginRight={minorScale(1)}>
                Nutrition
              </Text>
              <Switch />
            </Pane>
          </Pane>
        </Pane>

        {/* Grid of cards */}
        <Pane
          display='grid'
          gridTemplateColumns='repeat(auto-fill,minmax(340px,1fr))'
          gap={majorScale(1)}
        >
          {displayData.map((hall) => (
            <DiningHallCard
              key={hall.name}
              hall={hall}
              // expanded={expanded}
              setModalHall={setModalHall}
              ALLERGEN_EMOJI={ALLERGEN_EMOJI}
              theme={theme}
            />
          ))}
        </Pane>
      </Pane>

      {/* ─── RIGHT SIDEBAR (desktop only) ─────────────────────────────────── */}
      <Pane
        // display={['none', 'flex']}
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
      <Modal isShown={!!modalHall} onClose={() => setModalHall(null)} hall={modalHall} />
    </Pane>
  );
}
