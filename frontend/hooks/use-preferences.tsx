/**
 * @overview Hook for managing user preferences.
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

import { useEffect, useRef, useState } from 'react';
import { DINING_HALLS, DietaryTagType, AllergenType, DiningHallType } from '@/data';
import { useUserProfile } from '@/hooks/use-user-profile';
import { toSnakeCase } from '@/utils/toCamelCase';
import { api } from './use-next-api';

const UPDATE_PREFERENCES_URL = '/api/user/update';
const PREFERENCES_KEY = 'diningPreferences';

export interface DiningPreferences {
  diningHalls: DiningHallType[];
  dietaryRestrictions: DietaryTagType[];
  allergens: AllergenType[];
  showNutrition: boolean;
}

export const DEFAULT_PREFERENCES: DiningPreferences = {
  diningHalls: DINING_HALLS,
  dietaryRestrictions: [],
  allergens: [],
  showNutrition: true,
};

/**
 * Hook for managing user preferences.
 * @returns An object containing the user preferences, a function to save the user preferences to the backend or local storage, a function to save the default preferences to the backend or local storage, and functions to set the user's dining halls, dietary restrictions, allergens, and show nutrition preference.
 */
export function usePreferences() {
  const {
    userProfile,
    loading: profileLoading,
    error: profileError,
    fetchedProfile,
  } = useUserProfile();
  const hasHydratedRef = useRef(false);

  const [preferences, setPreferences] = useState<DiningPreferences>(DEFAULT_PREFERENCES);

  // update user preferences in state from the backend or local storage
  useEffect(() => {
    if (profileLoading || profileError) return;
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    if (fetchedProfile) {
      setPreferences({
        diningHalls: userProfile.diningHalls,
        dietaryRestrictions: userProfile.dietaryRestrictions,
        allergens: userProfile.allergens,
        showNutrition: userProfile.showNutrition,
      });
    } else if (localStorage.getItem(PREFERENCES_KEY)) {
      const preferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) as string);
      setPreferences(preferences);
    } else {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, [fetchedProfile, profileLoading, profileError, hasHydratedRef, userProfile]);

  // save the preferences to the backend or local storage
  const savePreferences = async (preferences: DiningPreferences) => {
    if (fetchedProfile) {
      const postData = toSnakeCase(preferences);
      const { error } = await api.post(UPDATE_PREFERENCES_URL, postData);
      if (error) console.error('Failed to save preferences:', error);
    } else {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    }
  };

  // set the user's show nutrition in state and save to the backend or local storage
  const setShowNutritionWithSave = (value: boolean) => {
    const newPreferences = { ...preferences, showNutrition: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  // set the user's dining halls in state and save to the backend or local storage
  const setDiningHallsWithSave = (value: DiningHallType[]) => {
    const newPreferences = { ...preferences, diningHalls: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  // set the user's dietary restrictions in state and save to the backend or local storage
  const setDietaryRestrictionsWithSave = (value: DietaryTagType[]) => {
    const newPreferences = { ...preferences, dietaryRestrictions: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  // set the user's allergens in state and save to the backend or local storage
  const setAllergensWithSave = (value: AllergenType[]) => {
    const newPreferences = { ...preferences, allergens: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  return {
    preferences,
    setPreferences: savePreferences,
    setShowNutrition: setShowNutritionWithSave,
    setDiningHalls: setDiningHallsWithSave,
    setDietaryRestrictions: setDietaryRestrictionsWithSave,
    setAllergens: setAllergensWithSave,
    loading: profileLoading,
  };
}
