'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ListTodo, Plus } from 'lucide-react';
import { useTodos } from '@/hooks/note/use-todo';
import { TODO_SHELVES, categoryLabelOf, categoryShelfOf } from '@/lib/constants/todo';
import AgendaBanner from '@/components/todo/agenda-banner';
import TodoSearchBar from '@/components/todo/todo-search-bar';
import TodoShelfSection from '@/components/todo/todo-shelf-section';
import TodoAddModal from '@/components/todo/todo-add-modal';
import JournalToast from '@/components/journal/journal-toast';
import JournalErrorBanner from '@/components/journal/journal-error-banner';
import type { TodoCategory } from '@renjana/types';

const SHELF_DOTS = [
  'bg-[#c8704c]',
  'bg-[#5d6143]',
] as const;

const SHELF_DEFAULT_CATEGORY: Record<string, TodoCategory> = {
  'Kencan & Waktu Bersama': 'PLANS',
  'Rutinitas & Kebutuhan Harian': 'HOME',
};

export default function TodoWorkspace() {
  const todos = useTodos();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<TodoCategory>('PLANS');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return todos.items;
    return todos.items.filter((item) => {
      const haystack =
        `${item.title} ${item.description ?? ''} ${categoryLabelOf(item.category)}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [todos.items, search]);

  const shelves = useMemo(
    () =>
      TODO_SHELVES.map((shelf) => ({
        title: shelf,
        items: filtered.filter((item) => categoryShelfOf(item.category) === shelf),
      })),
    [filtered],
  );

  const completedCount = todos.items.filter(
    (item) => item.status === 'COMPLETED',
  ).length;

  const openAdd = (shelf: string) => {
    setModalCategory(SHELF_DEFAULT_CATEGORY[shelf] ?? 'PLANS');
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfaf6] text-[#1a1c1c] antialiased">
      <TodoSearchBar value={search} onChange={setSearch} />

      <motion.button
        type="button"
        onClick={() => openAdd(TODO_SHELVES[0])}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-40 flex cursor-pointer items-center gap-2.5 rounded-full bg-[#c8704c] px-6 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg transition-colors hover:bg-[#b8613f]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        + Tambah Rencana
      </motion.button>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <AgendaBanner
          active={todos.items.length - completedCount}
          completed={completedCount}
          total={todos.items.length}
        />

        <div className="px-2 pb-2">
          <JournalErrorBanner message={todos.error} onClose={todos.dismissError} />
        </div>

        {todos.loading && todos.items.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="min-h-55 animate-pulse rounded-2xl bg-[#f1e7dd]/70 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4ebe1] text-[#c8704c]">
              <ListTodo className="h-6 w-6" aria-hidden />
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-[#50453b]">
              {search
                ? 'Tidak ada rencana yang cocok dengan pencarian ini.'
                : 'Belum ada rencana di rak ini. Tambahkan momen pertamamu.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {shelves.map((shelf, index) => (
              <TodoShelfSection
                key={shelf.title}
                title={shelf.title}
                dotClass={SHELF_DOTS[index % SHELF_DOTS.length]}
                items={shelf.items}
                togglingId={todos.togglingId}
                onToggle={(id) => {
                  void todos.toggle(id);
                }}
                onAdd={() => openAdd(shelf.title)}
              />
            ))}
          </div>
        )}
      </main>

      <TodoAddModal
        open={modalOpen}
        creating={todos.creating}
        initialCategory={modalCategory}
        onClose={() => setModalOpen(false)}
        onSubmit={async (dto) => {
          const item = await todos.create(dto);
          if (item) triggerToast('Rencana baru telah tersimpan di rak bersama.');
          return item !== null;
        }}
      />

      <JournalToast message={toast} />
    </div>
  );
}
