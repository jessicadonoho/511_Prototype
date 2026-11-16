// The weekly review (Iteration 2, Theme 6). Assigned by the professor, taken in class.
// Tasks are picked for the student's mastery level, and pasting is turned off.

import type { Level } from './courses'

export interface ReviewTask {
  id: string
  conceptId: string
  /** Mastery levels this task is aimed at. The review picks one task per concept. */
  forLevels: Level[]
  prompt: string
  starter: string
  /** Lowercased substrings that all have to appear for the answer to pass. */
  needs: string[]
  /** Scripted result when every `needs` token is present. */
  passNote: string
  /** Scripted result otherwise. */
  failNote: string
}

export const REVIEW_TASKS: ReviewTask[] = [
  // dictget
  {
    id: 'wr-get-easy',
    conceptId: 'dictget',
    forLevels: [0, 1],
    prompt: 'Write one line that adds 1 to this user’s count, starting a new user at 0.',
    starter: 'counts = {}\nuser = "maya"\n\n# your line here\n',
    needs: ['get(', ', 0)', '+ 1'],
    passNote: 'Runs on an empty dictionary without a KeyError.',
    failNote: 'Raises a KeyError on a user who is not in `counts` yet.',
  },
  {
    id: 'wr-get-hard',
    conceptId: 'dictget',
    forLevels: [2, 3, 4],
    prompt: 'Write a function that returns a dictionary of user → number of checkouts.',
    starter: 'def count_checkouts(records):\n    # your code here\n',
    needs: ['for', 'get(', '+ 1', 'return'],
    passNote: 'Counted all 6 records correctly.',
    failNote: 'The counts came back empty or crashed on a new user.',
  },
  // dictitems
  {
    id: 'wr-items-easy',
    conceptId: 'dictitems',
    forLevels: [0, 1, 2],
    prompt: 'Write a loop that prints each name and count from `counts`.',
    starter: 'counts = {"maya": 3, "sam": 1}\n\n# your loop here\n',
    needs: ['for', 'items()', 'print'],
    passNote: 'Printed both names with their counts.',
    failNote: 'Did not get the name and the count out together.',
  },
  {
    id: 'wr-items-hard',
    conceptId: 'dictitems',
    forLevels: [3, 4],
    prompt: 'Return a list of the names in `counts` that have more than one checkout.',
    starter: 'def repeat_borrowers(counts):\n    # your code here\n',
    needs: ['items()', 'if', '> 1', 'return'],
    passNote: 'Returned exactly the names with 2 or more checkouts.',
    failNote: 'Missed the filter, or lost the names along the way.',
  },
  // sortedkey
  {
    id: 'wr-sorted-easy',
    conceptId: 'sortedkey',
    forLevels: [0, 1],
    prompt: 'Sort these pairs so the highest count comes first.',
    starter: 'pairs = [("maya", 3), ("sam", 1), ("jordan", 2)]\n\nranked = \n',
    needs: ['sorted(', 'key=', 'reverse=true'],
    passNote: 'Ordered maya, jordan, sam.',
    failNote: 'Came out lowest first, or did not sort by the count.',
  },
  {
    id: 'wr-sorted-hard',
    conceptId: 'sortedkey',
    forLevels: [2, 3, 4],
    prompt: 'Write a function that returns the top `n` users by count, highest first.',
    starter: 'def top_n(counts, n=3):\n    # your code here\n',
    needs: ['sorted(', 'items()', 'reverse=true', 'return'],
    passNote: 'Returned the top 3 in the right order.',
    failNote: 'The order or the slice was off.',
  },
  // boundary
  {
    id: 'wr-bound-easy',
    conceptId: 'boundary',
    forLevels: [0, 1],
    prompt: 'Finish the condition so a book due today counts as overdue.',
    starter: 'def is_overdue(due, today):\n    return due ____ today\n',
    needs: ['<='],
    passNote: 'A book due today is flagged.',
    failNote: 'A book due today was treated as on time.',
  },
  {
    id: 'wr-bound-hard',
    conceptId: 'boundary',
    forLevels: [2, 3, 4],
    prompt: 'Return the titles of every record that is overdue, counting books due today.',
    starter: 'def overdue_titles(records, today):\n    # your code here\n',
    needs: ['<=', 'return'],
    passNote: 'Included the book due today.',
    failNote: 'Left out the book that is due today.',
  },
  // forloops
  {
    id: 'wr-for-easy',
    conceptId: 'forloops',
    forLevels: [0, 1, 2],
    prompt: 'Sum the numbers in `grades` and store the result in `total`.',
    starter: 'grades = [88, 92, 79]\n\n# your code here\n',
    needs: ['total', 'for', '+'],
    passNote: 'Totalled 259.',
    failNote: 'The running total was reset or never added to.',
  },
  {
    id: 'wr-for-hard',
    conceptId: 'forloops',
    forLevels: [3, 4],
    prompt: 'Return the average of a list of grades.',
    starter: 'def average(grades):\n    # your code here\n',
    needs: ['for', '/', 'len(', 'return'],
    passNote: 'Returned the right average.',
    failNote: 'Divided by the wrong thing, or never divided.',
  },
  // listcomp
  {
    id: 'wr-comp-easy',
    conceptId: 'listcomp',
    forLevels: [0, 1, 2],
    prompt: 'Use a comprehension to double every number in `nums`.',
    starter: 'nums = [1, 2, 3]\n\ndoubled = \n',
    needs: ['for', '* 2'],
    passNote: 'Returned [2, 4, 6].',
    failNote: 'Did not double every item.',
  },
  {
    id: 'wr-comp-hard',
    conceptId: 'listcomp',
    forLevels: [3, 4],
    prompt: 'Use one comprehension to get the titles of records due on or before `today`.',
    starter: 'def due_titles(records, today):\n    return \n',
    needs: ['for', 'if', '<=', 'title'],
    passNote: 'Filtered and pulled the titles in one line.',
    failNote: 'The filter or the boundary was wrong.',
  },
]

