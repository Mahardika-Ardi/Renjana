import { getCurrentDateFormatted } from '@renjana/utils';
import { useMounted } from '@/lib/use-mounted';
import { AuthUser } from '@renjana/types';

interface HomeGreetingProps {
  user: AuthUser | null;
  userLoading: boolean;
}

function greetingForHour(hour: number): string {
  if (hour < 6) return 'Good night, ';
  if (hour < 12) return 'Good morning, ';
  if (hour < 18) return 'Good afternoon, ';
  return 'Good evening, ';
}

export default function HomeGreeting({ user, userLoading }: HomeGreetingProps) {
  const mounted = useMounted();

  return (
    <header className="mb-16 text-center">
      <div className="mx-auto mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f3f3f1] px-5 py-2.5 text-xs font-medium tracking-[0.16em] text-[#79582f]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#8a6335]" />
        {getCurrentDateFormatted().toUpperCase()}
      </div>

      <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-[52px]">
        {greetingForHour(new Date().getHours())}
        <span className="font-serif italic font-semibold text-[#875e2f]">
          {/* Pre-mount renders the placeholder so the first client paint
              matches the server HTML (cached username must not leak
              into hydration). */}
          {!mounted || userLoading ? '…' : (user?.name ?? 'Teman')}
        </span>
      </h1>

      <div className="mx-auto mt-1 h-1 w-23 -rotate-3 rounded-full bg-[#c9cbb8]" />
    </header>
  );
}
