import type { TodoCategory } from '@renjana/types';

/* Display labels from docs/style-refrence/todo.html mapped to the API enum.
 * Single source of truth for label <-> category conversion. */

export interface TodoCategoryOption {
  value: TodoCategory;
  label: string;
  pillClass: string;
}

export const TODO_CATEGORY_OPTIONS: TodoCategoryOption[] = [
  {
    value: 'PLANS',
    label: '#Kencan',
    pillClass: 'bg-[#f1ece5] text-[#615f4b]',
  },
  {
    value: 'HOME',
    label: '#Rumah',
    pillClass: 'bg-[#f1ece5] text-[#615f4b]',
  },
  {
    value: 'SOCIAL',
    label: '#Spesial',
    pillClass: 'bg-[#fbe7d5] text-[#623f18]',
  },
  {
    value: 'FINANCES',
    label: '#Impian',
    pillClass: 'bg-[#eef0d8] text-[#45492d]',
  },
  {
    value: 'ERRANDS',
    label: '#Santai',
    pillClass: 'bg-[#f1ece5] text-[#615f4b]',
  },
  {
    value: 'OTHER',
    label: '#Lainnya',
    pillClass: 'bg-[#f1ece5] text-[#615f4b]',
  },
];

export function categoryLabelOf(category: TodoCategory): string {
  return (
    TODO_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ??
    '#Lainnya'
  );
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
