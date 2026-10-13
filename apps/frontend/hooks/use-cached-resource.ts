'use client';

import { cacheGet, cacheSet } from '@/lib/api/cache';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCachedResourceOptions {
  ttlMs: number;
  enabled?: boolean;
}

/* Generic cache-first fetch: instant render from cache (survives reloads
 * via sessionStorage), silent background refresh when stale.
 *
 * - Lazy initializers read the cache once — never setState, lint-safe,
 *   and SSR-safe (empty on the server).
 * - All setState calls live inside async callbacks (post-hydration).
 * - `fetcher` identity is irrelevant: it is read through a ref, so inline
 *   callbacks never retrigger the effect.
 */
export function useCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedResourceOptions,
) {
  const { ttlMs, enabled = true } = options;
  // `fetcher` identity is irrelevant: always read through the ref, so
  // inline callbacks never retrigger the fetch effect below.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const [data, setData] = useState<T | null>(
    () => cacheGet<T>(key)?.value ?? null,
  );
  const [loading, setLoading] = useState<boolean>(
    () => enabled && !cacheGet<T>(key),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (cacheGet<T>(key)?.fresh) return;

    let ignore = false;

    (async () => {
      setError(null);
      try {
        const value = await fetcherRef.current();
        if (ignore) return;
        setData(value);
        cacheSet(key, value, ttlMs);
      } catch (err) {
        if (ignore) return;
        setError(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [enabled, key, ttlMs]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await fetcherRef.current();
      setData(value);
      cacheSet(key, value, ttlMs);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [key, ttlMs]);

  return { data, loading, error, refresh };
}
