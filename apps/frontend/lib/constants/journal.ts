export const SAVE_INTERVAL = 180_000;
export const UNTITLED = 'Tanpa Judul';
export const SHELF_FILTERS: Array<{ value: ShelfFilter; label: string }> = [
  { value: 'semua', label: 'Semua' },
  { value: 'bersama', label: 'Jurnal Bersama' },
  { value: 'privat', label: 'Privat' },
];

// Style tailwind

export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f4a]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f3ee]';
export const SCROLLBAR =
  '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#e3d5ca] hover:[&::-webkit-scrollbar-thumb]:bg-[#d4a373]';
export const PAPER_SHADOW =
  'shadow-[0_24px_60px_-24px_rgba(60,40,30,0.22),0_2px_8px_rgba(60,40,30,0.05)]';
export const FLOAT_SHADOW =
  'shadow-[0_16px_40px_-6px_rgba(110,80,65,0.18),0_4px_16px_rgba(0,0,0,0.05)]';
export const GLASS_PANEL =
  'border-white/50 bg-[#fffdf9]/75 backdrop-blur-xl';
export const GLASS_SIDEBAR =
  'border-white/40 bg-[#fbf8f5]/80 backdrop-blur-2xl';

// Motion tokens (motion/react). Durations stay short; MotionConfig with
// reducedMotion="user" at the workspace root disables them on request.
export const EASE_SMOOTH: [number, number, number, number] = [
  0.16, 1, 0.3, 1,
];
export const SPRING_SOFT = {
  type: 'spring',
  stiffness: 400,
  damping: 34,
} as const;
export const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 520,
  damping: 36,
} as const;

// Type constant

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
export type ShelfFilter = 'semua' | 'bersama' | 'privat';

export interface Draft {
  id: string;
  title: string;
  body: string;
  tags: string[];
}
