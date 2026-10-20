/* Day-key helpers shared by the emotion-dump card and the calendar page.
 *
 * Server timestamps (createdAt, engagedDate exports) are UTC instants, but
 * the app's calendar truth is Asia/Jakarta (WIB, no DST). Keying everything
 * in WIB keeps a 01:30-WIB dump on the correct local day even when the
 * backend runs in UTC. Mood logDate and dump week fields are already
 * calendar-day strings — those just get their date part sliced off.
 *
 * Calendar math is done on "day tokens": Date.UTC(y, m, d) values whose UTC
 * accessors ARE the intended calendar day, formatted with timeZone 'UTC' —
 * immune to the viewer's timezone.
 */

const WIB = 'Asia/Jakarta';

/** YYYY-MM-DD (WIB) for a server timestamp or Date. */
export function serverDayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** YYYY-MM-DD for a value that is already a calendar day (YYYY-MM-DD...). */
export function datePartKey(value: string): string {
  return value.slice(0, 10);
}

/** Today's calendar day key (WIB). */
export function todayKey(): string {
  return serverDayKey(new Date());
}

/** Y/M/D of today in WIB. */
export function todayParts(): { year: number; month: number; day: number } {
  const [year, month, day] = todayKey().split('-').map(Number);
  return { year, month, day };
}

/** A day token: UTC accessors return the intended calendar day. */
export function dayToken(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** YYYY-MM-DD key for a day token (UTC-space, exact). */
export function tokenKey(token: Date): string {
  const y = token.getUTCFullYear();
  const m = String(token.getUTCMonth() + 1).padStart(2, '0');
  const d = String(token.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Days in a month (month is 0-based). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Monday-based weekday index (0 = Monday … 6 = Sunday) for a day token. */
export function mondayIndex(token: Date): number {
  return (token.getUTCDay() + 6) % 7;
}
