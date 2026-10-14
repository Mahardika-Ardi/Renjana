/* Tiny TTL cache: memory + sessionStorage, stale-while-revalidate friendly.
 *
 * - Memory Map answers synchronously within a session.
 * - sessionStorage survives page reloads (same tab), so reloads render
 *   instantly without refetching. sessionStorage (not localStorage) is a
 *   deliberate privacy choice: journal data never outlives the tab session,
 *   which matters on shared devices.
 * - Every read path that caches MUST have a matching invalidation on the
 *   mutation paths (see invalidateJournals / call sites in useJournal and
 *   use-auth-form). Cached reads without invalidation are a bug factory.
 */

interface CacheRecord {
  value: unknown;
  expiresAt: number;
}

const memory = new Map<string, CacheRecord>();
const PREFIX = 'renjana:cache:v1:';

function readStore(key: string): CacheRecord | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheRecord;
  } catch {
    return null;
  }
}

function writeStore(key: string, record: CacheRecord): void {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify(record));
  } catch {
    // Quota / private mode — memory cache still works.
  }
}

function deleteStore(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

function collectStoreKeys(prefix: string): string[] {
  const victims: string[] = [];
  try {
    if (typeof window === 'undefined') return victims;
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const full = window.sessionStorage.key(i);
      if (full && full.startsWith(PREFIX + prefix)) victims.push(full);
    }
  } catch {
    // ignore
  }
  return victims;
}

const isFresh = (record: CacheRecord): boolean =>
  Date.now() < record.expiresAt;

/** Read a cached value. Returns null on miss; `fresh: false` means stale (usable instantly, revalidate in background). */
export function cacheGet<T>(key: string): { value: T; fresh: boolean } | null {
  const mem = memory.get(key);
  if (mem) return { value: mem.value as T, fresh: isFresh(mem) };
  const stored = readStore(key);
  if (!stored) return null;
  memory.set(key, stored);
  return { value: stored.value as T, fresh: isFresh(stored) };
}

/** Store a value with a TTL (ms). Overwrites any previous entry. */
export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  const record: CacheRecord = { value, expiresAt: Date.now() + ttlMs };
  memory.set(key, record);
  writeStore(key, record);
}

/** Drop one key and every key nested under `prefix:` (e.g. all detail entries). */
export function cacheInvalidate(prefix: string): void {
  for (const key of [...memory.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}:`)) memory.delete(key);
  }
  for (const full of collectStoreKeys(prefix)) {
    try {
      if (typeof window !== 'undefined')
        window.sessionStorage.removeItem(full);
    } catch {
      // ignore
    }
  }
  deleteStore(prefix);
}

/** Drop everything (account switch). Prefer targeted invalidation otherwise. */
export function cacheClearAll(): void {
  memory.clear();
  for (const full of collectStoreKeys('')) {
    try {
      if (typeof window !== 'undefined')
        window.sessionStorage.removeItem(full);
    } catch {
      // ignore
    }
  }
}

export const CACHE_TTL = {
  ME: 5 * 60 * 1000,
  JOURNAL_LIST: 3 * 60 * 1000,
  JOURNAL_LATEST: 3 * 60 * 1000,
  JOURNAL_DETAIL: 5 * 60 * 1000,
} as const;

export const cacheKeys = {
  me: 'me',
  journalList: 'journals:list',
  journalLatest: 'journals:latest',
  journalDetail: (id: string) => `journals:detail:${id}`,
  journalDetailPrefix: 'journals:detail',
} as const;

/** Drop list + latest + one (or all) detail entries after a journal mutation. */
export function invalidateJournals(id?: string): void {
  cacheInvalidate(cacheKeys.journalList);
  cacheInvalidate(cacheKeys.journalLatest);
  cacheInvalidate(
    id ? cacheKeys.journalDetail(id) : cacheKeys.journalDetailPrefix,
  );
}
