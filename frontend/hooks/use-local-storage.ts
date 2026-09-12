'use client';

import { useCallback, useEffect, useState } from 'react';

const DEFAULT_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000;

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const expired =
      typeof parsed?.expiry !== 'number' ||
      parsed.value === undefined ||
      Date.now() > parsed.expiry;
    if (expired) {
      window.localStorage.removeItem(key);
      return fallback;
    }
    return parsed.value as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

/** `useState` backed by localStorage. Entries expire after `expiryInMs` (default five days). */
export function useLocalStorage<T>({
  key,
  initialValue,
  expiryInMs = DEFAULT_EXPIRY_MS,
}: {
  key: string;
  initialValue: T;
  expiryInMs?: number;
}) {
  // Render with initialValue first so server and client markup match, then load the stored
  // value once hydrated.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    setStoredValue(readFromStorage(key, initialValue));
    // initialValue is deliberately excluded: callers often pass a fresh literal each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(
          key,
          JSON.stringify({ value: next, expiry: Date.now() + expiryInMs })
        );
        return next;
      });
    },
    [key, expiryInMs]
  );

  return [storedValue, setValue] as const;
}
