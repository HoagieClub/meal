import { useState, useEffect, useCallback } from 'react';

interface UseLocalStorageProps<T> {
  key: string;
  initialValue: T;
}
// This custom hook is like useState, but it automatically saves the data to the browser's localStorage.
// Super handy for remembering user preferences!
export default function useLocalStorage<T>({ key, initialValue }: UseLocalStorageProps<T>) {
  //  1. Always initialize state with initialValue.
  // This ensures the server render and the first client render (hydration) match.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  //  2. Use useEffect to read from localStorage *after* mount (client-side only).
  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    if (typeof window === 'undefined') {
      return;
    }
    try {
      // Try to get the stored item
      const item = window.localStorage.getItem(key);
      // Parse it or fall back to initialValue
      const value = item ? JSON.parse(item) : initialValue;
      setStoredValue(value);
    } catch (error) {
      // If parsing fails, fall back to initial value
      console.error(error);
      setStoredValue(initialValue);
    }
    // We only want this to run once on mount when the key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only re-run if the key changes

  // We wrap this in useCallback to ensure the function identity is stable across renders.
  // This prevents the useEffect hook in DietPlanner from re-running unnecessarily.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Use the functional update form of setStoredValue to ensure we have the latest state
        setStoredValue((prevValue) => {
          const valueToStore = value instanceof Function ? value(prevValue) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.error(error);
      }
    },
    [key]
  ); // The key is stable, so this function is created only once.

  return [storedValue, setValue] as const;
}
