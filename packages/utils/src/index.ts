// ================================================================
// @renjana/utils — Shared Utilities
// ================================================================

// ---- String Utilities ------------------------------------------
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ---- Date Utilities --------------------------------------------
export const formatDate = (date: Date | string, locale = 'id-ID'): string =>
  new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const getISOWeek = (date: Date): { week: number; year: number } => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return {
    week:
      1 +
      Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      ),
    year: d.getFullYear(),
  };
};

export const daysBetween = (a: Date, b: Date): number =>
  Math.abs(Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));

// ---- Validation Utilities -------------------------------------
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isStrongPassword = (password: string): boolean =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password);

// ---- Math Utilities --------------------------------------------
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const average = (numbers: number[]): number =>
  numbers.length === 0
    ? 0
    : numbers.reduce((sum, n) => sum + n, 0) / numbers.length;

export const percentage = (value: number, total: number): number =>
  total === 0 ? 0 : Math.round((value / total) * 100);
