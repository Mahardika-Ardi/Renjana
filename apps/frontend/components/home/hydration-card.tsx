'use client';

import { useState } from 'react';
import { DropletIcon } from './home-icons';
import { useHome } from '@/components/home/home-i18n';

const MAX_GLASSES = 8;

export default function HydrationCard() {
  const [glasses, setGlasses] = useState(4);
  const t = useHome();

  const hydrationPercentage = Math.min((glasses / MAX_GLASSES) * 100, 100);

  return (
    <div className="relative flex min-h-68.75 flex-col rounded-[30px] bg-[#f1f1f0] p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{t.hydration.title}</h3>

          <p className="mt-1 text-[11px] font-medium tracking-wide text-[#474742]">
            {glasses} / {MAX_GLASSES} {t.hydration.unit}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e9e7]">
          <DropletIcon />
        </div>
      </div>

      {/* Percentage */}
      <div className="mt-5 flex flex-1 items-center justify-center">
        <div className="relative flex h-17.5 w-17.5 items-center justify-center rounded-full border-[6px] border-[#8b602f]">
          <span className="text-[22px] text-[#875e2f]">
            {Math.round(hydrationPercentage)}%
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setGlasses((value) => Math.max(0, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9e9e7] text-lg text-[#5b5a54] transition hover:bg-[#dfdfdc]"
        >
          −
        </button>

        <button
          type="button"
          onClick={() => setGlasses((value) => Math.min(MAX_GLASSES, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9e9e7] text-lg text-[#5b5a54] transition hover:bg-[#dfdfdc]"
        >
          +
        </button>
      </div>
    </div>
  );
}
