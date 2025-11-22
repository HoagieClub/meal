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
  vitaminD: string; // API returns string "0.00"
  potassium: string; // API returns string "1.00"
  calcium: string; // API returns string "16.00"
  iron: string; // API returns string "40.00"
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
