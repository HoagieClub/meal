import { Nutrients, PlanSettings } from './types';

const DAILY_VALUES: Omit<Nutrients, 'calories' | 'protein' | 'fat' | 'carbohydrates'> = {
  fiber: 28,
  sugar: 50,
  sodium: 2300,
  cholesterol: 300,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
  vitaminD: 20,
  vitaminA: 900,
  vitaminC: 90,
  magnesium: 420,
  zinc: 11,
};

const DINING_HALLS: Record<string, number> = {
  'Any Available Hall': -1,
  'Mathey & Rockefeller College': 3,
  'Forbes College': 5,
  'Whitman & Butler College': 6,
  'Center for Jewish Life': 7,
  'Graduate College': 8,
  'Yeh & NCW College': 1088,
};

const HALL_NAME_BY_ID: Record<number, string> = Object.fromEntries(
  Object.entries(DINING_HALLS).map(([name, id]) => [id, name])
);

const DIET_PRESETS: Record<string, Omit<PlanSettings, 'preset' | 'allergens' | 'preferredHall'>> = {
  custom: { calories: 2200, protein: 40, fat: 70, carbohydrates: 280 },
  balanced: { calories: 2000, protein: 30, fat: 65, carbohydrates: 250 },
  'high-protein': { calories: 2500, protein: 40, fat: 80, carbohydrates: 280 },
  'low-carb': { calories: 1800, protein: 20, fat: 100, carbohydrates: 100 },
};

const ALLERGENS_LIST = [
  'Peanut',
  'Coconut',
  'Egg',
  'Milk',
  'Wheat',
  'Soybeans',
  'Crustacean',
  'Gluten',
  'Alcohol',
  'Fish',
  'Sesame',
];

const DEFAULT_NUTRIENTS: Nutrients = {
  calories: 0,
  protein: 0,
  fat: 0,
  carbohydrates: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  cholesterol: 0,
  calcium: 0,
  iron: 0,
  potassium: 0,
  vitaminD: 0,
  vitaminA: 0,
  vitaminC: 0,
  magnesium: 0,
  zinc: 0,
};

export {
  DAILY_VALUES,
  DINING_HALLS,
  HALL_NAME_BY_ID,
  DIET_PRESETS,
  ALLERGENS_LIST,
  DEFAULT_NUTRIENTS,
};
