'use client';

import React, { useEffect, useState, useMemo } from 'react';
import FilterSidebar from './components/filter-sidebar';
import { Pane, Heading, Text, majorScale, minorScale, useTheme, SearchIcon } from 'evergreen-ui';
import HallMenuModal from '@/components/HallMenuModal';
import DiningHallCard from '@/components/DiningHallCard';
import { AllergenKey, DietKey, UIMenuItem, UIVenue } from '@/types/dining';
import { useUserProfile } from '@/hooks/use-user-profile';
import useLocalStorage from '@/hooks/useLocalStorage';
import { classifyDish } from '@/utils/dietary';
import SkeletonDiningHallCard from '@/app/menu/components/dining-hall-card-skeleton';
import { categorize, extractAllergens } from '@/utils/dining';
import { RawApiMenuItem, RawVenue, Meal as MealType } from '@/types/dining';
import MenuPageHeader from '@/app/menu/components/menu-header';
import AllergenSidebar from '@/app/menu/components/allergen-sidebar';
import {
  MEAL_RANGES,
  ALLERGEN_EMOJI,
  defaultMeal,
  defaultDate,
  PREF_EXPIRY_MS,
  PREFS_KEY,
  FILTER_PREFS_KEY,
  PINNED_HALLS_KEY,
  initialSelectedHalls,
  ALLERGENS,
} from '@/app/menu/data';

