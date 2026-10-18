'use client';

import { authApi } from '@/lib/api/auth';
import { CACHE_TTL, cacheKeys } from '@/lib/api/cache';
import { useCachedResource } from '@/hooks/use-cached-resource';
import { AuthUser } from '@renjana/types';

export function useGetUserProfile(options?: { enabled?: boolean }) {
  const { data, loading, error, refresh } = useCachedResource<AuthUser>(
    cacheKeys.me,
    async () => (await authApi.getUserProfile()).data as AuthUser,
    { ttlMs: CACHE_TTL.ME, enabled: options?.enabled },
  );

  return { user: data, loading, error, refresh };
}
