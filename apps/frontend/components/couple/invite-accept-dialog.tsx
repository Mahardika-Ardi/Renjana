'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HeartHandshake, Loader2, TriangleAlert, X } from 'lucide-react';
import { useInvite } from '@/hooks/auth/use-invite';
import { useHome } from '@/components/home/home-i18n';
import { FOCUS_RING } from '@/lib/constants/journal';
import type { ValidateInviteResponse } from '@renjana/types';

interface InviteAcceptDialogProps {
  token: string;
  onAccepted: () => void;
  onDismiss: () => void;
}

type DialogState =
  | { kind: 'checking' }
  | { kind: 'ready'; invite: ValidateInviteResponse }
  | { kind: 'failed'; message: string };

export default function InviteAcceptDialog({
  token,
  onAccepted,
  onDismiss,
}: InviteAcceptDialogProps) {
  const { validate, accept, accepting, error, dismissError } = useInvite();
  const t = useHome();
  const [state, setState] = useState<DialogState>({ kind: 'checking' });

  useEffect(() => {
    let ignore = false;
    (async () => {
      const invite = await validate(token);
      if (ignore) return;
      if (!invite) {
        setState({
          kind: 'failed',
          message: t.invite.invalidOrExpired,
        });
        return;
      }
      setState({ kind: 'ready', invite });
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleAccept = async () => {
    dismissError();
    const user = await accept(token);
    if (user) onAccepted();
    else
      setState({
        kind: 'failed',
        message: error ?? t.invite.acceptFailed,
      });
  };

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t.invite.inviteTitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="relative w-full max-w-md rounded-3xl border border-white/50 bg-[#fdfbf9]/95 p-6 text-center backdrop-blur-xl sm:p-7"
        >
          {state.kind === 'checking' ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faebe6] text-[#c96f4a]">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold tracking-tight text-[#2c2523]">
                {t.invite.checking}
              </h3>
            </>
          ) : state.kind === 'failed' ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <TriangleAlert className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold tracking-tight text-[#2c2523]">
                {t.invite.invalidTitle}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#665c54]">
                {state.message} {t.invite.invalidHint}
              </p>
              <button
                type="button"
                onClick={onDismiss}
                className={`mt-6 w-full rounded-xl border border-[#eedfd5] bg-white px-4 py-2.5 text-xs font-semibold text-[#665c54] transition hover:bg-[#f5efe6] ${FOCUS_RING}`}
              >
                {t.invite.close}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onDismiss}
                aria-label={t.invite.closeAria}
                className={`absolute right-4 top-4 rounded-lg p-1.5 text-[#8c7e75] transition hover:bg-[#f5efe6] ${FOCUS_RING}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faebe6] text-[#c96f4a]">
                <HeartHandshake className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold tracking-tight text-[#2c2523] sm:text-2xl">
                {state.invite.sender.name} {t.invite.invitedYou}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#665c54]">
                {t.invite.acceptDesc}
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={onDismiss}
                  disabled={accepting}
                  className={`w-full rounded-xl border border-[#eedfd5] bg-white px-4 py-2.5 text-xs font-semibold text-[#665c54] transition hover:bg-[#f5efe6] disabled:opacity-60 sm:w-1/2 ${FOCUS_RING}`}
                >
                  {t.invite.decline}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleAccept();
                  }}
                  disabled={accepting}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#c96f4a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#b55e39] disabled:opacity-70 sm:w-1/2 ${FOCUS_RING}`}
                >
                  {accepting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  )}
                  {t.invite.accept}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
