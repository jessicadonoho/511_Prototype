// Courses, lectures, projects and concepts (PRODUCT.md §5.7).

export const LEVELS = ['New', 'Learning', 'Familiar', 'Proficient', 'Mastered'] as const
export type Level = 0 | 1 | 2 | 3 | 4

/** The prototype's fixed "today", so every participant sees the same dates. */
export const TODAY = new Date(2026, 10, 2)
export const TODAY_LABEL = 'Nov 2'
export const MIDTERM_DATE = '2026-11-11'

export interface CourseItem {
  id: string
  kind: 'lecture' | 'project'
  code: string
  title: string
  current?: boolean
  /** Exam prep pre-checks items covered before the exam. */
  beforeExam?: boolean
}

export interface Course {
  id: string
  code: string
  name: string
  items: CourseItem[]
}

export const COURSES: Course[] = [
  {
    id: 'cs120',
    code: 'CS 120',
    name: 'Intro to Programming (Python)',
    items: [
      { id: 'cs120-l4', kind: 'lecture', code: 'L4', title: 'Conditionals & Booleans', beforeExam: true },
      { id: 'cs120-l5', kind: 'lecture', code: 'L5', title: 'Lists & Loops', beforeExam: true },
      { id: 'cs120-l6', kind: 'lecture', code: 'L6', title: 'Dictionaries', beforeExam: true },
      { id: 'cs120-l7', kind: 'lecture', code: 'L7', title: 'Sorting & Lambdas', beforeExam: true },
      { id: 'cs120-l8', kind: 'lecture', code: 'L8', title: 'Files & CSV' },
      { id: 'cs120-p1', kind: 'project', code: 'Project 1', title: 'Grade Calculator', beforeExam: true },
      { id: 'cs120-p2', kind: 'project', code: 'Project 2', title: 'Library Checkout Tracker', current: true, beforeExam: true },
    ],
  },
  {
    id: 'cs240',
    code: 'CS 240',
    name: 'Databases',
    items: [
      { id: 'cs240-l3', kind: 'lecture', code: 'L3', title: 'SELECT & WHERE', beforeExam: true },
      { id: 'cs240-l4', kind: 'lecture', code: 'L4', title: 'JOINs', beforeExam: true },
      { id: 'cs240-l5', kind: 'lecture', code: 'L5', title: 'GROUP BY & Aggregates', beforeExam: true },
      { id: 'cs240-p1', kind: 'project', code: 'Lab 2', title: 'Event Analytics', beforeExam: true },
    ],
  },
]

export const courseById = (id: string) => COURSES.find((c) => c.id === id)
export function findItem(itemId: string) {
  for (const course of COURSES) {
    const item = course.items.find((i) => i.id === itemId)
    if (item) return { course, item }
  }
  return null
}

export interface Concept {
  id: string
  name: string
  courseId: string
  /** The lecture this concept belongs to. */
  itemId: string
  /** Project items that also use this concept. */
  alsoIn?: string[]
  start: Level
  /** Weekly mastery levels for the sparkline, oldest first (excludes today). */
  history: Level[]
  lastPracticed: string
  /** Sort key: days since last practice. */
  daysSince: number
  summary: string
  related: string[]
  /** Hidden until today's AI session adds it. */
  addedToday?: boolean
}

