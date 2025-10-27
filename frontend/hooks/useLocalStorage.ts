import { useState, useEffect } from 'react';

/**
 * @overview A custom React hook to persist state in localStorage with expiration.
 * This version is safe for Server-Side Rendering (SSR) / Next.js.
 *
 * @param {string} key The key to use for storing the value in localStorage.
 * @param {T} initialValue The initial value to use if nothing is found or item is expired.
 * @param {number} [expiryInMs] Optional. Time in milliseconds until the item expires.
 * @returns A stateful value, and a function to update it.
 */
export default function useLocalStorage<T>(key: string, initialValue: T, expiryInMs?: number) {
  // 1. Initialize state with initialValue.
  // This ensures the server render and initial client render are identical.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 2. Use useEffect to read from localStorage only on the client, after hydration.
  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return; // No item, state remains initialValue
      }

      const parsedItem = JSON.parse(item);

      // If no expiry rule, just set the value
      if (!expiryInMs) {
        setStoredValue(parsedItem);
        return;
      }

      // Expiry rule IS in effect. We expect {value, expiry} structure.
      if (parsedItem && typeof parsedItem.expiry === 'number' && parsedItem.value !== undefined) {
        if (Date.now() > parsedItem.expiry) {
          // It's expired!
          window.localStorage.removeItem(key); // Clean up
          // State remains initialValue
        } else {
          // Not expired, set the unwrapped value
          setStoredValue(parsedItem.value);
        }
      } else {
        // Item exists but is malformed or doesn't match {value, expiry}
        window.localStorage.removeItem(key); // Clean up
      }
    } catch (error) {
      console.error(error);
      window.localStorage.removeItem(key); // Clean up corrupted item
    }
    // We only want this effect to run once on mount to hydrate the state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. The setter function.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Use the functional update form of useState to get the latest state
      setStoredValue((prevValue) => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;

        if (typeof window !== 'undefined') {
          let itemToStore: any = valueToStore;

          // If expiry is provided, wrap the value
          if (expiryInMs) {
            itemToStore = {
              value: valueToStore,
              expiry: Date.now() + expiryInMs,
            };
          }
          window.localStorage.setItem(key, JSON.stringify(itemToStore));
        }

        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
