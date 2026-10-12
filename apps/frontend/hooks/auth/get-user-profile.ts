'use client';

import { authApi } from '@/lib/api/auth';
import { AuthUser } from '@renjana/types';
import { useEffect, useState } from 'react';

export function useGetUserProfile() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await authApi.getUserProfile();

        if (isMounted) {
          setUser(res.data as AuthUser);
        }
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.';

        console.log(message);
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    user,
    loading,
    error,
  };
}