export default function Index() {
  const theme = useTheme();

  const backgroundByMeal: Record<MealType, string> = {
    Breakfast: theme.colors.green100,
    Lunch: theme.colors.green200,
    Dinner: theme.colors.green400,
  };

  // ─── Load & Transform Data ───────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<UIVenue[]>([]);

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
    setLoading(true); // <-- **Set loading immediately**
    const newDate = value instanceof Function ? value(selectedDate) : value;
    setPrefs((prev) => ({ ...prev, date: newDate.toISOString() }));
  };

  const setMeal = (value: MealType | ((val: MealType) => MealType)) => {
    setLoading(true); // <-- **Set loading immediately**
    const newMeal = value instanceof Function ? value(meal) : value;
    setPrefs((prev) => ({ ...prev, meal: newMeal }));
  };

  // ─── Filters (Not from DB) ──────────────────────────────────────────────
  // Use the hook for searchTerm and showNutrition
  const [searchTerm, setSearchTerm] = useLocalStorage('diningSearchTerm', '');
  const [showNutrition, setShowNutrition] = useLocalStorage('diningShowNutrition', true);

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

  const [halls] = useState<string[]>(initialSelectedHalls);
  const DIETARY: DietKey[] = ['Vegetarian', 'Vegan', 'Halal', 'Kosher'];

  // ** Store applied filters in localStorage **
  const [appliedFilterPrefs, setAppliedFilterPrefs] = useLocalStorage(FILTER_PREFS_KEY, {
    halls: initialSelectedHalls,
    dietary: [] as DietKey[],
    allergens: [] as AllergenKey[],
  });

  // ** Derive applied state from localStorage object **
  const {
    halls: appliedHalls,
    dietary: appliedDietary,
    allergens: appliedAllergens,
  } = appliedFilterPrefs;

  // ** Create setters that update the localStorage object **
  const setAppliedHalls = (value: React.SetStateAction<string[]>) => {
    setAppliedFilterPrefs((prev) => ({
      ...prev,
      halls: value instanceof Function ? value(prev.halls) : value,
    }));
  };
  const setAppliedDietary = (value: React.SetStateAction<DietKey[]>) => {
    setAppliedFilterPrefs((prev) => ({
      ...prev,
      dietary: value instanceof Function ? value(prev.dietary) : value,
    }));
  };
  const setAppliedAllergens = (value: React.SetStateAction<AllergenKey[]>) => {
    setAppliedFilterPrefs((prev) => ({
      ...prev,
      allergens: value instanceof Function ? value(prev.allergens) : value,
    }));
  };

  // ** temporary UI selections now initialize from applied (localStorage) state **
  const [tempHalls, setTempHalls] = useState<string[]>([...appliedHalls]);
  const [tempDietary, setTempDietary] = useState<DietKey[]>([...appliedDietary]);
  const [tempAllergens, setTempAllergens] = useState<AllergenKey[]>([...appliedAllergens]);

  // ** This effect syncs the temp state if the applied state changes
  // (e.g., from a quick toggle or profile load) **
  useEffect(() => {
    setTempHalls(appliedHalls);
    setTempDietary(appliedDietary);
    setTempAllergens(appliedAllergens);
  }, [appliedHalls, appliedDietary, appliedAllergens]);

  // This flag tracks if the user's profile settings have been processed
  const [profileLoaded, setProfileLoaded] = useState(false);

  const { dietaryRestrictions, allergens, diningHalls } = useUserProfile();

  // ** This effect now updates the localStorage state (appliedFilterPrefs) **
  useEffect(() => {
    // Only run this if the profile data is available and has content
    if (
      (dietaryRestrictions && dietaryRestrictions.length > 0) ||
      (allergens && allergens.length > 0) ||
      (diningHalls && diningHalls.length > 0)
    ) {
      console.log('Profile loaded, syncing filters from DB...');
      setAppliedFilterPrefs((prev) => ({
        halls: diningHalls && diningHalls.length > 0 ? diningHalls : prev.halls,
        dietary:
          dietaryRestrictions && dietaryRestrictions.length > 0
            ? dietaryRestrictions
            : prev.dietary,
        allergens: allergens && allergens.length > 0 ? allergens : prev.allergens,
      }));
    }
    // Mark the profile as loaded so the menu fetch can proceed
    setProfileLoaded(true);
  }, [dietaryRestrictions, allergens, diningHalls, setAppliedFilterPrefs]);

  const [modalHall, setModalHall] = useState<UIVenue | null>(null);

  const toggle = <T,>(val: T, arr: T[], setter: (value: React.SetStateAction<T[]>) => void) =>
    setter((prevArr) =>
      prevArr.includes(val) ? prevArr.filter((x) => x !== val) : [...prevArr, val]
    );

  // ** This now updates the localStorage state directly **
  const toggleQuickAllergen = (allergen: AllergenKey) => {
    toggle(allergen, appliedAllergens, setAppliedAllergens);
  };

  const resetTemp = () => {
    setTempHalls([...initialSelectedHalls]);
    // ** Reset dietary and allergen filters to empty **
    setTempDietary([]);
    setTempAllergens([]);
  };

  useEffect(() => {
    if (isWeekend && meal === 'Breakfast') {
      setMeal('Lunch');
    }
  }, [isWeekend, meal]); // Dependency simplified

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

  useEffect(() => {
    // Only run this fetch if the user's profile has been loaded
    if (!profileLoaded) return;

    let isCurrent = true;

    // ** Use selectedDate and meal directly **
    const menuId = formatMenuId(selectedDate, meal);

    const fetchMenuData = async () => {
      try {
        const response = await fetch(`/api/dining/locations/with-menus?menu_id=${menuId}`);

        if (!response.ok) {
          throw new Error(`HTTP error fetching menu! status: ${response.status}`);
        }

        const data: { locations: { location: RawVenue[] } } = await response.json();

        if (isCurrent) {
          const ui = data.locations.location.map((raw: RawVenue) => {
            const items = (raw.menu.menus || []).map((x: RawApiMenuItem) => ({
              id: x.id,
              name: x.name,
              description: x.description,
              link: x.link,
              // --- FIXED ---
              // Read from the nested nutrition object
              calories: x.nutrition?.calories || 0,
              protein: x.nutrition?.protein || 0,
              allergens: x.allergens || [],
              ingredients: x.ingredients || [],
            }));
            const uiItems: UIMenuItem[] = items.map((x: (typeof items)[number]) => ({
              id: x.id,
              name: x.name,
              description: x.description,
              link: x.link,
              allergens: x.allergens,
              ingredients: x.ingredients,
            }));
            return {
              name: raw.name,
              items: categorize(uiItems),
              allergens: extractAllergens(uiItems),
              calories: Object.fromEntries(
                items.map((i: (typeof items)[number]) => [i.name, i.calories || 0])
              ),
              protein: Object.fromEntries(
                items.map((i: (typeof items)[number]) => [i.name, i.protein || 0])
              ),
            } as UIVenue;
          });
          // truncate Center for Jewish Life name for easier display
          ui.forEach((venue: UIVenue) => {
            if (venue.name.startsWith('Center for Jewish Life')) {
              venue.name = 'Center for Jewish Life';
            }
          });
          ui.forEach((venue: UIVenue) => {
            if (venue.name.startsWith('Yeh College & N')) {
              venue.name = 'Yeh College & NCW';
            }
          });
          console.log(`Fetched menu data for ${menuId}:`, data);

          setVenues(ui);
        }
      } catch (error) {
        if (isCurrent) {
          console.error(`Error fetching menu data for ${menuId}:`, error);
          setVenues([]);
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    fetchMenuData();

    return () => {
      isCurrent = false;
    };
    // ** Depend on selectedDate and meal directly **
  }, [selectedDate, meal, profileLoaded]);

  // ─── Filtering Logic ────────────────────────────────────────────────────

  const displayData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    // ** A filter is active if one or more options are selected **
    const isDietFilterActive = appliedDietary.length > 0;
    const isAllergenFilterActive = appliedAllergens.length > 0;
    const isSearchActive = term !== '';

    const sortFn = (a: UIVenue, b: UIVenue) => {
      const aIsPinned = pinnedHalls.has(a.name);
      const bIsPinned = pinnedHalls.has(b.name);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    };

    // If no filters are active, return the base data directly
    if (!isDietFilterActive && !isAllergenFilterActive && !isSearchActive) {
      return appliedHalls
        .map((h) => venues.find((v) => v.name === h))
        .filter((v): v is UIVenue => !!v)
        .sort(sortFn);
    }

    // Otherwise, apply filters
    return appliedHalls
      .map((hallName) => {
        const venue = venues.find((v) => v.name === hallName);
        if (!venue) return null;

        const items: UIVenue['items'] = {
          'Main Entrée': [],
          'Vegetarian + Vegan Entrée': [],
          Soups: [],
        };
        let hasAnyItemsAfterFilter = false; // Track if any items remain after filtering this venue

        for (const cat of Object.keys(venue.items) as (keyof typeof venue.items)[]) {
          items[cat] = venue.items[cat].filter((dish) => {
            const dishText = (dish.name + ' ' + dish.description).toLowerCase();

            // ** 1. Get all dietary tags for this dish using the new function **
            const dishTags = classifyDish(dish); // e.g., ['Vegan', 'Vegetarian', 'Halal']

            // --- DIETARY FILTER (Opt-In: Show items that MATCH selected) ---
            if (isDietFilterActive) {
              // Check if *any* of the dish's tags are in the user's selected filter list
              // e.g., dishTags = ['Vegan', 'Vegetarian'], appliedDietary = ['Vegan']
              const matchesADiet = dishTags.some((tag) => appliedDietary.includes(tag));

              // If it doesn't match *any* of the selected diets, filter it out
              if (!matchesADiet) {
                return false;
              }
            }

            // --- ALLERGEN FILTER (Opt-In Avoidance: Hide items that MATCH selected allergens) ---
            if (isAllergenFilterActive) {
              // Use the structured dish.allergens array for reliable filtering
              // We must compare case-insensitively.
              const dishAllergensLower = dish.allergens.map((a) => a.toLowerCase());
              const containsAvoidedAllergen = appliedAllergens.some((avoidedAllergen) =>
                dishAllergensLower.includes(avoidedAllergen.toLowerCase())
              );

              // If it *does* contain an allergen the user wants to avoid, filter it out
              if (containsAvoidedAllergen) {
                return false;
              }
            }

            // --- SEARCH FILTER ---
            if (isSearchActive && !dishText.includes(term)) {
              return false;
            }

            // If we reach here, the item passes all active filters
            hasAnyItemsAfterFilter = true; // Mark that this venue has at least one item
            return true; // Keep the item
          });
        }

        // If, after filtering all categories, this venue has no items left, exclude the venue
        if (!hasAnyItemsAfterFilter) return null;

        // Otherwise, return the venue with its filtered items
        return { ...venue, items } as UIVenue;
      })
      .filter((v): v is UIVenue => v !== null) // Remove venues that became null
      .sort(sortFn);
  }, [venues, appliedHalls, appliedDietary, appliedAllergens, searchTerm, pinnedHalls]);

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
        initialHalls={initialSelectedHalls}
        tempHalls={tempHalls}
        toggleHall={(h) => toggle(h, tempHalls, setTempHalls)}
        DIETARY={DIETARY}
        tempDietary={tempDietary}
        toggleDietary={(d) => toggle(d, tempDietary, setTempDietary)}
        ALLERGENS={ALLERGENS}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        tempAllergens={tempAllergens}
        toggleAllergen={(a) => toggle(a, tempAllergens, setTempAllergens)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showNutrition={showNutrition}
        setShowNutrition={setShowNutrition}
        onReset={resetTemp}
        // ** onApply now updates the localStorage state **
        onApply={() => {
          setAppliedHalls(tempHalls);
          setAppliedDietary(tempDietary);
          setAppliedAllergens(tempAllergens);

          // This fetch call remains to save prefs to DB for logged-in users
          fetch('/api/user/update', {
            method: 'POST',
            body: JSON.stringify({
              dietary_restrictions: tempDietary,
              allergens: tempAllergens, // Send the list of allergens to avoid
              dining_halls: tempHalls,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log('Preferences saved to DB:', data);
            })
            .catch((error) => console.error('Error updating user preferences:', error));
        }}
      />

      {/* ─── MAIN VIEW ──────────────────────────────────────────────────────── */}

      <Pane flex={1} className='overflow-x-hidden h-full no-scrollbar px-4'>
        <MenuPageHeader
          meal={meal}
          selectedDate={selectedDate}
          prevDay={prevDay}
          nextDay={nextDay}
          getMealLabel={getMealLabel}
          getDisplayMealRange={getDisplayMealRange}
          availableMeals={availableMeals}
          setMeal={setMeal}
        />

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
      <AllergenSidebar
        allergens={ALLERGENS}
        selected={appliedAllergens}
        emoji={ALLERGEN_EMOJI}
        onToggle={toggleQuickAllergen}
        theme={theme}
      />
      <HallMenuModal
        isShown={!!modalHall}
        onClose={() => setModalHall(null)}
        hall={modalHall}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
      />
    </Pane>
  );
}
