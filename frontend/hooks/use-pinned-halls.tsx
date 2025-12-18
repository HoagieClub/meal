'use client';

import { useMemo, useRef } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

const PINNED_HALLS_KEY = 'diningPinnedHalls';

export function usePinnedHalls() {
  const [pinnedArray, setPinnedArray] = useLocalStorage<string[]>(PINNED_HALLS_KEY, []);

  const pinnedHalls = useMemo(() => new Set(pinnedArray), [pinnedArray]);

  const isPinned = (hallName: string): boolean => {
    return pinnedHalls.has(hallName);
  };

  const togglePin = (hallName: string) => {
    setPinnedArray((prevArray) => {
      const prevSet = new Set(prevArray);
      if (prevSet.has(hallName)) {
        prevSet.delete(hallName);
      } else {
        prevSet.add(hallName);
      }
      return Array.from(prevSet);
    });
  };

  const addPin = (hallName: string) => {
    setPinnedArray((prevArray) => {
      const prevSet = new Set(prevArray);
      prevSet.add(hallName);
      return Array.from(prevSet);
    });
  };

  const removePin = (hallName: string) => {
    setPinnedArray((prevArray) => {
      const prevSet = new Set(prevArray);
      prevSet.delete(hallName);
      return Array.from(prevSet);
    });
  };

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
