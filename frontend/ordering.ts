/**
 * @overview Canonical display ordering for the Hoagie Meal app.
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

import type { DiningHall } from '@/types/types';

// Canonical display order for residential dining halls.
export const RESIDENTIAL_HALL_ORDER: DiningHall[] = [
  'Yeh College & NCW',
  'Mathey & Rockefeller Colleges',
  'Whitman & Butler Colleges',
  'Forbes College',
  'Center for Jewish Life',
  'Graduate College',
];

// Canonical display order for retail locations.
export const RETAIL_LOCATION_ORDER: DiningHall[] = [
  'Frist Gallery',
  'EQuad Cafe',
  'Shultz Cafe',
  'Genomics Cafe',
  'Chemistry CaFe',
];

// Canonical order for menu section titles within a dining hall card.
// Sections not in this list appear at the end, sorted alphabetically.
export const SECTION_TITLE_ORDER: string[] = [
  'Early Entree',
  'At the grill',
  'Breakfast Bars',
  'Main Entree',
  'Entree',
  'Vegetarian & Vegan Entree',
  'Specialty Bars',
  'Action Station',
  'Asian Station',
  'Pasta Station',
  'Pizza Station',
  'Entree & Sides',
  'Global Kitchen',
  'Panini',
  'Quesadillas',
  'Pasta',
  'Sandwich',
  'Sandwiches',
  'Gallery Sandwiches',
  'Food for Thought',
  'Grill',
  'On the Side',
  'Sides',
  'Soups',
  'Soup',
  'Salads',
  'Salad',
  'Gallery Salads',
  'Appetizers',
  'Desserts',
  'Breakfast',
  "Grab 'N Go",
  'Grab N Go',
  'Grab n Go',
];

// Returns the sort index of an item against a canonical list. Unknown items → Infinity.
export function canonicalIndex(item: string, order: readonly string[]): number {
  const idx = order.indexOf(item);
  return idx === -1 ? Infinity : idx;
}
