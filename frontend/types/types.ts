// @overview Type definitions.
//
// Copyright © 2021-2025 Hoagie Club and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree or at
//
//    https://github.com/hoagieclub/meal/LICENSE.
//
// Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.

// Represents a dining venue or location where meals are served.
export interface Location {
  databaseId: string | number; // Can be string to preserve leading zeros
  name: string;
  mapName: string;
  latitude: string;
  longitude: string;
  buildingName: string;
  amenities: string[];
  isActive: boolean;
  categoryId: string | number; // Can be string to preserve leading zeros
  menu?: MenuItem[]; // Built data may attach menu items to the location.
}

// Nutritional information for a menu item. All values are optional and may be null if not available.
export interface MenuItemNutrition {
  servingSize?: number | null;
  servingUnit?: string | null;
  calories?: number | null;
  caloriesFromFat?: number | null;
  totalFat?: number | null;
  saturatedFat?: number | null;
  transFat?: number | null;
  cholesterol?: number | null;
  sodium?: number | null;
  totalCarbohydrates?: number | null;
  dietaryFiber?: number | null;
  sugars?: number | null;
  protein?: number | null;
  vitaminD?: number | null;
  potassium?: number | null;
  calcium?: number | null;
  iron?: number | null;
}

// Represents a single menu item (food item) available at a dining location.
export interface MenuItem {
  apiId: string;
  apiUrl?: string;
  name: string;
  allergens?: string[];
  ingredients?: string[];
  dietaryFlags?: string[];
  nutrition?: MenuItemNutrition;
  metrics?: MenuItemMetrics; // Built data may attach metrics and interactions to the menu item.
  userInteraction?: MenuItemInteraction;
}

// Aggregated metrics for a menu item based on user interactions. Tracks views, likes, favorites, and user feedback.
export interface MenuItemMetrics {
  viewCount: number | null;
  uniqueViewCount: number | null;
  likeCount: number | null;
  dislikeCount: number | null;
  averageLikeScore: number | null;
  favoriteCount: number | null;
  savedForLaterCount: number | null;
  wouldEatAgainYes: number | null;
  wouldEatAgainNo: number | null;
  wouldEatAgainMaybe: number | null;
  averageWouldEatAgainScore: number | null;
}

// Represents a user's interaction history with a specific menu item. Tracks viewing history, likes, favorites, and preferences.
export interface MenuItemInteraction {
  viewed: boolean | null;
  viewCount: number | null;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  liked: boolean | null;
  favorited: boolean | null;
  savedForLater: boolean | null;
  wouldEatAgain: 'Y' | 'N' | 'M' | null;
}

// Represents a recommendation score for a menu item.
export type MenuItemScore = number;

// Unique identifier for a menu item from the API. Always a string.
export type ApiId = string;

// Unique identifier for a dining location. Can be either a number or string.
export type LocationId = number | string;

// Meal period types available at dining locations.
export type Meal = 'Breakfast' | 'Lunch' | 'Dinner';

// Meal periods types available at dining locations.
export const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner'];

// Date key format used for indexing menus by date. Typically in YYYY-MM-DD format.
export type DateKey = string;

// A menu is an array of menu item API IDs. Structure: (string|number)[]
export type Menu = ApiId[];

// Maps location IDs to their menus. Structure: { [locationId: string]: (string|number)[] }. Keys are strings due to Django serialization.
export type MenusForLocations = {
  [locationId in LocationId]: Menu;
};

// Maps meal types to menus for all locations. Structure: { [meal: string]: { [locationId: string]: (string|number)[] } }. Keys are strings due to Django serialization.
export type MenusForMealAndLocations = {
  [meal in Meal]: MenusForLocations;
};

// Maps dates to menus organized by meal and location. Structure: { [dateKey: string]: { [meal: string]: { [locationId: string]: (string|number)[] } } }. Keys are strings due to Django serialization.
export type MenusForDateMealAndLocations = {
  [dateKey in DateKey]: MenusForMealAndLocations;
};

