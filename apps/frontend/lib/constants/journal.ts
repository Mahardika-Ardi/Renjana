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
  'shadow-[0_8px_30px_rgba(60,40,30,0.05),0_1px_3px_rgba(60,40,30,0.03)]';
export const FLOAT_SHADOW =
  'shadow-[0_16px_40px_-6px_rgba(110,80,65,0.18),0_4px_16px_rgba(0,0,0,0.05)]';

// Type constant

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
export type ShelfFilter = 'semua' | 'bersama' | 'privat';

export interface Draft {
  id: string;
  title: string;
  body: string;
  tags: string[];
}
