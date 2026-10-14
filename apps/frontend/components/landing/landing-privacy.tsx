'use client';

import { HeartHandshake, Lock, ShieldCheck } from 'lucide-react';
import { useLanding } from './landing-i18n';
import { Eyebrow, Reveal } from './landing-section';
import { SoftBlobs } from './landing-decor';

const PRIVACY_ICONS = [Lock, ShieldCheck, HeartHandshake];

export default function LandingPrivacy() {
  const { t } = useLanding();

  return (
    <section
      id="privasi"
      className="relative scroll-mt-24 overflow-hidden bg-[#2c2523] px-4 py-16 text-[#f5efe6] sm:px-6 sm:py-24"
    >
      <SoftBlobs tone="ember" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <Eyebrow>{t.privacy.eyebrow}</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[44px] md:leading-[1.1]">
            {t.privacy.title}
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#e9ded4]/80">
            {t.privacy.sub}
          </p>
        </Reveal>

        <div className="space-y-4">
          {t.privacy.items.map((item, index) => {
            const Icon = PRIVACY_ICONS[index] ?? Lock;
            return (
              <Reveal key={item.title} delay={index * 0.1}>
                <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors duration-300 hover:bg-white/10">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c96f4a] text-white">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-tight text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#e9ded4]/75">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
