type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

interface Nutrients {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  calcium: number;
  iron: number;
  potassium: number;
  vitaminD: number;
  vitaminA: number;
  vitaminC: number;
  magnesium: number;
  zinc: number;
}

interface FoodItem {
  apiId: number;
  name: string;
  location: string;
  description: string;
  link: string;
  nutrition: Nutrients;
}

interface DailyPlan {
  date: Date | string;
  meals: { Breakfast: FoodItem[]; Lunch: FoodItem[]; Dinner: FoodItem[] };
  totals: Nutrients;
}

type WeeklyPlan = DailyPlan[];

interface PlanSettings {
  preset: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  allergens: string[];
  preferredHall: string;
}

export type { MealType, Nutrients, FoodItem, DailyPlan, WeeklyPlan, PlanSettings };
