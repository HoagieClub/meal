import { MenuItem, Meal, DiningHall } from '@/types/dining';

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

export interface DailyPlan {
  date: Date | string;
  meals: Record<Meal, MenuItem[]>;
  totals: Nutrients;
  venueMap: Record<string, string>; // Maps menu item apiId to venue name
}

export type WeeklyPlan = DailyPlan[];

export interface PlanSettings {
  preset: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  allergens: string[];
  preferredHall: DiningHall | 'Any Available Hall';
}

export interface SavedPlansManagerProps {
  savedPlans: Record<string, WeeklyPlan>;
  setSavedPlans: (value: Record<string, WeeklyPlan>) => void;
  setCurrentDate: (value: string) => void;
  setStoredPlan: (value: WeeklyPlan | null) => void;
}
