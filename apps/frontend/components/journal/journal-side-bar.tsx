import {
  ShelfFilter,
  EASE_SMOOTH,
  FLOAT_SHADOW,
  FOCUS_RING,
  GLASS_SIDEBAR,
  SCROLLBAR,
  SHELF_FILTERS,
  SPRING_SNAPPY,
} from '@/lib/constants/journal';
import { JournalResponse } from '@renjana/types';
import { motion, AnimatePresence } from 'motion/react';
import { PanelLeftClose, Loader2, Plus } from 'lucide-react';
import JournalCard from './journal-card';
import Input from '@/components/ui/Input';

interface SidebarProps {
  open: boolean;
  journals: JournalResponse[];
  selectedId: string | null;
  loading: boolean;
  creating: boolean;
  search: string;
  filter: ShelfFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: ShelfFilter) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export default function JournalSidebar({
  open,
  journals,
  selectedId,
  loading,
  creating,
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onSelect,
  onCreate,
  onClose,
}: SidebarProps) {
  return (
    <aside
      id="journal-shelf"
      aria-label="Daftar jurnal"
      aria-hidden={!open}
      className={`fixed inset-y-3 left-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border ${GLASS_SIDEBAR} transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none md:absolute ${FLOAT_SHADOW} ${
        open
          ? 'translate-x-0 opacity-100'
          : 'pointer-events-none translate-x-[-115%] opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-[#ebdcd2]/70 px-4 py-3">
        <div className="relative flex flex-1 items-center">
          <Input
            type="search"
            value={search}
            logoName="search"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari catatan atau jurnal…"
            aria-label="Cari jurnal"
            classes={{
              input: `w-full rounded-full border border-white/60 bg-white/60 py-1.5 pl-9 pr-3 text-xs text-[#2c2523] shadow-sm backdrop-blur transition placeholder:text-[#8c7e75] hover:bg-white/80 focus:border-[#c96f4a]/50 focus:bg-white ${FOCUS_RING}`,
              logo: {
                style: `
                    absolute
                    left-2.5
                    top-3.5
                    -translate-y-1/2
                  `,
                width: 14,
                height: 14,
              },
            }}
          />
        </div>
        <motion.button
          type="button"
          onClick={onClose}
          title="Tutup daftar (fokus menulis)"
          aria-label="Tutup daftar jurnal"
          whileTap={{ scale: 0.88 }}
          className={`shrink-0 rounded-full border border-transparent p-1.5 text-[#8c7e75] transition hover:border-[#ebdcd2] hover:bg-white/70 hover:text-[#2c2523] ${FOCUS_RING}`}
        >
          <PanelLeftClose className="h-4 w-4" aria-hidden />
        </motion.button>
      </div>

      <div
        className={`flex items-center gap-1.5 overflow-x-auto border-b border-[#ebdcd2]/50 px-3 pb-2.5 pt-3 ${SCROLLBAR}`}
        role="group"
        aria-label="Saring jurnal"
      >
        {SHELF_FILTERS.map((option) => {
          const selected = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onFilterChange(option.value)}
              aria-pressed={selected}
              className={`relative whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition active:scale-95 ${FOCUS_RING} ${
                selected
                  ? 'text-white'
                  : 'text-[#665c54] hover:bg-white/70 hover:text-[#2c2523]'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="shelf-filter-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-full bg-[#c96f4a] shadow-[0_4px_14px_-4px_rgba(201,111,74,0.7)]"
                  aria-hidden
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className={`flex-1 space-y-2.5 overflow-y-auto p-3 ${SCROLLBAR}`}>
        {loading && journals.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-23 animate-pulse rounded-2xl bg-[#f1e7dd]/70 motion-reduce:animate-none"
              />
            ))
          : (
            <AnimatePresence initial={false}>
              {journals.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: 0.3,
                    ease: EASE_SMOOTH,
                    delay: Math.min(index * 0.03, 0.24),
                  }}
                >
                  <JournalCard
                    entry={entry}
                    active={entry.id === selectedId}
                    onSelect={onSelect}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}

        {!loading && journals.length === 0 && (
          <p className="px-2 py-8 text-center text-xs leading-relaxed text-[#8c7e75]">
            Tidak ada jurnal yang cocok dengan pencarian ini.
          </p>
        )}
      </div>

      <div className="border-t border-[#ebdcd2]/70 bg-white/40 p-3.5 backdrop-blur-xl">
        <motion.button
          type="button"
          onClick={onCreate}
          disabled={creating}
          whileTap={creating ? undefined : { scale: 0.97 }}
          className={`group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c96f4a] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(201,111,74,0.8)] transition hover:bg-[#b55e39] hover:shadow-[0_10px_24px_-8px_rgba(201,111,74,0.9)] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
        >
          {creating ? (
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          ) : (
            <Plus
              className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none"
              aria-hidden
            />
          )}
          Catatan Baru
        </motion.button>
      </div>
    </aside>
  );
}
