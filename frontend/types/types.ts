/**
 * @overview Core TypeScript type definitions for meals, menu items, and interactions.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

export const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;
export type Meal = (typeof MEALS)[number];

export const ALLERGENS = [
  'Peanut', 'Coconut', 'Eggs', 'Milk', 'Wheat', 'Soybeans',
  'Crustacean', 'Alcohol', 'Fish', 'Sesame', 'Gluten',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const MENU_SORT_OPTIONS = ['None', 'Starred'] as const;
export type MenuSortOption = (typeof MENU_SORT_OPTIONS)[number];

export interface MenuItem {
  id: string;
  apiId: string;
  name: string;
  allergens?: string[];
  ingredients?: string[];
  nutrition?: {
    ingredients?: string;
    allergens?: string;
    servingSize?: string;
    calories?: number;
    [key: string]: any;
  };
}

export interface MenuItemInteraction {
  liked?: boolean | null;
  favorited?: boolean;
  savedForLater?: boolean;
  wouldEatAgain?: string;
}

export interface MenuItemMetrics {
  likeCount: number;
  dislikeCount: number;
  averageLikeScore?: number;
}