import { getCurrentDateFormatted } from '@renjana/utils';
import { useMounted } from '@/lib/use-mounted';
import { useLang } from '@/lib/i18n/lang-context';
import { useHome } from '@/components/home/home-i18n';
import { AuthUser } from '@renjana/types';

interface HomeGreetingProps {
  user: AuthUser | null;
  userLoading: boolean;
}

export default function HomeGreeting({ user, userLoading }: HomeGreetingProps) {
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

  return (
    <header className="mb-16 text-center">
      <div className="mx-auto mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f3f3f1] px-5 py-2.5 text-xs font-medium tracking-[0.16em] text-[#79582f]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#8a6335]" />
        {getCurrentDateFormatted(lang === 'id' ? 'id-ID' : 'en-US').toUpperCase()}
      </div>

      <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-[52px]">
        {greeting}
        <span className="font-serif italic font-semibold text-[#875e2f]">
          {/* Pre-mount renders the placeholder so the first client paint
              matches the server HTML (cached username must not leak
              into hydration). */}
          {!mounted || userLoading ? '…' : (user?.name ?? t.greeting.fallbackName)}
        </span>
      </h1>

      <div className="mx-auto mt-1 h-1 w-23 -rotate-3 rounded-full bg-[#c9cbb8]" />
    </header>
  );
}
