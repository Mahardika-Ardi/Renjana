'use client';

import { motion } from 'motion/react';
import { Calendar, Check, Loader2 } from 'lucide-react';
import { categoryLabelOf, categoryPillOf } from '@/lib/constants/todo';
import { TodoResponse } from '@renjana/types';

interface TodoCardProps {
  item: TodoResponse;
  busy: boolean;
  onToggle: (id: string) => void;
}

function dueLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export default function TodoCard({ item, busy, onToggle }: TodoCardProps) {
  const completed = item.status === 'COMPLETED';
  const due = dueLabel(item.dueDate);
  const initial = (item.creator.name || '?').charAt(0).toUpperCase();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={`relative flex min-h-55 flex-col justify-between rounded-2xl border p-5 transition-colors duration-200 ${
        completed
          ? 'border-[#ebdcd2] bg-[#f6f2ec]'
          : 'border-[#eee4da] bg-white shadow-[0_4px_16px_rgba(200,160,130,0.06)] hover:shadow-[0_10px_24px_-4px_rgba(125,86,45,0.12)]'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span
            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${categoryPillOf(item.category)}`}
          >
            {categoryLabelOf(item.category)}
          </span>
          <div
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#82756a]"
            title={`Dibuat oleh ${item.creator.name}`}
          >
            <span>{item.creator.name}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d4a373] text-[11px] font-bold text-white ring-2 ring-white">
              {initial}
            </span>
          </div>
        </div>

        <div>
          <h4
            className={`text-sm sm:text-base font-semibold leading-snug ${
              completed ? 'text-[#82756a] line-through' : 'text-[#1a1c1c]'
            }`}
          >
            {item.title}
          </h4>
          {item.description && (
            <p
              className={`mt-1.5 text-xs leading-relaxed ${
                completed ? 'text-[#a4978c]' : 'text-[#50453b]'
              }`}
            >
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div
        className={`flex items-center justify-between border-t pt-3 ${
          completed ? 'border-[#ebdcd2]' : 'border-[#f7f1ea]'
        }`}
      >
        {due ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ${
              completed
                ? 'bg-[#e4e0c7] text-[#65634f]'
                : 'bg-[#faebe6] text-[#c8704c]'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {due}
          </span>
        ) : (
          <span />
        )}

        <motion.button
          type="button"
          onClick={() => onToggle(item.id)}
          disabled={busy}
          whileTap={{ scale: 0.9 }}
          aria-label={completed ? 'Batal selesai' : 'Tandai selesai'}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:cursor-wait ${
            completed
              ? 'bg-[#c8704c] text-white'
              : 'border border-[#d4c4b7] text-[#82756a] hover:border-[#c8704c] hover:bg-[#faebe6] hover:text-[#c8704c]'
          }`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          )}
        </motion.button>
      </div>
    </motion.article>
  );
}
