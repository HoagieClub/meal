'use client';

import { useEffect, useRef, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { DietKey, AllergenKey } from '@/app/menu/types';
import { initialSelectedHalls } from '@/app/menu/data';
import { useUserProfile } from '@/hooks/use-user-profile';

const PREFERENCES_KEY = 'diningFilterPrefs';

export interface MenuPreferences {
  halls: string[];
  dietary: DietKey[];
  allergens: AllergenKey[];
  showNutrition: boolean;
}

export function usePreferences() {
  const { userProfile, loading: profileLoading } = useUserProfile();

  const [preferences, setPreferences] = useLocalStorage<MenuPreferences>(PREFERENCES_KEY, {
    halls: initialSelectedHalls,
    dietary: [],
    allergens: [],
    showNutrition: true,
  });

  const lastProfileKeyRef = useRef<string>('');

  const profileKey = useMemo(() => {
    if (!userProfile) return '';
    return JSON.stringify(userProfile);
  }, [userProfile]);

  useEffect(() => {
    if (profileLoading || !userProfile || !profileKey) return;
    if (profileKey === lastProfileKeyRef.current) return;

    const dietaryRestrictions = userProfile.dietaryRestrictions ?? [];
    const allergens = userProfile.allergens ?? [];
    const diningHalls = userProfile.diningHalls ?? [];
    const showNutrition = userProfile.showNutrition ?? true;

    if (dietaryRestrictions.length === 0 && allergens.length === 0 && diningHalls.length === 0) {
      lastProfileKeyRef.current = profileKey;
      return;
    }

    const nextPreferences: MenuPreferences = {
      halls: diningHalls.length > 0 ? diningHalls : preferences.halls,
      dietary: dietaryRestrictions.length > 0 ? dietaryRestrictions : preferences.dietary,
      allergens: allergens.length > 0 ? allergens : preferences.allergens,
      showNutrition,
    };

    lastProfileKeyRef.current = profileKey;

    const hasChanges =
      nextPreferences.halls !== preferences.halls ||
      nextPreferences.dietary !== preferences.dietary ||
      nextPreferences.allergens !== preferences.allergens ||
      nextPreferences.showNutrition !== preferences.showNutrition;

    if (!hasChanges) return;

    setPreferences(nextPreferences);
  }, [profileKey, profileLoading, userProfile, preferences, setPreferences]);

  const setShowNutrition = (value: React.SetStateAction<boolean>) => {
    setPreferences((prev) => {
      const current = prev.showNutrition ?? true;
      return {
        ...prev,
        showNutrition: value instanceof Function ? value(current) : value,
      };
    });
  };

  const setHalls = (value: React.SetStateAction<string[]>) => {
    setPreferences((prev) => {
      const current = prev.halls ?? [];
      return {
        ...prev,
        halls: value instanceof Function ? value(current) : value,
      };
    });
  };

  const setDietary = (value: React.SetStateAction<DietKey[]>) => {
    setPreferences((prev) => {
      const current = prev.dietary ?? [];
      return {
        ...prev,
        dietary: value instanceof Function ? value(current) : value,
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
    halls: preferences.halls,
    dietary: preferences.dietary,
    allergens: preferences.allergens,
    showNutrition: preferences.showNutrition,
    setHalls,
    setDietary,
    setAllergens,
    setShowNutrition,
    setPreferences,
    loading: profileLoading,
  };
}
