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

import { useLocalStorage } from '@/hooks/use-local-storage';
import { useMemo } from 'react';
import { DiningHall, Allergen, DietaryTag } from '@/types/dining';

const CACHE_KEYS = {
  PINNED_HALLS: 'diningPinnedHalls',
  DINING_HALLS: 'diningHallsPreferences',
  ALLERGENS: 'allergensPreferences',
  DIETARY_RESTRICTIONS: 'dietaryRestrictionsPreferences',
  SHOW_NUTRITION: 'showNutritionPreference',
} as const;

/**
 * Hook for managing user dining preferences cache.
 *
 * @returns Object with cache state and functions:
 *   - State: { loading, pinnedHalls, diningHalls, allergens, dietaryRestrictions, showNutrition }
 *   - Getters: { getPinnedHalls, getDiningHalls, getAllergens, getDietaryRestrictions, getShowNutrition, isPinned }
 *   - Checkers: { hasPinnedHall, hasDiningHall, hasAllergen, hasDietaryRestriction }
 *   - Setters: { setPinnedHalls, setDiningHalls, setAllergens, setDietaryRestrictions, setShowNutrition }
 *   - Adders: { addPinnedHall, addDiningHall, addAllergen, addDietaryRestriction }
 *   - Removers: { removePinnedHall, removeDiningHall, removeAllergen, removeDietaryRestriction }
 *   - Togglers: { togglePinnedHall, toggleDiningHall, toggleAllergen, toggleDietaryRestriction }
 *   - Clearers: { clearPinnedHalls, clearDiningHalls, clearAllergens, clearDietaryRestrictions, clearAll }
 */
