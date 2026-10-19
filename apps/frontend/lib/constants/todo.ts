import type { TodoCategory } from '@renjana/types';
import type { Lang } from '@/lib/i18n/pick';

/* Display labels from docs/style-refrence/todo.html mapped to the API enum.
 * Single source of truth for label <-> category conversion. */

export interface TodoCategoryOption {
  value: TodoCategory;
  /** Indonesian hashtag (original design reference). */
  label: string;
  /** English hashtag for the EN locale. */
  labelEn: string;
  pillClass: string;
}

export const TODO_CATEGORY_OPTIONS: TodoCategoryOption[] = [
  {
    value: 'PLANS',
    label: '#Kencan',
    labelEn: '#Dates',
    pillClass: 'bg-[#f1ece5] text-[#615f4b]',
  },
  {
    value: 'HOME',
    label: '#Rumah',
    labelEn: '#Home',
    pillClass: 'bg-[#f1ece5] text-[#615f4b]',
  },
  {
    value: 'SOCIAL',
    label: '#Spesial',
    labelEn: '#Special',
    pillClass: 'bg-[#fbe7d5] text-[#623f18]',
  },
  {
    value: 'FINANCES',
    label: '#Impian',
    labelEn: '#Dreams',
    pillClass: 'bg-[#eef0d8] text-[#45492d]',
  },
  {
    value: 'ERRANDS',
    label: '#Santai',
    labelEn: '#Errands',
    pillClass: 'bg-[#f1ece5] text-[#615f4b]',
  },
  {
    value: 'OTHER',
    label: '#Lainnya',
    labelEn: '#Other',
    pillClass: 'bg-[#f1ece5] text-[#615f4b]',
  },
];

export function categoryLabelOf(
  category: TodoCategory,
  lang: Lang = 'id',
): string {
  const option = TODO_CATEGORY_OPTIONS.find(
    (candidate) => candidate.value === category,
  );
  return (lang === 'en' ? option?.labelEn : option?.label) ?? '#Lainnya';
}

export function categoryPillOf(category: TodoCategory): string {
  return (
    TODO_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.pillClass ?? 'bg-[#f1ece5] text-[#615f4b]'
  );
}

/* Shelf grouping: backend enum -> bookshelf section titles. */
export function categoryShelfOf(category: TodoCategory): string {
  switch (category) {
    case 'PLANS':
    case 'SOCIAL':
      return 'Kencan & Waktu Bersama';
    case 'HOME':
    case 'ERRANDS':
    case 'FINANCES':
    case 'OTHER':
    default:
      return 'Rutinitas & Kebutuhan Harian';
  }
}

export const TODO_SHELVES = [
  'Kencan & Waktu Bersama',
  'Rutinitas & Kebutuhan Harian',
] as const;