export const CONCEPTS: Concept[] = [
  {
    id: 'ifelif', name: 'if / elif / else', courseId: 'cs120', itemId: 'cs120-l4', alsoIn: ['cs120-p1'],
    start: 4, history: [3, 3, 4, 4, 4], lastPracticed: 'Oct 12', daysSince: 21,
    summary: 'Runs different code depending on which condition is true. Python checks from the top and stops at the first match.',
    related: ['boolops', 'boundary'],
  },
  {
    id: 'boolops', name: 'Boolean operators', courseId: 'cs120', itemId: 'cs120-l4',
    start: 2, history: [1, 1, 1, 2, 2], lastPracticed: 'Oct 20', daysSince: 13,
    summary: '`and`, `or` and `not` combine true/false values into one condition.',
    related: ['ifelif', 'boundary'],
  },
  {
    id: 'boundary', name: 'Boundary conditions (< vs <=)', courseId: 'cs120', itemId: 'cs120-l4', alsoIn: ['cs120-p2'],
    start: 1, history: [0, 1, 1, 1, 1], lastPracticed: 'Oct 26', daysSince: 7,
    summary: 'A boundary is the exact value where a rule flips. `<` leaves the boundary out and `<=` includes it. Off-by-one bugs usually live here.',
    related: ['ifelif', 'forloops'],
  },
  {
    id: 'forloops', name: 'for loops', courseId: 'cs120', itemId: 'cs120-l5', alsoIn: ['cs120-p1', 'cs120-p2'],
    start: 3, history: [2, 2, 3, 3, 3], lastPracticed: 'Oct 28', daysSince: 5,
    summary: 'Repeats a block of code once for each item in a sequence.',
    related: ['listcomp', 'dictitems'],
  },
  {
    id: 'listcomp', name: 'List comprehensions', courseId: 'cs120', itemId: 'cs120-l5', alsoIn: ['cs120-p2'],
    start: 2, history: [1, 2, 2, 2, 2], lastPracticed: 'Oct 29', daysSince: 4,
    summary: 'A one-line way to build a list from another sequence, with an optional filter.',
    related: ['forloops', 'slicing'],
  },
  {
    id: 'slicing', name: 'Slicing', courseId: 'cs120', itemId: 'cs120-l5',
    start: 3, history: [2, 3, 3, 3, 3], lastPracticed: 'Oct 22', daysSince: 11,
    summary: '`items[start:stop]` copies part of a list. Leave out `start` to begin at the first item.',
    related: ['listcomp', 'sortedkey'],
  },
  {
    id: 'dictget', name: 'Dictionaries: .get() with default', courseId: 'cs120', itemId: 'cs120-l6', alsoIn: ['cs120-p2'],
    start: 1, history: [0, 0, 1, 1, 1], lastPracticed: 'Oct 24', daysSince: 9,
    summary: '`d.get(key, default)` looks up a key safely. If the key is missing, you get the default instead of a KeyError.',
    related: ['dictitems', 'forloops'],
  },
  {
    id: 'dictitems', name: 'dict.items()', courseId: 'cs120', itemId: 'cs120-l6', alsoIn: ['cs120-p2'],
    start: 2, history: [1, 1, 1, 2, 2], lastPracticed: 'Oct 27', daysSince: 6,
    summary: 'Gives you each key and value as a pair, so you can loop over or sort both together.',
    related: ['dictget', 'sortedkey'],
  },
  {
    id: 'sortedkey', name: 'sorted() with key', courseId: 'cs120', itemId: 'cs120-l7', alsoIn: ['cs120-p2'],
    start: 1, history: [0, 0, 0, 1, 1], lastPracticed: 'Oct 30', daysSince: 3,
    summary: '`sorted(items, key=fn)` returns a new list ordered by whatever `fn` returns for each item.',
    related: ['lambda', 'dictitems'],
  },
  {
    id: 'lambda', name: 'Lambda functions', courseId: 'cs120', itemId: 'cs120-l7', alsoIn: ['cs120-p2'],
    start: 0, history: [], lastPracticed: 'Today', daysSince: 0, addedToday: true,
    summary: 'A tiny unnamed function written inline. Handy when a function is only needed once, like the `key` for `sorted`.',
    related: ['sortedkey'],
  },
  {
    id: 'csvread', name: 'Reading CSV files', courseId: 'cs120', itemId: 'cs120-l8',
    start: 2, history: [0, 1, 1, 1, 2], lastPracticed: 'Oct 31', daysSince: 2,
    summary: "Python's `csv` module turns each row of a file into a list or dictionary.",
    related: ['forloops', 'dictget'],
  },
  {
    id: 'joins', name: 'JOINs can duplicate rows', courseId: 'cs240', itemId: 'cs240-l4', alsoIn: ['cs240-p1'],
    start: 1, history: [0, 0, 1, 1, 1], lastPracticed: 'Oct 25', daysSince: 8,
    summary: 'When one row matches many rows in the joined table, it appears once per match. Two one-to-many joins multiply the rows.',
    related: ['groupby'],
  },
  {
    id: 'groupby', name: 'GROUP BY', courseId: 'cs240', itemId: 'cs240-l5', alsoIn: ['cs240-p1'],
    start: 2, history: [1, 1, 1, 2, 2], lastPracticed: 'Oct 25', daysSince: 8,
    summary: 'Collapses rows that share a value into one row per group, so you can count or sum each group.',
    related: ['joins'],
  },
]

export const conceptById = (id: string) => CONCEPTS.find((c) => c.id === id)

export const conceptsForItem = (itemId: string) =>
  CONCEPTS.filter((c) => c.itemId === itemId || c.alsoIn?.includes(itemId))

export const SEED_MASTERY: Record<string, Level> = Object.fromEntries(
  CONCEPTS.filter((c) => !c.addedToday).map((c) => [c.id, c.start]),
)

/** Starting "Continue studying" pages. */
export const SEED_RECENT = ['/course/cs120/item/cs120-l7', '/course/cs120/item/cs120-l6', '/course/cs120/item/cs120-p2']
