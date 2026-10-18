'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { HeartHandshake, Loader2, TriangleAlert } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { useInvite } from '@/hooks/auth/use-invite';
import type { ValidateInviteResponse } from '@renjana/types';

function InviteGateInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { validate } = useInvite();
  const [state, setState] = useState<
    | { kind: 'checking' }
    | { kind: 'invalid'; message: string }
    | { kind: 'valid'; invite: ValidateInviteResponse }
  >(() =>
    token
      ? { kind: 'checking' }
      : { kind: 'invalid', message: 'Tautan undangan tidak valid.' },
  );

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    (async () => {
      const invite = await validate(token);
      if (ignore) return;
      if (!invite) {
        setState({
          kind: 'invalid',
          message: 'Tautan undangan tidak valid atau sudah kadaluarsa.',
        });
        return;
      }
      setState({ kind: 'valid', invite });
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Branch AFTER validation: members to home, guests to login — always
  // replace, so /invite never traps the back button.
  useEffect(() => {
    if (state.kind !== 'valid') return;
    let ignore = false;
    (async () => {
      try {
        await authApi.getUserProfile();
        if (!ignore) router.replace(`/home?invite=${encodeURIComponent(token)}`);
      } catch {
        if (!ignore)
          router.replace(`/login?redirect=${encodeURIComponent(`/home?invite=${token}`)}`);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [state, token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ee] px-4 text-[#2c2523]">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-md rounded-3xl border border-[#ede3da] bg-white p-8 text-center shadow-[0_24px_60px_-24px_rgba(60,40,30,0.22)]"
      >
        {state.kind === 'checking' || state.kind === 'valid' ? (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faebe6] text-[#c96f4a]">
              {state.kind === 'checking' ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              ) : (
                <HeartHandshake className="h-6 w-6" aria-hidden />
              )}
            </span>
            <h1 className="mt-5 font-serif text-2xl font-semibold tracking-tight">
              {state.kind === 'checking'
                ? 'Memeriksa undangan…'
                : 'Undangan valid! Mengalihkan…'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#8c7e75]">
              {state.kind === 'checking'
                ? 'Sebentar, kami pastikan tautan ini masih berlaku.'
                : `Menghubungkanmu dengan ${state.invite.sender.name}…`}
            </p>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <TriangleAlert className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="mt-5 font-serif text-2xl font-semibold tracking-tight">
              Undangan tidak berlaku
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#8c7e75]">
              {state.message} Minta tautan baru dari pasanganmu.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function InviteGate() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f3ee]">
          <Loader2 className="h-6 w-6 animate-spin text-[#c96f4a]" aria-hidden />
        </div>
      }
    >
      <InviteGateInner />
    </Suspense>
  );
}
