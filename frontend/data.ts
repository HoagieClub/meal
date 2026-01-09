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

import { Meal, Allergen, DietaryTag } from '@/types/types';

// Meal ranges that maps from meal type to their corresponding range.
export const MEAL_RANGES: Record<Meal, string> = {
  Breakfast: '7:30 AM – 10:30 AM',
  Lunch: '11:30 AM – 2:00 PM',
  Dinner: '5:00 PM – 8:00 PM',
};

// Diet label map that maps from dietary tag type to their corresponding label.
export const DIET_LABEL_MAP: Record<DietaryTag, string> = {
  Vegetarian: 'V',
  Vegan: 'VG',
  Halal: 'H',
  Kosher: 'K',
};

// Allergen emoji map that maps from allergen type to their corresponding emoji.
export const ALLERGEN_EMOJI_MAP: Record<Allergen, string> = {
  Peanut: '🥜',
  Coconut: '🌰',
  Eggs: '🥚',
  Milk: '🥛',
  Wheat: '🌾',
  Soybeans: '🌱',
  Crustacean: '🦞',
  Alcohol: '🍺',
  Gluten: '🍞',
  Fish: '🐟',
  Sesame: '🍔',
};


