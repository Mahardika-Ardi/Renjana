'use client';

import ConnectionStatus from '@/components/home/connection-status';
import HomeGreeting from '@/components/home/home-greeting';
import HydrationCard from '@/components/home/hydration-card';
import LatestEntryCard from '@/components/home/latest-entry-card';
import RhythmsHeader from '@/components/home/rhythms-header';
import SharedFocusCard from '@/components/home/shared-focus-card';
import StillnessCard from '@/components/home/stillness-card';
import { useGetUserProfile } from '@/hooks/auth/get-user-profile';

export default function HomePage() {
  // Single shared GET /auth/me feeding the greeting and both profiles.
  const { user, loading: userLoading } = useGetUserProfile();

  return (
    <div className="min-h-screen bg-[#f8f8f7] text-[#1d1d1b]">
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
      </div>
    </div>
  );
}
