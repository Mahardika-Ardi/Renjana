'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Plus, X } from 'lucide-react';
import { TODO_CATEGORY_OPTIONS } from '@/lib/constants/todo';
import { FOCUS_RING } from '@/lib/constants/journal';
import type { CreateTodoDto, TodoCategory } from '@renjana/types';

interface TodoAddModalProps {
  open: boolean;
  creating: boolean;
  initialCategory?: TodoCategory;
  onClose: () => void;
  onSubmit: (dto: CreateTodoDto) => Promise<boolean>;
}

export default function TodoAddModal({
  open,
  creating,
  initialCategory = 'PLANS',
  onClose,
  onSubmit,
}: TodoAddModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TodoCategory>(initialCategory);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setTitle('');
    setCategory(initialCategory);
    setDueDate('');
    setNotes('');
  };

  const handleClose = () => {
    if (creating) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || creating) return;
    const ok = await onSubmit({
      title: title.trim(),
      category,
      dueDate: dueDate || undefined,
      description: notes.trim() || undefined,
    });
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Tambah rencana"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) handleClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2523]/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#ebdcd2] bg-[#fbf9f6] p-6 shadow-[0_25px_50px_-12px_rgba(97,95,75,0.25)] sm:p-7"
          >
            <div className="flex items-center justify-between border-b border-[#ebdcd2] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#faebe6] font-bold text-[#c8704c]">
                  <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1a1c1c]">
                    Tambah ke Daftar To-Do
                  </h3>
                  <p className="text-xs text-[#50453b]">
                    Rencana baru untuk diwujudkan bersama pasangan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Tutup form"
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#f3ece4] text-[#82756a] transition-colors hover:bg-[#e9e0d6] hover:text-[#1a1c1c] ${FOCUS_RING}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="todo-form-title"
                  className="text-xs font-semibold text-[#1a1c1c]"
                >
                  Nama Rencana / Tugas <span className="text-[#c8704c]">*</span>
                </label>
                <input
                  id="todo-form-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Contoh: Menonton matahari terbit di tebing"
                  required
                  type="text"
                  autoComplete="off"
                  className="w-full rounded-xl border border-[#ebdcd2] bg-white px-3.5 py-2.5 text-xs text-[#1a1c1c] outline-none transition-all placeholder:text-[#82756a] focus:border-[#c8704c] focus:ring-2 focus:ring-[#c8704c]/20 sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#1a1c1c]">
                  Pilih Kategori
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {TODO_CATEGORY_OPTIONS.map((option) => {
                    const selected = category === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCategory(option.value)}
                        aria-pressed={selected}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          selected
                            ? 'bg-[#c8704c] text-white'
                            : 'bg-[#f1ece5] text-[#50453b] hover:bg-[#e8e0d6]'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="todo-form-date"
                  className="text-xs font-semibold text-[#1a1c1c]"
                >
                  Target Tanggal
                </label>
                <input
                  id="todo-form-date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  type="date"
                  className="w-full rounded-xl border border-[#ebdcd2] bg-white px-3.5 py-2.5 text-xs text-[#1a1c1c] outline-none transition-all focus:border-[#c8704c] focus:ring-2 focus:ring-[#c8704c]/20 sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="todo-form-notes"
                  className="text-xs font-semibold text-[#1a1c1c]"
                >
                  Catatan &amp; Detail Momen
                </label>
                <textarea
                  id="todo-form-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Tambahkan detail kecil agar momen ini semakin berkesan..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[#ebdcd2] bg-white px-3.5 py-2.5 text-xs text-[#1a1c1c] outline-none transition-all placeholder:text-[#82756a] focus:border-[#c8704c] focus:ring-2 focus:ring-[#c8704c]/20 sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-[#ebdcd2] pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#50453b] transition-colors hover:bg-[#ede5dc] hover:text-[#1a1c1c] sm:text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#c8704c] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#b8613f] hover:shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                >
                  {creating && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  )}
                  Simpan ke Rak To-Do
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
