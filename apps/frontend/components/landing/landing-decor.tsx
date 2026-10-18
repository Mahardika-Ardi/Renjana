'use client';

import { motion } from 'motion/react';

type BlobTone = 'light' | 'dream' | 'ember';

/* Sparse background decor for landing bands. Pure CSS paint, zero JS cost:
 * large blurred radial washes that break up flat slabs. A couple per band
 * maximum — texture should be felt, not noticed.
 */
const TONES: Record<BlobTone, string[]> = {
  light: ['rgba(201,111,74,0.10)', 'rgba(212,163,115,0.12)'],
  dream: ['rgba(201,111,74,0.12)', 'rgba(245,221,210,0.5)'],
  ember: ['rgba(201,111,74,0.22)', 'rgba(181,80,42,0.16)'],
};

export function SoftBlobs({ tone = 'light' }: { tone?: BlobTone }) {
  const [first, second] = TONES[tone];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ x: [0, 24, 0], y: [0, -18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${first}, transparent 70%)` }}
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 22, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-20 bottom-0 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${second}, transparent 70%)` }}
      />
    </div>
  );
}
