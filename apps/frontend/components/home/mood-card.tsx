'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { HeartPulseIcon } from './home-icons';
import { useHome } from '@/components/home/home-i18n';
import { MOOD_ITEMS, MoodLevel, MOOD_LEVEL_TO_ENUM, MoodEnum } from '@/lib/constants/mood';
import { useMoodToday } from '@/hooks/use-mood-today';
import { usePartnerMood } from '@/hooks/use-partner-mood';
import { useMounted } from '@/lib/use-mounted';
import { avatarSrc } from '@/lib/avatar-revision';

const AUTO_SEND_MS = 10_000;

/* Row geometry: fixed w-8 (32px) wrapper buttons with gap-2 (8px) → one
 * step between neighbors is 40px, so the pop-to-center translation for
 * index i (of 5) is exactly (2 - i) * 40px.
 *
 * Hitbox vs visual split: the wrapper <button> is a stationary hit area
 * (h-24 spans the row slot plus the stage strip above it) carrying all
 * listeners; only the inner <span> transforms. A moving hitbox would
 * leave the cursor behind on pop → mouseleave/mouseenter loop → the
 * hover "shake" — this layout makes enter/leave fire exactly once, and
 * lets the cursor chase the popped emoji without losing the wrapper. */
const BTN = 32;
const GAP = 8;
const STEP = BTN + GAP;
const POP_Y = -56;
const POP_SCALE = 2.05;

export default function MoodCard() {
  const mounted = useMounted();
  const t = useHome();
  const { data, locked, loading, submitting, submit, error, clearError } = useMoodToday();
  const { partnerMood, partnerLoading } = usePartnerMood();

  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [hovered, setHovered] = useState<MoodLevel | null>(null);
  const [remaining, setRemaining] = useState(AUTO_SEND_MS);
  const [armed, setArmed] = useState(false);
  const [sentOnce, setSentOnce] = useState(false);

  /* Device capability, not user agent: mice/desktops report hover:hover,
   * phones/tablets don't. Desktop pops only while hovering (idle = clean
   * flat row + halo on the pick); touch has no hover, so the pick stays
   * popped so there is always feedback. Client-only effect → server HTML
   * and first paint are the same flat row in both modes. */
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSelectedRef = useRef<MoodLevel | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  // Sync with an already-existing today's mood (locked state from server)
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

    intervalRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000));
    }, 1000);

    timeoutRef.current = setTimeout(async () => {
      if (lastSelectedRef.current === level && !sentOnce) {
        const moodEnum: MoodEnum = MOOD_LEVEL_TO_ENUM[level];
        const res = await submit(moodEnum);
        if (res.success) setSentOnce(true);
        setArmed(false);
        clearTimers();
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

  useEffect(() => { lastSelectedRef.current = selected; }, [selected]);
  useEffect(() => () => clearTimers(), []);

  const lockedState = mounted && (locked || data !== null);
  const showCountdown = mounted && armed && !lockedState && !submitting;
  const loadingState = mounted ? loading : false;
  const rowDisabled = lockedState || submitting || loadingState;

  /* Who pops:
   * - Locked/submitting (row disabled): the pick stays CENTERED on every
   *   device — the "lock to center" state, same look as the hover pop;
   *   the other four dim below it.
   * - Otherwise: desktop pops only the hovered/focused one (idle = clean
   *   flat row + halo on the pick), touch has no hover so the pick stays
   *   popped for constant feedback. */
  const popped = rowDisabled ? selected : canHover ? hovered : selected;

  const partnerItem = partnerMood ? MOOD_ITEMS.find((m) => m.enum === partnerMood.mood) : undefined;
  const showPartner = mounted && !partnerLoading && partnerMood != null && partnerItem != null;

  return (
    <div className="relative flex min-h-68.75 flex-col rounded-[30px] bg-[#f1f1f0] p-5">
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

      {/* Bottom-pinned stack: any leftover card height is absorbed by the
          stage above the row (invisible slack), never pooled below. */}
      <div className="mt-4 flex flex-1 flex-col justify-end gap-3">
        <div
          className="flex items-end justify-center gap-2"
          role="radiogroup"
          aria-label={t.mood.howDoYouFeel}
        >
          {MOOD_ITEMS.map((item, index) => {
            const isSelected = selected === item.level;
            const isPopped = popped === item.level;
            const showHalo = isSelected && !isPopped;
            return (
              <button
                key={item.level}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={item.emoji}
                disabled={rowDisabled}
                onClick={() => {
                  if (rowDisabled) return;
                  arm(item.level);
                }}
                onMouseEnter={() => { if (!rowDisabled) setHovered(item.level); }}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => { if (!rowDisabled) setHovered(item.level); }}
                onBlur={() => setHovered(null)}
                className={[
                  'flex h-24 w-8 items-end justify-center touch-manipulation select-none',
                  rowDisabled
                    ? isSelected
                      ? 'opacity-100'
                      : 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer',
                ].join(' ')}
              >
                <span
                  style={
                    isPopped
                      ? {
                          transform: `translate(${(2 - index) * STEP}px, ${POP_Y}px) scale(${POP_SCALE})`,
                          zIndex: 10,
                        }
                      : undefined
                  }
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full text-2xl leading-none',
                    'transition-transform duration-200 ease-out',
                    showHalo ? 'bg-[#e9e6dc] ring-1 ring-[#d8c9a3]' : '',
                  ].join(' ')}
                >
                  {item.emoji}
                </span>
              </button>
            );
          })}
        </div>

        {/* Auto-send progress: fills linearly with the 10s countdown pill below */}
        {showCountdown && (
          <div
            className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-[#e4e4e1]"
            role="progressbar"
            aria-label={t.mood.sendingIn.replace('{n}', String(Math.ceil(remaining / 1000)))}
            aria-valuenow={AUTO_SEND_MS - remaining}
            aria-valuemin={0}
            aria-valuemax={AUTO_SEND_MS}
          >
            <div
              className="h-full rounded-full bg-[#8b602f] transition-[width] duration-1000 ease-linear"
              style={{ width: `${((AUTO_SEND_MS - remaining) / AUTO_SEND_MS) * 100}%` }}
            />
          </div>
        )}

        {/* Status line: tiny countdown + cancel, or state hints */}
        <div className="flex h-6 items-center justify-center gap-2">
          {showCountdown && (
            <>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#5b5a54]">
                {Math.ceil(remaining / 1000)}s
              </span>
              <button
                type="button"
                onClick={cancel}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-[12px] leading-none font-medium text-[#8a6335] transition hover:bg-white/90"
                aria-label={t.mood.cancel}
              >
                ×
              </button>
            </>
          )}

          {submitting && (
            <span className="text-[10px] font-medium tracking-wide text-[#5b5a54]">
              {t.mood.submitting}
            </span>
          )}

          {lockedState && !submitting && (
            <span className="text-[10px] font-medium tracking-wide text-[#5b5a54]">
              {t.mood.locked}
            </span>
          )}

          {error && (
            <span className="text-[10px] font-medium tracking-wide text-[#b35a5a]">
              {error}
            </span>
          )}
        </div>

        {/* Partner's mood today — text-free: avatar + emoji, hidden when absent */}
        {showPartner && partnerItem && partnerMood && (
          <div
            className="flex h-6 items-center justify-center gap-2"
            role="img"
            aria-label={t.mood.partnerMood}
          >
            <Image
              src={avatarSrc(partnerMood.user?.avatarUrl)}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 rounded-full object-cover"
            />
            <span className="text-xl leading-none">{partnerItem.emoji}</span>
          </div>
        )}
      </div>
    </div>
  );
}
