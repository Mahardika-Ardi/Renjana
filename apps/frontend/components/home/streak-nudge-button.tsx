'use client';

import { motion } from 'motion/react';
import { Check, Hand, Loader2 } from 'lucide-react';
import { FOCUS_RING } from '@/lib/constants/journal';
import { useHome } from '@/components/home/home-i18n';
import type { TodayNudgeState } from '@renjana/types';

interface StreakNudgeButtonProps {
  status: TodayNudgeState;
  acting: boolean;
  error: string | null;
  onSend: () => void;
  onReply: () => void;
}

export default function StreakNudgeButton({
  status,
  acting,
  error,
  onSend,
  onReply,
}: StreakNudgeButtonProps) {
  const t = useHome();

  if (status === 'COMPLETED') {
    return (
      <div className="relative z-10 mt-5 flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-4 py-2 text-xs font-semibold text-emerald-700">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {t.nudge.doneToday}
        </span>
      </div>
    );
  }

  if (status === 'WAITING_PARTNER') {
    return (
      <div className="relative z-10 mt-5 flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5d5c8] bg-white/70 px-4 py-2 text-xs font-semibold text-[#8c7e75]">
          {acting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          {t.nudge.waiting}
        </span>
      </div>
    );
  }

  const isReply = status === 'WAITING_YOU';

  return (
    <div className="relative z-10 mt-5 flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={isReply ? onReply : onSend}
        disabled={acting}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(201,111,74,0.8)] transition hover:bg-[#b55e39] disabled:cursor-wait disabled:opacity-70 ${FOCUS_RING} ${
          isReply ? 'bg-[#b5502a]' : 'bg-[#c96f4a]'
        } ${isReply && !acting ? 'animate-pulse motion-reduce:animate-none' : ''}`}
      >
        {acting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Hand className="h-3.5 w-3.5" aria-hidden />
        )}
        {acting ? t.nudge.sending : isReply ? t.nudge.reply : t.nudge.send}
      </motion.button>
      {error && (
        <p role="alert" className="text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
