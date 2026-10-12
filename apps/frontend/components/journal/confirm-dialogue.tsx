import { FLOAT_SHADOW, FOCUS_RING } from "@/lib/constants/journal";
import { X, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  tone: 'primary' | 'danger' | 'neutral';
  icon: ReactNode;
  title: string;
  description: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  tertiaryLabel?: string;
  onTertiary?: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  tone,
  icon,
  title,
  description,
  cancelLabel,
  confirmLabel,
  busy = false,
  tertiaryLabel,
  onTertiary,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmTone =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : tone === 'neutral'
        ? 'bg-[#665c54] hover:bg-[#2c2523]'
        : 'bg-[#c96f4a] hover:bg-[#b55e39]';

  const iconTone =
    tone === 'danger'
      ? 'border-red-200/60 bg-red-50 text-red-600'
      : 'border-[#c96f4a]/20 bg-[#faebe6] text-[#c96f4a]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div
        className={`w-full max-w-md rounded-3xl border border-[#eedfd5] bg-[#fdfbf9] p-6 sm:p-7 ${FLOAT_SHADOW}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${iconTone}`}
          >
            {icon}
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup dialog"
            className={`rounded-lg p-1.5 text-[#8c7e75] transition hover:bg-[#f5efe6] hover:text-[#2c2523] ${FOCUS_RING}`}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <h3 className="font-serif text-xl font-semibold tracking-tight text-[#2c2523] sm:text-2xl">
          {title}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#665c54]">
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse items-center gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`w-full rounded-xl border border-[#eedfd5] bg-white px-4 py-2.5 text-xs font-semibold text-[#665c54] transition hover:bg-[#f5efe6] hover:text-[#2c2523] sm:w-1/2 ${FOCUS_RING}`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:w-1/2 ${confirmTone} ${FOCUS_RING}`}
          >
            {busy && (
              <Loader2
                className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            )}
            {confirmLabel}
          </button>
        </div>

        {tertiaryLabel && onTertiary && (
          <button
            type="button"
            onClick={onTertiary}
            disabled={busy}
            className={`mt-2 w-full rounded-xl px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
          >
            {tertiaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
