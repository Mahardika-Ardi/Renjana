'use client';

import { useEffect, useRef } from 'react';

interface UseRevalidateOptions {
  /** Skips every tick while false (e.g. user not coupled yet). */
  enabled?: boolean;
  /** Tick period in ms. 0 or undefined disables the hook entirely. */
  intervalMs?: number;
  /** Minimum spacing between two ticks — absorbs focus/visibility spam. */
  minGapMs?: number;
}

/**
 * Calls `fn` on a fixed interval and again the moment the tab becomes
 * visible (alt-tab back, returning to the window). Ticks pause while the
 * document is hidden so background tabs never fire requests, then resume
 * immediately on return.
 *
 * Owns *when* to revalidate — nothing about fetching or caching (SoC).
 * `fn` identity is read through a ref, so inline callbacks never retrigger
 * the effect.
 */
export function useRevalidate(
  fn: () => void | Promise<void>,
  options?: UseRevalidateOptions,
): void {
  const { enabled = true, intervalMs = 0, minGapMs = 5_000 } = options ?? {};

  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!enabled || !intervalMs) return;
    if (typeof document === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    // Start with a grace window: the mount fetch just ran, so an instant
    // focus tick would only duplicate it.
    let lastTick = Date.now();
    let disposed = false;

    const tick = () => {
      if (disposed || document.hidden) return;
      const now = Date.now();
      if (now - lastTick < minGapMs) return;
      lastTick = now;
      void fnRef.current();
    };

    const schedule = () => {
      if (disposed) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        tick();
        schedule();
      }, intervalMs);
    };

    const onVisibility = () => {
      if (disposed) return;
      if (document.visibilityState === 'visible') {
        tick();
        schedule(); // restart the cadence on resume
      } else if (timer) {
        // Hidden tab: pause — no wasted requests in the background.
        clearTimeout(timer);
        timer = null;
      }
    };

    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [enabled, intervalMs, minGapMs]);
}
