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

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

export const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];

export const MEAL_RANGES: Record<MealType, string> = {
  Breakfast: '7:30 AM – 10:30 AM',
  Lunch: '11:30 AM – 2:00 PM',
  Dinner: '5:00 PM – 8:00 PM',
};

export type MenuCategoryType = 'Main Entrée' | 'Vegan Entrée' | 'Soups';

export const MENU_CATEGORIES: MenuCategoryType[] = ['Main Entrée', 'Vegan Entrée', 'Soups'];

export type MealIconType = '🍂' | '🥜' | '🥚' | '🥛' | '🌱' | '🥜';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icons?: MealIconType[];
  calories?: number;
  protein?: number;
  link?: string;
}

export interface UIMenuItem {
  id: number;
  name: string;
  description: string;
  link: string;
  allergens: string[];
  ingredients: string[];
  calories: number;
  protein: number;
}

export interface UIVenue {
  name: string;
  items: Record<'Main Entrée' | 'Vegan Entrée' | 'Soups', UIMenuItem[]>;
  allergens: Set<string>;
  calories: Record<string, number>;
  protein: Record<string, number>;
  nutrition: Set<string>;
}

export interface RawApiMenuItem {
  id: number;
  name: string;
  description: string;
  link: string;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
  allergens: string[];
  ingredients: string[];
}

export interface NutrientInfo {
  servingSize: string;
  servingUnit: string;
  calories: number;
  caloriesFromFat: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  totalCarbohydrates: number;
  dietaryFiber: number;
  sugars: number;
  protein: number;
  vitaminD: string;
  potassium: string;
  calcium: string;
  iron: string;
}

export interface MenuItemDetails {
  id: number;
  apiId: number;
  name: string;
  description: string;
  link: string;
  allergens: string[];
  ingredients: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isKosher: boolean;
  dietaryFlags: string[];
  nutrientInfo: NutrientInfo;
  averageRating: number | null;
  ratingCount: number;
}
