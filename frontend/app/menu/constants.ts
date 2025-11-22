import { AllergenKey } from '@/types/dining';
import { MealType } from '@/types/goals';

const MEAL_RANGES: Record<MealType, string> = {
  Breakfast: '7:30 AM – 10:30 AM',
  Lunch: '11:30 AM – 2:00 PM',
  Dinner: '5:00 PM – 8:00 PM',
};

const ALLERGEN_EMOJI: Record<string, string> = {
  peanut: '🥜',
  coconut: '🌰',
  eggs: '🥚',
  milk: '🥛',
  wheat: '🌾',
  soybeans: '🌱',
  crustacean: '🦞',
  alcohol: '🍺',
  gluten: '🍞',
  fish: '🐟',
  sesame: '🍔',
};

const defaultMeal: MealType = 'Breakfast';
const defaultDate = new Date(new Date().setHours(0, 0, 0, 0));
const PREF_EXPIRY_MS = 2 * 60 * 60 * 1000;
const PREFS_KEY = 'diningPrefs';
const FILTER_PREFS_KEY = 'diningFilterPrefs';
const PINNED_HALLS_KEY = 'diningPinnedHalls';

const initialSelectedHalls = [
  'Forbes College',
  'Mathey College',
  'Rockefeller College',
  'Whitman & Butler Colleges',
  'Yeh College & NCW',
  'Center for Jewish Life',
  'Graduate College',
];

const ALLERGENS: AllergenKey[] = [
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

export {
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
};
