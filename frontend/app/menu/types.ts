type MealIcon = '🍂' | '🥜' | '🥚' | '🥛' | '🌱' | '🥜';
type Meal = 'Breakfast' | 'Lunch' | 'Dinner';

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icons?: MealIcon[];
  calories?: number;
  protein?: number;
  link?: string;
}

type DietKey = 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher';

type AllergenKey =
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

interface UIMenuItem {
  id: number;
  name: string;
  description: string;
  link: string;
  allergens: string[];
  ingredients: string[];
}

interface UIVenue {
  name: string;
  items: Record<'Main Entrée' | 'Vegetarian + Vegan Entrée' | 'Soups', UIMenuItem[]>;
  allergens: Set<string>;
  calories: Record<string, number>;
  protein: Record<string, number>;
  nutrition: Set<string>;
}

interface RawApiMenuItem {
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

interface RawVenue {
  name: string;
  menu: { menus?: RawApiMenuItem[] };
}

export type {
  MealIcon,
  Meal,
  MenuCategory,
  MenuItem,
  DietKey,
  AllergenKey,
  UIMenuItem,
  UIVenue,
  RawApiMenuItem,
  RawVenue,
};
