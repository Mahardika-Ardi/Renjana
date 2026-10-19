'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanding } from './landing-i18n';
import { Reveal } from './landing-section';
import LandingParticles from './landing-particles';
import RenjanaLogo from '@/components/ui/logo';

export default function LandingClosing() {
  const { t } = useLanding();

  return (
    <>
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-4xl bg-[#c96f4a] px-6 py-14 text-center text-white shadow-[0_28px_70px_-24px_rgba(201,111,74,0.7)] sm:px-12 sm:py-16">
            <LandingParticles tone="light" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_110%,rgba(255,255,255,0.22),transparent_70%)]"
            />
            <h2 className="relative mx-auto max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-[44px] md:leading-[1.1]">
              {t.cta.title}
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/85">
              {t.cta.sub}
            </p>
            <Link
              href="/register"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#b5502a] shadow-lg transition hover:bg-[#fdf8f3]"
            >
              {t.cta.button}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-[#e5d5c8] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <span className="flex items-center gap-2">
                <RenjanaLogo className="h-9 w-auto" />
                <span className="text-sm font-bold tracking-[0.22em] text-[#2c2523]">
                  RENJANA
                </span>
              </span>
              <p className="mt-4 text-sm leading-relaxed text-[#8c7e75]">
                {t.footer.tagline}
              </p>
            </div>

            <div className="flex gap-16">
              <div>
                <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8c7e75]">
                  {t.footer.product}
                </h4>
                <ul className="space-y-2.5 text-sm font-medium text-[#665c54]">
                  <li>
                    <a href="#fitur" className="transition hover:text-[#c96f4a]">
                      {t.nav.features}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#cara-kerja"
                      className="transition hover:text-[#c96f4a]"
                    >
                      {t.nav.how}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#segera-hadir"
                      className="transition hover:text-[#c96f4a]"
                    >
                      {t.coming.eyebrow.charAt(0) +
                        t.coming.eyebrow.slice(1).toLowerCase()}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8c7e75]">
                  {t.footer.account}
                </h4>
                <ul className="space-y-2.5 text-sm font-medium text-[#665c54]">
                  <li>
                    <Link
                      href="/login"
                      className="transition hover:text-[#c96f4a]"
                    >
                      {t.nav.signin}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/register"
                      className="transition hover:text-[#c96f4a]"
                    >
                      {t.nav.signup}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-[#e5d5c8] pt-6 text-center text-xs text-[#8c7e75]">
            <p>{t.footer.rights}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
