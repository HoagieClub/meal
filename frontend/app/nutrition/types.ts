interface MacronutrientRowProps {
  label: string;
  amount: number | string | null;
  unit: string;
  dvPercent: number | null;
}

interface MicronutrientRowProps {
  label: string;
  dvPercent?: string | null;
}

interface NutrientInfo {
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

interface MenuItemDetails {
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

export type { MacronutrientRowProps, MicronutrientRowProps, NutrientInfo, MenuItemDetails };
