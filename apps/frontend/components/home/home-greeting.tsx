import { getCurrentDateFormatted } from '@renjana/utils';
import { motion } from 'motion/react';
import { useMounted } from '@/lib/use-mounted';
import { useLang } from '@/lib/i18n/lang-context';
import { useHome } from '@/components/home/home-i18n';
import { TILE, tileRise } from '@/lib/constants/home';
import { AuthUser } from '@renjana/types';
import type { UseStreakReturn } from '@/hooks/note/use-streak';

interface HomeGreetingProps {
  user: AuthUser | null;
  userLoading: boolean;
  /** Shared streak state — the count line lives here now, not in the hero. */
  streak: UseStreakReturn;
}

export default function HomeGreeting({
  user,
  userLoading,
  streak,
}: HomeGreetingProps) {
  const mounted = useMounted();
  const { lang } = useLang();
  const t = useHome();

  const hour = new Date().getHours();
  const greeting =
    hour < 6
      ? t.greeting.night
      : hour < 12
        ? t.greeting.morning
        : hour < 18
          ? t.greeting.afternoon
          : t.greeting.evening;

  // Same contract the couple hero used to carry: pre-mount renders the
  // not-connected placeholder on BOTH server and first client paint (the
  // warm sessionStorage cache must not pick a branch during hydration);
  // the count hangs off `coupled`, gated by `mounted`.
  const ready = mounted && !userLoading && !!user;
  const coupled = ready && !!user?.couple;

  return (
    <motion.header {...tileRise(0)} className={`${TILE} justify-center sm:col-span-2`}>
      <div className="flex w-fit items-center gap-3 rounded-full bg-[#f3f1ec] px-4 py-2 text-[11px] font-medium tracking-[0.16em] text-[#79582f]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#8a6335]" />
        {getCurrentDateFormatted(lang === 'id' ? 'id-ID' : 'en-US').toUpperCase()}
      </div>

      <h1 className="mt-4 text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">
        {greeting}
        <span className="font-serif italic font-semibold text-[#875e2f]">
          {/* Pre-mount renders the placeholder so the first client paint
              matches the server HTML (cached username must not leak
              into hydration). */}
          {!mounted || userLoading ? '…' : (user?.name ?? t.greeting.fallbackName)}
        </span>
      </h1>

      {/* Streak — split out of the couple hero: count left, SELAMANYA right.
          `SELAMANYA` only pairs with an actual count (it used to sit under
          "Belum Terkoneksi", which read oddly). */}
      <div className="mt-5 border-t border-[#efeae2] pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-semibold tracking-[-0.02em]">
            {coupled ? (
              <>
                <span className="text-xl tabular-nums">
                  {streak.loading ? '…' : (streak.currentStreak ?? 0)}
                </span>{' '}
                <span className="text-sm font-medium text-[#575650]">
                  {t.connection.daysConnected}
                </span>
              </>
            ) : (
              <span className="text-lg font-medium text-[#575650]">
                {t.connection.notConnected}
              </span>
            )}
          </p>

          {coupled && (
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#79582f]">
              {t.connection.forever}
            </p>
          )}
        </div>
      </div>
    </motion.header>
  );
}
