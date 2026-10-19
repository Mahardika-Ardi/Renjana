'use client';

import Link from 'next/link';
import { useTodos } from '@/hooks/note/use-todo';
import { categoryLabelOf } from '@/lib/constants/todo';
import { useLang } from '@/lib/i18n/lang-context';
import { useHome } from '@/components/home/home-i18n';
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
    <div className="flex items-center gap-3 rounded-full bg-[#aaad82] px-4 py-3">
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
            completed ? 'text-[#646844] line-through' : ''
          }`}
        >
          {item.title}
        </p>
        <p className="mt-0.5 text-[9px] text-[#646844]">
          {subtitleOf(item, lang)}
        </p>
      </div>
    </div>
  );
}

export default function SharedFocusCard() {
  const { items, loading, togglingId, toggle } = useTodos();
  const t = useHome();

  const visible = items
    .filter((item) => item.status === 'PENDING')
    .slice(0, 3);
  const pendingCount = items.filter(
    (item) => item.status === 'PENDING',
  ).length;

  return (
    <article className="min-h-72.5 rounded-[30px] bg-[#b4b68d] p-7 text-[#3e4326]">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t.focus.title}</h3>

        <div className="flex items-center">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[#b4b68d] bg-white">
            {loading ? (
              <span className="h-4 w-4 animate-pulse rounded-full bg-[#e8e8df] motion-reduce:animate-none" />
            ) : (
              <span className="text-[10px] font-bold text-[#646946]">
                {pendingCount}
              </span>
            )}
          </div>

          <div className="-ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#b4b68d] bg-[#646946] text-[10px] text-white">
            E
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading && items.length === 0 ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-15 animate-pulse rounded-full bg-[#aaad82]/60 motion-reduce:animate-none"
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

      <Link
        href="/note/todos"
        className="mt-5 flex h-9 w-full items-center justify-center rounded-full bg-[#3f4524] text-xs font-medium text-[#c8c9a9] transition hover:bg-[#34391d]"
      >
        {t.focus.viewAll}
      </Link>
    </article>
  );
}
