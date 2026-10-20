'use client';

import { useEffect, useState } from 'react';
import { moodApi, MoodLog } from '@/lib/api/mood';
import { CACHE_TTL, cacheGet, cacheKeys, cacheSet } from '@/lib/api/cache';
import { todayDateString } from '@/hooks/use-mood-today';

/**
 * Today's partner mood for the mood card (display-only, no polling).
 *
 * GET /mood/partner has no date filter and — like the sibling endpoints —
 * crashes if page/limit are sent (strings reach Prisma's Int check), so
 * this calls it with NO params: the backend's numeric defaults apply and
 * we get the latest 20 logs. Today's entry (the unique per-day log) is
 * then picked client-side by comparing logDate's date part.
 *
 * Absent data (uncoupled, partner hasn't logged, fetch failed) resolves
 * to null and stays hidden — the strip is decorative, so failures are
 * silent by design.
 */
export function usePartnerMood(enabled = true) {
  const [log, setLog] = useState<MoodLog | null>(
    () => cacheGet<MoodLog>(cacheKeys.moodPartnerToday)?.value ?? null,
  );
  const [loading, setLoading] = useState<boolean>(
    () => enabled && !cacheGet<MoodLog>(cacheKeys.moodPartnerToday),
  );

  useEffect(() => {
    if (!enabled) return;
    // Fresh cache: init already started with loading=false, so nothing to do.
    if (cacheGet<MoodLog>(cacheKeys.moodPartnerToday)?.fresh) return;
    let ignore = false;
    (async () => {
      try {
        // No params: {} serializes to no query string (see warnings in lib/api/mood.ts).
        const res = await moodApi.getPartner({});
        const today = todayDateString();
        const found =
          (res.data?.items ?? []).find(
            (item) =>
              typeof item.logDate === 'string' &&
              item.logDate.slice(0, 10) === today,
          ) ?? null;
        // Cache null too — "no mood today" is an answer worth not re-asking.
        cacheSet(cacheKeys.moodPartnerToday, found, CACHE_TTL.MOOD_TODAY);
        if (!ignore) setLog(found);
      } catch {
        if (!ignore) setLog(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [enabled]);

  return { partnerMood: log, partnerLoading: loading };
}
