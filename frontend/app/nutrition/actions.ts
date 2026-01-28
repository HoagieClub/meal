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

/**
 * Macronutrients data.
 *
 * @param nutrition - The nutrition to display.
 * @returns The macronutrients data.
 */
export const getMacronutrients = (nutrition: MenuItemNutrition) => {
  // Get the macronutrients from the nutrition
  const totalFat = toNumber(nutrition?.totalFat);
  const saturatedFat = toNumber(nutrition?.saturatedFat);
  const cholesterol = toNumber(nutrition?.cholesterol);
  const sodium = toNumber(nutrition?.sodium);
  const totalCarbohydrates = toNumber(nutrition?.totalCarbohydrates);
  const dietaryFiber = toNumber(nutrition?.dietaryFiber);
  const sugars = toNumber(nutrition?.sugars);
  const protein = toNumber(nutrition?.protein);

  // Calculate the dv percentages for the macronutrients
  const totalFatDVPercent = calculateDVPercentage(totalFat, 78);
  const saturatedFatDVPercent = calculateDVPercentage(saturatedFat, 20);
  const cholesterolDVPercent = calculateDVPercentage(cholesterol, 300);
  const sodiumDVPercent = calculateDVPercentage(sodium, 2300);
  const totalCarbohydratesDVPercent = calculateDVPercentage(totalCarbohydrates, 275);
  const dietaryFiberDVPercent = calculateDVPercentage(dietaryFiber, 28);
  const sugarsDVPercent = calculateDVPercentage(sugars, 50);
  const proteinDVPercent = null;

  // Return the macronutrients data
  return [
    {
      label: 'Total Fat',
      amount: totalFat,
      unit: 'g',
      dvPercent: totalFatDVPercent,
    },
    {
      label: 'Saturated Fat',
      amount: saturatedFat,
      unit: 'g',
      dvPercent: saturatedFatDVPercent,
    },
    {
      label: 'Cholesterol',
      amount: cholesterol,
      unit: 'mg',
      dvPercent: cholesterolDVPercent,
    },
    {
      label: 'Sodium',
      amount: sodium,
      unit: 'mg',
      dvPercent: sodiumDVPercent,
    },
    {
      label: 'Total Carbohydrates',
      amount: totalCarbohydrates,
      unit: 'g',
      dvPercent: totalCarbohydratesDVPercent,
    },
    {
      label: 'Dietary Fiber',
      amount: dietaryFiber,
      unit: 'g',
      dvPercent: dietaryFiberDVPercent,
    },
    {
      label: 'Sugars',
      amount: sugars,
      unit: 'g',
      dvPercent: sugarsDVPercent,
    },
    {
      label: 'Protein',
      amount: protein,
      unit: 'g',
      dvPercent: proteinDVPercent,
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
  // Get the micronutrients from the nutrition
  const vitaminDDV = nutrition?.vitaminD?.toString() || null;
  const calciumDV = nutrition?.calcium?.toString() || null;
  const ironDV = nutrition?.iron?.toString() || null;
  const potassiumDV = nutrition?.potassium?.toString() || null;

  // Calculate the dv percentages for the micronutrients
  return [
    {
      label: 'Vitamin D',
      dvPercent: vitaminDDV,
    },
    {
      label: 'Calcium',
      dvPercent: calciumDV,
    },
    {
      label: 'Iron',
      dvPercent: ironDV,
    },
    {
      label: 'Potassium',
      dvPercent: potassiumDV,
    },
  ];
};
