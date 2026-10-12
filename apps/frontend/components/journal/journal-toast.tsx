import { Check } from 'lucide-react';

interface JournalToastProps {
  message: string | null;
}

export default function JournalToast({ message }: JournalToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-[#eedfd5] bg-white/95 px-4 py-3 shadow-[0_16px_40px_-6px_rgba(110,80,65,0.18),0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-md"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <Check className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-xs font-medium text-[#2c2523]">{message}</p>
    </div>
  );
}
