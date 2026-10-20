'use client';

import { useCopy } from '@/lib/i18n/lang-context';
import type { CopyValue } from '@/lib/i18n/pick';

/* Bilingual copy for the AI counselor page. [indonesian, english] pairs —
 * same convention as the home copy tree. */
const copy = {
  header: {
    title: ['Konselor AI', 'AI Counselor'],
    subtitle: ['Cerita hati, dipahami dengan tenang.', 'Heartfelt stories, calmly understood.'],
    newChat: ['Obrolan Baru', 'New Chat'],
    back: ['Kembali', 'Back'],
  },
  sidebar: {
    history: ['Riwayat', 'History'],
    empty: ['Belum ada riwayat.', 'No history yet.'],
    loading: ['Memuat riwayat…', 'Loading history…'],
    delete: ['Hapus', 'Delete'],
    deleteAria: ['Hapus sesi ini', 'Delete this session'],
    confirm: ['Hapus?', 'Delete?'],
    yes: ['Ya', 'Yes'],
    cancel: ['Batal', 'Cancel'],
    deleteFailed: ['Gagal menghapus sesi.', 'Could not delete the session.'],
  },
  welcome: {
    title: ['Hai, aku di sini untuk mendengarkan', 'Hi, I’m here to listen'],
    desc: [
      'Ceritakan apa yang kamu rasakan tentang hubunganmu. Semua obrolan bersifat pribadi.',
      'Tell me what’s on your mind about your relationship. Every conversation is private.',
    ],
    examplesLabel: ['Mulai dari:', 'Start with:'],
  },
  examples: {
    distant: [
      'Pasanganku mendadak cuek hari ini, kenapa ya?',
      'My partner has been acting distant today, why?',
    ],
    annoyed: [
      'Aku kesal tapi nggak tahu cara ngomong dengan baik',
      'I’m annoyed but don’t know how to say it nicely',
    ],
    fighting: [
      'Kami sering bertengkar soal hal kecil',
      'We keep fighting over small things',
    ],
  },
  chat: {
    placeholder: ['Tulis pesan untuk konselor…', 'Write a message to the counselor…'],
    send: ['Kirim', 'Send'],
    sendAria: ['Kirim pesan', 'Send message'],
    typing: ['Konselor sedang mengetik…', 'Counselor is typing…'],
    you: ['Kamu', 'You'],
    counselor: ['Konselor', 'Counselor'],
    loadingChat: ['Memuat percakapan…', 'Loading conversation…'],
    sendFailed: ['Pesan gagal dikirim. Coba lagi.', 'Message failed to send. Try again.'],
    chatFailed: ['Gagal memuat percakapan. Coba lagi.', 'Could not load the conversation.'],
    charOf: ['/2000', '/2000'],
  },
  errors: {
    listFailed: ['Gagal memuat riwayat. Coba lagi.', 'Failed to load history. Try again.'],
    retry: ['Coba Lagi', 'Try Again'],
  },
} as const;

export type ConsultationCopy = CopyValue<typeof copy>;

/** Resolved consultation copy for the active language. */
export function useConsultation(): ConsultationCopy {
  return useCopy(copy);
}
