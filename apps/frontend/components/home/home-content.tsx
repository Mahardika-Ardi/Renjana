'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MotionConfig } from 'motion/react';
import { CoupleHero } from '@/components/home/connection-status';
import HomeGreeting from '@/components/home/home-greeting';
import MoodCard from '@/components/home/mood-card';
import LatestEntryCard from '@/components/home/latest-entry-card';
import RhythmsHeader from '@/components/home/rhythms-header';
import SharedFocusCard from '@/components/home/shared-focus-card';
import EmotionDumpCard from '@/components/home/emotion-dump-card';
import InviteAcceptDialog from '@/components/couple/invite-accept-dialog';
import JournalToast from '@/components/journal/journal-toast';
import ProfileModal from '@/components/home/profile-modal';
import LangSwitcher from '@/components/ui/lang-switcher';
import AiFab from '@/components/ui/ai-fab';
import { useHome } from '@/components/home/home-i18n';
import { useGetUserProfile } from '@/hooks/auth/get-user-profile';
import { useStreak } from '@/hooks/note/use-streak';
import { PAPER } from '@/lib/constants/home';

export default function HomeContent() {
  const t = useHome();
  // Single shared GET /auth/me feeding the greeting and both profiles.
  const { user, loading: userLoading, refresh } = useGetUserProfile();
  // Streak only exists for coupled users — skip the request when single.
  const streak = useStreak({ enabled: !!user?.couple });
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite')?.trim() || null;

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Which profile slot is open ('me' | 'partner' | null).
  const [profileModal, setProfileModal] = useState<'me' | 'partner' | null>(null);

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
    triggerToast(t.toast.connected);
  };

  return (
    <div className={PAPER}>
      <div className="mx-auto w-full max-w-250 px-6 py-8 md:px-10 md:py-10">
        <LangSwitcher />

        {/* One bento grid — rows are [greeting | couple hero],
            [mood | dump] (nested row: fixed 288px mood column so it reads
            square against the dump's height), [journal | focus]. Each tile
            is a grid item, so it stretches to its row's height;
            MotionConfig keeps the stagger entrances opacity-only for
            reduced-motion users. */}
        <MotionConfig reducedMotion="user">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HomeGreeting
              user={user}
              userLoading={userLoading}
              streak={streak}
            />
            <CoupleHero
              user={user}
              userLoading={userLoading}
              streak={streak}
              onProfileClick={setProfileModal}
            />
            <RhythmsHeader />

            <div className="grid grid-cols-1 gap-4 sm:col-span-2 lg:col-span-4 lg:grid-cols-[288px_minmax(0,1fr)]">
              <MoodCard />
              <EmotionDumpCard />
            </div>

            <LatestEntryCard />
            <SharedFocusCard
              partnerName={user?.couple?.partnerName ?? null}
            />
          </div>
        </MotionConfig>

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

        {profileModal && (
          <ProfileModal
            key={profileModal}
            user={user}
            who={profileModal}
            onClose={() => setProfileModal(null)}
            onAvatarChange={refresh}
          />
        )}

        <JournalToast message={toast} />

        <AiFab label={t.fab.ai} />
      </div>
    </div>
  );
}
