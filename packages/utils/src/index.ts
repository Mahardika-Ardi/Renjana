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

export const toString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return value.toString();
  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
};

// ---- Date Utilities --------------------------------------------
export const formatDate = (date: Date | string, locale = 'en-US'): string =>
  new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const getCurrentDateFormatted = (): string => {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

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

// --- Storage Utilities -----------------------------------------

/**
 * Safe wrappers around sessionStorage and localStorage.
 * All functions are SSR-safe: they no-op / return null when `window` isn't available.
 */

type StorageType = 'session' | 'local';

const getStorage = (type: StorageType): Storage | null => {
  if (typeof window === 'undefined') return null;
  return type === 'session' ? window.sessionStorage : window.localStorage;
};

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

/**
 * Safely get a raw string item from storage.
 * Returns null if running on server, storage is unavailable, or key doesn't exist.
 */
export const getStorageItem = (
  key: string,
  type: StorageType = 'session',
): string | null => {
  const storage = getStorage(type);
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    // storage might be disabled (e.g. private mode, quota, security settings)
    return null;
  }
};

/**
 * Safely set a raw string item to storage.
 * No-op if running on server or storage is unavailable.
 */
export const setStorageItem = (
  key: string,
  value: string,
  type: StorageType = 'session',
): void => {
  const storage = getStorage(type);
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch {
    // ignore quota/security errors silently, or add logging here if needed
  }
};

/**
 * Safely remove an item from storage.
 * No-op if running on server or storage is unavailable.
 */
export const removeStorageItem = (
  key: string,
  type: StorageType = 'session',
): void => {
  const storage = getStorage(type);
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
};

/**
 * Safely clear all items from storage.
 * No-op if running on server or storage is unavailable.
 */
export const clearStorage = (type: StorageType = 'session'): void => {
  const storage = getStorage(type);
  if (!storage) return;

  try {
    storage.clear();
  } catch {
    // ignore
  }
};

// ---------------------------------------------------------------------------
// JSON helpers (for objects / arrays / numbers / booleans)
// ---------------------------------------------------------------------------

/**
 * Safely get and parse a JSON item from storage.
 * Returns `fallback` (default null) if key doesn't exist, JSON is invalid,
 * or running on server.
 */
export const getStorageJSON = <T = unknown>(
  key: string,
  type: StorageType = 'session',
  fallback: T | null = null,
): T | null => {
  const raw = getStorageItem(key, type);
  if (raw === null) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/**
 * Safely stringify and set a JSON item to storage.
 * No-op if running on server or storage is unavailable.
 */
export const setStorageJSON = <T = unknown>(
  key: string,
  value: T,
  type: StorageType = 'session',
): void => {
  try {
    const raw = JSON.stringify(value);
    setStorageItem(key, raw, type);
  } catch {
    // ignore serialization errors (e.g. circular refs)
  }
};

// ---------------------------------------------------------------------------
// Convenience shorthands (default to sessionStorage, matching original usage)
// ---------------------------------------------------------------------------

export const session = {
  get: (key: string) => getStorageItem(key, 'session'),
  set: (key: string, value: string) => setStorageItem(key, value, 'session'),
  remove: (key: string) => removeStorageItem(key, 'session'),
  clear: () => clearStorage('session'),
  getJSON: <T = unknown>(key: string, fallback: T | null = null) =>
    getStorageJSON<T>(key, 'session', fallback),
  setJSON: <T = unknown>(key: string, value: T) =>
    setStorageJSON<T>(key, value, 'session'),
};

export const local = {
  get: (key: string) => getStorageItem(key, 'local'),
  set: (key: string, value: string) => setStorageItem(key, value, 'local'),
  remove: (key: string) => removeStorageItem(key, 'local'),
  clear: () => clearStorage('local'),
  getJSON: <T = unknown>(key: string, fallback: T | null = null) =>
    getStorageJSON<T>(key, 'local', fallback),
  setJSON: <T = unknown>(key: string, value: T) =>
    setStorageJSON<T>(key, value, 'local'),
};
