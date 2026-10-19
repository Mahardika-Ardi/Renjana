'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { streakApi } from '@/lib/api/streak';
import {
  CACHE_TTL,
  POLL,
  cacheGet,
  cacheKeys,
  cacheSet,
  invalidateStreak,
} from '@/lib/api/cache';
import { useRevalidate } from '@/hooks/use-revalidate';
import type { StreakResponse, TodayNudgeState } from '@renjana/types';

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useStreak(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<StreakResponse | null>(
    () => cacheGet<StreakResponse>(cacheKeys.streak)?.value ?? null,
  );
  const [loading, setLoading] = useState<boolean>(
    () => enabled && !cacheGet<StreakResponse>(cacheKeys.streak),
  );
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<boolean>(false);

  const fetchSnapshot = useCallback(async () => {
    const res = await streakApi.get();
    const snapshot = res.data as unknown as StreakResponse;
    cacheSet(cacheKeys.streak, snapshot, CACHE_TTL.STREAK);
    return snapshot;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (cacheGet<StreakResponse>(cacheKeys.streak)?.fresh) return;

    let ignore = false;
    (async () => {
      setError(null);
      try {
        const snapshot = await fetchSnapshot();
        if (!ignore) setData(snapshot);
      } catch (err) {
        if (!ignore)
          setError(toErrorMessage(err, 'Gagal memuat streak.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [enabled, fetchSnapshot]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const snapshot = await fetchSnapshot();
      setData(snapshot);
      return true;
    } catch (err) {
      setError(toErrorMessage(err, 'Gagal memuat streak.'));
      return false;
    }
  }, [fetchSnapshot]);

  // Cross-device staleness: the partner's nudge/reply (or their invite
  // acceptance flipping `enabled` on) lands in *their* session, so an open
  // tab must revalidate itself. Silent — no loading flicker on the counter
  // or nudge face, and a failed tick keeps the last good snapshot.
  const polling = useRef(false);
  const revalidate = useCallback(async () => {
    if (polling.current) return false;
    polling.current = true;
    try {
      const snapshot = await fetchSnapshot();
      setData(snapshot);
      return true;
    } catch {
      return false;
    } finally {
      polling.current = false;
    }
  }, [fetchSnapshot]);

  useRevalidate(() => void revalidate(), {
    enabled,
    intervalMs: POLL.STREAK,
  });

  const act = useCallback(
    async (action: 'nudge' | 'reply') => {
      if (acting) return null;
      setActing(true);
      setError(null);
      try {
        const res =
          action === 'nudge'
            ? await streakApi.nudge()
            : await streakApi.reply();
        // Server replies carry only the action outcome — re-read the full
        // snapshot so counter, history, and nudge state stay consistent.
        invalidateStreak();
        const snapshot = await fetchSnapshot();
        setData(snapshot);
        return res.data as unknown as {
          message: string;
          status: TodayNudgeState;
        };
      } catch (err) {
        setError(toErrorMessage(err, 'Gagal memproses senggolan.'));
        return null;
      } finally {
        setActing(false);
      }
    },
    [acting, fetchSnapshot],
  );

  const send = useCallback(() => act('nudge'), [act]);
  const reply = useCallback(() => act('reply'), [act]);

  return {
    data,
    loading,
    error,
    acting,
    status: (data?.todayNudge.status ?? 'IDLE') as TodayNudgeState,
    currentStreak: data?.currentStreak ?? null,
    send,
    reply,
    refresh,
    dismissError: () => setError(null),
  };
}

export type UseStreakReturn = ReturnType<typeof useStreak>;
