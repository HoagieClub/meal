'use client';
import { useState, useEffect } from 'react';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/me');
        const data = await response.json();

        if (data.data) {
          setUserProfile(data.data);
        }
      } catch (err) {
        setError('Failed to fetch user profile');
        console.error('Error fetching user profile:', err);
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
    dietaryRestrictions: userProfile?.dietary_restrictions || [],
    allergens: userProfile?.allergens || [],
    dailyCalorieTarget: userProfile?.daily_calorie_target || 0,
    dailyProteinTarget: userProfile?.daily_protein_target || 0,
    diningHalls: userProfile?.dining_halls || [],
  };
};
