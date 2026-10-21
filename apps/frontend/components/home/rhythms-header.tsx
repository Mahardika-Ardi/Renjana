'use client';

import { motion } from 'motion/react';
import { useHome } from '@/components/home/home-i18n';
import { tileRise } from '@/lib/constants/home';

export default function RhythmsHeader() {
  const t = useHome();

  return (
    <motion.section
      {...tileRise(0.16)}
      className="flex flex-col justify-center sm:col-span-2 lg:col-span-4"
    >
      <h2 className="text-xl font-semibold tracking-[-0.03em]">
        {t.rhythms.title}
      </h2>

      <p className="mt-1 text-sm text-[#575650]">{t.rhythms.subtitle}</p>
    </motion.section>
  );
}
