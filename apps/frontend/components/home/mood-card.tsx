'use client';

import { useEffect, useRef, useState } from 'react';
import { HeartPulseIcon } from './home-icons';
import { useHome } from '@/components/home/home-i18n';
import { useLang } from '@/lib/i18n/lang-context';
import { pick } from '@/lib/i18n/pick';
import { MOOD_ITEMS, MoodLevel, MOOD_LEVEL_TO_ENUM, MoodEnum } from '@/lib/constants/mood';
import { useMoodToday } from '@/hooks/use-mood-today';
import { useMounted } from '@/lib/use-mounted';

const AUTO_SEND_MS = 10_000;

export default function MoodCard() {
  const mounted = useMounted();
  const t = useHome();
  const { lang } = useLang();
  const { data, locked, loading, submitting, submit, error, clearError } = useMoodToday();

  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [remaining, setRemaining] = useState(AUTO_SEND_MS);
  const [armed, setArmed] = useState(false);
  const [sentOnce, setSentOnce] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSelectedRef = useRef<MoodLevel | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  // Sync with existing today's mood
  useEffect(() => {
    if (!data?.mood) return;
    const found = MOOD_ITEMS.find((m) => m.enum === data.mood);
    if (!found) return;
    const id = setTimeout(() => {
      setSelected(found.level);
      setArmed(false);
      clearTimers();
    }, 0);
    return () => clearTimeout(id);
  }, [data]);

  const arm = (level: MoodLevel) => {
    clearTimers();
    setSelected(level);
    setArmed(true);
    setRemaining(AUTO_SEND_MS);
    setSentOnce(false);
    clearError();

    // countdown tick every 1s
    intervalRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000));
    }, 1000);

    timeoutRef.current = setTimeout(async () => {
      if (lastSelectedRef.current === level && !sentOnce) {
        const moodEnum: MoodEnum = MOOD_LEVEL_TO_ENUM[level];
        const res = await submit(moodEnum);
        if (res.success) {
          setSentOnce(true);
          setArmed(false);
          clearTimers();
        } else {
          // keep armed? allow retry by re-selecting (will reset)
          setArmed(false);
          clearTimers();
        }
      } else {
        setArmed(false);
        clearTimers();
      }
    }, AUTO_SEND_MS);
  };

  const cancel = () => {
    clearTimers();
    setArmed(false);
    setRemaining(AUTO_SEND_MS);
  };

  // track last selected to avoid firing for stale selection
  useEffect(() => { lastSelectedRef.current = selected; }, [selected]);

  useEffect(() => () => clearTimers(), []);

  const lockedState = mounted && (locked || data !== null);
  const showCountdown = mounted && armed && !lockedState && !submitting;
  const loadingState = mounted ? loading : false;

  return (
    <div className="relative flex min-h-68.75 flex-col rounded-[30px] bg-[#f1f1f0] p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{t.mood.title}</h3>
          <p className="mt-1 text-[11px] font-medium tracking-wide text-[#474742]">
            {t.mood.howDoYouFeel}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e9e7]">
          <HeartPulseIcon />
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
        <div className="flex flex-col gap-2">
          {MOOD_ITEMS.map((item) => {
            const active = selected === item.level;
            const disabled = lockedState || submitting;
            return (
              <button
                key={item.level}
                type="button"
                disabled={disabled || loadingState}
                onClick={() => {
                  if (disabled) return;
                  arm(item.level);
                }}
                className={[
                  'flex items-center gap-3 rounded-2xl px-3 py-2 text-left transition',
                  active ? 'bg-[#e9e6dc] ring-2 ring-[#d8c9a3]' : 'bg-[#f6f6f4] hover:bg-[#ecece8]',
                  disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
              >
                <span className="text-2xl leading-none">{item.emoji}</span>
                <span className="text-sm text-[#3f3f3a]">
                  {pick(item.label, lang)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 space-y-2">
          {showCountdown && (
            <div className="rounded-2xl bg-white/70 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium tracking-wide text-[#5b5a54]">
                  {t.mood.sendingIn.replace('{n}', String(Math.ceil(remaining / 1000)))}
                </p>
                <button type="button" onClick={cancel} className="text-[11px] font-medium text-[#8a6335] underline">
                  {t.mood.cancel}
                </button>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#e9e9e7]">
                <div
                  className="h-full bg-[#8b602f] transition-[width] duration-1000 ease-linear"
                  style={{ width: `${((AUTO_SEND_MS - remaining) / AUTO_SEND_MS) * 100}%` }}
                />
              </div>
            </div>
          )}

          {submitting && (
            <p className="text-center text-[11px] font-medium tracking-wide text-[#5b5a54]">
              {t.mood.submitting}
            </p>
          )}

          {lockedState && (
            <p className="text-center text-[11px] font-medium tracking-wide text-[#5b5a54]">
              {t.mood.locked}
            </p>
          )}

          {error && (
            <p className="text-center text-[11px] font-medium tracking-wide text-[#b35a5a]">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}