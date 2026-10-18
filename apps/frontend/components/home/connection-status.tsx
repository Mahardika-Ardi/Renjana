import Profile from '@/components/profile/photo-profile';
import InviteButton from '@/components/couple/invite-button';
import StreakNudgeButton from '@/components/home/streak-nudge-button';
import { AuthUser } from '@renjana/types';
import type { UseStreakReturn } from '@/hooks/note/use-streak';

interface ConnectionStatusProps {
  user: AuthUser | null;
  userLoading: boolean;
  streak: UseStreakReturn;
}

export default function ConnectionStatus({ user, userLoading, streak }: ConnectionStatusProps) {
  const coupled = !!user?.couple;
  return (
    <section className="relative mb-16 overflow-hidden rounded-[38px] bg-[#f1eee8] px-6 py-16 shadow-[0_15px_35px_rgba(60,50,40,0.05)] md:px-10 md:py-20">
      <div className="relative mx-auto flex max-w-212.5 items-center justify-between">
        {/* Arka */}
        <Profile who="me" user={user} loading={userLoading} />

        {/* Heartbeat */}
        <div className="absolute left-[18%] right-[18%] top-8.75 h-37.5">
          <svg
            viewBox="0 0 800 150"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d="
                M0 75
                L180 75
                L205 75
                L230 100
                L260 45
                L290 105
                L320 35
                L350 95
                L380 10
                L410 105
                L440 45
                L470 105
                L500 45
                L530 95
                L560 45
                L590 75
                L800 75
              "
              fill="none"
              stroke="#e8ceb0"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Heart */}
          <div className="absolute left-1/2 top-9.75 -translate-x-1/2">
            <svg
              width="72"
              height="72"
              viewBox="0 0 24 24"
              fill="#f04444"
              className="drop-shadow-[0_6px_12px_rgba(240,68,68,0.22)]"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
            </svg>
          </div>
        </div>

        {/* Senja — partner slot, or invite button when single */}
        {userLoading || !user ? (
          <div className="relative z-20 flex flex-col items-center" aria-hidden>
            <div className="h-16.5 w-16.5 animate-pulse rounded-full border-[3px] border-[#b1a082] bg-[#e8e2d8] motion-reduce:animate-none md:h-18 md:w-18" />
            <span className="mt-3 h-4 w-16 animate-pulse rounded-full bg-[#e8e2d8] motion-reduce:animate-none" />
          </div>
        ) : user.couple ? (
          <Profile who="partner" user={user} loading={userLoading} />
        ) : (
          <InviteButton />
        )}
      </div>

      {/* Connection text */}
      <div className="relative z-10 mt-7 text-center">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-[25px]">
          {coupled ? (
            <>
              {streak.loading ? '…' : (streak.currentStreak ?? 0)} Hari
              Terkoneksi
            </>
          ) : (
            'Belum Terkoneksi'
          )}
        </h2>

        <p className="mt-2 text-xs font-semibold tracking-[0.16em] text-[#8a5f2d]">
          SELAMANYA
        </p>

        {coupled && (
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
        )}
      </div>
    </section>
  );
}
