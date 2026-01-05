import { Allergen, DiningHall, DietaryTag, Meal } from '@/types/dining';

export const ALLERGENS: Allergen[] = [
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

export const DINING_HALLS: DiningHall[] = [
  'Forbes College',
  'Mathey & Rockefeller Colleges',
  'Whitman & Butler Colleges',
  'Yeh College & NCW',
  'Center for Jewish Life',
  'Graduate College',
];

export const DIETARY_TAGS: DietaryTag[] = ['Vegetarian', 'Vegan', 'Halal', 'Kosher'];

export const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner'];

export const MEAL_RANGES: Record<Meal, string> = {
  Breakfast: '7:30 AM – 10:30 AM',
  Lunch: '11:30 AM – 2:00 PM',
  Dinner: '5:00 PM – 8:00 PM',
};
