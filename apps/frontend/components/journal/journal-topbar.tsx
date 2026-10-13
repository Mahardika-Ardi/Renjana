'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileDown, Loader2, Lock, Menu, MoreVertical, Printer, Save, Trash2, Users } from 'lucide-react';
import SavePill from './save-pill';
import { EASE_SMOOTH, SaveState } from '@/lib/constants/journal';

interface JournalTopbarProps {
  title: string;
  wordCount: number;
  sentenceCount: number;
  isShared: boolean;
  saveState: SaveState;
  canSave: boolean;
  onSave: () => void;
  onToggleSidebar: () => void;
  onShareClick: () => void;
  onPrint: () => void;
  onExportMarkdown: () => void;
  onDeleteClick: () => void;
  onRetrySave: () => void;
}

export default function JournalTopbar({
  title,
  wordCount,
  sentenceCount,
  isShared,
  saveState,
  canSave,
  onSave,
  onToggleSidebar,
  onShareClick,
  onPrint,
  onExportMarkdown,
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
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: EASE_SMOOTH }}
      className="fixed inset-x-3 top-3 z-20 flex h-14 shrink-0 items-center justify-between rounded-2xl border border-white/50 bg-[#fffdf9]/75 px-4 shadow-[0_12px_36px_-12px_rgba(60,40,30,0.25)] backdrop-blur-xl sm:inset-x-6 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <motion.button
          type="button"
          onClick={onToggleSidebar}
          title="Daftar jurnal"
          aria-label="Buka atau tutup daftar jurnal"
          whileTap={{ scale: 0.9 }}
          className="rounded-full p-1.5 text-[#8c7e75] transition hover:bg-[#f5efe6] hover:text-[#2c2523] md:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden />
        </motion.button>

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

      <div className="flex items-center gap-2 sm:gap-3">
        <motion.button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          title={canSave ? 'Simpan perubahan' : 'Tidak ada perubahan'}
          whileTap={canSave ? { scale: 0.95 } : undefined}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
            saveState === 'saving'
              ? 'border border-[#eedfd5] bg-[#faf6f0]/80 text-[#8c7e75] backdrop-blur disabled:opacity-90'
              : canSave
                ? 'bg-[#c96f4a] text-white shadow-[0_6px_18px_-6px_rgba(201,111,74,0.7)] hover:bg-[#b55e39]'
                : 'border border-[#eedfd5]/70 bg-[#faf6f0]/60 text-[#b3a599] backdrop-blur disabled:opacity-70'
          }`}
        >
          {saveState === 'saving' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <Save className="h-3.5 w-3.5" aria-hidden />
          )}
          {saveState === 'saving' ? 'Menyimpan' : 'Simpan'}
          {canSave && (
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
          )}
        </motion.button>

        <SavePill state={saveState} onRetry={onRetrySave} />

        <motion.button
          type="button"
          onClick={onShareClick}
          whileTap={{ scale: 0.95 }}
          className={`group hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur transition sm:flex ${
            isShared
              ? 'border-[#c96f4a]/40 bg-[#faebe6]/80 text-[#c96f4a] hover:bg-[#c96f4a] hover:text-white'
              : 'border-[#eedfd5]/70 bg-[#faf6f0]/60 text-[#2c2523] hover:border-[#c96f4a] hover:bg-[#faebe6]/60'
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
        </motion.button>

        <div className="relative" ref={menuRef}>
          <motion.button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Opsi jurnal"
            whileTap={{ scale: 0.9 }}
            className="rounded-full p-1.5 text-[#8c7e75] transition hover:bg-[#f5efe6] hover:text-[#2c2523]"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: EASE_SMOOTH }}
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-white/50 bg-[#fdfbf9]/95 py-2 shadow-[0_16px_40px_-6px_rgba(110,80,65,0.18),0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onShareClick();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-[#2c2523] transition hover:bg-[#f5efe6] sm:hidden"
                >
                  {isShared ? (
                    <Users className="h-4 w-4 text-[#c96f4a]" aria-hidden />
                  ) : (
                    <Lock className="h-4 w-4 text-[#c96f4a]" aria-hidden />
                  )}
                  {isShared ? 'Bersama' : 'Privat'}
                </button>
                <div className="my-1.5 border-t border-[#eedfd5]/70 sm:hidden" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onPrint();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-[#2c2523] transition hover:bg-[#f5efe6]"
                >
                  <Printer className="h-4 w-4 text-[#c96f4a]" aria-hidden />
                  Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onExportMarkdown();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-[#2c2523] transition hover:bg-[#f5efe6]"
                >
                  <FileDown className="h-4 w-4 text-[#c96f4a]" aria-hidden />
                  Unduh Markdown (.md)
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
