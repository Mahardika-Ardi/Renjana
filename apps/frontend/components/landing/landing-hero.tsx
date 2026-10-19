'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { EASE_SMOOTH } from '@/lib/constants/journal';
import { useLanding } from './landing-i18n';
import LandingParticles from './landing-particles';

export default function LandingHero() {
  const { t } = useLanding();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const cardY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-3 pt-24 sm:px-6 sm:pt-28"
    >
      <LandingParticles />
      <div
        aria-hidden
        className="bg-rules pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(201,111,74,0.14),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SMOOTH, delay: 0.08 }}
            className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#2c2523] sm:text-5xl lg:text-[64px]"
          >
            {t.hero.titleA}{' '}
            <span className="font-serif italic text-[#c96f4a]">
              {t.hero.titleAccent}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SMOOTH, delay: 0.16 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-[#665c54] sm:text-lg"
          >
            {t.hero.sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SMOOTH, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-[#c96f4a] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgba(201,111,74,0.8)] transition hover:bg-[#b55e39]"
            >
              {t.hero.ctaPrimary}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
            <a
              href="#cara-kerja"
              className="inline-flex items-center rounded-full border border-[#e5d5c8] bg-white/70 px-6 py-3 text-sm font-semibold text-[#2c2523] backdrop-blur transition hover:bg-white"
            >
              {t.hero.ctaSecondary}
            </a>
          </motion.div>
        </div>

        <motion.div
          style={{ y: cardY }}
          className="relative mx-auto w-full max-w-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_SMOOTH, delay: 0.2 }}
            className="relative w-full"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-3xl border border-[#ede3da] bg-white p-7 shadow-[0_24px_60px_-24px_rgba(60,40,30,0.28)]"
            >
              <p className="font-serif text-2xl font-medium tracking-tight text-[#2c2523]">
                {t.hero.cardTitle}
              </p>
              <p className="mt-3 font-serif text-[15px] italic leading-relaxed text-[#665c54]">
                “{t.hero.cardText}”
              </p>
              <div className="mt-5 flex justify-end border-t border-[#f1e6de] pt-4">
                <span
                  aria-hidden
                  className="flex items-center gap-1 text-[11px] text-[#b3a599]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
              </div>
            </motion.div>

            <div
              aria-hidden
              className="absolute -bottom-5 -left-5 -z-10 h-28 w-28 rounded-3xl bg-[#faebe6]"
            />
            <div
              aria-hidden
              className="absolute -right-4 -top-4 -z-10 h-20 w-20 rounded-full bg-[#f4ebe1]"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
