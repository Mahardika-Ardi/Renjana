'use client';

import { AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import TodoCard from './todo-card';
import { TodoResponse } from '@renjana/types';

interface TodoShelfSectionProps {
  title: string;
  dotClass: string;
  items: TodoResponse[];
  togglingId: string | null;
  onToggle: (id: string) => void;
  onAdd: () => void;
}

export default function TodoShelfSection({
  title,
  dotClass,
  items,
  togglingId,
  onToggle,
  onAdd,
}: TodoShelfSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden />
          <h3 className="text-lg font-bold text-[#1a1c1c]">{title}</h3>
        </div>
        <span className="text-xs font-medium text-[#82756a]">
          {items.length} Rencana Terpajang
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <TodoCard
              key={item.id}
              item={item}
              busy={togglingId === item.id}
              onToggle={onToggle}
            />
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={onAdd}
          className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ddcebe] p-6 text-center transition-all hover:border-[#c8704c] hover:bg-white/60"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4ebe1] text-[#82756a] transition-colors group-hover:bg-[#faebe6] group-hover:text-[#c8704c]">
            <Plus className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" aria-hidden />
          </div>
          <span className="text-sm font-semibold text-[#1a1c1c] transition-colors group-hover:text-[#c8704c]">
            Tambah ke Rak Ini
          </span>
          <span className="mt-1 text-xs text-[#50453b]/70">
            Tulis rencana baru
          </span>
        </button>
      </div>

      <div
        aria-hidden
        className="relative mt-2 h-2 rounded-full bg-gradient-to-b from-[#e7ddcf] to-[#d8cdbe] shadow-[0_3px_6px_-1px_rgba(97,95,75,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)]"
      />
    </section>
  );
}
