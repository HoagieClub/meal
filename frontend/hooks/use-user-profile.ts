/**
 * @overview Hook for fetching the authenticated user's profile.
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

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { toCamelCase } from '@/utils/toCamelCase';
import { AllergenType, DietaryTagType, DiningHallType } from '@/data';

const FETCH_USER_PROFILE_URL = '/api/user/me';

export interface UserProfile {
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dietaryRestrictions: DietaryTagType[];
  diningHalls: DiningHallType[];
  allergens: AllergenType[];
  showNutrition: boolean;
}

/**
 * Hook to fetch the authenticated user's profile data.
 *
 * This hook waits for Auth0 authentication to resolve before issuing
 * a request to the user profile endpoint. It handles authentication
 * errors, HTTP failures, and loading state internally.
 *
 * @returns An object containing the user profile, loading state, error state,
 *          and commonly accessed derived fields.
 */
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasHydratedRef = useRef(false);

  const { user, isLoading: authLoading, error: authError } = useUser();

  useEffect(() => {
    // return if auth is still loading
    if (authLoading) {
      return;
    }

    // return if auth error
    if (authError) {
      setError('Authentication failed');
      setLoading(false);
      return;
    }

    // return if user is not authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    // fetch user profile
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(FETCH_USER_PROFILE_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const userProfile = toCamelCase(data.data ?? null) as UserProfile;
        setUserProfile(userProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [authLoading, user, authError, hasHydratedRef]);

  return {
    userProfile,
    loading,
    error,
  };
};
