'use client';

import {
  FileDown,
  Flame,
  ListChecks,
  PenLine,
  Sparkles,
  Users,
} from 'lucide-react';
import { useLanding } from './landing-i18n';
import { Eyebrow, Reveal, SectionTitle } from './landing-section';
import { SoftBlobs } from './landing-decor';

const FEATURE_ICONS = [PenLine, Users, Flame, ListChecks, Sparkles, FileDown];

export default function LandingFeatures() {
  const { t } = useLanding();

  return (
    <section
      id="fitur"
      className="relative scroll-mt-24 overflow-hidden bg-[#f1ece4] px-4 py-16 sm:px-6 sm:py-24"
    >
      <SoftBlobs tone="light" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <Eyebrow>{t.features.eyebrow}</Eyebrow>
          <SectionTitle>{t.features.title}</SectionTitle>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((feature, index) => {
            const Icon = FEATURE_ICONS[index] ?? PenLine;
            return (
              <Reveal key={feature.title} delay={(index % 3) * 0.1}>
                <div className="group h-full rounded-3xl border border-white/60 bg-white/70 p-7 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_24px_60px_-24px_rgba(60,40,30,0.3)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faebe6] text-[#c96f4a] transition-colors duration-300 group-hover:bg-[#c96f4a] group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-[#2c2523]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#665c54]">
                    {feature.desc}
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
