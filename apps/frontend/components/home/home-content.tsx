'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConnectionStatus from '@/components/home/connection-status';
import HomeGreeting from '@/components/home/home-greeting';
import HydrationCard from '@/components/home/hydration-card';
import LatestEntryCard from '@/components/home/latest-entry-card';
import RhythmsHeader from '@/components/home/rhythms-header';
import SharedFocusCard from '@/components/home/shared-focus-card';
import StillnessCard from '@/components/home/stillness-card';
import InviteAcceptDialog from '@/components/couple/invite-accept-dialog';
import JournalToast from '@/components/journal/journal-toast';
import { useGetUserProfile } from '@/hooks/auth/get-user-profile';

export default function HomeContent() {
  // Single shared GET /auth/me feeding the greeting and both profiles.
  const { user, loading: userLoading, refresh } = useGetUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite')?.trim() || null;

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

  const stripInviteParam = () => {
    router.replace('/home');
  };

  const handleInviteAccepted = async () => {
    await refresh();
    stripInviteParam();
    triggerToast('Berhasil terhubung dengan pasangan');
  };

  return (
    <div className="mx-auto w-full max-w-250 px-6 py-8 md:px-10 md:py-10">
      <HomeGreeting user={user} userLoading={userLoading} />

      <ConnectionStatus user={user} userLoading={userLoading} />

      <RhythmsHeader />

      <section className="grid grid-cols-1 gap-5 md:grid-cols-[235px_1fr]">
        <HydrationCard />
        <StillnessCard />
      </section>

      <section className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-[1.55fr_1fr]">
        <LatestEntryCard />
        <SharedFocusCard />
      </section>

      {inviteToken && (
        <InviteAcceptDialog
          key={inviteToken}
          token={inviteToken}
          onAccepted={() => {
            void handleInviteAccepted();
          }}
          onDismiss={stripInviteParam}
        />
      )}

      <JournalToast message={toast} />
    </div>
  );
}
