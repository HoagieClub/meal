/**
 * @overview Hook for managing local storage.
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

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing local storage.
 *
 * @param key - The key to store the value in localStorage.
 * @param initialValue - The initial value to store in localStorage.
 * @param expiryInMs - The expiry time in milliseconds. Defaults to 1 week if not provided.
 * @returns A tuple containing the stored value and a function to set the value.
 */
export function useLocalStorage<T>({
  key,
  initialValue,
  expiryInMs,
}: {
  key: string;
  initialValue: T;
  expiryInMs?: number;
}) {
  // Default expiry to 1 week (7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
  const DEFAULT_EXPIRY_MS = 30 * 1000;
  const effectiveExpiryInMs = expiryInMs ?? DEFAULT_EXPIRY_MS;

  // State for stored value and loading state
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If the window is undefined, return
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Get the raw value from localStorage
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      // Parse the raw value
      const parsed = JSON.parse(raw);

      // Check if the parsed value is valid (should have expiry and value)
      const valid = parsed && typeof parsed.expiry === 'number' && parsed.value !== undefined;
      if (!valid) {
        window.localStorage.removeItem(key);
        setLoading(false);
        return;
      }

      // Check if the expiry time has passed
      if (Date.now() > parsed.expiry) {
        window.localStorage.removeItem(key);
        setLoading(false);
        return;
      }

      // Set the stored value to the parsed value
      setStoredValue(parsed.value);
      setLoading(false);
    } catch {
      window.localStorage.removeItem(key);
      setLoading(false);
    }
  }, [key, effectiveExpiryInMs]);

  // Set the value to the local storage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;

        // If the window is defined, set the value to the local storage with expiry
        if (typeof window !== 'undefined') {
          const stored = { value: next, expiry: Date.now() + effectiveExpiryInMs };
          window.localStorage.setItem(key, JSON.stringify(stored));
        }

        return next;
      });
    },
    [key, effectiveExpiryInMs]
  );

  return [storedValue, setValue, loading] as const;
}
