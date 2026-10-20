'use client';

import { authApi } from '@/lib/api/auth';
import { CACHE_TTL, POLL, cacheKeys } from '@/lib/api/cache';
import { useCachedResource } from '@/hooks/use-cached-resource';
import { AuthUser } from '@renjana/types';

export function useGetUserProfile(options?: { enabled?: boolean }) {
  const { data, loading, error, refresh } = useCachedResource<AuthUser>(
    cacheKeys.me,
    async () => (await authApi.getUserProfile()).data as AuthUser,
    {
      ttlMs: CACHE_TTL.ME,
      enabled: options?.enabled,
      // Couple state changes on the *partner's* device — poll so an open
      // tab picks up their invite acceptance without a re-login.
      pollMs: POLL.ME,
    },
  );

  return { user: data, loading, error, refresh };
}
