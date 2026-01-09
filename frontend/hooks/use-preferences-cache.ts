/**
 * @overview Hook for managing user dining preferences cache.
 * Uses separate caches for different preference types:
 * - Pinned halls cache: DiningHall[]
 * - Dining halls preferences cache: DiningHall[]
 * - Allergens cache: Allergen[]
 * - Dietary restrictions cache: DietaryTag[]
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

import { DINING_HALLS } from '@/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DiningHall, Allergen, DietaryTag } from '@/types/types';

// Keys for each preference type
const CACHE_KEYS = {
  PINNED_HALLS: 'diningPinnedHalls',
  DINING_HALLS: 'diningHallsPreferences',
  ALLERGENS: 'allergensPreferences',
  DIETARY_RESTRICTIONS: 'dietaryRestrictionsPreferences',
  SHOW_NUTRITION: 'showNutritionPreference',
} as const;

// Default values for each preference type
const DEFAULT_PINNED_HALLS: DiningHall[] = [];
const DEFAULT_DINING_HALLS: DiningHall[] = DINING_HALLS;
const DEFAULT_ALLERGENS: Allergen[] = [];
const DEFAULT_DIETARY_RESTRICTIONS: DietaryTag[] = [];
const DEFAULT_SHOW_NUTRITION: boolean = true;

/**
 * Hook for managing user dining preferences cache
 *
 * @returns Object with cache state and functions
 */
