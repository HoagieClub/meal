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
  'Chemistry CaFe',
  'EQuad Cafe',
  'Frist Gallery',
  'Genomics Cafe',
  'Shultz Cafe'
] as const;
export type DiningHall = (typeof DINING_HALLS)[number];

export const RETAIL_LOCATIONS = [
  'Chemistry CaFe',
  'EQuad Cafe',
  'Frist Gallery',
  'Genomics Cafe',
  'Shultz Cafe'
] as const;
export type RetailLocation = (typeof RETAIL_LOCATIONS)[number];

export const RESIDENTIAL_LOCATIONS = DINING_HALLS.filter((location: DiningHall) => !RETAIL_LOCATIONS.includes(location as RetailLocation));
export type ResidentialLocation = (typeof RESIDENTIAL_LOCATIONS)[number];

export const MENU_SORT_OPTIONS = ['Category', 'Most Liked'] as const;
export type MenuSortOption = (typeof MENU_SORT_OPTIONS)[number];