'use client';

import { AlertCircle, X } from 'lucide-react';

interface JournalErrorBannerProps {
  message: string | null;
  onClose: () => void;
}

export default function JournalErrorBanner({ message, onClose }: JournalErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="mx-auto mb-6 flex w-full max-w-3xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup pesan kesalahan"
        className="rounded-lg p-1 transition hover:bg-red-100"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
