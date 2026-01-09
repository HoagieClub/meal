/**
 * @overview Nutrition data.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { MenuItemNutrition } from '@/types/dining';

/**
 * Helper to convert string/number to number for calculations.
 *
 * @param value - The value to convert to a number.
 * @returns The number.
 */
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Helper to calculate the dv percentage.
 *
 * @param amount - The amount of the nutrient.
 * @param dailyValue - The daily value of the nutrient.
 * @returns The dv percentage.
 */
const calculateDVPercentage = (amount: number, dailyValue: number): number | null => {
  if (!amount || amount === 0) return null;
  return Math.round((amount / dailyValue) * 100);
};

/**
 * Macronutrients data.
 *
 * @param nutrition - The nutrition to display.
 * @returns The macronutrients data.
 */
export const getMacronutrients = (nutrition: MenuItemNutrition) => {
  return [
    {
      label: 'Total Fat',
      amount: toNumber(nutrition?.totalFat),
      unit: 'g',
      dvPercent: calculateDVPercentage(toNumber(nutrition?.totalFat), 78),
    },
    {
      label: 'Saturated Fat',
      amount: toNumber(nutrition?.saturatedFat),
      unit: 'g',
      dvPercent: calculateDVPercentage(toNumber(nutrition?.saturatedFat), 20),
    },
    {
      label: 'Cholesterol',
      amount: toNumber(nutrition?.cholesterol),
      unit: 'mg',
      dvPercent: calculateDVPercentage(toNumber(nutrition?.cholesterol), 300),
    },
    {
      label: 'Sodium',
      amount: toNumber(nutrition?.sodium),
      unit: 'mg',
      dvPercent: calculateDVPercentage(toNumber(nutrition?.sodium), 2300),
    },
    {
      label: 'Total Carbohydrates',
      amount: toNumber(nutrition?.totalCarbohydrates),
      unit: 'g',
      dvPercent: calculateDVPercentage(toNumber(nutrition?.totalCarbohydrates), 275),
    },
    {
      label: 'Dietary Fiber',
      amount: toNumber(nutrition?.dietaryFiber),
      unit: 'g',
      dvPercent: calculateDVPercentage(toNumber(nutrition?.dietaryFiber), 28),
    },
    {
      label: 'Sugars',
      amount: toNumber(nutrition?.sugars),
      unit: 'g',
      dvPercent: null,
    },
    {
      label: 'Protein',
      amount: toNumber(nutrition?.protein),
      unit: 'g',
      dvPercent: null,
    },
  ];
};

/**
 * Micronutrients data.
 *
 * @param nutrition - The nutrition to display.
 * @returns The micronutrients data.
 */
export const getMicronutrients = (nutrition: MenuItemNutrition) => {
  return [
    {
      label: 'Vitamin D',
      dvPercent: nutrition?.vitaminD?.toString() || null,
    },
    {
      label: 'Calcium',
      dvPercent: nutrition?.calcium?.toString() || null,
    },
    {
      label: 'Iron',
      dvPercent: nutrition?.iron?.toString() || null,
    },
    {
      label: 'Potassium',
      dvPercent: nutrition?.potassium?.toString() || null,
    },
  ];
};
