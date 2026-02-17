export const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;
export type Meal = (typeof MEALS)[number];

export const ALLERGENS = [
  'Peanut', 'Coconut', 'Eggs', 'Milk', 'Wheat', 'Soybeans',
  'Crustacean', 'Alcohol', 'Fish', 'Sesame', 'Gluten',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const DINING_HALLS = [
  'Forbes College',
  'Mathey & Rockefeller Colleges',
  'Whitman & Butler Colleges',
  'Yeh College & NCW',
  'Center for Jewish Life',
  'Graduate College',
] as const;
export type DiningHall = (typeof DINING_HALLS)[number];

export const MENU_SORT_OPTIONS = ['Category', 'Most Liked'] as const;
export type MenuSortOption = (typeof MENU_SORT_OPTIONS)[number];

export const MEAL_ICONS = ['🍂', '🥜', '🥚', '🥛', '🌱', '🥜'] as const;
export type MealIcon = (typeof MEAL_ICONS)[number];
