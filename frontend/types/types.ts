export const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;
export type Meal = (typeof MEALS)[number];

export const ALLERGENS = [
  'Peanut', 'Coconut', 'Eggs', 'Milk', 'Wheat', 'Soybeans',
  'Crustacean', 'Alcohol', 'Fish', 'Sesame', 'Gluten',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const MENU_SORT_OPTIONS = ['None', 'Starred'] as const;
export type MenuSortOption = (typeof MENU_SORT_OPTIONS)[number];

export interface MenuItem {
  id: string;
  apiId: string;
  name: string;
  allergens?: string[];
  ingredients?: string[];
  nutrition?: {
    ingredients?: string;
    allergens?: string;
    servingSize?: string;
    calories?: number;
    [key: string]: any;
  };
}

export interface MenuItemInteraction {
  liked?: boolean | null;
  favorited?: boolean;
  savedForLater?: boolean;
  wouldEatAgain?: string;
}

export interface MenuItemMetrics {
  likeCount: number;
  dislikeCount: number;
  averageLikeScore?: number;
}