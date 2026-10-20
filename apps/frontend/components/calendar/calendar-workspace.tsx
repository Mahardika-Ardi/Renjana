'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EmotionDump } from '@renjana/types';
import { emotionDumpApi } from '@/lib/api/emotion-dump';
import { moodApi, type MoodLog } from '@/lib/api/mood';
import { useStreak } from '@/hooks/note/use-streak';
import { MOOD_ITEMS, type MoodEnum } from '@/lib/constants/mood';
import { useLang } from '@/lib/i18n/lang-context';
import { useMounted } from '@/lib/use-mounted';
import {
  datePartKey,
  dayToken,
  daysInMonth,
  mondayIndex,
  serverDayKey,
  tokenKey,
  todayKey,
  todayParts,
} from '@/lib/day-key';
import { useCalendar } from './calendar-i18n';

/** Monday-first weekday heads (fixed arrays — hydration-safe). */
const HEADS = {
  id: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const;

/** Dot colors per dump status (kept in sync with STATUS_STYLE on the card). */
const DUMP_DOT: Record<EmotionDump['status'], string> = {
  PRIVATE: '#a8a69e',
  REFINED: '#d5a46d',
  SHARED: '#6f8f3f',
};
const STREAK_DOT = '#8a6335';

function moodMeta(mood: MoodEnum, lang: 'id' | 'en') {
  const item = MOOD_ITEMS.find((i) => i.enum === mood);
  return item ? { emoji: item.emoji, label: item.label[lang === 'id' ? 0 : 1] } : null;
}

function monthKeyOf(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * /calendar — per-day view of the three daily-layer signals:
 * streak engagement (GET /streak recentLogs), moods (own via two safe
 * half-month range calls; partner via latest-20 endpoint), and emotion
 * dumps (full history, colored by status).
 *
 * Known backend coverage limits (frontend-only rule): streak logs are only
 * exposed for the last 28 days, and the partner mood endpoint has no date
 * filter (latest 20). Days beyond those windows read as "no data" — never
 * as false inactivity.
 *
 * All calendar math runs on WIB day tokens (see lib/day-key.ts), so a
 * server timestamp never lands on the wrong cell.
 */
export default function CalendarWorkspace() {
  const t = useCalendar();
  const { lang } = useLang();
  const mounted = useMounted();
  const router = useRouter();

  const today = todayParts();
  const todayToken = dayToken(today.year, today.month, today.day);
  const todayK = todayKey();

  const [view, setView] = useState(() => ({ year: today.year, month: today.month - 1 }));
  const [selected, setSelected] = useState<string>(todayK);

  const [partnerMoods, setPartnerMoods] = useState<MoodLog[] | null>(null);
  const [dumps, setDumps] = useState<EmotionDump[] | null>(null);
  const [dumpsFailed, setDumpsFailed] = useState(false);
  const [mineByMonth, setMineByMonth] = useState<Record<string, MoodLog[]>>({});
  const [moodsFailed, setMoodsFailed] = useState(false);
  const [monthToken, setMonthToken] = useState(0);

  const streak = useStreak(); // cached + revalidated from home; uncoupled users land in error

  // ---- one-time fetches ---------------------------------------------------
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await moodApi.getPartner({});
        if (!ignore) setPartnerMoods(res.data?.items ?? []);
      } catch {
        if (!ignore) setPartnerMoods([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await emotionDumpApi.list();
        if (!ignore) {
          setDumps(res.data?.items ?? []);
          setDumpsFailed(false);
        }
      } catch {
        if (!ignore) {
          setDumps(null);
          setDumpsFailed(true);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // ---- own moods for the viewed month ------------------------------------
  // Two half-month ranges: GET /mood silently caps results at its default
  // page of 20 (page/limit strings crash the backend — never send them),
  // and 16 days ≤ 20 even with a daily log. Results cache per month.
  const viewMonthKey = monthKeyOf(view.year, view.month);
  useEffect(() => {
    if (mineByMonth[viewMonthKey]) return;
    let ignore = false;
    (async () => {
      try {
        const mm = String(view.month + 1).padStart(2, '0');
        const last = String(daysInMonth(view.year, view.month)).padStart(2, '0');
        const [a, b] = await Promise.all([
          moodApi.list({
            startDate: `${view.year}-${mm}-01`,
            endDate: `${view.year}-${mm}-15`,
          }),
          moodApi.list({
            startDate: `${view.year}-${mm}-16`,
            endDate: `${view.year}-${mm}-${last}`,
          }),
        ]);
        const items = [...(a.data?.items ?? []), ...(b.data?.items ?? [])];
        if (!ignore) {
          setMineByMonth((prev) => ({ ...prev, [viewMonthKey]: items }));
          setMoodsFailed(false);
        }
      } catch {
        if (!ignore) setMoodsFailed(true);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [view, viewMonthKey, mineByMonth, monthToken]);

  // ---- groupings ----------------------------------------------------------
  const mineMoods = mineByMonth[viewMonthKey] ?? null;
  const mineByDay = useMemo(
    () => new Map((mineMoods ?? []).map((m) => [datePartKey(m.logDate), m])),
    [mineMoods],
  );
  const partnerByDay = useMemo(
    () => new Map((partnerMoods ?? []).map((m) => [datePartKey(m.logDate), m])),
    [partnerMoods],
  );
  const dumpsByDay = useMemo(() => {
    const map = new Map<string, EmotionDump[]>();
    for (const d of dumps ?? []) {
      const key = serverDayKey(d.createdAt);
      const list = map.get(key);
      if (list) list.push(d);
      else map.set(key, [d]);
    }
    return map;
  }, [dumps]);

  const streakDays = useMemo(
    () => new Set((streak.data?.recentLogs ?? []).map((r) => datePartKey(r.engagedDate))),
    [streak.data],
  );
  const streakAvailable = streak.data !== null;
  // Anything older than the 28-entry log window is genuinely unknowable.
  const windowStartToken = new Date(todayToken);
  windowStartToken.setUTCDate(windowStartToken.getUTCDate() - 27);
  const windowStartKey = tokenKey(windowStartToken);

  // ---- month grid (Mon-first, WIB day tokens) -----------------------------
  const grid = useMemo(() => {
    const first = dayToken(view.year, view.month + 1, 1);
    const total = daysInMonth(view.year, view.month);
    const leading = mondayIndex(first);
    const cells: Array<Date | null> = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= total; day++) cells.push(dayToken(view.year, view.month + 1, day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  const locale = lang === 'id' ? 'id-ID' : 'en-US';
  const monthTitle = dayToken(view.year, view.month + 1, 1).toLocaleDateString(locale, {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  });
  const dateLabelOf = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return dayToken(y, m, d).toLocaleDateString(locale, {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const next = new Date(Date.UTC(v.year, v.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
    setMoodsFailed(false);
  };

  // ---- selected-day detail ------------------------------------------------
  const mineMood = mineByDay.get(selected) ?? null;
  const partnerMood = partnerByDay.get(selected) ?? null;
  const selectedDumps = dumpsByDay.get(selected) ?? [];
  const streakState: 'active' | 'none' | 'outside' | 'unavailable' = !streakAvailable
    ? 'unavailable'
    : streakDays.has(selected)
      ? 'active'
      : selected < windowStartKey
        ? 'outside'
        : 'none';

  // ---- pre-mount: static skeleton (server HTML ≡ first client paint) ------
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8f8f7] pb-12" aria-busy="true" aria-label={t.header.title}>
        <div className="mx-auto w-full max-w-250 px-4 pt-8 md:px-8">
          <div className="h-8 w-40 animate-pulse rounded-full bg-[#e7e5df] motion-reduce:animate-none" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded-full bg-[#e7e5df] motion-reduce:animate-none" />
          <div className="mt-6 h-96 animate-pulse rounded-[28px] bg-[#f1f1f0] motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f7] pb-12 text-[#1d1d1b]">
      <div className="mx-auto w-full max-w-250 px-4 pt-6 md:px-8 md:pt-8">
        {/* ---- header ---- */}
        <header className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/home')}
            aria-label={t.header.back}
            title={t.header.back}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e0ddd5] bg-white text-[#7a7871] transition hover:bg-[#f6f4ef]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4.5 w-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              {t.header.title}
            </h1>
            <p className="mt-0.5 text-xs text-[#8f8d85]">{t.header.subtitle}</p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setView({ year: today.year, month: today.month - 1 });
                setSelected(todayK);
                setMoodsFailed(false);
              }}
              className="rounded-full border border-[#d9d4c8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#79582f] transition hover:bg-[#faf8f4]"
            >
              {t.header.today}
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label={t.header.prevMonth}
              title={t.header.prevMonth}
              className="grid h-8 w-8 place-items-center rounded-full border border-[#e0ddd5] bg-white text-[#7a7871] transition hover:bg-[#f6f4ef]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="min-w-36 text-center text-sm font-semibold md:min-w-44 md:text-base">
              {monthTitle}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label={t.header.nextMonth}
              title={t.header.nextMonth}
              className="grid h-8 w-8 place-items-center rounded-full border border-[#e0ddd5] bg-white text-[#7a7871] transition hover:bg-[#f6f4ef]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </header>

        {/* ---- legend ---- */}
        <section
          aria-label={t.legend.title}
          className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-[#f1f1f0] px-4 py-3 text-[11px] text-[#6b6961] ring-1 ring-[#e7e5df]"
        >
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: STREAK_DOT }} />
            {t.legend.streak}
            <span className="text-[#a3a199]">({t.legend.streakNote})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="text-[11px] leading-none">
              🙂🥰
            </span>
            {t.legend.moods}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: DUMP_DOT.PRIVATE }} />
            {t.legend.dumpPrivate}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: DUMP_DOT.REFINED }} />
            {t.legend.dumpRefined}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: DUMP_DOT.SHARED }} />
            {t.legend.dumpShared}
          </span>
        </section>

        {moodsFailed && (
          <div
            role="alert"
            className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#f0dcd8] bg-[#fbeeea] px-4 py-2.5 text-xs text-[#b4453c]"
          >
            <span>{t.banner.moodsFailed}</span>
            <button
              type="button"
              onClick={() => setMonthToken((n) => n + 1)}
              className="shrink-0 rounded-full border border-[#e8c9c3] bg-white px-3 py-1 font-semibold"
            >
              {t.banner.retry}
            </button>
          </div>
        )}

        {/* ---- grid + detail ---- */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="rounded-[28px] bg-white p-3 shadow-[0_6px_28px_rgba(29,29,27,0.05)] ring-1 ring-[#e7e5df] md:p-4">
            <div className="grid grid-cols-7 gap-1 pb-1 text-center">
              {HEADS[lang].map((head, i) => (
                <span key={head + i} className="py-1 text-[10px] font-semibold uppercase tracking-wide text-[#a3a199]">
                  {head}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.map((token, i) => {
                if (!token) return <span key={`pad-${i}`} aria-hidden />;
                const key = tokenKey(token);
                const dayNum = token.getUTCDate();
                const isSelected = key === selected;
                const isToday = key === todayK;
                const mine = mineByDay.get(key);
                const partner = partnerByDay.get(key);
                const mineMeta = mine ? moodMeta(mine.mood, lang) : null;
                const partnerMeta = partner ? moodMeta(partner.mood, lang) : null;
                const cellDumps = dumpsByDay.get(key);
                const latestDump = cellDumps?.[0];
                const dumpDot = latestDump ? DUMP_DOT[latestDump.status] : null;
                const streakOn = streakDays.has(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    aria-pressed={isSelected}
                    aria-label={dateLabelOf(key)}
                    className={`flex flex-col items-center gap-1 rounded-xl py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6335] ${
                      isSelected
                        ? 'bg-[#8a6335] shadow-sm'
                        : isToday
                          ? 'bg-[#faf6ef] ring-1 ring-[#d5a46d]'
                          : 'hover:bg-[#f6f4ef]'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-semibold ${
                        isSelected ? 'text-white' : isToday ? 'text-[#8a6335]' : 'text-[#474742]'
                      }`}
                    >
                      {dayNum}
                    </span>
                    <span className="flex h-3.5 items-center gap-0.5">
                      {mineMeta && <span className="text-[10px] leading-none">{mineMeta.emoji}</span>}
                      {partnerMeta && <span className="text-[10px] leading-none">{partnerMeta.emoji}</span>}
                    </span>
                    <span className="flex h-1.5 items-center gap-0.5">
                      {streakOn && (
                        <i
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: isSelected ? '#f5e9d7' : STREAK_DOT }}
                          title={t.legend.streak}
                        />
                      )}
                      {dumpDot && (
                        <i
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: isSelected ? '#f5e9d7' : dumpDot }}
                          title={t.legend.title}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ---- selected-day detail ---- */}
          <aside className="h-fit rounded-[28px] bg-[#f1f1f0] p-5 ring-1 ring-[#e7e5df]">
            <h2 className="text-sm font-bold leading-5 text-[#1d1d1b]">
              {dateLabelOf(selected)}
            </h2>

            {/* streak */}
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a3a199]">
                {t.detail.sectionStreak}
              </p>
              {streak.loading ? (
                <div className="mt-1.5 h-4 w-24 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[#474742]">
                  {streakState === 'active' && (
                    <i className="h-2 w-2 rounded-full" style={{ background: STREAK_DOT }} />
                  )}
                  {streakState === 'active' && t.detail.streakActive}
                  {streakState === 'none' && t.detail.streakNone}
                  {streakState === 'outside' && t.detail.streakOutside}
                  {streakState === 'unavailable' &&
                    (streak.data ? t.detail.unavailable : t.detail.uncoupled)}
                </p>
              )}
            </div>

            {/* moods */}
            <div className="mt-4 border-t border-[#e4e2dc] pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a3a199]">
                {t.detail.sectionMood}
              </p>
              {mineMoods === null || partnerMoods === null ? (
                <div className="mt-2 space-y-1.5">
                  <div className="h-4 w-32 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
                  <div className="h-4 w-28 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {(() => {
                    const meta = mineMood ? moodMeta(mineMood.mood, lang) : null;
                    return (
                      <p className="flex items-center gap-2 text-sm text-[#474742]">
                        <span className="text-base leading-none">{meta ? meta.emoji : '·'}</span>
                        <span className="text-xs font-semibold text-[#6b6961]">{t.detail.you}</span>
                        <span className="truncate text-xs">{meta ? meta.label : t.detail.noMood}</span>
                      </p>
                    );
                  })()}
                  {(() => {
                    const meta = partnerMood ? moodMeta(partnerMood.mood, lang) : null;
                    return (
                      <p className="flex items-center gap-2 text-sm text-[#474742]">
                        <span className="text-base leading-none">{meta ? meta.emoji : '·'}</span>
                        <span className="text-xs font-semibold text-[#6b6961]">{t.detail.partner}</span>
                        <span className="truncate text-xs">{meta ? meta.label : t.detail.noMood}</span>
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* dumps */}
            <div className="mt-4 border-t border-[#e4e2dc] pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a3a199]">
                {t.detail.sectionDumps}
              </p>
              {dumps === null ? (
                dumpsFailed ? (
                  <p className="mt-1.5 text-xs text-[#a3a199]">{t.detail.unavailable}</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    <div className="h-4 w-36 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
                    <div className="h-4 w-24 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
                  </div>
                )
              ) : selectedDumps.length === 0 ? (
                <p className="mt-1.5 text-xs text-[#a3a199]">{t.detail.noDumps}</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {selectedDumps.map((d) => (
                    <div key={d.id} className="rounded-2xl bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: DUMP_DOT[d.status] }} />
                        <span className="text-[9px] font-bold uppercase tracking-wide text-[#8f8d85]">
                          {d.status === 'PRIVATE'
                            ? t.legend.dumpPrivate
                            : d.status === 'REFINED'
                              ? t.legend.dumpRefined
                              : t.legend.dumpShared}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-5 text-[#242420]">
                        {d.status === 'PRIVATE' ? d.rawContent : d.refinedContent || d.rawContent}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-4 border-t border-[#e4e2dc] pt-3 text-[10px] leading-4 text-[#a3a199]">
              {t.detail.selectDay}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
