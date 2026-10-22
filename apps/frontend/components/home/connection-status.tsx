import Profile from '@/components/profile/photo-profile';
import InviteButton from '@/components/couple/invite-button';
import { useHome } from '@/components/home/home-i18n';
import StreakNudgeButton from '@/components/home/streak-nudge-button';
import { motion } from 'motion/react';
import { AuthUser } from '@renjana/types';
import { useMounted } from '@/lib/use-mounted';
import { TILE_SAGE, tileRise } from '@/lib/constants/home';
import type { UseStreakReturn } from '@/hooks/note/use-streak';

interface CoupleHeroProps {
  user: AuthUser | null;
  userLoading: boolean;
  streak: UseStreakReturn;
  onProfileClick?: (type: 'me' | 'partner') => void;
}

/* The couple hero — the original connection scene, restored inside the
 * bento as a fully in-flow layout: [me] 〜 mirrored ECG 〜 ♥ 〜 ECG 〜
 * [partner]. The flex-1 connector spans exactly avatar-to-avatar and is
 * offset by (circle radius − heart radius), responsive for md's 72px
 * circles, so the line and the pulsing `heart-beat` heart stay optically
 * dead-center on the avatars. Fixed w-20 columns truncate long names and
 * keep pre-mount → loaded output from reflowing. The nudge hangs below on
 * its own internal mt-5; the count + SELAMANYA line lives in the greeting
 * tile now.
 *
 * Hydration contract unchanged: pre-mount renders the same placeholder on
 * BOTH server and first client paint; every coupled-derived value stays
 * gated behind `mounted`. */
export function CoupleHero({
  user,
  userLoading,
  streak,
  onProfileClick,
}: CoupleHeroProps) {
  const mounted = useMounted();
  const t = useHome();
  // Pre-mount renders the placeholder on BOTH server and first client
  // paint — the warm sessionStorage cache must not pick a branch during
  // hydration (same contract as HomeGreeting / Profile).
  const ready = mounted && !userLoading && !!user;
  const coupled = ready && !!user?.couple;

  return (
    <motion.div
      {...tileRise(0.06)}
      className={`${TILE_SAGE} justify-center sm:col-span-2`}
    >
      <div className="mx-auto flex w-full max-w-112.5 items-start justify-center gap-2">
        {/* Me — click for profile */}
        <button
          type="button"
          onClick={() => onProfileClick?.('me')}
          aria-label={t.profile.titleMe}
          className="w-20 shrink-0 cursor-pointer rounded-xl transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b1a082] motion-reduce:transition-none motion-reduce:hover:scale-100"
        >
          <Profile who="me" user={user} loading={userLoading} />
        </button>

        {/* ECG ↔ heart ↔ ECG — in flow, so the line always spans exactly
            avatar-to-avatar. Each segment carries a single spike aimed at
            the heart (the right one mirrored); non-scaling-stroke keeps
            the stroke crisp at this width. mt aligns the 36px heart row
            with the 66px circle center (72px circles at md). */}
        <div
          className="mt-[15px] flex min-w-0 flex-1 items-center gap-1.5 md:mt-[18px]"
          aria-hidden
        >
          <svg
            viewBox="0 0 800 150"
            preserveAspectRatio="none"
            className="h-4 min-w-0 flex-1"
          >
            <path
              d="M0 75 H250 L330 15 L410 140 L490 45 L560 75 H800"
              fill="none"
              stroke="#d9b98f"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="#f04444"
            className="heart-beat shrink-0 drop-shadow-[0_6px_12px_rgba(240,68,68,0.28)]"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
          </svg>
          <svg
            viewBox="0 0 800 150"
            preserveAspectRatio="none"
            className="h-4 min-w-0 flex-1 scale-x-[-1]"
          >
            <path
              d="M0 75 H250 L330 15 L410 140 L490 45 L560 75 H800"
              fill="none"
              stroke="#d9b98f"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Partner slot: skeleton → partner profile → invite button */}
        {!ready || !user ? (
          <div
            className="flex w-20 shrink-0 flex-col items-center gap-3"
            aria-hidden
          >
            <div className="h-16.5 w-16.5 animate-pulse rounded-full border-[3px] border-[#b1a082] bg-[#dfe0cf] motion-reduce:animate-none md:h-18 md:w-18" />
            <span className="h-4 w-16 animate-pulse rounded-full bg-[#dfe0cf] motion-reduce:animate-none" />
          </div>
        ) : user.couple ? (
          <button
            type="button"
            onClick={() => onProfileClick?.('partner')}
            aria-label={t.profile.titlePartner}
            className="w-20 shrink-0 cursor-pointer rounded-xl transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b1a082] motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <Profile who="partner" user={user} loading={userLoading} />
          </button>
        ) : (
          <div className="w-20 shrink-0">
            <InviteButton />
          </div>
        )}
      </div>

      {/* Nudge — still below the couple; the count + SELAMANYA line moved
          over to the greeting tile. */}
      {coupled && (
        <div className="text-center">
          <StreakNudgeButton
            status={streak.status}
            acting={streak.acting}
            error={streak.error}
            onSend={() => {
              void streak.send();
            }}
            onReply={() => {
              void streak.reply();
            }}
          />
        </div>
      )}
    </motion.div>
  );
}
