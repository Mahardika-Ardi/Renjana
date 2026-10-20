'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MoodEnum } from '@/lib/constants/mood';
import { moodApi, MoodLog, MoodListResponse } from '@/lib/api/mood';
import { cacheGet, cacheKeys, cacheSet, cacheInvalidate, CACHE_TTL } from '@/lib/api/cache';
import type { ApiResponse } from '@renjana/types';

export function todayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useMoodToday(enabled = true) {
  const [dateStr] = useState(() => todayDateString());
  const [data, setData] = useState<MoodLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cancelled = useRef(false);

  const fetchToday = useCallback(async () => {
    if (!enabled) return null;
    const cached = cacheGet<MoodLog>(cacheKeys.moodToday);
    if (cached?.value) return cached.value as MoodLog;
    const res = await moodApi.getToday(dateStr, dateStr);
    const apiRes = res.data as ApiResponse<MoodListResponse> | MoodListResponse;
    const payload = 'data' in apiRes && apiRes.data ? apiRes.data : (apiRes as MoodListResponse);
    const items = payload.items ?? [];
    const log = items[0] ?? null;
    if (log) cacheSet(cacheKeys.moodToday, log, CACHE_TTL.MOOD_TODAY ?? 5 * 60 * 1000);
    return log;
  }, [dateStr, enabled]);

  useEffect(() => {
    if (!enabled) return;
    let ignore = false;
    (async () => {
      try {
        const log = await fetchToday();
        if (!ignore) {
          setLoading(false);
          setData(log);
        }
      } catch (e: unknown) {
        if (!ignore) {
          setLoading(false);
          setError(e instanceof Error ? e.message : 'Gagal memuat mood hari ini.');
        }
      }
    })();
    return () => {
      ignore = true;
      cancelled.current = true;
    };
  }, [enabled, fetchToday]);

  const submit = useCallback(async (mood: MoodEnum) => {
    if (submitting || data) return { success: false as const, locked: true as const };
    setSubmitting(true);
    setError(null);
    try {
      const res = await moodApi.create({ mood, logDate: dateStr });
      const apiRes = res.data as ApiResponse<MoodLog> | MoodLog;
      const log = ('data' in apiRes && apiRes.data ? apiRes.data : apiRes) as MoodLog | undefined;
      if (log) {
        cacheSet(cacheKeys.moodToday, log, CACHE_TTL.MOOD_TODAY ?? 5 * 60 * 1000);
        setData(log);
      } else {
        await fetchToday().then((l) => { if (l) setData(l); });
      }
      return { success: true as const };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message ?? err?.message ?? 'Gagal mengirim mood.';
      setError(msg);
      return { success: false as const, message: msg };
    } finally {
      setSubmitting(false);
    }
  }, [data, dateStr, fetchToday, submitting]);

  const refresh = useCallback(async () => {
    try {
      cacheInvalidate(cacheKeys.moodToday);
      const log = await fetchToday();
      setData(log);
      return true;
    } catch {
      return false;
    }
  }, [fetchToday]);

  return {
    dateStr,
    data,
    loading,
    error,
    submitting,
    locked: !!data,
    submit,
    refresh,
    clearError: () => setError(null),
  };
}