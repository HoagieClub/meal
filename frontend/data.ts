export type AllergenType =
  | 'Peanut'
  | 'Coconut'
  | 'Eggs'
  | 'Milk'
  | 'Wheat'
  | 'Soybeans'
  | 'Crustacean'
  | 'Alcohol'
  | 'Gluten'
  | 'Fish'
  | 'Sesame';

export const ALLERGENS: AllergenType[] = [
  'Peanut',
  'Coconut',
  'Eggs',
  'Milk',
  'Wheat',
  'Soybeans',
  'Crustacean',
  'Alcohol',
  'Gluten',
  'Fish',
  'Sesame',
];

export type DiningHallType =
  | 'Forbes College'
  | 'Mathey College'
  | 'Rockefeller College'
  | 'Whitman & Butler Colleges'
  | 'Yeh College & NCW'
  | 'Center for Jewish Life'
  | 'Graduate College'
  | 'Frist Grill';

export const DINING_HALLS: DiningHallType[] = [
  'Forbes College',
  'Mathey College',
  'Rockefeller College',
  'Whitman & Butler Colleges',
  'Yeh College & NCW',
  'Center for Jewish Life',
  'Graduate College',
];

export type DietaryTagType = 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher';

export const DIETARY_TAGS: DietaryTagType[] = ['Vegetarian', 'Vegan', 'Halal', 'Kosher'];

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Brunch';

export const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Brunch'];

export const MEAL_RANGES: Record<MealType, string> = {
  Breakfast: '7:30 AM – 10:30 AM',
  Lunch: '11:30 AM – 2:00 PM',
  Dinner: '5:00 PM – 8:00 PM',
  Brunch: '10:00 AM – 2:00 PM',
};

export type MenuCategoryType = 'Main Entrée' | 'Vegan Entrée' | 'Soups';

export const MENU_CATEGORIES: MenuCategoryType[] = ['Main Entrée', 'Vegan Entrée', 'Soups'];

export type MealIconType = '🍂' | '🥜' | '🥚' | '🥛' | '🌱' | '🥜';