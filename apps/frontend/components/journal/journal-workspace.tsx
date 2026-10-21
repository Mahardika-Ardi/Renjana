'use client';

import { useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { BookMarked, ChevronRight, Lock, Save, Trash2, Users } from 'lucide-react';
import JournalSidebar from '@/components/journal/journal-side-bar';
import JournalTopbar from '@/components/journal/journal-topbar';
import JournalEditor from '@/components/journal/journal-editor';
import JournalToast from '@/components/journal/journal-toast';
import JournalErrorBanner from '@/components/journal/journal-error-banner';
import ConfirmDialog from '@/components/journal/confirm-dialogue';
import { UNTITLED } from '@/lib/constants/journal';
import { useJournal } from '@/hooks/note/use-journal';
import {
  downloadJournalMarkdown,
  printJournal,
  splitJournalBody,
} from '@/lib/journal-export';
import { formatEditedAt, formatFullDate } from '@renjana/utils';
import { JournalResponse } from '@renjana/types';

interface JournalWorkspaceProps {
  initialItems?: JournalResponse[];
}

export default function JournalWorkspace({ initialItems = [] }: JournalWorkspaceProps) {
  const journal = useJournal(initialItems);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
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

  const isShared = journal.selected?.isShared ?? false;
  const title = journal.selected ? journal.selectedTitle || UNTITLED : UNTITLED;

  // Shelf empty-state copy: shared-timeline states read differently from
  // a plain search miss. undefined → sidebar default.
  const shelfEmptyText = journal.search.trim()
    ? undefined
    : journal.filter === 'bersama'
      ? journal.partnerNotConnected
        ? 'Kamu belum terhubung dengan pasangan.'
        : 'Belum ada jurnal bersama di linimasa ini.'
      : undefined;

  const handleCreate = async () => {
    const entry = await journal.create();
    if (entry) triggerToast('Jurnal baru siap ditulis');
  };

  const handleSave = async () => {
    const ok = await journal.save();
    if (ok) triggerToast('Jurnal tersimpan');
  };

  const handlePrint = () => {
    if (!journal.selected) return;
    printJournal();
  };

  const handleExportMarkdown = () => {
    const entry = journal.selected;
    if (!entry) return;
    downloadJournalMarkdown(
      {
        title: journal.selectedTitle || UNTITLED,
        body: splitJournalBody(journal.content),
        tags: journal.tags,
        entryDateLabel: `Dibuat: ${formatFullDate(entry.entryDate)}`,
        updatedLabel: `Terakhir disunting: ${formatEditedAt(entry.updatedAt)}`,
      },
      entry.entryDate.slice(0, 10),
    );
    triggerToast('File jurnal terunduh ke perangkat');
  };

  const handleSelect = (id: string) => {
    if (id === journal.selectedId) return;
    if (journal.isDirty) {
      setPendingId(id);
      setUnsavedOpen(true);
      return;
    }
    void journal.select(id);
  };

  const closeUnsavedDialog = () => {
    setUnsavedOpen(false);
    setPendingId(null);
  };

  const handleUnsavedSave = async () => {
    const ok = await journal.save();
    // Stay in the dialog on failure so the user can retry or discard.
    if (!ok) return;
    const target = pendingId;
    closeUnsavedDialog();
    if (target) void journal.select(target);
  };

  const handleUnsavedDiscard = () => {
    journal.discardChanges();
    const target = pendingId;
    closeUnsavedDialog();
    if (target) void journal.select(target);
  };

  const handleDeleteConfirm = async () => {
    if (!journal.selectedId) return;
    const ok = await journal.remove(journal.selectedId);
    setDeleteDialogOpen(false);
    if (ok) triggerToast('Catatan jurnal telah dihapus');
  };

  const handleShareConfirm = async () => {
    const wasShared = isShared;
    const ok = await journal.toggleShare();
    setShareDialogOpen(false);
    if (ok) {
      triggerToast(
        wasShared
          ? 'Status jurnal dikembalikan ke privat'
          : 'Jurnal berhasil dibagikan ke pasangan',
      );
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex h-screen flex-col overflow-hidden bg-[#f7f3ee] text-[#2c2523] antialiased">
      <JournalTopbar
        title={title}
        wordCount={journal.wordCount}
        sentenceCount={journal.sentenceCount}
        isShared={isShared}
        readOnly={journal.readOnly}
        saveState={journal.saveState}
        canSave={journal.isDirty}
        onSave={handleSave}
        onToggleSidebar={() => setSidebarOpen((previous) => !previous)}
        onShareClick={() => setShareDialogOpen(true)}
        onPrint={handlePrint}
        onExportMarkdown={handleExportMarkdown}
        onDeleteClick={() => setDeleteDialogOpen(true)}
        onRetrySave={journal.retrySave}
      />

      {/* Body */}
      <div className="relative flex-1 overflow-hidden pt-20">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Tutup daftar jurnal"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-stone-900/20 backdrop-blur-[2px] md:hidden"
          />
        )}

        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            title="Buka daftar jurnal"
            className="absolute left-0 top-24 z-30 hidden items-center rounded-r-2xl border-y border-r border-white/50 bg-[#fffdf9]/80 px-2 py-3 text-[#665c54] shadow-[0_12px_30px_-12px_rgba(60,40,30,0.3)] backdrop-blur-xl transition-all duration-300 hover:translate-x-1 hover:bg-white/95 hover:px-3 hover:text-[#c96f4a] motion-reduce:transition-none md:flex"
          >
            <span className="flex flex-col items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#faebe6]/90 text-[#c96f4a]">
                <BookMarked className="h-4 w-4" aria-hidden />
              </span>
              <span className="select-none py-1 text-[11px] font-semibold tracking-wide text-[#8c7e75] [writing-mode:vertical-lr]">
                Daftar Jurnal
              </span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </button>
        )}

        <JournalSidebar
          open={sidebarOpen}
          journals={journal.filtered}
          selectedId={journal.selectedId}
          loading={
            journal.loading ||
            (journal.filter !== 'privat' && journal.partnerLoading)
          }
          creating={journal.creating}
          search={journal.search}
          filter={journal.filter}
          getAuthor={journal.authorOf}
          emptyText={shelfEmptyText}
          onSearchChange={journal.setSearch}
          onFilterChange={journal.setFilter}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main editor area */}
        <main className="h-full overflow-y-auto px-3 py-6 sm:px-8 sm:py-8 lg:px-12">
          <JournalErrorBanner message={journal.error} onClose={journal.dismissError} />

          <JournalEditor
            entry={journal.selected}
            content={journal.content}
            tags={journal.tags}
            detailLoading={journal.detailLoading}
            readOnly={journal.readOnly}
            author={journal.readOnly ? journal.selectedAuthor : null}
            onContentChange={journal.setContent}
            onTagsChange={journal.setTags}
          />
        </main>
      </div>

      {/* Unsaved changes confirmation */}
      <ConfirmDialog
        open={unsavedOpen}
        tone="primary"
        icon={<Save className="h-5 w-5" aria-hidden />}
        title="Simpan perubahan?"
        description={
          <>
            Jurnal{' '}
            <strong className="font-semibold text-[#2c2523]">&ldquo;{title}&rdquo;</strong>{' '}
            memiliki perubahan yang belum tersimpan. Simpan dulu sebelum
            pindah ke jurnal lain?
          </>
        }
        cancelLabel="Batal"
        confirmLabel="Simpan"
        busy={journal.saveState === 'saving'}
        tertiaryLabel="Buang perubahan"
        onTertiary={handleUnsavedDiscard}
        onCancel={closeUnsavedDialog}
        onConfirm={handleUnsavedSave}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        tone="danger"
        icon={<Trash2 className="h-5 w-5" aria-hidden />}
        title="Hapus Catatan Jurnal?"
        description={
          <>
            Tindakan ini akan menghapus tulisan{' '}
            <strong className="font-semibold text-[#2c2523]">&ldquo;{title}&rdquo;</strong>{' '}
            secara permanen dari suaka digital Anda berdua. Anda tidak dapat
            membatalkan tindakan ini.
          </>
        }
        cancelLabel="Batal"
        confirmLabel="Ya, Hapus Jurnal"
        busy={journal.deleting}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Share / unshare confirmation */}
      <ConfirmDialog
        open={shareDialogOpen}
        tone={isShared ? 'neutral' : 'primary'}
        icon={
          isShared ? (
            <Lock className="h-5 w-5" aria-hidden />
          ) : (
            <Users className="h-5 w-5" aria-hidden />
          )
        }
        title={isShared ? 'Kembalikan ke Privat?' : 'Bagikan Jurnal ke Pasangan?'}
        description={
          isShared ? (
            <>
              Jurnal ini sekarang dapat dibaca pasangan kamu. Jika dikembalikan
              ke privat, catatan ini hilang dari linimasa bersama.
            </>
          ) : (
            <>
              Jurnal ini berstatus{' '}
              <strong className="font-semibold text-[#2c2523]">privat</strong>.
              Setelah dibagikan, pasangan kamu bisa membacanya dan menambahkan
              refleksi.
            </>
          )
        }
        cancelLabel={isShared ? 'Batal' : 'Tetap Privat'}
        confirmLabel={isShared ? 'Jadikan Privat' : 'Ya, Bagikan ke Pasangan'}
        busy={journal.sharing}
        onCancel={() => setShareDialogOpen(false)}
        onConfirm={handleShareConfirm}
      />

      <JournalToast message={toast} />
    </div>
    </MotionConfig>
  );
}
