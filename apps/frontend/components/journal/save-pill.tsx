import { FOCUS_RING, SaveState } from '@/lib/constants/journal';
import { Loader2, AlertCircle, Check } from 'lucide-react';

interface SavePillProps {
  state: SaveState;
  onRetry: () => void;
}

export default function SavePill({ state, onRetry }: SavePillProps) {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-[#eedfd5] bg-[#faf6f0] px-2.5 py-1 text-[11px] font-medium text-[#8c7e75]">
        <Loader2
          className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
          aria-hidden
        />
        <span className="hidden sm:inline">Menyimpan…</span>
      </span>
    );
  }

  if (state === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        className={`flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-100 ${FOCUS_RING}`}
      >
        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">Gagal menyimpan — coba lagi</span>
        <span className="sm:hidden">Ulangi</span>
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
      <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
      <span className="hidden sm:inline">Tersimpan otomatis</span>
    </span>
  );
}
