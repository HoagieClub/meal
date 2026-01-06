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
import { DiningHall, Allergen, DietaryTag } from '@/types/dining';

const CACHE_KEYS = {
  PINNED_HALLS: 'diningPinnedHalls',
  DINING_HALLS: 'diningHallsPreferences',
  ALLERGENS: 'allergensPreferences',
  DIETARY_RESTRICTIONS: 'dietaryRestrictionsPreferences',
  SHOW_NUTRITION: 'showNutritionPreference',
} as const;

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

  /**
   * Checks if a dining hall is pinned
   *
   * @param diningHall - DiningHall to check
   * @returns Boolean indicating if the dining hall is pinned.
   */
  const isPinned = (diningHall: DiningHall): boolean => {
    return pinnedHalls.includes(diningHall);
  };

  /**
   * Checks if a dining hall is in preferences
   *
   * @param diningHall - DiningHall to check
   * @returns Boolean indicating if the dining hall is selected.
   */
  const hasDiningHall = (diningHall: DiningHall): boolean => {
    return diningHalls.includes(diningHall);
  };

  /**
   * Checks if an allergen is in preferences
   *
   * @param allergen - Allergen to check
   * @returns Boolean indicating if the allergen is selected.
   */
  const hasAllergen = (allergen: Allergen): boolean => {
    return allergens.includes(allergen);
  };

  /**
   * Checks if a dietary restriction is in preferences
   *
   * @param dietaryRestriction - DietaryTag to check
   * @returns Boolean indicating if the dietary restriction is selected.
   */
  const hasDietaryRestriction = (dietaryRestriction: DietaryTag): boolean => {
    return dietaryRestrictions.includes(dietaryRestriction);
  };

  /**
   * Checks if show nutrition is enabled
   *
   * @returns Boolean indicating if show nutrition is enabled.
   */
  const isShowNutritionEnabled = (): boolean => {
    return showNutrition;
  };

  /**
   * Adds a dining hall to pinned halls
   *
   * @param diningHall - DiningHall to add
   * @returns void
   */
  const addPinnedHall = (diningHall: DiningHall): void => {
    setPinnedHalls((prev) => {
      if (prev.includes(diningHall)) {
        return prev;
      }
      return [...prev, diningHall];
    });
  };

  /**
   * Adds a dining hall to preferences
   *
   * @param diningHall - DiningHall to add
   * @returns void
   */
  const addDiningHall = (diningHall: DiningHall): void => {
    setDiningHalls((prev) => {
      if (prev.includes(diningHall)) {
        return prev;
      }
      return [...prev, diningHall];
    });
  };

  /**
   * Adds an allergen to preferences
   *
   * @param allergen - Allergen to add
   * @returns void
   */
  const addAllergen = (allergen: Allergen): void => {
    setAllergens((prev) => {
      if (prev.includes(allergen)) {
        return prev;
      }
      return [...prev, allergen];
    });
  };

  /**
   * Adds a dietary restriction to preferences
   *
   * @param dietaryRestriction - DietaryTag to add
   * @returns void
   */
  const addDietaryRestriction = (dietaryRestriction: DietaryTag): void => {
    setDietaryRestrictions((prev) => {
      if (prev.includes(dietaryRestriction)) {
        return prev;
      }
      return [...prev, dietaryRestriction];
    });
  };

  /**
   * Removes a dining hall from pinned halls
   *
   * @param diningHall - DiningHall to remove
   * @returns void
   */
  const removePinnedHall = (diningHall: DiningHall): void => {
    setPinnedHalls((prev) => {
      if (!prev.includes(diningHall)) {
        return prev;
      }
      return prev.filter((hall) => hall !== diningHall);
    });
  };

  /**
   * Removes a dining hall from preferences
   *
   * @param diningHall - DiningHall to remove
   * @returns void
   */
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

  /**
   * Removes an allergen from preferences
   *
   * @param allergen - Allergen to remove
   * @returns void
   */
  const removeAllergen = (allergen: Allergen): void => {
    setAllergens((prev) => {
      if (!prev.includes(allergen)) {
        return prev;
      }
      return prev.filter((a) => a !== allergen);
    });
  };

  /**
   * Removes a dietary restriction from preferences
   *
   * @param dietaryRestriction - DietaryTag to remove
   * @returns void
   */
  const removeDietaryRestriction = (dietaryRestriction: DietaryTag): void => {
    setDietaryRestrictions((prev) => {
      if (!prev.includes(dietaryRestriction)) {
        return prev;
      }
      return prev.filter((restriction) => restriction !== dietaryRestriction);
    });
  };

  /**
   * Toggles a dining hall's pinned status
   *
   * @param diningHall - DiningHall to toggle
   * @returns void
   */
  const togglePinnedHall = (diningHall: DiningHall): void => {
    if (isPinned(diningHall)) {
      removePinnedHall(diningHall);
    } else {
      addPinnedHall(diningHall);
    }
  };

  /**
   * Toggles a dining hall in preferences
   *
   * @param diningHall - DiningHall to toggle
   * @returns void
   */
  const toggleDiningHall = (diningHall: DiningHall): void => {
    if (hasDiningHall(diningHall)) {
      removeDiningHall(diningHall);
    } else {
      addDiningHall(diningHall);
    }
  };

  /**
   * Toggles an allergen in preferences
   *
   * @param allergen - Allergen to toggle
   * @returns void
   */
  const toggleAllergen = (allergen: Allergen): void => {
    if (hasAllergen(allergen)) {
      removeAllergen(allergen);
    } else {
      addAllergen(allergen);
    }
  };

  /**
   * Toggles a dietary restriction in preferences
   *
   * @param dietaryRestriction - DietaryTag to toggle
   * @returns void
   */
  const toggleDietaryRestriction = (dietaryRestriction: DietaryTag): void => {
    if (hasDietaryRestriction(dietaryRestriction)) {
      removeDietaryRestriction(dietaryRestriction);
    } else {
      addDietaryRestriction(dietaryRestriction);
    }
  };

  /**
   * Toggles show nutrition
   *
   * @returns void
   */
  const toggleShowNutrition = (): void => {
    setShowNutrition((prev) => !prev);
  };

  /**
   * Clears all pinned halls
   *
   * @returns void
   */
  const clearPinnedHalls = (): void => {
    setPinnedHalls(DEFAULT_PINNED_HALLS);
  };

  /**
   * Clears all dining halls preferences
   *
   * @returns void
   */
  const clearDiningHalls = (): void => {
    setDiningHalls(DEFAULT_DINING_HALLS);
  };

  /**
   * Clears all allergens preferences
   *
   * @returns void
   */
  const clearAllergens = (): void => {
    setAllergens(DEFAULT_ALLERGENS);
  };

  /**
   * Clears all dietary restrictions preferences
   *
   * @returns void
   */
  const clearDietaryRestrictions = (): void => {
    setDietaryRestrictions(DEFAULT_DIETARY_RESTRICTIONS);
  };

  /**
   * Clears show nutrition preference
   *
   * @returns void
   */
  const clearShowNutrition = (): void => {
    setShowNutrition(DEFAULT_SHOW_NUTRITION);
  };

  /**
   * Clears all preferences
   *
   * @returns void
   */
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
