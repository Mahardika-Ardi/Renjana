'use client';

import { BarChart3, CalendarCheck, MessagesSquare } from 'lucide-react';
import { useLanding } from './landing-i18n';
import { Eyebrow, Reveal, SectionTitle } from './landing-section';

const TEASER_ICONS = [CalendarCheck, MessagesSquare, BarChart3];

export default function LandingComingSoon() {
  const { t } = useLanding();

  return (
    <section
      id="segera-hadir"
      className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <Eyebrow>{t.coming.eyebrow}</Eyebrow>
          <SectionTitle>{t.coming.title}</SectionTitle>
          <p className="mt-4 text-[15px] leading-relaxed text-[#665c54]">
            {t.coming.sub}
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {t.coming.items.map((item, index) => {
            const Icon = TEASER_ICONS[index] ?? CalendarCheck;
            return (
              <Reveal key={item.title} delay={index * 0.1}>
                <div className="relative h-full overflow-hidden rounded-3xl border border-dashed border-[#c96f4a]/40 bg-[#fdf8f3] p-7">
                  <span className="absolute right-5 top-5 rounded-full bg-[#c96f4a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#b5502a]">
                    {t.coming.badge}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#c96f4a] shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-[#2c2523]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#665c54]">
                    {item.desc}
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
