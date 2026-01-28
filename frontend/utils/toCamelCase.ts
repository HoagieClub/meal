/**
 * @overview Utility functions to convert between camelCase and snake_case.
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
 * Converts an object from snake_case to camelCase.
 *
 * @param obj - The object to convert.
 * @returns The converted object.
 */
export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
        toCamelCase(value),
      ])
    );
  }

  return obj; // Base case: return primitive values as-is
};

/**
 * Converts an object from camelCase to snake_case.
 *
 * @param obj - The object to convert.
 * @returns The converted object.
 */
export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(/([A-Z])/g, '_$1').toLowerCase(),
        toSnakeCase(value),
      ])
    );
  }
  return obj;
};
