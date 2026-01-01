export interface DiningVenue {
  database_id: number;
  name: string;
  map_name: string;
  latitude: string;
  longitude: string;
  building_name: string;
  amenities: string[];
  is_active: boolean;
  category_id: number;
  menu?: MenuItem[];
}

export interface MenuItem {
  api_id: number;
  name: string;
  description: string;
  link: string;
  nutrition?: MenuItemNutrition;
}

export interface MenuItemNutrition {
  serving_size: string | number | null;
  serving_unit: string | null;
  calories: string | number | null;
  calories_from_fat: string | number | null;
  total_fat: string | number | null;
  saturated_fat: string | number | null;
  trans_fat: string | number | null;
  cholesterol: string | number | null;
  sodium: string | number | null;
  total_carbohydrates: string | number | null;
  dietary_fiber: string | number | null;
  sugars: string | number | null;
  protein: string | number | null;
  vitamin_d: string | number | null;
  potassium: string | number | null;
  calcium: string | number | null;
  iron: string | number | null;
  allergens: string[] | null;
  ingredients: string[] | null;
  dietary_flags: string[] | null;
}

export type Meal = 'Breakfast' | 'Lunch' | 'Dinner';

export type Menu = MenuItem[];

export type MenusForLocations = DiningVenue[];

export type MenusForMealAndLocations = {
  [M in Meal]?: DiningVenue[];
};

export type MenusForDateMealAndLocations = {
  [key: string]: MenusForMealAndLocations;
};
