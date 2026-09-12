/**
 * A meal as shown in the UI, after the site's names have been normalised (see lib/menus.ts).
 * Usually one of MEAL_ORDER, but any meal the site publishes is displayed.
 */
export type Meal = string;
export const MEAL_ORDER = ['Breakfast', 'Brunch', 'Lunch', 'Dinner'] as const;

export type LocationType = 'residential' | 'retail';

export const ALLERGENS = [
  'Peanut',
  'Tree Nuts',
  'Coconut',
  'Eggs',
  'Milk',
  'Wheat',
  'Soybeans',
  'Crustacean',
  'Alcohol',
  'Fish',
  'Sesame',
  'Gluten',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

/** Nutrition facts as returned by the backend, with keys converted to camelCase. */
export interface MenuItemNutrition {
  servingsPerContainer?: number | null;
  servingSize?: string | null;
  calories?: number | null;
  totalFat?: number | null;
  saturatedFat?: number | null;
  transFat?: number | null;
  cholesterol?: number | null;
  sodium?: number | null;
  totalCarbs?: number | null;
  dietaryFiber?: number | null;
  totalSugars?: number | null;
  addedSugars?: number | null;
  protein?: number | null;
  vitaminD?: number | null;
  calcium?: number | null;
  iron?: number | null;
  potassium?: number | null;
  ingredients?: string | null;
  allergens?: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  url?: string | null;
  nutrition?: MenuItemNutrition | null;
}

export interface MenuItemInteraction {
  liked?: boolean | null;
  favorited?: boolean;
  savedForLater?: boolean;
  wouldEatAgain?: string | null;
}

export interface MenuItemMetrics {
  likeCount: number;
  dislikeCount: number;
  averageLikeScore?: number | null;
}

/**
 * A location's menu for one day. Residential locations nest meal → station → item ids;
 * retail locations nest section → station → item ids.
 */
export type MenuTree = { [key: string]: string[] | MenuTree };
export type MenusByLocation = Record<string, MenuTree>;

/** Everything the menu page needs for one day. */
export interface MenuData {
  residentialMenus: MenusByLocation;
  retailMenus: MenusByLocation;
  menuItems: Record<string, MenuItem>;
  interactions: Record<string, MenuItemInteraction>;
  metrics: Record<string, MenuItemMetrics>;
}

/** A menu item ready to render: API data plus its section and any optimistic interaction state. */
export interface DisplayMenuItem extends MenuItem {
  category: string;
  userInteraction: MenuItemInteraction | null;
  metrics: MenuItemMetrics | null;
}

export interface DisplayLocation {
  id: string;
  name: string;
  menu: DisplayMenuItem[];
  /** Item count before search, allergen and sort filters were applied. */
  rawMenuCount: number;
}