/** One task per concept, chosen for the student's current level. */
export function tasksForMastery(conceptIds: string[], mastery: Record<string, Level>): ReviewTask[] {
  const out: ReviewTask[] = []
  conceptIds.forEach((id) => {
    const level = (mastery[id] ?? 0) as Level
    const task = REVIEW_TASKS.find((t) => t.conceptId === id && t.forLevels.includes(level))
    if (task) out.push(task)
  })
  return out
}

export const WEEKLY_REVIEW = {
  id: 'wr-week-6',
  title: 'Weekly review · Week 6',
  assignedBy: 'Prof. Rivera',
  when: 'In class, Fri Nov 6',
  minutes: 20,
  /** The concepts the professor put on this week's review. */
  conceptIds: ['dictget', 'dictitems', 'sortedkey', 'boundary', 'forloops'],
  pasteNotice: 'Pasting is turned off for this review. Type your answers out.',
  intro:
    'Prof. Rivera assigned this review for the whole class. The questions are picked for where you are on each concept, so yours will not match the person next to you.',
}

// ---------- Professor-facing aggregate (mock) ----------

export interface ClassConceptRow {
  conceptId: string
  /** Share of the class at Familiar or above, as a percentage. */
  familiar: number
  /** Students who got this week's review task wrong. */
  missed: number
  /** Students whose submissions were flagged as AI-written and unexplained. */
  flagged: number
}

export const CLASS_SIZE = 28

export const CLASS_ROWS: ClassConceptRow[] = [
  { conceptId: 'dictget', familiar: 39, missed: 17, flagged: 6 },
  { conceptId: 'sortedkey', familiar: 43, missed: 15, flagged: 5 },
  { conceptId: 'boundary', familiar: 54, missed: 12, flagged: 1 },
  { conceptId: 'dictitems', familiar: 61, missed: 10, flagged: 2 },
  { conceptId: 'forloops', familiar: 86, missed: 4, flagged: 0 },
]

export const CLASS_NOTE =
  'Two thirds of the class is still below Familiar on `.get` with a default, and it is the concept most often reached for with AI help. Worth re-teaching before the midterm.'
