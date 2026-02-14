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

// Aggregated metrics for a menu item based on user interactions. Tracks views, likes, favorites, and user feedback.
export interface MenuItemMetrics {
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
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  liked: boolean | null;
  favorited: boolean | null;
  savedForLater: boolean | null;
  wouldEatAgain: 'Y' | 'N' | 'M' | null;
}


// Meal period types available at dining locations.
export type Meal = 'Breakfast' | 'Lunch' | 'Dinner';

// Meal periods types available at dining locations.
export const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner'];

// Date key format used for indexing menus by date. Typically in YYYY-MM-DD format.
export type DateKey = string;

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
  | 'Sesame'
  | 'Gluten';

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
  'Gluten',
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
export type DietaryTag = 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher';

// Dietary tags that can be applied to menu items or user preferences.
export const DIETARY_TAGS: DietaryTag[] = ['Vegetarian', 'Vegan', 'Halal', 'Kosher'];

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

// Options to sort the menu.
export type MenuSortOption = 'Best' | 'Category' | 'Most Liked' | 'Recommended';

// Options to sort the menu.
export const MENU_SORT_OPTIONS: MenuSortOption[] = [
  'Best',
  'Category',
  'Most Liked',
  'Recommended',
];
