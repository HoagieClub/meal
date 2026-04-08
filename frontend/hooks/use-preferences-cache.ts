/**
 * @overview Hook for managing user filter preferences in localStorage.
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

import { useCallback } from 'react';
import { DINING_HALLS } from '@/locations';
import type { DiningHall } from '@/locations';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Allergen } from '@/types/types';

const PREFS_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 1 month

export function usePreferencesCache() {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean>({ key: 'sidebarOpen', initialValue: true });
  const [pinnedHalls, setPinnedHalls] = useLocalStorage<DiningHall[]>({ key: 'diningPinnedHalls', initialValue: [], expiryInMs: PREFS_EXPIRY });
  const [diningHalls, setDiningHalls] = useLocalStorage<DiningHall[]>({ key: 'diningHallsPreferences', initialValue: Array.from(DINING_HALLS), expiryInMs: PREFS_EXPIRY });
  const [allergens, setAllergens] = useLocalStorage<Allergen[]>({ key: 'allergensPreferences', initialValue: [], expiryInMs: PREFS_EXPIRY });
  const [hideAllergenTags, setHideAllergenTags] = useLocalStorage<boolean>({ key: 'hideAllergenTags', initialValue: false, expiryInMs: PREFS_EXPIRY });

  const togglePinnedHall = useCallback((hall: DiningHall) => {
    setPinnedHalls((prev) => prev.includes(hall) ? prev.filter((h) => h !== hall) : [...prev, hall]);
  }, [setPinnedHalls]);

  const toggleDiningHall = useCallback((hall: DiningHall) => {
    setDiningHalls((prev) => prev.includes(hall) ? prev.filter((h) => h !== hall) : [...prev, hall]);
  }, [setDiningHalls]);

  const toggleAllergen = useCallback((allergen: Allergen) => {
    setAllergens((prev) => prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]);
  }, [setAllergens]);

  const clearAll = useCallback(() => {
    setPinnedHalls([]);
    setDiningHalls(Array.from(DINING_HALLS));
    setAllergens([]);
  }, [setPinnedHalls, setDiningHalls, setAllergens]);

  return {
    sidebarOpen,
    setSidebarOpen,
    pinnedHalls,
    diningHalls,
    allergens,
    hideAllergenTags,
    setHideAllergenTags,
    togglePinnedHall,
    toggleDiningHall,
    toggleAllergen,
    clearAll,
  };
}
