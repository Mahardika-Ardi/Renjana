'use client';

import { useLang, type Lang } from '@/lib/i18n/lang-context';

const OPTIONS: readonly Lang[] = ['id', 'en'];

/** Compact ID/EN pill for app pages (the landing keeps its navbar switcher). */
export default function LangSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Language / Bahasa"
      className="fixed right-4 top-4 z-40 flex items-center rounded-full border border-[#e7e2d8] bg-[#f3f3f1]/90 p-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={`rounded-full px-2.5 py-1 uppercase transition ${
            lang === option
              ? 'bg-[#8a6335] text-white shadow-sm'
              : 'text-[#79582f] hover:text-[#1d1d1b]'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
