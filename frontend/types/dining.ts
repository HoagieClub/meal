export interface DiningVenue {
  databaseId: number;
  name: string;
  mapName: string;
  latitude: string;
  longitude: string;
  buildingName: string;
  amenities: string[];
  isActive: boolean;
  categoryId: number;
  menu?: MenuItem[];
}

export interface MenuItem {
  apiId: number;
  apiUrl?: string;
  name: string;
  description: string;
  link?: string;
  servingSize?: string | number | null;
  servingUnit?: string | null;
  calories?: string | number | null;
  caloriesFromFat?: string | number | null;
  totalFat?: string | number | null;
  saturatedFat?: string | number | null;
  transFat?: string | number | null;
  cholesterol?: string | number | null;
  sodium?: string | number | null;
  totalCarbohydrates?: string | number | null;
  dietaryFiber?: string | number | null;
  sugars?: string | number | null;
  protein?: string | number | null;
  vitaminD?: string | number | null;
  potassium?: string | number | null;
  calcium?: string | number | null;
  iron?: string | number | null;
  allergens?: string[] | null;
  ingredients?: string[] | null;
  dietaryFlags?: string[] | null;
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

export type Allergen =
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

export type DiningHall =
  | 'Forbes College'
  | 'Mathey College'
  | 'Rockefeller College'
  | 'Whitman & Butler Colleges'
  | 'Yeh College & NCW'
  | 'Center for Jewish Life'
  | 'Graduate College'
  | 'Frist Grill';

export type DietaryTag = 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher';

export type DisplayMeal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Brunch';

export type MenuCategory = 'Main Entrée' | 'Vegan Entrée' | 'Soups';

export type MealIcon = '🍂' | '🥜' | '🥚' | '🥛' | '🌱' | '🥜';

export interface DiningPreferences {
  diningHalls: DiningHall[];
  dietaryRestrictions: DietaryTag[];
  allergens: Allergen[];
  showNutrition: boolean;
}

export interface MenuItemMetrics {
  viewCount: number;
  uniqueViewCount: number;
  likeCount: number;
  dislikeCount: number;
  averageLikeScore: number;
  favoriteCount: number;
  savedForLaterCount: number;
  wouldEatAgainYes: number;
  wouldEatAgainNo: number;
  wouldEatAgainMaybe: number;
  averageWouldEatAgainScore: number;
}

export interface MenuItemInteraction {
  viewed: boolean;
  viewCount: number;
  firstViewedAt: string;
  lastViewedAt: string;
  liked: boolean;
  favorited: boolean;
  savedForLater: boolean;
  wouldEatAgain: string;
}
