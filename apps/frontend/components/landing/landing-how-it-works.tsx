'use client';

import { Link2, PenLine, UserPlus } from 'lucide-react';
import { useLanding } from './landing-i18n';
import { Eyebrow, Reveal, SectionTitle } from './landing-section';

const STEP_ICONS = [UserPlus, Link2, PenLine];

export default function LandingHowItWorks() {
  const { t } = useLanding();

  return (
    <section id="cara-kerja" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <Eyebrow>{t.steps.eyebrow}</Eyebrow>
          <SectionTitle>{t.steps.title}</SectionTitle>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {t.steps.items.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? PenLine;
            return (
              <Reveal key={step.title} delay={index * 0.1}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-[#ede3da] bg-white p-7 transition-shadow duration-300 hover:shadow-[0_24px_60px_-24px_rgba(60,40,30,0.25)]">
                  <span
                    aria-hidden
                    className="absolute -right-2 -top-5 font-serif text-[88px] font-semibold leading-none text-[#faebe6] transition-colors duration-300 group-hover:text-[#f5ddd2]"
                  >
                    {index + 1}
                  </span>
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c96f4a] text-white shadow-[0_8px_20px_-8px_rgba(201,111,74,0.8)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-[#2c2523]">
                    {step.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-[#665c54]">
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
