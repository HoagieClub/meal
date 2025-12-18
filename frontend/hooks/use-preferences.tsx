'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { DINING_HALLS, DietaryTagType, AllergenType, DiningHallType } from '@/data';
import { useUserProfile } from '@/hooks/use-user-profile';
import { toSnakeCase } from '@/utils/toCamelCase';

const UPDATE_PREFERENCES_URL = '/api/user/update';

export interface MenuPreferences {
  diningHalls: DiningHallType[];
  dietaryRestrictions: DietaryTagType[];
  allergens: AllergenType[];
  showNutrition: boolean;
}

export function usePreferences() {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const hasHydratedRef = useRef(false);

  const [preferences, setPreferences] = useState<MenuPreferences>({
    diningHalls: DINING_HALLS,
    dietaryRestrictions: [],
    allergens: [],
    showNutrition: true,
  });

  useEffect(() => {
    if (profileLoading || !userProfile) return;
    if (hasHydratedRef.current) return;

    hasHydratedRef.current = true;

    const nextPreferences = {
      diningHalls: userProfile.diningHalls,
      dietaryRestrictions: userProfile.dietaryRestrictions,
      allergens: userProfile.allergens,
      showNutrition: userProfile.showNutrition,
    };

    setPreferences(nextPreferences);
  }, [profileLoading, userProfile, hasHydratedRef]);

  const updatePreferencesBackend = async (preferences: MenuPreferences) => {
    try {
      const response = await fetch(UPDATE_PREFERENCES_URL, {
        method: 'POST',
        body: JSON.stringify(toSnakeCase(preferences)),
      });
      if (!response.ok) {
        throw new Error('Failed to update user preferences');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  };

  const resetPreferencesBackend = () => {
    updatePreferencesBackend({
      dietaryRestrictions: [],
      allergens: [],
      diningHalls: DINING_HALLS,
      showNutrition: true,
    });
  };

  const setShowNutrition = (value: React.SetStateAction<boolean>) => {
    setPreferences((prev) => {
      const current = prev.showNutrition ?? true;
      return {
        ...prev,
        showNutrition: value instanceof Function ? value(current) : value,
      };
    });
  };

  const setDiningHalls = (value: React.SetStateAction<string[]>) => {
    setPreferences((prev) => {
      const current = prev.diningHalls ?? [];
      return {
        ...prev,
        diningHalls: value instanceof Function ? value(current) : value,
      };
    });
  };

  const setDietaryRestrictions = (value: React.SetStateAction<DietKey[]>) => {
    setPreferences((prev) => {
      const current = prev.dietaryRestrictions ?? [];
      return {
        ...prev,
        dietaryRestrictions: value instanceof Function ? value(current) : value,
      };
    });
  };

  const setAllergens = (value: React.SetStateAction<AllergenKey[]>) => {
    setPreferences((prev) => {
      const current = prev.allergens ?? [];
      return {
        ...prev,
        allergens: value instanceof Function ? value(current) : value,
      };
    });
  };

  return {
    preferences,
    diningHalls: preferences.diningHalls,
    dietaryRestrictions: preferences.dietaryRestrictions,
    allergens: preferences.allergens,
    showNutrition: preferences.showNutrition,
    setDiningHalls,
    setDietaryRestrictions,
    setAllergens,
    setShowNutrition,
    setPreferences,
    loading: profileLoading,
    updatePreferencesBackend,
    resetPreferencesBackend,
  };
}
