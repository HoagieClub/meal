/**
 * @overview Hook for managing user dining preferences cache.
 * Uses separate caches for different preference types:
 * - Pinned halls cache: DiningHall[]
 * - Dining halls preferences cache: DiningHall[]
 * - Allergens cache: Allergen[]
 * - Show nutrition cache: boolean
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

'use client';

import { DINING_HALLS } from '@/types/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DiningHall, Allergen } from '@/types/types';

// Keys for each preference type
const CACHE_KEYS = {
  PINNED_HALLS: 'diningPinnedHalls',
  DINING_HALLS: 'diningHallsPreferences',
  ALLERGENS: 'allergensPreferences',
} as const;

// Default values for each preference type
const DEFAULT_PINNED_HALLS: DiningHall[] = [];
const DEFAULT_DINING_HALLS: DiningHall[] = Array.from(DINING_HALLS);
const DEFAULT_ALLERGENS: Allergen[] = [];

/**
 * Hook for managing user dining preferences cache
 *
 * @returns Object with cache state and functions
 */
export function usePreferencesCache() {
  // Pinned halls cache
  const [pinnedHalls, setPinnedHalls] = useLocalStorage<DiningHall[]>({
    key: CACHE_KEYS.PINNED_HALLS,
    initialValue: DEFAULT_PINNED_HALLS,
    expiryInMs: 30 * 24 * 60 * 60 * 1000, // 1 month
  });

  // Dining halls preferences cache
  const [diningHalls, setDiningHalls] = useLocalStorage<DiningHall[]>({
    key: CACHE_KEYS.DINING_HALLS,
    initialValue: DEFAULT_DINING_HALLS,
    expiryInMs: 30 * 24 * 60 * 60 * 1000, // 1 month
  });

  // Allergens preferences cache
  const [allergens, setAllergens] = useLocalStorage<Allergen[]>({
    key: CACHE_KEYS.ALLERGENS,
    initialValue: DEFAULT_ALLERGENS,
    expiryInMs: 30 * 24 * 60 * 60 * 1000, // 1 month
  });

  // Check if a dining hall is pinned
  const isPinned = (diningHall: DiningHall): boolean => {
    return pinnedHalls.includes(diningHall);
  };

  // Check if a dining hall is in preferences
  const hasDiningHall = (diningHall: DiningHall): boolean => {
    return diningHalls.includes(diningHall);
  };

  // Check if an allergen is in preferences
  const hasAllergen = (allergen: Allergen): boolean => {
    return allergens.includes(allergen);
  };

  // Toggle a dining hall's pinned status
  const togglePinnedHall = (diningHall: DiningHall): void => {
    setPinnedHalls((prev) => {
      if (prev.includes(diningHall)) {
        return prev.filter((hall) => hall !== diningHall);
      }
      return [...prev, diningHall];
    });
  };

  // Toggle a dining hall in preferences
  const toggleDiningHall = (diningHall: DiningHall): void => {
    setDiningHalls((prev) => {
      if (prev.includes(diningHall)) {
        return prev.filter((hall) => hall !== diningHall);
      }
      return [...prev, diningHall];
    });
  };

  // Toggle an allergen in preferences
  const toggleAllergen = (allergen: Allergen): void => {
    setAllergens((prev) => {
      if (prev.includes(allergen)) {
        return prev.filter((a) => a !== allergen);
      }
      return [...prev, allergen];
    });
  };

  // Clear all pinned halls
  const clearPinnedHalls = (): void => {
    setPinnedHalls(DEFAULT_PINNED_HALLS);
  };

  // Clear all dining halls preferences
  const clearDiningHalls = (): void => {
    setDiningHalls(DEFAULT_DINING_HALLS);
  };

  // Clear all allergens preferences
  const clearAllergens = (): void => {
    setAllergens(DEFAULT_ALLERGENS);
  };

  // Clear all preferences
  const clearAll = (): void => {
    clearPinnedHalls();
    clearDiningHalls();
    clearAllergens();
  };

  return {
    // State
    pinnedHalls,
    diningHalls,
    allergens,

    // Checkers
    isPinned,
    hasDiningHall,
    hasAllergen,

    // Togglers
    togglePinnedHall,
    toggleDiningHall,
    toggleAllergen,

    // Clearers
    clearPinnedHalls,
    clearDiningHalls,
    clearAllergens,
    clearAll,
  };
}
