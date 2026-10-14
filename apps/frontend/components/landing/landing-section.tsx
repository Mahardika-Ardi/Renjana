'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { EASE_SMOOTH } from '@/lib/constants/journal';

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE_SMOOTH, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#c96f4a]">
      {children}
    </p>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#2c2523] sm:text-4xl md:text-[44px] md:leading-[1.1]">
      {children}
    </h2>
  );
}
