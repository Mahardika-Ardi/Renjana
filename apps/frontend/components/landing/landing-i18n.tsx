'use client';

import { useLang, type Lang } from '@/lib/i18n/lang-context';
import { pick } from '@/lib/i18n/pick';

export type LandingLang = Lang;

const copy = {
  nav: {
    how: ['Cara Kerja', 'How It Works'],
    features: ['Fitur', 'Features'],
    privacy: ['Privasi', 'Privacy'],
    signin: ['Masuk', 'Sign In'],
    signup: ['Daftar', 'Sign Up'],
  },
  hero: {
    titleA: ['Ruang tumbuh untuk', 'Room to grow for'],
    titleAccent: ['hubungan berdua.', 'your relationship.'],
    sub: [
      'Renjana adalah jurnal digital untuk pasangan — tulis secara privat, bagikan saat kamu siap, dan rayakan progres bersama. Bukan untuk saat krisis, melainkan untuk merawat hubungan setiap hari.',
      'Renjana is a digital journal for couples — write privately, share when you’re ready, and celebrate progress together. Not for crises, but for tending your relationship every day.',
    ],
    ctaPrimary: ['Mulai Menulis Berdua', 'Start Writing Together'],
    ctaSecondary: ['Lihat Cara Kerja', 'See How It Works'],
    trust: [
      ['Privat secara default', 'Private by default'],
      ['Dibuat untuk berdua', 'Built for two'],
      ['Gratis untuk memulai', 'Free to start'],
    ],
    cardTitle: ['Minggu yang hangat', 'A warm week'],
    cardText: [
      'Tertawa lebih banyak, keberatan lebih sedikit. Minggu ini terasa ringan…',
      'More laughter, fewer frictions. This week felt light…',
    ],
    cardBadge: ['Bersama', 'Shared'],
  },
  steps: {
    eyebrow: ['CARA KERJA', 'HOW IT WORKS'],
    title: ['Mulai dalam tiga langkah', 'Start in three steps'],
    items: [
      {
        title: ['Daftar dalam semenit', 'Sign up in a minute'],
        desc: [
          'Buat akunmu secara gratis — tanpa kartu kredit, tanpa ribet.',
          'Create your free account — no credit card, no fuss.',
        ],
      },
      {
        title: ['Undang pasanganmu', 'Invite your partner'],
        desc: [
          'Kirim tautan undangan. Pasanganmu bergabung dan kalian otomatis terhubung.',
          'Send an invite link. Your partner joins and you’re instantly connected.',
        ],
      },
      {
        title: ['Tulis & bagikan pilihan', 'Write & share by choice'],
        desc: [
          'Jurnalmu tetap privat sampai kamu memilih untuk membagikannya.',
          'Your journal stays private until you choose to share it.',
        ],
      },
    ],
  },
  features: {
    eyebrow: ['FITUR', 'FEATURES'],
    title: [
      'Semua yang kamu butuhkan, tanpa yang tidak',
      'Everything you need, nothing you don’t',
    ],
    items: [
      {
        title: ['Jurnal Privat WYSIWYG', 'Private WYSIWYG Journal'],
        desc: [
          'Editor cantik dengan format otomatis. Fokus menulis, Markdown tersimpan rapi.',
          'A beautiful editor with automatic formatting. Just write — Markdown is saved neatly.',
        ],
      },
      {
        title: ['Privat atau Bersama', 'Private or Shared'],
        desc: [
          'Satu ketukan mengubah jurnal privat menjadi bacaan berdua.',
          'One tap turns a private entry into a shared read.',
        ],
      },
      {
        title: ['Streak Bersama', 'Shared Streak'],
        desc: [
          'Hitung hari kalian bertumbuh bersama — sebagai tim, bukan kompetisi.',
          'Count the days you grow together — as a team, not a competition.',
        ],
      },
      {
        title: ['To-do Bersama', 'Shared To-dos'],
        desc: [
          'Rencana kecil yang tersinkron: belanja, kejutan, mimpi akhir pekan.',
          'Little plans in sync: errands, surprises, weekend dreams.',
        ],
      },
      {
        title: ['AI Refine Emosi', 'AI Emotion Refine'],
        desc: [
          'AI membantu merapikan luapan emosi menjadi kata yang jujur dan baik.',
          'AI helps reshape raw emotions into honest, kind words.',
        ],
      },
      {
        title: ['Export PDF & Markdown', 'PDF & Markdown Export'],
        desc: [
          'Cetak kenangan atau unduh arsipmu kapan saja. Datamu milikmu.',
          'Print memories or download your archive anytime. Your data is yours.',
        ],
      },
    ],
  },
  coming: {
    eyebrow: ['SEGERA HADIR', 'COMING SOON'],
    title: ['Perjalanan berlanjut', 'The journey continues'],
    sub: [
      'Langganan akan membuka lapisan mingguan dan bulanan — ritual yang lebih dalam untuk hubungan yang bertumbuh.',
      'Subscriptions will unlock weekly and monthly layers — deeper rituals for a growing relationship.',
    ],
    badge: ['Segera hadir', 'Coming soon'],
    items: [
      {
        title: ['Ritual Check-in Mingguan', 'Weekly Check-in Ritual'],
        desc: [
          '20–30 menit bersama: review minggu ini, rayakan kemenangan, tentukan fokus.',
          '20–30 minutes together: review the week, celebrate wins, set focus.',
        ],
      },
      {
        title: ['Review AI Emosi', 'AI Emotion Review'],
        desc: [
          'Luapan emosi seminggu disuling AI menjadi bahasa yang jernih sebelum dibagikan.',
          'A week of raw emotion refined by AI into clear language before sharing.',
        ],
      },
      {
        title: ['Rekap Bulanan', 'Monthly Recap'],
        desc: [
          'Tren mood, streak terbaik, dan momen berkesan — dirangkum otomatis.',
          'Mood trends, best streaks, and highlights — summarized automatically.',
        ],
      },
    ],
  },
  privacy: {
    eyebrow: ['PRIVASI', 'PRIVACY'],
    title: ['Privat by default. Selalu.', 'Private by default. Always.'],
    sub: [
      'Kepercayaan adalah fondasi setiap hubungan — begitu juga fondasi Renjana.',
      'Trust is the foundation of every relationship — and of Renjana too.',
    ],
    items: [
      {
        title: ['Jurnalmu milikmu', 'Your journal is yours'],
        desc: [
          'Default privat. Tidak ada yang terbaca pasangan tanpa izinmu.',
          'Private by default. Nothing reaches your partner without your permission.',
        ],
      },
      {
        title: ['Kontrol penuh', 'Full control'],
        desc: [
          'Bagikan atau tarik kembali kapan saja. Ekspor atau hapus datamu kapan saja.',
          'Share or unshare anytime. Export or delete your data anytime.',
        ],
      },
      {
        title: ['Bukan untuk krisis', 'Not for crises'],
        desc: [
          'Renjana untuk pasangan stabil yang ingin bertumbuh — bukan pengganti terapi.',
          'Renjana is for stable couples who want to grow — not a therapy replacement.',
        ],
      },
    ],
  },
  cta: {
    title: ['Siap merawat hubunganmu?', 'Ready to tend your relationship?'],
    sub: [
      'Bergabunglah dengan pasangan yang memilih bertumbuh bersama, satu jurnal dalam satu waktu.',
      'Join couples choosing to grow together, one entry at a time.',
    ],
    button: ['Buat Akun Gratis', 'Create Free Account'],
  },
  footer: {
    tagline: [
      'Jurnal digital untuk pasangan yang bertumbuh bersama.',
      'The digital journal for couples growing together.',
    ],
    product: ['Produk', 'Product'],
    account: ['Akun', 'Account'],
    rights: [
      '© 2026 Renjana. Seluruh hak cipta dilindungi.',
      '© 2026 Renjana. All rights reserved.',
    ],
  },
} as const;

