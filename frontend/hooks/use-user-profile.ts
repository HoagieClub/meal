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
import { toCamelCase } from '@/utils/toCamelCase';
import { AllergenType, DietaryTagType, DiningHallType, DINING_HALLS } from '@/data';
import { api } from './use-next-api';

const FETCH_USER_PROFILE_URL = '/api/user/me';

export interface UserProfile {
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dietaryRestrictions: DietaryTagType[];
  diningHalls: DiningHallType[];
  allergens: AllergenType[];
  showNutrition: boolean;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  dailyCalorieTarget: 0,
  dailyProteinTarget: 0,
  dietaryRestrictions: [],
  diningHalls: DINING_HALLS,
  allergens: [],
  showNutrition: true,
};

/**
 * Hook to fetch the authenticated user's profile data.
 *
 * This hook issues a request to the user profile endpoint,
 * handles loading, errors, and provides a safe default profile
 * so the UI always has usable data. It fetches only once per
 * lifecycle thanks to a hydration guard.
 *
 * @returns
 * - userProfile: The user profile.
 * - loading: Whether the profile is being loaded.
 * - error: Any error that occurred when fetching the profile.
 */
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // if the profile has already been fetched, return
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // fetch the user profile
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await api.get(FETCH_USER_PROFILE_URL);
        if (error) {
          console.error('Failed to fetch user profile:', error);
          setError(error?.message);
          return;
        }

        const parsed = toCamelCase(data?.data) as UserProfile;
        setUserProfile(parsed);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch user profile');
        setUserProfile(DEFAULT_USER_PROFILE);
        return;
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  return {
    userProfile,
    loading,
    error,
  };
};
