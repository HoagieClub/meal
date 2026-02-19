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

import { Allergen, DiningHall } from '@/types/types';

// Meal ranges that maps from meal type to their corresponding range.
export const MEAL_RANGES: Record<string, string> = {
  Breakfast: '7:30 AM – 10:30 AM',
  Lunch: '11:30 AM – 2:00 PM',
  Dinner: '5:00 PM – 8:00 PM',
  Brunch: '10:00 AM – 2:00 PM',
};

// Icon path map for allergens.
export const ALLERGEN_ICON_MAP: Record<Allergen, string> = {
  Peanut: '/images/icons/peanut.svg',
  Coconut: '/images/icons/coconut.svg',
  Eggs: '/images/icons/egg.svg',
  Milk: '/images/icons/milk.svg',
  Wheat: '/images/icons/wheat.svg',
  Soybeans: '/images/icons/soybean.svg',
  Crustacean: '/images/icons/shellfish.svg',
  Alcohol: '/images/icons/alcohol.svg',
  Fish: '/images/icons/fish.svg',
  Sesame: '/images/icons/sesame.svg',
  Gluten: '/images/icons/gluten.svg',
};

// Display name map for dining halls. Maps backend API names to short user-facing nicknames.
export const DINING_HALL_DISPLAY_NAMES: Record<DiningHall, string> = {
  'Forbes College': 'Forbes',
  'Mathey & Rockefeller Colleges': 'Rocky / Mathey',
  'Whitman & Butler Colleges': 'Whitman / Butler',
  'Yeh College & NCW': 'Yeh / NCW',
  'Center for Jewish Life': 'CJL',
  'Graduate College': 'Grad',
  'Chemistry CaFe': 'Chemistry',
  'EQuad Cafe': 'EQuad',
  'Frist Gallery': 'Frist',
  'Genomics Cafe': 'Genomics',
  'Shultz Cafe': 'Shultz',
};


