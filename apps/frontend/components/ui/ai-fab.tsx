'use client';

import { useRouter } from 'next/navigation';

/**
 * Floating bottom-right entry point to the AI counselor (/consultation).
 * Rendered on the home dashboard; redundant there, so the consultation
 * page itself never mounts it. `label` comes from the caller's copy tree.
 */
export default function AiFab({ label }: { label: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push('/consultation')}
      aria-label={label}
      title={label}
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#8a6335] text-white shadow-[0_8px_24px_rgba(138,99,53,0.38)] transition hover:bg-[#79582f] active:scale-95"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
        <path d="M18.5 4.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
      </svg>
    </button>
  );
}
