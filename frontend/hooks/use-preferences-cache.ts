'use client';

import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DINING_HALLS } from '@/lib/constants';
import type { DiningHall } from '@/lib/constants';
import type { Allergen } from '@/types';

const PREFS_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** The user's filter preferences, persisted in localStorage for a month. */
export function usePreferencesCache() {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean>({
    key: 'sidebarOpen',
    initialValue: true,
  });
  const [pinnedHalls, setPinnedHalls] = useLocalStorage<DiningHall[]>({
    key: 'diningPinnedHalls',
    initialValue: [],
    expiryInMs: PREFS_EXPIRY_MS,
  });
  const [diningHalls, setDiningHalls] = useLocalStorage<DiningHall[]>({
    key: 'diningHallsPreferences',
    initialValue: [...DINING_HALLS],
    expiryInMs: PREFS_EXPIRY_MS,
  });
  const [allergens, setAllergens] = useLocalStorage<Allergen[]>({
    key: 'allergensPreferences',
    initialValue: [],
    expiryInMs: PREFS_EXPIRY_MS,
  });
  const togglePinnedHall = useCallback(
    (hall: DiningHall) => setPinnedHalls((prev) => toggle(prev, hall)),
    [setPinnedHalls]
  );
  const toggleDiningHall = useCallback(
    (hall: DiningHall) => setDiningHalls((prev) => toggle(prev, hall)),
    [setDiningHalls]
  );
  const toggleAllergen = useCallback(
    (allergen: Allergen) => setAllergens((prev) => toggle(prev, allergen)),
    [setAllergens]
  );
  const clearAll = useCallback(() => {
    setPinnedHalls([]);
    setDiningHalls([...DINING_HALLS]);
    setAllergens([]);
  }, [setPinnedHalls, setDiningHalls, setAllergens]);

  return {
    sidebarOpen,
    setSidebarOpen,
    pinnedHalls,
    diningHalls,
    allergens,
    togglePinnedHall,
    toggleDiningHall,
    toggleAllergen,
    clearAll,
  };
}
