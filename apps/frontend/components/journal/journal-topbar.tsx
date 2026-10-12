'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Lock, Menu, MoreVertical, Trash2, Users } from 'lucide-react';
import SavePill from './save-pill';
import { SaveState } from '@/lib/constants/journal';

interface JournalTopbarProps {
  title: string;
  wordCount: number;
  sentenceCount: number;
  isShared: boolean;
  saveState: SaveState;
  onToggleSidebar: () => void;
  onShareClick: () => void;
  onDownload: () => void;
  onDeleteClick: () => void;
  onRetrySave: () => void;
}

export default function JournalTopbar({
  title,
  wordCount,
  sentenceCount,
  isShared,
  saveState,
  onToggleSidebar,
  onShareClick,
  onDownload,
  onDeleteClick,
  onRetrySave,
}: JournalTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  return (
    <header className="z-20 fixed flex h-14 w-full shrink-0 items-center justify-between border-b border-[#eedfd5] bg-white/70 px-4 backdrop-blur-md sm:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          title="Menu Jurnal"
          className="rounded-xl p-1.5 text-[#8c7e75] transition hover:bg-[#f5efe6] hover:text-[#2c2523] md:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex min-w-0 items-center gap-2.5 text-xs">
          <span className="max-w-45 truncate font-semibold text-[#2c2523] sm:max-w-xs">
            {title}
          </span>
          <span
            className="inline-block h-1 w-1 rounded-full bg-[#8c7e75]/40"
            aria-hidden
          />
          <span className="hidden items-center gap-2 text-[11px] text-[#8c7e75] sm:flex">
            <span>{wordCount.toLocaleString('id-ID')} kata</span>
            <span aria-hidden>•</span>
            <span>{sentenceCount} kalimat</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SavePill state={saveState} onRetry={onRetrySave} />

        <button
          type="button"
          onClick={onShareClick}
          className={`group flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
            isShared
              ? 'border-[#c96f4a]/40 bg-[#faebe6] text-[#c96f4a] hover:bg-[#c96f4a] hover:text-white'
              : 'border-[#eedfd5] bg-[#faf6f0] text-[#2c2523] hover:border-[#c96f4a] hover:bg-[#faebe6]/60'
          }`}
        >
          {isShared ? (
            <Users className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Lock className="h-3.5 w-3.5" aria-hidden />
          )}
          {isShared ? 'Bersama' : 'Privat'}
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isShared ? 'bg-emerald-500' : 'bg-amber-500/80'
            }`}
            aria-hidden
          />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Opsi jurnal"
            className="rounded-lg p-1.5 text-[#8c7e75] transition hover:bg-[#f5efe6] hover:text-[#2c2523] active:scale-95"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-[#eedfd5] bg-[#fdfbf9] py-2 shadow-[0_16px_40px_-6px_rgba(110,80,65,0.18),0_4px_16px_rgba(0,0,0,0.05)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDownload();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-[#2c2523] transition hover:bg-[#f5efe6]"
              >
                <Download className="h-4 w-4 text-[#c96f4a]" aria-hidden />
                Simpan ke Perangkat
              </button>
              <div className="my-1.5 border-t border-[#eedfd5]/70" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteClick();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 text-red-500" aria-hidden />
                Hapus jurnal
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
