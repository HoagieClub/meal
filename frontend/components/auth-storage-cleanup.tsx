/**
 * @overview Client component that clears localStorage on login/logout.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

/**
 * AuthStorageCleanup component that clears localStorage when user logs in or logs out.
 * This ensures a clean state for each user session.
 *
 * @returns A null JSX element.
 */
export default function AuthStorageCleanup() {
  const { user, isLoading } = useUser();
  const previousUserRef = useRef<typeof user | null>(null);
  const hasClearedOnLoginRef = useRef(false);

  useEffect(() => {
    // Skip if still loading or not on client
    if (isLoading || typeof window === 'undefined') {
      return;
    }

    // Get the current user and previous user
    const currentUser = user;
    const previousUser = previousUserRef.current;
    const pathname = window.location.pathname;
    const isCallbackPage = pathname.includes('/api/auth/callback');
    const isLogoutPage = pathname.includes('/api/auth/logout');

    // Clear localStorage on logout page
    if (isLogoutPage && typeof window !== 'undefined') {
      window.localStorage.clear();
      console.log('LocalStorage cleared on logout');
      return;
    }

    // Clear localStorage on callback page (after login)
    if (isCallbackPage && currentUser && !hasClearedOnLoginRef.current) {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        console.log('LocalStorage cleared on login callback');
        hasClearedOnLoginRef.current = true;
      }
      previousUserRef.current = currentUser;
      return;
    }

    // Track user state changes
    if (previousUser === null) {
      // First render - initialize
      previousUserRef.current = currentUser;
      return;
    }

    // Clear localStorage when user state changes
    const userLoggedIn = !previousUser && currentUser;
    const userLoggedOut = previousUser && !currentUser;
    if (userLoggedIn || userLoggedOut) {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        console.log('LocalStorage cleared due to authentication state change');
      }
    }

    // Update the previous user reference
    previousUserRef.current = currentUser;
  }, [user, isLoading]);
}
