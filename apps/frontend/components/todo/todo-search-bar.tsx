'use client';

import { Search, X } from 'lucide-react';
import { FOCUS_RING } from '@/lib/constants/journal';

interface TodoSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TodoSearchBar({ value, onChange }: TodoSearchBarProps) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-20 z-30 w-full max-w-lg -translate-x-1/2 px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[#ede3d8] bg-white/90 px-6 py-3 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md">
        <Search className="h-4 w-4 shrink-0 text-[#c8704c]" aria-hidden />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Cari rencana, tugas, atau tag..."
          aria-label="Cari tugas"
          type="search"
          className="w-full border-none bg-transparent p-0 text-sm text-[#1a1c1c] outline-none placeholder:text-[#82756a]/80"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Bersihkan pencarian"
            className={`shrink-0 rounded-full p-1 text-xs text-[#82756a] transition hover:text-[#1a1c1c] ${FOCUS_RING}`}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
