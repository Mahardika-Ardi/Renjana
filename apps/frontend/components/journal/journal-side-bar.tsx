import {
  ShelfFilter,
  FLOAT_SHADOW,
  FOCUS_RING,
  SCROLLBAR,
  SHELF_FILTERS,
} from '@/lib/constants/journal';
import { JournalResponse } from '@renjana/types';
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
  console.log(journals);

  return (
    <aside
      id="journal-shelf"
      aria-label="Daftar jurnal"
      aria-hidden={!open}
      className={`fixed inset-y-3 left-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-[#eddcd2] bg-[#fbf8f5]/95 backdrop-blur-xl transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none md:absolute ${FLOAT_SHADOW} ${
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
              input: `w-full rounded-xl border-0 bg-[#f2e9e1]/80 py-1.5 pl-9 pr-3 text-xs text-[#2c2523] shadow-inner transition placeholder:text-[#8c7e75] hover:bg-[#f2e9e1] focus:bg-white ${FOCUS_RING}`,
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
        <button
          type="button"
          onClick={onClose}
          title="Tutup daftar (fokus menulis)"
          aria-label="Tutup daftar jurnal"
          className={`shrink-0 rounded-xl border border-transparent p-1.5 text-[#8c7e75] transition hover:border-[#ebdcd2] hover:bg-[#f5efe6] hover:text-[#2c2523] active:scale-90 ${FOCUS_RING}`}
        >
          <PanelLeftClose className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div
        className={`flex items-center gap-1.5 overflow-x-auto border-b border-[#ebdcd2]/50 px-3 pb-2.5 pt-3 ${SCROLLBAR}`}
        role="group"
        aria-label="Saring jurnal"
      >
        {SHELF_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFilterChange(option.value)}
            aria-pressed={filter === option.value}
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition active:scale-95 ${FOCUS_RING} ${
              filter === option.value
                ? 'bg-[#c96f4a] text-white'
                : 'text-[#665c54] hover:bg-[#f5efe6] hover:text-[#2c2523]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={`flex-1 space-y-2.5 overflow-y-auto p-3 ${SCROLLBAR}`}>
        {loading && journals.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-23 animate-pulse rounded-2xl bg-[#f1e7dd] motion-reduce:animate-none"
              />
            ))
          : journals.map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                active={entry.id === selectedId}
                onSelect={onSelect}
              />
            ))}

        {!loading && journals.length === 0 && (
          <p className="px-2 py-8 text-center text-xs leading-relaxed text-[#8c7e75]">
            Tidak ada jurnal yang cocok dengan pencarian ini.
          </p>
        )}
      </div>

      <div className="border-t border-[#ebdcd2] bg-[#fbf8f5] p-3.5">
        <button
          type="button"
          onClick={onCreate}
          disabled={creating}
          className={`group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c96f4a] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#b55e39] hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
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
        </button>
      </div>
    </aside>
  );
}
