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

import { MenuItem } from '@/types/dining';
import { MacronutrientRowProps, MicronutrientRowProps } from './components/nutrient-rows';

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
 * @param menuItem - The menu item to display.
 * @returns The macronutrients data.
 */
export const MACRONUTRIENTS = (menuItem: MenuItem): MacronutrientRowProps[] => {
  return [
    {
      label: 'Total Fat',
      amount: toNumber(menuItem?.totalFat),
      unit: 'g',
      dvPercent: calculateDVPercentage(toNumber(menuItem?.totalFat), 78),
    },
    {
      label: 'Saturated Fat',
      amount: toNumber(menuItem?.saturatedFat),
      unit: 'g',
      dvPercent: calculateDVPercentage(toNumber(menuItem?.saturatedFat), 20),
    },
    {
      label: 'Cholesterol',
      amount: toNumber(menuItem?.cholesterol),
      unit: 'mg',
      dvPercent: calculateDVPercentage(toNumber(menuItem?.cholesterol), 300),
    },
    {
      label: 'Sodium',
      amount: toNumber(menuItem?.sodium),
      unit: 'mg',
      dvPercent: calculateDVPercentage(toNumber(menuItem?.sodium), 2300),
    },
    {
      label: 'Total Carbohydrates',
      amount: toNumber(menuItem?.totalCarbohydrates),
      unit: 'g',
      dvPercent: calculateDVPercentage(toNumber(menuItem?.totalCarbohydrates), 275),
    },
    {
      label: 'Dietary Fiber',
      amount: toNumber(menuItem?.dietaryFiber),
      unit: 'g',
      dvPercent: calculateDVPercentage(toNumber(menuItem?.dietaryFiber), 28),
    },
    {
      label: 'Sugars',
      amount: toNumber(menuItem?.sugars),
      unit: 'g',
      dvPercent: null,
    },
    {
      label: 'Protein',
      amount: toNumber(menuItem?.protein),
      unit: 'g',
      dvPercent: null,
    },
  ];
};

/**
 * Micronutrients data.
 *
 * @param menuItem - The menu item to display.
 * @returns The micronutrients data.
 */
export const MICRONUTRIENTS = (menuItem: MenuItem): MicronutrientRowProps[] => {
  return [
    {
      label: 'Vitamin D',
      dvPercent: menuItem?.vitaminD?.toString() || null,
    },
    {
      label: 'Calcium',
      dvPercent: menuItem?.calcium?.toString() || null,
    },
    {
      label: 'Iron',
      dvPercent: menuItem?.iron?.toString() || null,
    },
    {
      label: 'Potassium',
      dvPercent: menuItem?.potassium?.toString() || null,
    },
  ];
};
