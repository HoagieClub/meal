import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const { user, error, isLoading } = useUser();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/auth/token')
        .then((res) => res.json())
        .then((data) => {
          if (data.accessToken) {
            setAccessToken(data.accessToken);
          }
        })
        .catch((error) => {
          console.error('Error getting access token:', error);
          setAccessToken(null);
        });
    } else {
      setAccessToken(null);
    }
  }, [user]);

  return {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    error,
  };
};