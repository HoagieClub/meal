/**
 * @overview Utility functions related to handling Dining API data.
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

import type { Meal } from '@/types/dining';

interface TimeRange {
  start: number; // Minutes since midnight
  end: number; // Minutes since midnight
  meal: Meal;
}

// Convert time to minutes since midnight
const toMinutes = (hour: number, minute: number = 0): number => hour * 60 + minute;

// Dining schedule
const WEEKDAY_SCHEDULE: TimeRange[] = [
  { start: toMinutes(7, 30), end: toMinutes(11), meal: 'Breakfast' },
  { start: toMinutes(11, 30), end: toMinutes(14), meal: 'Lunch' },
  { start: toMinutes(17), end: toMinutes(20), meal: 'Dinner' },
];

const WEEKEND_SCHEDULE: TimeRange[] = [
  { start: toMinutes(10), end: toMinutes(14), meal: 'Brunch' },
  { start: toMinutes(17), end: toMinutes(20), meal: 'Dinner' },
];

export function getNextMeal(date: Date = new Date()): {
  date: Date;
  meal: Meal;
} {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const schedule = isWeekend ? WEEKEND_SCHEDULE : WEEKDAY_SCHEDULE;
  const currentMinutes = toMinutes(date.getHours(), date.getMinutes());

  // Find current or next meal today
  for (const period of schedule) {
    if (currentMinutes < period.end) {
      return { date, meal: period.meal };
    }
  }

  // If no meals left today, get first meal of next day
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);

  const isNextDayWeekend = nextDay.getDay() === 0 || nextDay.getDay() === 6;
  const firstMeal = isNextDayWeekend ? 'Brunch' : 'Breakfast';

  return { date: nextDay, meal: firstMeal };
}

export function formatMenuId(date: Date, meal: Meal): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}-${meal}`;
}

// Main function to use in route handler
export function getCurrentMenuId(): string {
  const { date, meal } = getNextMeal();
  return formatMenuId(date, meal);
}

// Extracts allergens from the structured UIMenuItem.allergens array
export function extractAllergens(items: UIMenuItem[]): Set<string> {
  const set = new Set<string>();
  items.forEach((item) => {
    item.allergens.forEach((allergen) => {
      // Normalize to lowercase to match ALLERGEN_EMOJI keys
      set.add(allergen.toLowerCase());
    });
  });

  // ** Fallback: Check text as well for safety, in case backend data is sparse **
  items.forEach((i) => {
    const ds = (i.description + ' ' + i.name).toLowerCase();
    [
      'peanut',
      'tree nut',
      'eggs',
      'milk',
      'wheat',
      'soybeans',
      'crustacean',
      'alcohol',
      'gluten',
      'coconut',
      'fish',
      'sesame',
    ].forEach((all) => ds.includes(all) && set.add(all));
  });
  return set;
}

// Categorizes menu items into main entrée, vegan entrée, and soups
export function categorize(items: UIMenuItem[]) {
  const out = {
    'Main Entrée': [] as UIMenuItem[],
    'Vegan Entrée': [] as UIMenuItem[],
    Soups: [] as UIMenuItem[],
  };
  items.forEach((i) => {
    const nm = i.name.toLowerCase();
    const ds = i.description.toLowerCase();
    if (nm.includes('soup')) out.Soups.push(i);
    // Include items explicitly marked with dietary labels in the description
    else if (
      ds.includes('vegan') ||
      ds.includes('(vg)') ||
      ds.includes('vegetarian') ||
      ds.includes('(v)') ||
      nm.includes('tofu') ||
      nm.includes('vegetable')
    )
      out['Vegan Entrée'].push(i);
    else out['Main Entrée'].push(i);
  });
  return out;
}
