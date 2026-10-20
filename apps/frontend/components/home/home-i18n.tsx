'use client';

import { useCopy } from '@/lib/i18n/lang-context';
import type { CopyValue } from '@/lib/i18n/pick';

/* Bilingual copy for the home dashboard. [indonesian, english] pairs —
 * the same convention as the landing copy tree. */
const copy = {
  greeting: {
    night: ['Selamat malam, ', 'Good night, '],
    morning: ['Selamat pagi, ', 'Good morning, '],
    afternoon: ['Selamat siang, ', 'Good afternoon, '],
    evening: ['Selamat malam, ', 'Good evening, '],
    fallbackName: ['Teman', 'Friend'],
  },
  connection: {
    daysConnected: ['Hari Terkoneksi', 'Days Connected'],
    notConnected: ['Belum Terkoneksi', 'Not connected'],
    forever: ['SELAMANYA', 'FOREVER'],
  },
  nudge: {
    send: ['Senggol Pasangan', 'Nudge Partner'],
    reply: ['Balas Senggolan', 'Reply to Nudge'],
    sending: ['Mengirim…', 'Sending…'],
    waiting: ['Menunggu balasan…', 'Waiting for reply…'],
    doneToday: ['Streak +1 hari ini', 'Streak +1 today'],
  },
  rhythms: {
    title: ['Ritme Harian', 'Daily Rhythms'],
    subtitle: [
      'Air untuk tubuh, ketenangan untuk pikiran.',
      'Water for the body, stillness for the mind.',
    ],
  },
  mood: {
    title: ['Mood Hari Ini', 'Today’s Mood'],
    howDoYouFeel: ['Hari ini kamu merasa?', 'How do you feel today?'],
    sendingIn: ['Terkirim dalam {n} detik…', 'Sending in {n} seconds…'],
    submitting: ['Mengirim mood…', 'Submitting mood…'],
    cancel: ['Batal', 'Cancel'],
    locked: ['Terkunci sampai besok', 'Locked until tomorrow'],
    partnerMood: ['Mood pasangan hari ini', 'Partner’s mood today'],
    error: ['Gagal mengirim mood', 'Failed to submit mood'],
  },
  hydration: {
    title: ['Hidrasi', 'Hydration'],
    unit: ['GELAS', 'GLASSES'],
  },
  dump: {
    badge: ['CURAHAN EMOSI', 'EMOTION DUMP'],
    tabMine: ['Milikku', 'Mine'],
    tabPartner: ['Pasangan', 'Partner'],
    calendarAria: ['Buka kalender', 'Open calendar'],
    addAria: ['Tambah curhatan', 'Add emotion dump'],
    closeAria: ['Tutup komposer', 'Close composer'],
    placeholder: ['Luapkan apa saja di sini…', 'Vent anything here…'],
    submit: ['Curhat', 'Vent'],
    submitting: ['Mengirim…', 'Sending…'],
    cronNote: [
      'AI memperhalus otomatis setiap Minggu pukul 12.00 WIB.',
      'AI refines automatically every Sunday at 12:00 WIB.',
    ],
    charOf: ['/1000', '/1000'],
    loading: ['Memuat curhatan…', 'Loading dumps…'],
    empty: ['Belum ada curhatan. Luapkan perasaanmu.', 'No dumps yet. Let it all out.'],
    listFailed: ['Gagal memuat curhatan.', 'Failed to load dumps.'],
    retry: ['Coba Lagi', 'Try Again'],
    createFailed: [
      'Gagal menyimpan curhatan. Coba lagi.',
      'Failed to save your dump. Try again.',
    ],
    shareFailed: ['Gagal membagikan. Coba lagi.', 'Failed to share. Try again.'],
    statusPrivate: ['PRIVAT', 'PRIVATE'],
    statusRefined: ['DIFOLES', 'REFINED'],
    statusShared: ['DIBAGIKAN', 'SHARED'],
    share: ['Bagikan', 'Share'],
    shareAria: ['Bagikan ke pasangan', 'Share with partner'],
    showOriginal: ['Lihat asli', 'View original'],
    showRefined: ['Lihat hasil AI', 'View refined'],
    partnerEmpty: [
      'Pasangan belum membagikan apa pun.',
      'Your partner hasn’t shared anything yet.',
    ],
    partnerNotConnected: [
      'Hubungkan dulu dengan pasanganmu.',
      'Connect with your partner first.',
    ],
  },
  entry: {
    title: ['Entri Terbaru', 'Latest Entry'],
    loading: ['Memuat jurnal terbaru', 'Loading latest journal entry'],
    empty: [
      'Belum ada jurnal. Tulis momen pertamamu hari ini.',
      'No entries yet. Write your first moment today.',
    ],
    failed: [
      'Tidak dapat memuat jurnal saat ini.',
      'Could not load your journal right now.',
    ],
    startWriting: ['Mulai Menulis →', 'Start Writing →'],
    retry: ['Coba Lagi →', 'Try Again →'],
    untitled: ['Tanpa Judul', 'Untitled'],
    lastUpdated: ['Terakhir diperbarui ·', 'Last updated ·'],
    openJournal: ['Buka Jurnal →', 'Open Journal →'],
  },
  focus: {
    title: ['Fokus Bersama', 'Shared Focus'],
    empty: [
      'Tidak ada tugas aktif. Nikmati harimu berdua.',
      'No active tasks. Enjoy your day together.',
    ],
    viewAll: ['Lihat Semua Tugas', 'View All Tasks'],
    markDone: ['Tandai selesai', 'Mark as done'],
    undoDone: ['Batal selesai', 'Undo'],
  },
  profile: {
    eyebrowMe: ['PROFIL SAYA', 'MY PROFILE'],
    eyebrowPartner: ['PASANGAN', 'PARTNER'],
    titleMe: ['Profil Anda', 'Your Profile'],
    titlePartner: ['Pasangan Anda', 'Your Partner'],
    close: ['Tutup', 'Close'],
    notConnected: ['Belum terhubung', 'Not connected yet'],
    imageMe: ['Foto profil kamu', 'Your profile picture'],
    imagePartner: ['Foto pasangan', 'Partner picture'],
    name: ['Nama', 'Name'],
    email: ['Email', 'Email'],
    status: ['Status', 'Status'],
    connected: ['Terhubung', 'Connected'],
    verified: ['Terverifikasi', 'Verified'],
    yes: ['Ya', 'Yes'],
    notYet: ['Belum', 'Not yet'],
    partner: ['Pasangan', 'Partner'],
    days: ['hari', 'days'],
    editPhoto: ['Ubah foto', 'Change photo'],
    removePhoto: ['Hapus foto', 'Remove photo'],
    uploading: ['Mengunggah…', 'Uploading…'],
    removing: ['Menghapus…', 'Removing…'],
    uploadFailed: [
      'Gagal mengunggah foto. Coba lagi.',
      'Photo upload failed. Try again.',
    ],
    removeFailed: ['Gagal menghapus foto.', 'Could not remove the photo.'],
    tooLarge: ['Ukuran foto maksimal 5MB', 'Photo must be at most 5MB'],
    badType: [
      'Format harus JPG, PNG, WEBP, atau GIF',
      'Photo must be JPG, PNG, WEBP, or GIF',
    ],
  },
  invite: {
    invite: ['Undang', 'Invite'],
    inviteTitle: ['Undang pasangan', 'Invite your partner'],
    inviteAria: [
      'Undang pasangan — salin tautan undangan',
      'Invite your partner — copy the invite link',
    ],
    copied: ['Tautan berhasil disalin', 'Link has been copied'],
    copyFailed: ['Gagal — coba lagi', 'Failed — try again'],
    checking: ['Memeriksa undangan…', 'Checking invitation…'],
    invalidTitle: ['Undangan tidak berlaku', 'Invitation is not valid'],
    invalidLink: [
      'Tautan undangan tidak valid.',
      'This invitation link is not valid.',
    ],
    invalidOrExpired: [
      'Tautan undangan tidak valid atau sudah kadaluarsa.',
      'This invitation link is invalid or has expired.',
    ],
    invalidHint: [
      'Minta tautan baru dari pasanganmu.',
      'Ask your partner for a new link.',
    ],
    invitedYou: ['mengundangmu', 'invited you'],
    acceptDesc: [
      'Terima undangan untuk terhubung sebagai pasangan dan mulai menulis jurnal bersama.',
      'Accept the invitation to connect as partners and start writing your journal together.',
    ],
    decline: ['Tolak', 'Decline'],
    accept: ['Terima', 'Accept'],
    close: ['Tutup', 'Close'],
    closeAria: ['Tutup undangan', 'Close invitation'],
    acceptFailed: ['Gagal menerima undangan.', 'Failed to accept the invitation.'],
  },
  toast: {
    connected: [
      'Berhasil terhubung dengan pasangan',
      'Successfully connected with your partner',
    ],
  },
  fab: {
    ai: ['Konselor AI', 'AI Counselor'],
  },
} as const;

export type HomeCopy = CopyValue<typeof copy>;

/** Resolved home copy for the active language. */
export function useHome(): HomeCopy {
  return useCopy(copy);
}
