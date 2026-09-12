import type { DiningHall } from '@/lib/constants';
import {
  canonicalIndex,
  LOCATION_ID_BY_NAME,
  LOCATIONS,
  RESIDENTIAL_HALL_ORDER,
  RETAIL_LOCATION_ORDER,
} from '@/lib/constants';
import { detectAllergens, isWeekend } from '@/lib/utils';
import type {
  Allergen,
  DisplayLocation,
  DisplayMenuItem,
  LocationType,
  Meal,
  MenuData,
  MenusByLocation,
  MenuTree,
} from '@/types';
import { MEAL_ORDER } from '@/types';

// Meal names the site uses that belong under one of our tabs.
const MEAL_ALIASES: Record<string, Meal> = {
  'Continental Breakfast': 'Breakfast',
};

/** The tab a raw meal name from the site belongs to. */
export function normalizeMeal(rawMeal: string): Meal {
  return MEAL_ALIASES[rawMeal] ?? rawMeal;
}

function mealRank(meal: Meal): number {
  return canonicalIndex(meal, MEAL_ORDER);
}

/** Meals served by at least one residential location that day, in display order. */
export function availableMeals(residentialMenus: MenusByLocation): Meal[] {
  const meals = new Set<Meal>();
  for (const tree of Object.values(residentialMenus)) {
    for (const rawMeal of Object.keys(tree)) meals.add(normalizeMeal(rawMeal));
  }
  return [...meals].sort((a, b) => mealRank(a) - mealRank(b) || a.localeCompare(b));
}

/** The meal to show by default: the one being served now, if it exists that day. */
export function defaultMeal(meals: Meal[], now: Date = new Date()): Meal {
  const hour = now.getHours();
  const preferred: Meal[] =
    hour < 11
      ? ['Breakfast', 'Brunch', 'Lunch']
      : hour < 17
        ? ['Lunch', 'Brunch', 'Dinner']
        : ['Dinner'];
  return preferred.find((meal) => meals.includes(meal)) ?? meals[0] ?? preferred[0];
}

/** Label for a meal tab. The site calls weekend lunch "Lunch"; students call it brunch. */
export function mealLabel(meal: Meal, date: Date): string {
  return meal === 'Lunch' && isWeekend(date) ? 'Brunch' : meal;
}

export interface DisplayDataOptions {
  locationType: LocationType;
  meal: Meal;
  searchTerm: string;
  /** Show only the items the user has starred. */
  starredOnly: boolean;
  diningHalls: DiningHall[];
  allergens: Allergen[];
  pinnedHalls: DiningHall[];
}

/** Flatten a menu tree into items. The key directly above each id list becomes the item's section. */
function flattenTree(
  tree: MenuTree | string[],
  category: string,
  data: MenuData,
  out: DisplayMenuItem[]
) {
  if (Array.isArray(tree)) {
    for (const id of tree) {
      const item = data.menuItems[id];
      if (!item?.name) continue;
      out.push({
        ...item,
        category,
        userInteraction: data.interactions[id] ?? null,
        metrics: data.metrics[id] ?? null,
      });
    }
    return;
  }
  for (const [key, subtree] of Object.entries(tree)) flattenTree(subtree, key, data, out);
}

function buildLocations(
  menus: MenusByLocation,
  data: MenuData,
  options: DisplayDataOptions
): DisplayLocation[] {
  const result: DisplayLocation[] = [];
  for (const [locationId, tree] of Object.entries(menus)) {
    const location = LOCATIONS[locationId];
    if (!location) continue;

    // Residential trees are keyed by meal; every raw meal that maps to the selected tab counts.
    const subtrees =
      options.locationType === 'residential'
        ? Object.entries(tree)
            .filter(([rawMeal]) => normalizeMeal(rawMeal) === options.meal)
            .map(([, subtree]) => subtree)
        : [tree];
    if (subtrees.length === 0) continue;

    const menu: DisplayMenuItem[] = [];
    for (const subtree of subtrees) flattenTree(subtree, '', data, menu);
    result.push({ id: locationId, name: location.name, menu, rawMenuCount: menu.length });
  }
  return result;
}

function passesFilters(item: DisplayMenuItem, blocked: Set<Allergen>, search: string): boolean {
  if (blocked.size > 0 && detectAllergens(item.nutrition).some((a) => blocked.has(a))) return false;
  if (search && !item.name.toLowerCase().includes(search)) return false;
  return true;
}

/**
 * Pinned halls first, then halls with something to show, then the canonical order, then
 * alphabetical. Closed, unpublished and filtered-out halls sink to the end of the grid.
 */
function sortLocations(
  locations: DisplayLocation[],
  pinnedHalls: DiningHall[],
  order: readonly string[]
): DisplayLocation[] {
  return [...locations].sort((a, b) => {
    const aPinned = pinnedHalls.includes(a.name as DiningHall);
    const bPinned = pinnedHalls.includes(b.name as DiningHall);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    const aEmpty = a.menu.length === 0;
    const bEmpty = b.menu.length === 0;
    if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
    const aIndex = canonicalIndex(a.name, order);
    const bIndex = canonicalIndex(b.name, order);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

/** Turn a day's menu data into the ordered, filtered list of location cards to render. */
export function buildDisplayData(
  data: MenuData | null,
  options: DisplayDataOptions
): { displayData: DisplayLocation[]; hasAnyRawLocations: boolean } {
  if (!data) return { displayData: [], hasAnyRawLocations: false };

  const isResidential = options.locationType === 'residential';
  const order = isResidential ? RESIDENTIAL_HALL_ORDER : RETAIL_LOCATION_ORDER;
  const shaped = buildLocations(
    isResidential ? data.residentialMenus : data.retailMenus,
    data,
    options
  );

  const search = options.searchTerm.trim().toLowerCase();
  const blocked = new Set(options.allergens);
  const filtered = shaped
    .filter((location) => options.diningHalls.includes(location.name as DiningHall))
    .map((location) => ({
      ...location,
      menu: location.menu.filter(
        (item) =>
          passesFilters(item, blocked, search) &&
          (!options.starredOnly || item.userInteraction?.favorited === true)
      ),
    }));

  // Selected halls with no menu for this meal still get a card, so their empty state is visible.
  const present = new Set(filtered.map((location) => location.name));
  for (const hall of options.diningHalls) {
    if (order.includes(hall) && !present.has(hall)) {
      filtered.push({ id: LOCATION_ID_BY_NAME[hall], name: hall, menu: [], rawMenuCount: 0 });
    }
  }

  return {
    displayData: sortLocations(filtered, options.pinnedHalls, order),
    hasAnyRawLocations: shaped.length > 0,
  };
}
