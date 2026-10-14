'use client';

import { useEffect, useRef } from 'react';

const COUNT = 36;
const COLORS = ['201,111,74', '212,163,115', '181,80,42'];
const PARALLAX = 0.15;

/* Line-streak particles for the hero background. Short drifting dashes
 * angled along their motion — decorative only, never interactive:
 * - capped count, capped pixel ratio, single rAF loop (auto-pauses off-tab)
 * - parallax against scroll + a decaying velocity kick on scroll flicks
 * - renders nothing when the user prefers reduced motion
 * - all setup inside the effect, so SSR output is an empty canvas
 */
export default function LandingParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let lastScroll = window.scrollY;

    interface Streak {
      x: number;
      y: number;
      len: number;
      vx: number;
      vy: number;
      kick: number;
      tilt: number;
      color: string;
      alpha: number;
      phase: number;
    }

    let streaks: Streak[] = [];

    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      streaks = Array.from({ length: COUNT }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 6 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.16 - 0.05,
        kick: 0,
        tilt: (Math.random() - 0.5) * 0.5,
        color: COLORS[i % COLORS.length],
        alpha: 0.1 + Math.random() * 0.16,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    seed();
    window.addEventListener('resize', seed);

    const wrap = (value: number, max: number): number =>
      ((value % max) + max) % max;

    let frame = 0;
    const tick = () => {
      frame += 1;
      const scrollY = window.scrollY;
      const delta = scrollY - lastScroll;
      lastScroll = scrollY;
      const parallax = scrollY * PARALLAX;

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      for (const s of streaks) {
        // Scroll flicks ripple through the field, then settle.
        s.kick = (s.kick + delta * 0.0015) * 0.94;
        if (s.kick > 1.2) s.kick = 1.2;
        if (s.kick < -1.2) s.kick = -1.2;

        s.x += s.vx;
        s.y += s.vy + s.kick;
        s.x = wrap(s.x, width + 16) - 8;
        s.y = wrap(s.y, height + 16) - 8;

        const angle =
          Math.atan2(s.vy + s.kick, s.vx || 0.001) + s.tilt;
        const dx = Math.cos(angle) * s.len;
        const dy = Math.sin(angle) * s.len;
        const drawY = wrap(s.y - parallax, height + 16) - 8;

        const twinkle = 0.7 + 0.3 * Math.sin(s.phase + frame / 90);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${s.color},${(s.alpha * twinkle).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.moveTo(s.x, drawY);
        ctx.lineTo(s.x - dx, drawY - dy);
        ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', seed);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