// Maps menu item API IDs to their full menu item data. Structure: { [apiId: string]: MenuItem }. Keys are strings due to Django serialization.
export type MenuItemMap = {
  [apiId in ApiId]: MenuItem;
};

// Maps menu item API IDs to their aggregated metrics. Structure: { [apiId: string]: MenuItemMetrics }. Keys are strings due to Django serialization.
export type MenuItemMetricsMap = {
  [apiId in ApiId]: MenuItemMetrics;
};

// Maps menu item API IDs to user interaction data. Structure: { [apiId: string]: MenuItemInteraction }. Keys are strings due to Django serialization.
export type MenuItemInteractionMap = {
  [apiId in ApiId]: MenuItemInteraction;
};

// Maps menu item API IDs to their recommendation scores. Structure: { [apiId: string]: MenuItemScore }. Keys are strings due to Django serialization.
export type MenuItemScoreMap = {
  [apiId in ApiId]: MenuItemScore;
};

// Maps location IDs to their full dining venue data. Structure: { [locationId: string]: Location }. Keys are strings due to Django serialization.
export type LocationMap = {
  [locationId in LocationId]: Location;
};

// Known allergens that may be present in menu items.
export type Allergen =
  | 'Peanut'
  | 'Coconut'
  | 'Eggs'
  | 'Milk'
  | 'Wheat'
  | 'Soybeans'
  | 'Crustacean'
  | 'Alcohol'
  | 'Fish'
  | 'Sesame';

// Known allergens that may be present in menu items.
export const ALLERGENS: Allergen[] = [
  'Peanut',
  'Coconut',
  'Eggs',
  'Milk',
  'Wheat',
  'Soybeans',
  'Crustacean',
  'Alcohol',
  'Fish',
  'Sesame',
];

// Available dining halls at the institution.
export type DiningHall =
  | 'Forbes College'
  | 'Mathey & Rockefeller Colleges'
  | 'Whitman & Butler Colleges'
  | 'Yeh College & NCW'
  | 'Center for Jewish Life'

// Available dining halls at the institution.
export const DINING_HALLS: DiningHall[] = [
  'Forbes College',
  'Mathey & Rockefeller Colleges',
  'Whitman & Butler Colleges',
  'Yeh College & NCW',
  'Center for Jewish Life',
];

// Dietary tags that can be applied to menu items or user preferences.
export type DietaryTag = 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher' | 'Gluten Free';

// Dietary tags that can be applied to menu items or user preferences.
export const DIETARY_TAGS: DietaryTag[] = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten Free'];

// Emoji icons used to represent different meal types or dietary information.
export type MealIcon = '🍂' | '🥜' | '🥚' | '🥛' | '🌱' | '🥜';

// Emoji icons used to represent different meal types or dietary information.
export const MEAL_ICONS: MealIcon[] = ['🍂', '🥜', '🥚', '🥛', '🌱', '🥜'];

// Represents a team member.
export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  imgSrc: string;
  socials: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
  };
}

// Columns that can be displayed in the menu section.
export type Column =
  | 'Calories'
  | 'Protein'
  | 'Sodium'
  | 'Fat'
  | 'Carbs'
  | 'Ingredients'
  | 'Allergens';

// Columns that can be displayed in the menu section.
export const COLUMNS: Column[] = [
  'Calories',
  'Protein',
  'Sodium',
  'Fat',
  'Carbs',
  'Ingredients',
  'Allergens',
];

// Options to sort the menu.
export type MenuSortOption = 'Best' | 'Most Viewed' | 'Most Liked' | 'Recommended';

// Options to sort the menu.
export const MENU_SORT_OPTIONS: MenuSortOption[] = [
  'Best',
  'Most Viewed',
  'Most Liked',
  'Recommended',
];
