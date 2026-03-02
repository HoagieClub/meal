/**
 * @overview Utility functions for the dining app.
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

/**
 * Helper to convert string/number to number for calculations.
 *
 * @param value - The value to convert to a number.
 * @returns The number.
 */
export const toNumber = (value: string | number | null | undefined): number => {
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
export const calculateDVPercentage = (amount: number, dailyValue: number): number | null => {
  if (!amount || amount === 0) return null;
  return Math.round((amount / dailyValue) * 100);
};
