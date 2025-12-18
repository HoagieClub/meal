/**
 * @overview Hook for managing pinned dining halls.
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

import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DiningHallType } from '@/data';

const PINNED_HALLS_KEY = 'diningPinnedHalls';

/**
 * Hook for managing pinned dining halls.
 * @returns An object relating to the pinned dining halls functionality.
 */
export function usePinnedHalls() {
  const [pinnedArray, setPinnedArray] = useLocalStorage<DiningHallType[]>({
    key: PINNED_HALLS_KEY,
    initialValue: [],
  });
  const pinnedHalls = useMemo(() => new Set<DiningHallType>(pinnedArray), [pinnedArray]);

  // check if a dining hall is pinned
  const isPinned = (diningHall: DiningHallType): boolean => {
    return pinnedHalls.has(diningHall);
  };

  // toggle a dining hall's pin status
  const togglePin = (diningHall: DiningHallType) => {
    setPinnedArray((prevArray) => {
      const prevSet = new Set(prevArray);
      if (prevSet.has(diningHall)) {
        prevSet.delete(diningHall);
      } else {
        prevSet.add(diningHall);
      }
      return Array.from(prevSet);
    });
  };

  // add a dining hall to the pinned list
  const addPin = (diningHall: DiningHallType) => {
    setPinnedArray((prevArray) => {
      const prevSet = new Set(prevArray);
      prevSet.add(diningHall);
      return Array.from(prevSet);
    });
  };

  // remove a dining hall from the pinned list
  const removePin = (diningHall: DiningHallType) => {
    setPinnedArray((prevArray) => {
      const prevSet = new Set(prevArray);
      prevSet.delete(diningHall);
      return Array.from(prevSet);
    });
  };

  // clear the pinned list
  const clearPins = () => {
    setPinnedArray([]);
  };

  return {
    pinnedHalls,
    isPinned,
    togglePin,
    addPin,
    removePin,
    clearPins,
  };
}