export function usePreferencesCache() {
  // Pinned halls cache
  const [pinnedHalls, setPinnedHalls, pinnedHallsLoading] = useLocalStorage<DiningHall[]>({
    key: CACHE_KEYS.PINNED_HALLS,
    initialValue: DEFAULT_PINNED_HALLS,
  });

  // Dining halls preferences cache
  const [diningHalls, setDiningHalls, diningHallsLoading] = useLocalStorage<DiningHall[]>({
    key: CACHE_KEYS.DINING_HALLS,
    initialValue: DEFAULT_DINING_HALLS,
  });

  // Allergens preferences cache
  const [allergens, setAllergens, allergensLoading] = useLocalStorage<Allergen[]>({
    key: CACHE_KEYS.ALLERGENS,
    initialValue: DEFAULT_ALLERGENS,
  });

  // Dietary restrictions preferences cache
  const [dietaryRestrictions, setDietaryRestrictions, dietaryRestrictionsLoading] = useLocalStorage<
    DietaryTag[]
  >({
    key: CACHE_KEYS.DIETARY_RESTRICTIONS,
    initialValue: DEFAULT_DIETARY_RESTRICTIONS,
  });

  // Show nutrition preference cache
  const [showNutrition, setShowNutrition, showNutritionLoading] = useLocalStorage<boolean>({
    key: CACHE_KEYS.SHOW_NUTRITION,
    initialValue: DEFAULT_SHOW_NUTRITION,
  });

  // Loading state
  const loading =
    pinnedHallsLoading ||
    diningHallsLoading ||
    allergensLoading ||
    dietaryRestrictionsLoading ||
    showNutritionLoading;

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

  // Check if a dietary restriction is in preferences
  const hasDietaryRestriction = (dietaryRestriction: DietaryTag): boolean => {
    return dietaryRestrictions.includes(dietaryRestriction);
  };

  // Check if show nutrition is enabled
  const isShowNutritionEnabled = (): boolean => {
    return showNutrition;
  };

  // Add a dining hall to pinned halls
  const addPinnedHall = (diningHall: DiningHall): void => {
    setPinnedHalls((prev) => {
      if (prev.includes(diningHall)) {
        return prev;
      }
      return [...prev, diningHall];
    });
  };

  // Add a dining hall to preferences
  const addDiningHall = (diningHall: DiningHall): void => {
    setDiningHalls((prev) => {
      if (prev.includes(diningHall)) {
        return prev;
      }
      return [...prev, diningHall];
    });
  };

  // Add an allergen to preferences
  const addAllergen = (allergen: Allergen): void => {
    setAllergens((prev) => {
      if (prev.includes(allergen)) {
        return prev;
      }
      return [...prev, allergen];
    });
  };

  // Add a dietary restriction to preferences
  const addDietaryRestriction = (dietaryRestriction: DietaryTag): void => {
    setDietaryRestrictions((prev) => {
      if (prev.includes(dietaryRestriction)) {
        return prev;
      }
      return [...prev, dietaryRestriction];
    });
  };

  // Remove a dining hall from pinned halls
  const removePinnedHall = (diningHall: DiningHall): void => {
    setPinnedHalls((prev) => {
      if (!prev.includes(diningHall)) {
        return prev;
      }
      return prev.filter((hall) => hall !== diningHall);
    });
  };

  // Remove a dining hall from preferences
  const removeDiningHall = (diningHall: DiningHall): void => {
    setDiningHalls((prev) => {
      if (!prev.includes(diningHall)) {
        return prev;
      }
      const filtered = prev.filter((hall) => hall !== diningHall);
      if (filtered.length === 0) {
        return DEFAULT_DINING_HALLS;
      }
      return filtered;
    });
  };

  // Remove an allergen from preferences
  const removeAllergen = (allergen: Allergen): void => {
    setAllergens((prev) => {
      if (!prev.includes(allergen)) {
        return prev;
      }
      return prev.filter((a) => a !== allergen);
    });
  };

  // Remove a dietary restriction from preferences
  const removeDietaryRestriction = (dietaryRestriction: DietaryTag): void => {
    setDietaryRestrictions((prev) => {
      if (!prev.includes(dietaryRestriction)) {
        return prev;
      }
      return prev.filter((restriction) => restriction !== dietaryRestriction);
    });
  };

  // Toggle a dining hall's pinned status
  const togglePinnedHall = (diningHall: DiningHall): void => {
    if (isPinned(diningHall)) {
      removePinnedHall(diningHall);
    } else {
      addPinnedHall(diningHall);
    }
  };

  // Toggle a dining hall in preferences
  const toggleDiningHall = (diningHall: DiningHall): void => {
    if (hasDiningHall(diningHall)) {
      removeDiningHall(diningHall);
    } else {
      addDiningHall(diningHall);
    }
  };

  // Toggle an allergen in preferences
  const toggleAllergen = (allergen: Allergen): void => {
    if (hasAllergen(allergen)) {
      removeAllergen(allergen);
    } else {
      addAllergen(allergen);
    }
  };

  // Toggle a dietary restriction in preferences
  const toggleDietaryRestriction = (dietaryRestriction: DietaryTag): void => {
    if (hasDietaryRestriction(dietaryRestriction)) {
      removeDietaryRestriction(dietaryRestriction);
    } else {
      addDietaryRestriction(dietaryRestriction);
    }
  };

  // Toggle show nutrition
  const toggleShowNutrition = (): void => {
    setShowNutrition((prev) => !prev);
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

  // Clear all dietary restrictions preferences
  const clearDietaryRestrictions = (): void => {
    setDietaryRestrictions(DEFAULT_DIETARY_RESTRICTIONS);
  };

  // Clear show nutrition preference
  const clearShowNutrition = (): void => {
    setShowNutrition(DEFAULT_SHOW_NUTRITION);
  };

  // Clear all preferences
  const clearAll = (): void => {
    clearPinnedHalls();
    clearDiningHalls();
    clearAllergens();
    clearDietaryRestrictions();
    clearShowNutrition();
  };

  return {
    // State
    loading,
    pinnedHalls,
    diningHalls,
    allergens,
    dietaryRestrictions,
    showNutrition,

    // Checkers
    isPinned,
    hasDiningHall,
    hasAllergen,
    hasDietaryRestriction,
    isShowNutritionEnabled,

    // Adders
    addPinnedHall,
    addDiningHall,
    addAllergen,
    addDietaryRestriction,

    // Removers
    removePinnedHall,
    removeDiningHall,
    removeAllergen,
    removeDietaryRestriction,

    // Togglers
    togglePinnedHall,
    toggleDiningHall,
    toggleAllergen,
    toggleDietaryRestriction,
    toggleShowNutrition,

    // Clearers
    clearPinnedHalls,
    clearDiningHalls,
    clearAllergens,
    clearDietaryRestrictions,
    clearShowNutrition,
    clearAll,
  };
}