export function usePreferencesCache() {
  const [pinnedHallsArray, setPinnedHallsArray, pinnedHallsLoading] = useLocalStorage<DiningHall[]>(
    {
      key: CACHE_KEYS.PINNED_HALLS,
      initialValue: [],
    }
  );

  const [diningHallsArray, setDiningHallsArray, diningHallsLoading] = useLocalStorage<DiningHall[]>(
    {
      key: CACHE_KEYS.DINING_HALLS,
      initialValue: [],
    }
  );

  const [allergensArray, setAllergensArray, allergensLoading] = useLocalStorage<Allergen[]>({
    key: CACHE_KEYS.ALLERGENS,
    initialValue: [],
  });

  const [dietaryRestrictionsArray, setDietaryRestrictionsArray, dietaryRestrictionsLoading] =
    useLocalStorage<DietaryTag[]>({
      key: CACHE_KEYS.DIETARY_RESTRICTIONS,
      initialValue: [],
    });

  const [showNutrition, setShowNutritionState, showNutritionLoading] = useLocalStorage<boolean>({
    key: CACHE_KEYS.SHOW_NUTRITION,
    initialValue: true,
  });

  const loading =
    pinnedHallsLoading ||
    diningHallsLoading ||
    allergensLoading ||
    dietaryRestrictionsLoading ||
    showNutritionLoading;

  // Convert arrays to Sets for efficient lookups
  const pinnedHalls = useMemo(() => new Set<DiningHall>(pinnedHallsArray), [pinnedHallsArray]);
  const diningHalls = useMemo(() => new Set<DiningHall>(diningHallsArray), [diningHallsArray]);
  const allergens = useMemo(() => new Set<Allergen>(allergensArray), [allergensArray]);
  const dietaryRestrictions = useMemo(
    () => new Set<DietaryTag>(dietaryRestrictionsArray),
    [dietaryRestrictionsArray]
  );

  /**
   * Gets all pinned halls.
   *
   * @returns Set of pinned DiningHall values. Structure: Set<DiningHall>
   */
  const getPinnedHalls = (): Set<DiningHall> => {
    return pinnedHalls;
  };

  /**
   * Gets all pinned halls as an array.
   *
   * @returns Array of pinned DiningHall values. Structure: DiningHall[]
   */
  const getPinnedHallsArray = (): DiningHall[] => {
    return pinnedHallsArray;
  };

  /**
   * Gets all dining halls preferences.
   *
   * @returns Set of selected DiningHall values. Structure: Set<DiningHall>
   */
  const getDiningHalls = (): Set<DiningHall> => {
    return diningHalls;
  };

  /**
   * Gets all dining halls preferences as an array.
   *
   * @returns Array of selected DiningHall values. Structure: DiningHall[]
   */
  const getDiningHallsArray = (): DiningHall[] => {
    return diningHallsArray;
  };

  /**
   * Gets all allergens preferences.
   *
   * @returns Set of selected Allergen values. Structure: Set<Allergen>
   */
  const getAllergens = (): Set<Allergen> => {
    return allergens;
  };

  /**
   * Gets all allergens preferences as an array.
   *
   * @returns Array of selected Allergen values. Structure: Allergen[]
   */
  const getAllergensArray = (): Allergen[] => {
    return allergensArray;
  };

  /**
   * Gets all dietary restrictions preferences.
   *
   * @returns Set of selected DietaryTag values. Structure: Set<DietaryTag>
   */
  const getDietaryRestrictions = (): Set<DietaryTag> => {
    return dietaryRestrictions;
  };

  /**
   * Gets all dietary restrictions preferences as an array.
   *
   * @returns Array of selected DietaryTag values. Structure: DietaryTag[]
   */
  const getDietaryRestrictionsArray = (): DietaryTag[] => {
    return dietaryRestrictionsArray;
  };

  /**
   * Gets show nutrition preference.
   *
   * @returns Boolean indicating if nutrition should be shown. Structure: boolean
   */
  const getShowNutrition = (): boolean => {
    return showNutrition;
  };

  /**
   * Checks if a dining hall is pinned.
   *
   * @param diningHall - DiningHall to check
   * @returns Boolean indicating if the dining hall is pinned.
   */
  const isPinned = (diningHall: DiningHall): boolean => {
    return pinnedHalls.has(diningHall);
  };

  /**
   * Checks if a dining hall is in preferences.
   *
   * @param diningHall - DiningHall to check
   * @returns Boolean indicating if the dining hall is selected.
   */
  const hasDiningHall = (diningHall: DiningHall): boolean => {
    return diningHalls.has(diningHall);
  };

  /**
   * Checks if an allergen is in preferences.
   *
   * @param allergen - Allergen to check
   * @returns Boolean indicating if the allergen is selected.
   */
  const hasAllergen = (allergen: Allergen): boolean => {
    return allergens.has(allergen);
  };

  /**
   * Checks if a dietary restriction is in preferences.
   *
   * @param dietaryRestriction - DietaryTag to check
   * @returns Boolean indicating if the dietary restriction is selected.
   */
  const hasDietaryRestriction = (dietaryRestriction: DietaryTag): boolean => {
    return dietaryRestrictions.has(dietaryRestriction);
  };

  /**
   * Sets all pinned halls.
   *
   * @param halls - Array of DiningHall values to set. Structure: DiningHall[]
   * @returns void
   */
  const setPinnedHalls = (halls: DiningHall[]): void => {
    setPinnedHallsArray(halls);
  };

  /**
   * Sets all dining halls preferences.
   *
   * @param halls - Array of DiningHall values to set. Structure: DiningHall[]
   * @returns void
   */
  const setDiningHalls = (halls: DiningHall[]): void => {
    setDiningHallsArray(halls);
  };

  /**
   * Sets all allergens preferences.
   *
   * @param allergensList - Array of Allergen values to set. Structure: Allergen[]
   * @returns void
   */
  const setAllergens = (allergensList: Allergen[]): void => {
    setAllergensArray(allergensList);
  };

  /**
   * Sets all dietary restrictions preferences.
   *
   * @param restrictions - Array of DietaryTag values to set. Structure: DietaryTag[]
   * @returns void
   */
  const setDietaryRestrictions = (restrictions: DietaryTag[]): void => {
    setDietaryRestrictionsArray(restrictions);
  };

  /**
   * Sets show nutrition preference.
   *
   * @param show - Boolean value to set. Structure: boolean
   * @returns void
   */
  const setShowNutrition = (show: boolean): void => {
    setShowNutritionState(show);
  };

  /**
   * Adds a dining hall to pinned halls.
   *
   * @param diningHall - DiningHall to add
   * @returns void
   */
  const addPinnedHall = (diningHall: DiningHall): void => {
    setPinnedHallsArray((prev) => {
      const prevSet = new Set(prev);
      prevSet.add(diningHall);
      return Array.from(prevSet);
    });
  };

  /**
   * Adds a dining hall to preferences.
   *
   * @param diningHall - DiningHall to add
   * @returns void
   */
  const addDiningHall = (diningHall: DiningHall): void => {
    setDiningHallsArray((prev) => {
      const prevSet = new Set(prev);
      prevSet.add(diningHall);
      return Array.from(prevSet);
    });
  };

  /**
   * Adds an allergen to preferences.
   *
   * @param allergen - Allergen to add
   * @returns void
   */
  const addAllergen = (allergen: Allergen): void => {
    setAllergensArray((prev) => {
      const prevSet = new Set(prev);
      prevSet.add(allergen);
      return Array.from(prevSet);
    });
  };

  /**
   * Adds a dietary restriction to preferences.
   *
   * @param dietaryRestriction - DietaryTag to add
   * @returns void
   */
  const addDietaryRestriction = (dietaryRestriction: DietaryTag): void => {
    setDietaryRestrictionsArray((prev) => {
      const prevSet = new Set(prev);
      prevSet.add(dietaryRestriction);
      return Array.from(prevSet);
    });
  };

  /**
   * Removes a dining hall from pinned halls.
   *
   * @param diningHall - DiningHall to remove
   * @returns void
   */
  const removePinnedHall = (diningHall: DiningHall): void => {
    setPinnedHallsArray((prev) => {
      const prevSet = new Set(prev);
      prevSet.delete(diningHall);
      return Array.from(prevSet);
    });
  };

  /**
   * Removes a dining hall from preferences.
   *
   * @param diningHall - DiningHall to remove
   * @returns void
   */
  const removeDiningHall = (diningHall: DiningHall): void => {
    setDiningHallsArray((prev) => {
      const prevSet = new Set(prev);
      prevSet.delete(diningHall);
      return Array.from(prevSet);
    });
  };

  /**
   * Removes an allergen from preferences.
   *
   * @param allergen - Allergen to remove
   * @returns void
   */
  const removeAllergen = (allergen: Allergen): void => {
    setAllergensArray((prev) => {
      const prevSet = new Set(prev);
      prevSet.delete(allergen);
      return Array.from(prevSet);
    });
  };

  /**
   * Removes a dietary restriction from preferences.
   *
   * @param dietaryRestriction - DietaryTag to remove
   * @returns void
   */
  const removeDietaryRestriction = (dietaryRestriction: DietaryTag): void => {
    setDietaryRestrictionsArray((prev) => {
      const prevSet = new Set(prev);
      prevSet.delete(dietaryRestriction);
      return Array.from(prevSet);
    });
  };

  /**
   * Toggles a dining hall's pinned status.
   *
   * @param diningHall - DiningHall to toggle
   * @returns void
   */
  const togglePinnedHall = (diningHall: DiningHall): void => {
    setPinnedHallsArray((prev) => {
      const prevSet = new Set(prev);
      if (prevSet.has(diningHall)) {
        prevSet.delete(diningHall);
      } else {
        prevSet.add(diningHall);
      }
      return Array.from(prevSet);
    });
  };

  /**
   * Toggles a dining hall in preferences.
   *
   * @param diningHall - DiningHall to toggle
   * @returns void
   */
  const toggleDiningHall = (diningHall: DiningHall): void => {
    setDiningHallsArray((prev) => {
      const prevSet = new Set(prev);
      if (prevSet.has(diningHall)) {
        prevSet.delete(diningHall);
      } else {
        prevSet.add(diningHall);
      }
      return Array.from(prevSet);
    });
  };

  /**
   * Toggles an allergen in preferences.
   *
   * @param allergen - Allergen to toggle
   * @returns void
   */
  const toggleAllergen = (allergen: Allergen): void => {
    setAllergensArray((prev) => {
      const prevSet = new Set(prev);
      if (prevSet.has(allergen)) {
        prevSet.delete(allergen);
      } else {
        prevSet.add(allergen);
      }
      return Array.from(prevSet);
    });
  };

  /**
   * Toggles a dietary restriction in preferences.
   *
   * @param dietaryRestriction - DietaryTag to toggle
   * @returns void
   */
  const toggleDietaryRestriction = (dietaryRestriction: DietaryTag): void => {
    setDietaryRestrictionsArray((prev) => {
      const prevSet = new Set(prev);
      if (prevSet.has(dietaryRestriction)) {
        prevSet.delete(dietaryRestriction);
      } else {
        prevSet.add(dietaryRestriction);
      }
      return Array.from(prevSet);
    });
  };

  /**
   * Clears all pinned halls.
   *
   * @returns void
   */
  const clearPinnedHalls = (): void => {
    setPinnedHallsArray([]);
  };

  /**
   * Clears all dining halls preferences.
   *
   * @returns void
   */
  const clearDiningHalls = (): void => {
    setDiningHallsArray([]);
  };

  /**
   * Clears all allergens preferences.
   *
   * @returns void
   */
  const clearAllergens = (): void => {
    setAllergensArray([]);
  };

  /**
   * Clears all dietary restrictions preferences.
   *
   * @returns void
   */
  const clearDietaryRestrictions = (): void => {
    setDietaryRestrictionsArray([]);
  };

  /**
   * Clears all preferences.
   *
   * @returns void
   */
  const clearAll = (): void => {
    setPinnedHallsArray([]);
    setDiningHallsArray([]);
    setAllergensArray([]);
    setDietaryRestrictionsArray([]);
    setShowNutritionState(true);
  };

  return {
    // State
    loading,
    pinnedHalls,
    pinnedHallsArray,
    diningHalls,
    diningHallsArray,
    allergens,
    allergensArray,
    dietaryRestrictions,
    dietaryRestrictionsArray,
    showNutrition,

    // Getters
    getPinnedHalls,
    getPinnedHallsArray,
    getDiningHalls,
    getDiningHallsArray,
    getAllergens,
    getAllergensArray,
    getDietaryRestrictions,
    getDietaryRestrictionsArray,
    getShowNutrition,

    // Checkers
    isPinned,
    hasDiningHall,
    hasAllergen,
    hasDietaryRestriction,

    // Setters
    setPinnedHalls,
    setDiningHalls,
    setAllergens,
    setDietaryRestrictions,
    setShowNutrition,

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

    // Clearers
    clearPinnedHalls,
    clearDiningHalls,
    clearAllergens,
    clearDietaryRestrictions,
    clearAll,
  };
}
