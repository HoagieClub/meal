/**
 * @overview Data constants for the Hoagie Meal app.
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

import { Allergen, DiningHall, DietaryTag, Meal } from '@/types/dining';

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
  'Gluten',
  'Fish',
  'Sesame',
];

// Known dining halls.
export const DINING_HALLS: DiningHall[] = [
  'Forbes College',
  'Mathey & Rockefeller Colleges',
  'Whitman & Butler Colleges',
  'Yeh College & NCW',
  'Center for Jewish Life',
  'Graduate College',
];

// Known dietary tags.
export const DIETARY_TAGS: DietaryTag[] = ['Vegetarian', 'Vegan', 'Halal', 'Kosher'];

// Known meals.
export const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner'];

// Meal ranges.
export const MEAL_RANGES: Record<Meal, string> = {
  Breakfast: '7:30 AM – 10:30 AM',
  Lunch: '11:30 AM – 2:00 PM',
  Dinner: '5:00 PM – 8:00 PM',
};
