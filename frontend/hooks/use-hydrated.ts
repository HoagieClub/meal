'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False while the page is rendered on the server and hydrated, true once it runs in the browser.
 * Anything that depends on the visitor's clock or storage waits for this, so the server's HTML
 * and the first client render always match.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
