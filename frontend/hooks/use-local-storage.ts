/**
 * @overview Hook for managing data in browser localStorage with optional expiry.
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

import { useState, useCallback, useEffect } from 'react';

const readFromStorage = <T>(key: string, initialValue: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return initialValue;

    const parsed = JSON.parse(raw);

    const valid =
      parsed &&
      typeof parsed.expiry === 'number' &&
      parsed.value !== undefined;

    if (!valid) {
      window.localStorage.removeItem(key);
      return initialValue;
    }

    if (Date.now() > parsed.expiry) {
      window.localStorage.removeItem(key);
      return initialValue;
    }

    return parsed.value as T;
  } catch {
    window.localStorage.removeItem(key);
    return initialValue;
  }
};

export function useLocalStorage<T>({
  key,
  initialValue,
  expiryInMs,
}: {
  key: string;
  initialValue: T;
  expiryInMs?: number;
}) {
  // Default expiry = 5 days
  const DEFAULT_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000;
  const effectiveExpiryInMs = expiryInMs ?? DEFAULT_EXPIRY_MS;

  // Always start with initialValue to match SSR output, then sync from
  // localStorage in an effect so the client-side value is never lost to
  // React hydration (which reuses the server-rendered state).
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    setStoredValue(readFromStorage(key, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Setter
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;

        if (typeof window !== 'undefined') {
          const stored = {
            value: next,
            expiry: Date.now() + effectiveExpiryInMs,
          };
          window.localStorage.setItem(key, JSON.stringify(stored));
        }

        return next;
      });
    },
    [key, effectiveExpiryInMs]
  );

  return [storedValue, setValue] as const;
}