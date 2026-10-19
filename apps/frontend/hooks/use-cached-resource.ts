'use client';

import { cacheGet, cacheSet } from '@/lib/api/cache';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRevalidate } from '@/hooks/use-revalidate';

interface UseCachedResourceOptions {
  ttlMs: number;
  enabled?: boolean;
  /**
   * Silent background revalidation period (ms). Refetches even while the
   * cached entry is still fresh — the server may have changed underneath
   * us (e.g. the partner accepted an invite from another device). Never
   * touches `loading`/`error`, so no skeleton flicker.
   */
  pollMs?: number;
}

/* Generic cache-first fetch: instant render from cache (survives reloads
 * via sessionStorage), silent background refresh when stale.
 *
 * - Lazy initializers read the cache once — never setState, lint-safe,
 *   and SSR-safe (empty on the server).
 * - All setState calls live inside async callbacks (post-hydration).
 * - `fetcher` identity is irrelevant: it is read through a ref, so inline
 *   callbacks never retrigger the fetch effect below.
 *
 * Two run paths:
 *   mount   — stale-while-revalidate on first paint: clears error, always
 *             ends with loading=false (inline in the effect below).
 *   refresh — manual, user-triggered: toggles loading, clears error.
 *   poll    — background tick: touches neither loading nor error and
 *             swallows its own failures (last good value stays on screen).
 */
export function useCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedResourceOptions,
) {
  const { ttlMs, enabled = true, pollMs } = options;
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

  // One poll in flight at a time — a slow response must not stack
  // requests on every tick.
  const polling = useRef(false);

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

  /** `refresh` — user-triggered (loading toggled). `poll` — background (silent). */
  const run = useCallback(
    async (mode: 'refresh' | 'poll') => {
      if (mode === 'poll') {
        if (polling.current) return false;
        polling.current = true;
      } else {
        setLoading(true);
        setError(null);
      }
      try {
        const value = await fetcherRef.current();
        setData(value);
        cacheSet(key, value, ttlMs);
        return true;
      } catch (err) {
        if (mode === 'poll') return false;
        setError(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
        return false;
      } finally {
        if (mode === 'poll') polling.current = false;
        else setLoading(false);
      }
    },
    [key, ttlMs],
  );

  // Cross-device staleness: the partner can change shared state (invite
  // acceptance, streak) from their own browser, where our local
  // invalidation never runs. Revalidate on a cadence + tab focus instead.
  useRevalidate(() => void run('poll'), {
    enabled: enabled && !!pollMs,
    intervalMs: pollMs,
  });

  const refresh = useCallback(
    () => run('refresh'),
    [run],
  );

  return { data, loading, error, refresh };
}
