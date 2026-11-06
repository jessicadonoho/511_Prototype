import type { ChangeId } from './code'

// Comprehension questions (PRODUCT.md §5.5). Choices are written in display order,
// so the correct answer isn't always first.

export interface Question {
  id: string
  text: string
  choices: string[]
  correct: number
  hint: string
  explanation: string
  changeId: ChangeId
  conceptId: string
}

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'The first time `maya` appears, what does `counts.get(user, 0)` return?',
    choices: ['`None`', '`0`', 'A `KeyError`', '`1`'],
    correct: 1,
    hint: "What's the second argument to `.get` for?",
    explanation: '`maya` isn\'t in `counts` yet, so `.get` returns the default, `0`. Then `+ 1` makes it 1.',
    changeId: 1,
    conceptId: 'dictget',
  },
  {
    id: 'q2',
    text: 'Two users both have 2 checkouts. Which one comes first in `ranked`?',
    choices: ['Alphabetical order', 'Random each time', 'Whoever appeared first in `records`', 'Whoever has the later due date'],
    correct: 2,
    hint: 'Does `sorted` reorder items that are tied?',
    explanation: "Python's `sorted` is *stable*: tied items keep their original order. Here that's the order users were first counted.",
    changeId: 1,
    conceptId: 'sortedkey',
  },
  {
    id: 'q3',
    text: 'After this change, is a book due *today* considered overdue?',
    choices: ['No, `<=` means strictly before', 'Yes, because `<=` includes today', 'Only if it\'s after noon', 'It depends on `n`'],
    correct: 1,
    hint: 'What does the `=` in `<=` add?',
    explanation: "The AI changed `<` to `<=`. That's a behavior change you didn't request. Check whether your project spec wants it.",
    changeId: 2,
    conceptId: 'boundary',
  },
]

export const ADDED_TO_NOTEBOOK = ['Dictionaries: .get() with default', 'sorted() with key', 'Boundary conditions']
export const ALL_RIGHT_COPY = "Nice. You'll see fewer questions on these concepts next time."

/** Question card placement. Top makes it easy to notice; bottom lets people read the changes first. */
export const DEFAULT_QUESTION_POSITION: 'top' | 'bottom' = 'top'
