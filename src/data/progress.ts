// Progress seed data (PRODUCT.md §5.7, §7.7).

export const WEEKLY_PROGRESS = [
  { week: 'Sep 28', familiar: 3, accuracy: 58 },
  { week: 'Oct 5', familiar: 4, accuracy: 61 },
  { week: 'Oct 12', familiar: 6, accuracy: 70 },
  { week: 'Oct 19', familiar: 6, accuracy: 68 },
  { week: 'Oct 26', familiar: 8, accuracy: 76 },
]

export const SEED_STREAK = 6
export const SEED_QUESTIONS = 142
/** 108 of 142 is 76%, matching the latest weekly accuracy. */
export const SEED_CORRECT = 108

/** Questions answered per day for the last 6 weeks, oldest first. The last entry is today. */
export const ACTIVITY: number[] = [
  0, 2, 0, 4, 3, 0, 0,
  3, 0, 5, 2, 0, 4, 0,
  0, 6, 3, 0, 4, 2, 0,
  2, 5, 0, 3, 0, 6, 1,
  0, 4, 2, 3, 0, 5, 0,
  0, 3, 4, 5, 2, 6, 3,
]

export const MIDTERM_LABEL = 'CS 120 Midterm'
export const MIDTERM_DAYS = 9
