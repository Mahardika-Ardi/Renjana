'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  EmotionDump,
  EmotionDumpStatus,
  PartnerEmotionDump,
} from '@renjana/types';
import { emotionDumpApi } from '@/lib/api/emotion-dump';
import { useLang } from '@/lib/i18n/lang-context';
import { useMounted } from '@/lib/use-mounted';
import { useHome } from '@/components/home/home-i18n';
import { PlayIcon } from './home-icons';
import { motion } from 'motion/react';
import { LIFT, tileRise } from '@/lib/constants/home';
import { formatShortDate } from '@renjana/utils';
import { dayToken, mondayIndex, serverDayKey, todayParts } from '@/lib/day-key';

/** Original Stillness strip letters — kept untouched by design. */
const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MAX_LEN = 1000;
const SHOW_COUNTER_AT = 900;

/** Dark-card status chips (glass tints of the card's own palette). */
const CHIP_STYLE: Record<EmotionDumpStatus, string> = {
  PRIVATE: 'bg-white/15 text-white/75',
  REFINED: 'bg-[#d5a46d]/30 text-[#f2cd94]',
  SHARED: 'bg-[#a4c177]/25 text-[#d8e6bb]',
};

function Avatar({ name, src }: { name: string; src: string | null }) {
  if (src) {
    /* eslint-disable-next-line @next/next/no-img-element --
     * avatar URLs are remote (Cloudinary), same pattern as profile surfaces */
    return <img src={src} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20 text-[10px] font-bold text-white">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/**
 * Emotion Dump card — the original Stillness hero (photo background, glass
 * badge, ▷ button, week strip) with the daily-layer flow added into it.
 *
 * Flow follows the backend exactly: vent → PRIVATE 🔒 → weekly AI cron
 * (Sunday 12:00 WIB) → REFINED ✨ → [Bagikan] → SHARED 👥 (Pasangan tab).
 * The ▷ button (original position and look) opens /calendar; the amber +
 * button (lower-right) toggles the inline composer. The week strip fills
 * amber on days you vented; today gets a white ring.
 */
export default function EmotionDumpCard() {
  const t = useHome();
  const { lang } = useLang();
  const mounted = useMounted();
  const router = useRouter();

  const [tab, setTab] = useState<'mine' | 'partner'>('mine');
  const [dumps, setDumps] = useState<EmotionDump[] | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const [partnerItems, setPartnerItems] = useState<PartnerEmotionDump[] | null>(null);
  const [partnerNotConnected, setPartnerNotConnected] = useState(false);
  const [partnerRequested, setPartnerRequested] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [createFailed, setCreateFailed] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareFailed, setShareFailed] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ---- own dumps (initial load + retry) ----------------------------------
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await emotionDumpApi.list();
        if (!ignore) {
          setDumps(res.data?.items ?? []);
          setListFailed(false);
        }
      } catch {
        if (!ignore) {
          setDumps(null);
          setListFailed(true);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [retryToken]);

  // ---- partner dumps, fetched lazily on first tab open -------------------
  useEffect(() => {
    if (tab !== 'partner' || !partnerRequested) return;
    let ignore = false;
    (async () => {
      try {
        const res = await emotionDumpApi.partner(1, 1);
        if (!ignore) {
          setPartnerItems(res.data?.items ?? []);
          // Only the uncoupled path carries a message (coupled returns {items, meta}).
          setPartnerNotConnected(Boolean(res.data?.message));
        }
      } catch {
        if (!ignore) {
          setPartnerItems([]);
          setPartnerNotConnected(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [tab, partnerRequested]);

  // ---- actions ------------------------------------------------------------
  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setCreateFailed(false);
    setSending(true);
    try {
      const res = await emotionDumpApi.create(text);
      const dump = res.data;
      if (!dump) throw new Error('empty response');
      setDumps((prev) => [dump, ...(prev ?? [])]);
      // Cleared only on success: a failure leaves the text in the composer.
      setDraft('');
      setComposerOpen(false);
    } catch {
      setCreateFailed(true);
    } finally {
      setSending(false);
    }
  };

  const share = async (id: string) => {
    if (sharingId) return;
    setShareFailed(false);
    setSharingId(id);
    try {
      const res = await emotionDumpApi.updateStatus(id, 'SHARED');
      const updated = res.data;
      setDumps((prev) =>
        (prev ?? []).map((d) =>
          d.id === id
            ? (updated ?? {
                ...d,
                status: 'SHARED' as const,
                sharedAt: new Date().toISOString(),
              })
            : d,
        ),
      );
    } catch {
      setShareFailed(true);
    } finally {
      setSharingId(null);
    }
  };

  const toggleComposer = () => {
    setComposerOpen((open) => {
      if (!open) {
        setTab('mine');
        setCreateFailed(false);
      }
      return !open;
    });
  };

  // ---- live week strip (current week in WIB, Mon-first) -------------------
  const today = todayParts();
  const todayToken = dayToken(today.year, today.month, today.day);
  const monday = mondayIndex(todayToken);
  const weekTokens = Array.from({ length: 7 }, (_, i) => {
    const token = new Date(todayToken);
    token.setUTCDate(token.getUTCDate() - monday + i);
    return token;
  });
  const dumpDays = new Set((dumps ?? []).map((d) => serverDayKey(d.createdAt)));

  // Auto-grow composer (also after state-driven draft resets).
  useEffect(() => {
    const el = document.getElementById('dump-composer') as HTMLTextAreaElement | null;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [draft, composerOpen]);

  const locale = lang === 'id' ? 'id-ID' : 'en-US';

  return (
    <motion.div
      {...tileRise(0.26)}
      className={`relative min-h-68.75 overflow-hidden rounded-[26px] bg-[#686854] ${LIFT}`}
    >
      {/* Background image (original Stillness treatment) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(73,73,57,.55), rgba(73,73,57,.7)), url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80')",
        }}
      />

      <div className="relative flex h-full flex-col p-6 md:p-7">
        {/* ---- row: badge · ▷ (original button, now → /calendar) ---- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
            <span aria-hidden>🔥</span>
            {t.dump.badge}
          </div>

          <button
            type="button"
            onClick={() => router.push('/calendar')}
            aria-label={t.dump.calendarAria}
            title={t.dump.calendarAria}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            <PlayIcon />
          </button>
        </div>

        {/* ---- tabs ---- */}
        <div
          role="tablist"
          aria-label={t.dump.badge}
          className="mt-4 flex w-fit items-center rounded-full bg-white/10 p-0.5 backdrop-blur-sm"
        >
          {(['mine', 'partner'] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                if (key === 'partner') setPartnerRequested(true);
              }}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                tab === key
                  ? 'bg-[#d5a46d] text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {key === 'mine' ? t.dump.tabMine : t.dump.tabPartner}
            </button>
          ))}
        </div>

        {/* ---- content: composer or dump list ---- */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {tab === 'mine' && composerOpen ? (
            <div className="rounded-3xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-sm">
              <textarea
                id="dump-composer"
                rows={1}
                value={draft}
                maxLength={MAX_LEN}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t.dump.placeholder}
                aria-label={t.dump.placeholder}
                autoFocus
                className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/50"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[9px] leading-4 text-white/55">{t.dump.cronNote}</p>
                <div className="flex items-center gap-2">
                  {draft.length >= SHOW_COUNTER_AT && (
                    <span className="text-[10px] tabular-nums text-white/55">
                      {draft.length}
                      {t.dump.charOf}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    className="rounded-full border border-white/25 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={!draft.trim() || sending}
                    className="flex items-center gap-2 rounded-full bg-[#d5a46d] px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#c4925b] disabled:opacity-40"
                  >
                    {sending && (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}
                    {sending ? t.dump.submitting : t.dump.submit}
                  </button>
                </div>
              </div>
              {createFailed && (
                <p role="alert" className="mt-1.5 text-[11px] text-[#f3b4ab]">
                  {t.dump.createFailed}
                </p>
              )}
            </div>
          ) : tab === 'mine' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              {shareFailed && (
                <p role="alert" className="mb-1.5 text-[11px] text-[#f3b4ab]">
                  {t.dump.shareFailed}
                </p>
              )}
              <div className="max-h-28 space-y-2 overflow-y-auto pr-0.5">
                {dumps === null ? (
                  listFailed ? (
                    <div className="flex flex-col items-center gap-2.5 py-4 text-center">
                      <p className="text-xs text-white/65">{t.dump.listFailed}</p>
                      <button
                        type="button"
                        onClick={() => setRetryToken((n) => n + 1)}
                        className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10"
                      >
                        {t.dump.retry}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2" aria-label={t.dump.loading}>
                      {[0, 1].map((i) => (
                        <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/10 motion-reduce:animate-none" />
                      ))}
                    </div>
                  )
                ) : dumps.length === 0 ? (
                  <p className="py-3.5 text-center text-xs leading-relaxed text-white/60">
                    {t.dump.empty}
                  </p>
                ) : (
                  // Latest dump only — the tile must stay bounded (no long
                  // scroll); the full history lives behind ▷ on /calendar.
                  dumps.slice(0, 1).map((d) => {
                    const showingRefined = d.status !== 'PRIVATE';
                    const expanded = expandedId === d.id;
                    const main = showingRefined
                      ? d.refinedContent || d.rawContent
                      : d.rawContent;
                    return (
                      <div key={d.id} className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-white/55">
                            {mounted ? formatShortDate(d.createdAt, locale) : ''}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${CHIP_STYLE[d.status]}`}
                          >
                            {d.status === 'PRIVATE'
                              ? t.dump.statusPrivate
                              : d.status === 'REFINED'
                                ? t.dump.statusRefined
                                : t.dump.statusShared}
                          </span>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-5 text-white/90">
                          {main}
                        </p>
                        {showingRefined && (
                          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : d.id)}
                              className="text-[11px] font-semibold text-[#f2cd94] hover:underline"
                            >
                              {expanded ? t.dump.showRefined : t.dump.showOriginal}
                            </button>
                            {d.status === 'REFINED' && (
                              <button
                                type="button"
                                onClick={() => void share(d.id)}
                                disabled={sharingId !== null}
                                aria-label={t.dump.shareAria}
                                className="rounded-full bg-[#d5a46d] px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#c4925b] disabled:opacity-40"
                              >
                                {sharingId === d.id ? '…' : t.dump.share}
                              </button>
                            )}
                          </div>
                        )}
                        {showingRefined && expanded && (
                          <p className="mt-2 whitespace-pre-wrap break-words border-t border-white/10 pt-2 text-sm leading-5 text-white/65">
                            {d.rawContent}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <p className="mt-2 text-[9px] leading-4 text-white/50">{t.dump.cronNote}</p>
            </div>
          ) : partnerItems === null ? (
            <div className="space-y-2" aria-label={t.dump.loading}>
              {[0, 1].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/10 motion-reduce:animate-none" />
              ))}
            </div>
          ) : partnerNotConnected ? (
            <p className="py-3.5 text-center text-xs leading-relaxed text-white/60">
              {t.dump.partnerNotConnected}
            </p>
          ) : partnerItems.length === 0 ? (
            <p className="py-3.5 text-center text-xs leading-relaxed text-white/60">
              {t.dump.partnerEmpty}
            </p>
          ) : (
            <div className="max-h-36 space-y-2 overflow-y-auto pr-0.5">
              {/* Latest shared dump only — same bounded-tile rule as mine. */}
              {partnerItems.slice(0, 1).map((p) => (
                <div key={p.id} className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Avatar name={p.user.name} src={p.user.avatarUrl} />
                    <span className="truncate text-xs font-semibold text-white">
                      {p.user.name}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] text-white/55">
                      {mounted && p.sharedAt ? formatShortDate(p.sharedAt, locale) : ''}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-5 text-white/90">
                    {p.refinedContent ?? ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- bottom row: live strip · + ---- */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex">
            {weekTokens.map((token, i) => {
              const key = `${token.getUTCFullYear()}-${String(token.getUTCMonth() + 1).padStart(2, '0')}-${String(token.getUTCDate()).padStart(2, '0')}`;
              const hasDump = dumpDays.has(key);
              const isToday = mounted && i === monday;
              return (
                <div
                  key={key}
                  className={`-ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#686854] text-[9px] ${
                    hasDump
                      ? 'bg-[#d5a46d] text-white'
                      : isToday
                        ? 'bg-[#e8e8df] text-[#55554d] ring-2 ring-white'
                        : 'bg-[#e8e8df] text-[#55554d]'
                  }`}
                >
                  {WEEK_DAYS[i]}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleComposer}
            aria-label={composerOpen ? t.dump.closeAria : t.dump.addAria}
            aria-pressed={composerOpen}
            title={composerOpen ? t.dump.closeAria : t.dump.addAria}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#d5a46d] text-white shadow-[0_4px_14px_rgba(213,164,109,0.4)] transition hover:bg-[#c4925b] active:scale-95"
          >
            {composerOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-4.5 w-4.5">
                <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-4.5 w-4.5">
                <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
