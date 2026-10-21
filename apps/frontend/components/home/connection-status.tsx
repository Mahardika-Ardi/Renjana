import Profile from '@/components/profile/photo-profile';
import InviteButton from '@/components/couple/invite-button';
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
 * bento: both Profile avatars joined by the warm ECG heartbeat line, the * red love heart pulsing in the exact center (the `heart-beat` keyframes
 * in globals.css; translate/scale compose because Tailwind v4 writes the * standalone `translate:` property), with the nudge button underneath. The * count + SELAMANYA line lives in the greeting tile now; this tile is * purely the scene, in a wide sage span-2 slot next to the greeting.
 *
 * Hydration contract unchanged: pre-mount renders the same placeholder on * BOTH server and first client paint; every coupled-derived value stays * gated behind `mounted`. */
export function CoupleHero({
  user,
  userLoading,
  streak,
  onProfileClick,
}: CoupleHeroProps) {
  const mounted = useMounted();
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
      <div className="relative mx-auto flex w-full max-w-96 items-center justify-between">
        {/* Me — click for profile */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onProfileClick?.('me')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onProfileClick?.('me');
            }
          }}
          className="relative z-10 cursor-pointer rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b1a082] motion-reduce:transition-none motion-reduce:hover:scale-100"
        >
          <Profile who="me" user={user} loading={userLoading} />
        </div>

        {/* Heartbeat line + love heart — the original ECG path, compacted
            to sit between the avatars, heart dead-center on the line. */}
        <div className="absolute left-[24%] right-[24%] top-1.5 h-16" aria-hidden>
          <svg
            viewBox="0 0 800 150"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d="M0 75 L180 75 L205 75 L230 100 L260 45 L290 105 L320 35 L350 95 L380 10 L410 105 L440 45 L470 105 L500 45 L530 95 L560 45 L590 75 L800 75"
              fill="none"
              stroke="#d9b98f"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="#f04444"
            className="heart-beat absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_6px_12px_rgba(240,68,68,0.28)]"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
          </svg>
        </div>

        {/* Partner slot: skeleton → partner profile → invite button */}
        {!ready || !user ? (
          <div className="relative z-10 flex flex-col items-center" aria-hidden>
            <div className="h-16.5 w-16.5 animate-pulse rounded-full border-[3px] border-[#b1a082] bg-[#dfe0cf] motion-reduce:animate-none md:h-18 md:w-18" />
            <span className="mt-3 h-4 w-16 animate-pulse rounded-full bg-[#dfe0cf] motion-reduce:animate-none" />
          </div>
        ) : user.couple ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onProfileClick?.('partner')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onProfileClick?.('partner');
              }
            }}
            className="relative z-10 cursor-pointer rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b1a082] motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <Profile who="partner" user={user} loading={userLoading} />
          </div>
        ) : (
          <div className="relative z-10">
            <InviteButton />
          </div>
        )}
      </div>

      {/* Nudge — still below the couple; the count + SELAMANYA line moved
          over to the greeting tile. */}
      {coupled && (
        <div className="relative z-10 mt-5 text-center">
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