interface TitledDesc {
  title: string;
  desc: string;
}

export interface LandingCopy {
  nav: {
    how: string;
    features: string;
    privacy: string;
    signin: string;
    signup: string;
  };
  hero: {
    eyebrow: string;
    titleA: string;
    titleAccent: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trust: string[];
    cardTitle: string;
    cardText: string;
    cardBadge: string;
  };
  steps: { eyebrow: string; title: string; items: TitledDesc[] };
  features: { eyebrow: string; title: string; items: TitledDesc[] };
  coming: { eyebrow: string; title: string; sub: string; badge: string; items: TitledDesc[] };
  privacy: { eyebrow: string; title: string; sub: string; items: TitledDesc[] };
  cta: { title: string; sub: string; button: string };
  footer: {
    tagline: string;
    product: string;
    account: string;
    rights: string;
  };
}

interface LandingContextValue {
  lang: LandingLang;
  setLang: (lang: LandingLang) => void;
  t: LandingCopy;
}

/* Language state lives in the app-wide LangProvider (root layout) so the
 * landing and every page share one choice; only the copy tree and the
 * resolved `t` are landing-specific. */
export function useLanding(): LandingContextValue {
  const { lang, setLang } = useLang();
  return { lang, setLang, t: pick(copy, lang) as LandingCopy };
}
