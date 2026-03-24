export const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;
export type Meal = (typeof MEALS)[number];

export const ALLERGENS = [
  'Peanut', 'Coconut', 'Eggs', 'Milk', 'Wheat', 'Soybeans',
  'Crustacean', 'Alcohol', 'Fish', 'Sesame', 'Gluten',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const MENU_SORT_OPTIONS = ['Starred', 'Most Liked'] as const;
export type MenuSortOption = (typeof MENU_SORT_OPTIONS)[number];