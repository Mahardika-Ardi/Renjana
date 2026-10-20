export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const MOOD_ENUMS = [
  'VERY_BAD',
  'BAD',
  'NEUTRAL',
  'GOOD',
  'VERY_GOOD',
] as const;
export type MoodEnum = (typeof MOOD_ENUMS)[number];

export const MOOD_LEVEL_TO_ENUM: Record<MoodLevel, MoodEnum> = {
  1: 'VERY_BAD',
  2: 'BAD',
  3: 'NEUTRAL',
  4: 'GOOD',
  5: 'VERY_GOOD',
};

export const MOOD_ENUM_TO_LEVEL: Record<MoodEnum, MoodLevel> = {
  VERY_BAD: 1,
  BAD: 2,
  NEUTRAL: 3,
  GOOD: 4,
  VERY_GOOD: 5,
};

export type MoodLabel = readonly [string, string]; // [id, en]

export const MOOD_ITEMS = [
  { level: 1 as MoodLevel, enum: 'VERY_BAD' as MoodEnum, emoji: '😡', label: ['Sangat sedih/marah', 'Very sad/angry'] as MoodLabel },
  { level: 2 as MoodLevel, enum: 'BAD' as MoodEnum, emoji: '😢', label: ['Sedih', 'Sad'] as MoodLabel },
  { level: 3 as MoodLevel, enum: 'NEUTRAL' as MoodEnum, emoji: '😐', label: ['Biasa', 'Neutral'] as MoodLabel },
  { level: 4 as MoodLevel, enum: 'GOOD' as MoodEnum, emoji: '🙂', label: ['Baik', 'Good'] as MoodLabel },
  { level: 5 as MoodLevel, enum: 'VERY_GOOD' as MoodEnum, emoji: '🥰', label: ['Penuh cinta', 'Full of love'] as MoodLabel },
] as const;