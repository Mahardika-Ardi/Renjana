'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { EASE_SMOOTH } from '@/lib/constants/journal';
import { useLanding, type LandingLang } from './landing-i18n';

function LangSwitcher() {
  const { lang, setLang } = useLanding();
  const options: LandingLang[] = ['id', 'en'];

  return (
    <div
      role="group"
      aria-label="Language / Bahasa"
      className="flex items-center rounded-full border border-[#eedfd5] bg-[#faf6f0]/80 p-0.5 text-[11px] font-semibold"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={`rounded-full px-2.5 py-1 uppercase transition ${
            lang === option
              ? 'bg-[#c96f4a] text-white shadow-sm'
              : 'text-[#8c7e75] hover:text-[#2c2523]'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function LandingNavbar() {
  const { t } = useLanding();

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_SMOOTH }}
      className="fixed inset-x-3 top-3 z-50 sm:inset-x-6"
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-white/50 bg-[#fffdf9]/75 px-4 shadow-[0_12px_36px_-12px_rgba(60,40,30,0.25)] backdrop-blur-xl sm:px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c96f4a] text-white">
            <Heart className="h-4 w-4 fill-current" aria-hidden />
          </span>
          <span className="text-sm font-bold tracking-[0.22em] text-[#2c2523]">
            RENJANA
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-[#665c54] md:flex">
          <a href="#cara-kerja" className="transition hover:text-[#c96f4a]">
            {t.nav.how}
          </a>
          <a href="#fitur" className="transition hover:text-[#c96f4a]">
            {t.nav.features}
          </a>
          <a href="#privasi" className="transition hover:text-[#c96f4a]">
            {t.nav.privacy}
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LangSwitcher />
          <Link
            href="/login"
            className="hidden px-3 py-2 text-sm font-medium text-[#665c54] transition hover:text-[#2c2523] sm:block"
          >
            {t.nav.signin}
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#c96f4a] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_18px_-6px_rgba(201,111,74,0.7)] transition hover:bg-[#b55e39]"
          >
            {t.nav.signup}
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
