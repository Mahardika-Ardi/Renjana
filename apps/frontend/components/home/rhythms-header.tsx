'use client';

import { useHome } from '@/components/home/home-i18n';

export default function RhythmsHeader() {
  const t = useHome();

  return (
    <section className="mb-7">
      <h2 className="text-3xl font-semibold tracking-[-0.04em]">
        {t.rhythms.title}
      </h2>

      <p className="mt-2 text-sm text-[#575650]">
        {t.rhythms.subtitle}
      </p>
    </section>
  );
}
