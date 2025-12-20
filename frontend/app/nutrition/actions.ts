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

import { NutrientInfo } from '@/data';
import { MacronutrientRowProps, MicronutrientRowProps } from './components/nutrient-rows';

/**
 * Macronutrients data.
 *
 * @param nutrient - The nutrient to display.
 * @returns The macronutrients data.
 */
const MACRONUTRIENTS = (nutrient: NutrientInfo): MacronutrientRowProps[] => {
  const calculateDVPercentage = (amount: number, dailyValue: number) => {
    return Math.round((amount / dailyValue) * 100);
  };
  return [
    {
      label: 'Total Fat',
      amount: nutrient?.totalFat,
      unit: 'g',
      dvPercent: calculateDVPercentage(nutrient?.totalFat, 78),
    },
    {
      label: 'Saturated Fat',
      amount: nutrient?.saturatedFat,
      unit: 'g',
      dvPercent: calculateDVPercentage(nutrient?.saturatedFat, 20),
    },
    {
      label: 'Cholesterol',
      amount: nutrient?.cholesterol,
      unit: 'mg',
      dvPercent: calculateDVPercentage(nutrient?.cholesterol, 300),
    },
    {
      label: 'Sodium',
      amount: nutrient?.sodium,
      unit: 'mg',
      dvPercent: calculateDVPercentage(nutrient?.sodium, 2300),
    },
    {
      label: 'Total Carbohydrates',
      amount: nutrient?.totalCarbohydrates,
      unit: 'g',
      dvPercent: calculateDVPercentage(nutrient?.totalCarbohydrates, 275),
    },
    {
      label: 'Dietary Fiber',
      amount: nutrient?.dietaryFiber,
      unit: 'g',
      dvPercent: calculateDVPercentage(nutrient?.dietaryFiber, 28),
    },
    {
      label: 'Sugars',
      amount: nutrient?.sugars,
      unit: 'g',
      dvPercent: null,
    },
    {
      label: 'Protein',
      amount: nutrient?.protein,
      unit: 'g',
      dvPercent: null,
    },
  ];
};

/**
 * Micronutrients data.
 *
 * @param nutrient - The nutrient to display.
 * @returns The micronutrients data.
 */
const MICRONUTRIENTS = (nutrient: NutrientInfo): MicronutrientRowProps[] => {
  return [
    {
      label: 'Vitamin D',
      dvPercent: nutrient?.vitaminD,
    },
    {
      label: 'Calcium',
      dvPercent: nutrient?.calcium,
    },
    {
      label: 'Iron',
      dvPercent: nutrient?.iron,
    },
    {
      label: 'Potassium',
      dvPercent: nutrient?.potassium,
    },
  ];
};

export { MACRONUTRIENTS, MICRONUTRIENTS };
