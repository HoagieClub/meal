'use client';

import { useState, useCallback } from 'react';

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

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

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

      // Expired
      if (Date.now() > parsed.expiry) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      return parsed.value as T;
    } catch {
      window.localStorage.removeItem(key);
      return initialValue;
    }
  });

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