'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useTodos } from '@/hooks/note/use-todo';
import { categoryLabelOf } from '@/lib/constants/todo';
import { useMounted } from '@/lib/use-mounted';
import { useLang } from '@/lib/i18n/lang-context';
import { useHome } from '@/components/home/home-i18n';
import { TILE, tileRise } from '@/lib/constants/home';
import type { Lang } from '@/lib/i18n/pick';
import type { TodoResponse } from '@renjana/types';

function subtitleOf(item: TodoResponse, lang: Lang): string {
  if (item.dueDate) {
    const date = new Date(
      item.dueDate.length <= 10 ? `${item.dueDate}T00:00:00` : item.dueDate,
    );
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
      });
    }
  }
  return `${categoryLabelOf(item.category, lang)} · ${item.creator.name}`;
}

function TaskRow({
  item,
  busy,
  onToggle,
}: {
  item: TodoResponse;
  busy: boolean;
  onToggle: (id: string) => void;
}) {
  const { lang } = useLang();
  const t = useHome();
  const completed = item.status === 'COMPLETED';

  return (
    <div className="flex items-center gap-3 rounded-full bg-[#f2f3e7] px-4 py-3">
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        disabled={busy}
        aria-label={completed ? t.focus.undoDone : t.focus.markDone}
        aria-pressed={completed}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 disabled:cursor-wait ${
          completed
            ? 'border-[#3f4524] bg-[#3f4524] text-[#c8c9a9]'
            : 'border-[#747957]'
        }`}
      >
        {completed && (
          <svg
            className="h-2.5 w-2.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            aria-hidden
          >
            <path
              d="M4.5 12.75l6 6 9-13.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0">
        <p
          className={`truncate text-xs font-medium ${
            completed ? 'text-[#646844] line-through' : 'text-[#3e4326]'
          }`}
        >
          {item.title}
        </p>
        <p className="mt-0.5 text-[9px] text-[#7c8256]">
          {subtitleOf(item, lang)}
        </p>
      </div>
    </div>
  );
}

interface SharedFocusCardProps {
  /** Partner display name (from GET /auth/me) — null while uncoupled. */
  partnerName: string | null;
}

/* Bento shell: the old olive #b4b68d slab became a white tile with light
 * sage rows (same two-accent system as the rest of the grid). The partner
 * chip now shows the real partner initial instead of a hardcoded "E" —
 * gated behind `mounted` so a cached name can never leak into the first
 * client paint (same contract as HomeGreeting). */
export default function SharedFocusCard({ partnerName }: SharedFocusCardProps) {
  const { items, loading, togglingId, toggle } = useTodos();
  const t = useHome();
  const mounted = useMounted();

  const visible = items
    .filter((item) => item.status === 'PENDING')
    .slice(0, 3);
  const pendingCount = items.filter(
    (item) => item.status === 'PENDING',
  ).length;

  return (
    <motion.article
      {...tileRise(0.38)}
      className={`${TILE} min-h-72.5 sm:col-span-2`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t.focus.title}</h3>

        <div className="flex items-center">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[#e9ead9] bg-[#f7f8f1]">
            {loading ? (
              <span className="h-4 w-4 animate-pulse rounded-full bg-[#dcdfc6] motion-reduce:animate-none" />
            ) : (
              <span className="text-[10px] font-bold text-[#5f6540]">
                {pendingCount}
              </span>
            )}
          </div>

          {mounted && partnerName && (
            <div className="-ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#5f6540] text-[10px] text-white">
              {partnerName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading && items.length === 0 ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-15 animate-pulse rounded-full bg-[#eef0e2] motion-reduce:animate-none"
            />
          ))
        ) : visible.length === 0 ? (
          <p className="py-4 text-center text-xs leading-relaxed text-[#646844]">
            {t.focus.empty}
          </p>
        ) : (
          visible.map((item) => (
            <TaskRow
              key={item.id}
              item={item}
              busy={togglingId === item.id}
              onToggle={(id) => {
                void toggle(id);
              }}
            />
          ))
        )}
      </div>

      <div className="mt-auto pt-5">
        <Link
          href="/note/todos"
          className="flex h-9 w-full items-center justify-center rounded-full bg-[#3f4524] text-xs font-medium text-[#c8c9a9] transition hover:bg-[#34391d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f4524] motion-reduce:transition-none"
        >
          {t.focus.viewAll}
        </Link>
      </div>
    </motion.article>
  );
}
