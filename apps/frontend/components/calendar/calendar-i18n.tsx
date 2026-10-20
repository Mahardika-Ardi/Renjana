'use client';

import { useCopy } from '@/lib/i18n/lang-context';
import type { CopyValue } from '@/lib/i18n/pick';

/* Bilingual copy for /calendar. [indonesian, english] pairs — same
 * convention as the home copy tree. Weekday heads live in the workspace
 * (fixed arrays, like the dump card's week letters). */
const copy = {
  header: {
    title: ['Kalender', 'Calendar'],
    subtitle: ['Ritme harianmu dalam satu tampilan.', 'Your daily rhythm at a glance.'],
    back: ['Kembali ke beranda', 'Back to home'],
    prevMonth: ['Bulan sebelumnya', 'Previous month'],
    nextMonth: ['Bulan berikutnya', 'Next month'],
    today: ['Hari ini', 'Today'],
  },
  legend: {
    title: ['Keterangan', 'Legend'],
    streak: ['Streak aktif', 'Streak active'],
    streakNote: ['28 hari terakhir', 'last 28 days'],
    moods: ['Mood kamu & pasangan', 'Moods (you & partner)'],
    dumpPrivate: ['Privat', 'Private'],
    dumpRefined: ['Dipoles AI', 'AI refined'],
    dumpShared: ['Dibagikan', 'Shared'],
  },
  detail: {
    sectionStreak: ['Streak', 'Streak'],
    sectionMood: ['Mood', 'Mood'],
    sectionDumps: ['Curhatan', 'Emotion dumps'],
    streakActive: ['Aktif', 'Active'],
    streakNone: ['Tidak ada aktivitas', 'No activity'],
    streakOutside: ['Di luar cakupan 28 hari', 'Outside the 28-day window'],
    unavailable: ['Data tidak tersedia', 'Data unavailable'],
    loading: ['Memuat…', 'Loading…'],
    noMood: ['Belum dicatat', 'Not logged'],
    noDumps: ['Tidak ada curhatan', 'No dumps'],
    you: ['Kamu', 'You'],
    partner: ['Pasangan', 'Partner'],
    uncoupled: ['Belum terhubung dengan pasangan', 'Not connected with a partner'],
    selectDay: ['Pilih hari mana pun untuk melihat detailnya.', 'Pick any day to see its details.'],
  },
  banner: {
    moodsFailed: ['Gagal memuat mood bulan ini.', 'Failed to load this month’s moods.'],
    retry: ['Coba Lagi', 'Try Again'],
  },
} as const;

export type CalendarCopy = CopyValue<typeof copy>;

/** Resolved calendar copy for the active language. */
export function useCalendar(): CalendarCopy {
  return useCopy(copy);
}
