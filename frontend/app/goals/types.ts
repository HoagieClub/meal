export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

export interface Nutrients {
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

export interface FoodItem {
  apiId: number;
  name: string;
  location: string;
  description: string;
  link: string;
  nutrition: Nutrients;
}

export interface DailyPlan {
  date: Date | string;
  meals: { Breakfast: FoodItem[]; Lunch: FoodItem[]; Dinner: FoodItem[] };
  totals: Nutrients;
}

export type WeeklyPlan = DailyPlan[];

export interface PlanSettings {
  preset: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  allergens: string[];
  preferredHall: string;
}

export interface SavedPlansManagerProps {
  savedPlans: Record<string, WeeklyPlan>;
  setSavedPlans: (value: Record<string, WeeklyPlan>) => void;
  setCurrentDate: (value: string) => void;
  setStoredPlan: (value: WeeklyPlan | null) => void;
}

export interface NutrientProgressBarProps {
  label: string;
  value: number;
  target: number;
  unit: string;
}
