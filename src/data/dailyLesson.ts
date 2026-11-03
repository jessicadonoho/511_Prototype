import type { Problem } from './practice'

// Today's Lesson (PRODUCT.md §7.6). The selection is fixed for the prototype.

export const LESSON_DUE_CONCEPTS = ['dictget', 'sortedkey', 'boundary']

export const DAILY_LESSON: Problem[] = [
  {
    id: 'daily-1', conceptId: 'dictget', type: 'predict',
    prompt: 'What does this print?',
    code: 'print({"a": 1}.get("b", 5))',
    answers: ['5'],
    explanation: '`"b"` is missing, so `.get` returns the default, `5`.',
  },
  {
    id: 'daily-2', conceptId: 'sortedkey', type: 'fill',
    prompt: 'Fill in the argument that sorts from highest to lowest.',
    code: 'sorted(scores.items(), key=lambda p: p[1], ____=True)',
    answers: ['reverse'],
    explanation: '`reverse=True` flips the order, so the highest comes first.',
  },
  {
    id: 'daily-3', conceptId: 'boundary', type: 'mc',
    prompt: 'Which condition counts a book due today as overdue?',
    choices: ['`due < today`', '`due <= today`', '`due > today`', '`due == tomorrow`'],
    correct: 1,
    explanation: '`<=` includes today. `<` only counts days before today.',
  },
  {
    id: 'daily-4', conceptId: 'joins', type: 'spot',
    language: 'sql',
    prompt: 'Why are the counts too high? Click the line that causes it.',
    lines: [
      'SELECT u.name, COUNT(*)',
      'FROM users u',
      'JOIN events e ON u.id = e.user_id',
      'JOIN orders o ON u.id = o.user_id',
      'GROUP BY u.name;',
    ],
    bugLines: [3],
    explanation: 'Joining two one-to-many tables multiplies rows. 2 events × 3 orders gives 6 rows for that user.',
  },
  {
    id: 'daily-5', conceptId: 'sortedkey', type: 'predict',
    prompt: 'What does this print?',
    code: 'print(sorted([3, 1, 2], reverse=True)[:2])',
    choices: ['[1, 2]', '[3, 2]', '[3, 1]', '[2, 3]'],
    correct: 1,
    explanation: 'Sorted from highest to lowest, the list is `[3, 2, 1]`. `[:2]` keeps the first two.',
  },
]

export const COME_BACK_COPY = 'Come back tomorrow: 2 concepts due.'
