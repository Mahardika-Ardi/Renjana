import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface JournalToastProps {
  message: string | null;
}

export default function JournalToast({ message }: JournalToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 overflow-hidden rounded-2xl border border-white/50 bg-white/90 px-4 py-3 shadow-[0_16px_40px_-6px_rgba(110,80,65,0.18),0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-xl"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-xs font-medium text-[#2c2523]">{message}</p>
          <motion.span
            key={`bar-${message}`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 3.2, ease: 'linear' }}
            className="absolute bottom-0 left-4 right-4 h-0.5 origin-left rounded-full bg-emerald-500/50"
            aria-hidden
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
