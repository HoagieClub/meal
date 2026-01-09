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

import { MenuItemNutrition } from '@/types/types';
import { toNumber, calculateDVPercentage } from '@/utils/dining';

const MACRONUTRIENTS_MAP: Record<keyof MenuItemNutrition, string> = {
  totalFat: 'Total Fat',
  saturatedFat: 'Saturated Fat',
  cholesterol: 'Cholesterol',
  sodium: 'Sodium',
  totalCarbohydrates: 'Total Carbohydrates',
  dietaryFiber: 'Dietary Fiber',
  sugars: 'Sugars',
};

const MACRONUTRIENTS_DAILY_VALUES: Record<keyof MenuItemNutrition, number> = {
  totalFat: 78,
  saturatedFat: 20,
  cholesterol: 300,
  sodium: 2300,
  totalCarbohydrates: 275,
  dietaryFiber: 28,
  sugars: 50,
  protein: 50,
};

const MACRONUTRIENTS_UNITS: Record<keyof MenuItemNutrition, string> = {
  totalFat: 'g',
  saturatedFat: 'g',
  cholesterol: 'mg',
  sodium: 'mg',
  totalCarbohydrates: 'g',
  dietaryFiber: 'g',
  sugars: 'g',
  protein: 'g',
};

const MICRONUTRIENTS_MAP: Record<keyof MenuItemNutrition, string> = {
  vitaminD: 'Vitamin D',
  calcium: 'Calcium',
  iron: 'Iron',
  potassium: 'Potassium',
};

const MICRONUTRIENTS_UNITS: Record<keyof MenuItemNutrition, string> = {
  vitaminD: 'mcg',
  calcium: 'mg',
  iron: 'mg',
  potassium: 'mg',
};

const MICRONUTRIENTS_DAILY_VALUES: Record<keyof MenuItemNutrition, number> = {
  vitaminD: 20,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
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
