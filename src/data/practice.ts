// Practice problems (PRODUCT.md §7.4). Four types: mc, predict, fill, spot.

export interface BaseProblem {
  id: string
  conceptId: string
  prompt: string
  explanation: string
}
export interface McProblem extends BaseProblem {
  type: 'mc'
  choices: string[]
  correct: number
}
export interface PredictProblem extends BaseProblem {
  type: 'predict'
  code: string
  language?: 'python' | 'sql'
  /** With choices, people pick. Without them, people type the output. */
  choices?: string[]
  correct?: number
  answers?: string[]
}
export interface FillProblem extends BaseProblem {
  type: 'fill'
  /** Use ____ for the gap. */
  code: string
  language?: 'python' | 'sql'
  answers: string[]
}
export interface SpotProblem extends BaseProblem {
  type: 'spot'
  lines: string[]
  language?: 'python' | 'sql'
  /** 0-indexed lines that count as the bug. */
  bugLines: number[]
}
export type Problem = McProblem | PredictProblem | FillProblem | SpotProblem

export const PROBLEM_TYPE_LABEL: Record<Problem['type'], string> = {
  mc: 'Multiple choice',
  predict: 'Predict the output',
  fill: 'Fill in the blank',
  spot: 'Spot the bug',
}

export const PROBLEMS: Problem[] = [
  // Dictionaries: .get()
  {
    id: 'get-1', conceptId: 'dictget', type: 'predict',
    prompt: 'What does this print?',
    code: 'stock = {"pens": 4}\nprint(stock.get("ink", 0))',
    choices: ['KeyError', 'None', '0', '4'], correct: 2,
    explanation: '`"ink"` isn\'t in the dictionary, so `.get` returns the default, `0`.',
  },
  {
    id: 'get-2', conceptId: 'dictget', type: 'fill',
    prompt: 'Fill in the method that safely looks up a key.',
    code: 'counts[user] = counts.____(user, 0) + 1',
    answers: ['get'],
    explanation: '`.get(user, 0)` returns the current count, or `0` for a new user.',
  },
  {
    id: 'get-3', conceptId: 'dictget', type: 'spot',
    prompt: 'This almost-right AI code crashes on the first user. Click the buggy line.',
    lines: ['counts = {}', 'for record in records:', '    user = record["user"]', '    counts[user] += 1'],
    bugLines: [3],
    explanation: '`counts[user]` raises a KeyError when the user is new. Use `counts.get(user, 0) + 1`.',
  },
  // dict.items()
  {
    id: 'items-1', conceptId: 'dictitems', type: 'mc',
    prompt: 'What does `{"maya": 3}.items()` give you?',
    choices: ['Just the keys', 'Just the values', 'Key and value pairs', 'A sorted copy'], correct: 2,
    explanation: '`.items()` gives you each key and value together, like `("maya", 3)`.',
  },
  {
    id: 'items-2', conceptId: 'dictitems', type: 'fill',
    prompt: 'Fill in the method so the loop gets both the name and the count.',
    code: 'for name, count in counts.____():\n    print(name, count)',
    answers: ['items'],
    explanation: '`.items()` gives you pairs, and the loop unpacks each one into `name` and `count`.',
  },
  // sorted() with key
  {
    id: 'sorted-1', conceptId: 'sortedkey', type: 'predict',
    prompt: 'What does this print?',
    code: 'words = ["kiwi", "fig", "banana"]\nprint(sorted(words, key=len))',
    choices: ['["banana", "fig", "kiwi"]', '["fig", "kiwi", "banana"]', '["banana", "kiwi", "fig"]', '["kiwi", "fig", "banana"]'], correct: 1,
    explanation: '`key=len` sorts by word length, so the shortest comes first.',
  },
  {
    id: 'sorted-2', conceptId: 'sortedkey', type: 'mc',
    prompt: 'What happens to the original list after you call `sorted(nums)`?',
    choices: ['It gets sorted too', "It doesn't change", 'It gets emptied', 'It raises an error'], correct: 1,
    explanation: '`sorted` returns a new list. `nums.sort()` is the one that changes the original.',
  },
  {
    id: 'sorted-3', conceptId: 'sortedkey', type: 'spot',
    prompt: 'The AI says this returns the highest scores first, but it returns the lowest. Click the buggy line.',
    lines: ['pairs = scores.items()', 'ranked = sorted(pairs, key=lambda p: p[1])', 'return ranked[:3]'],
    bugLines: [1],
    explanation: '`sorted` goes lowest to highest by default. It needs `reverse=True`.',
  },
  // Lambda
  {
    id: 'lambda-1', conceptId: 'lambda', type: 'mc',
    prompt: 'What does `lambda pair: pair[1]` do?',
    choices: ['Sorts a list', 'Returns the second item of a pair', 'Returns the first item of a pair', 'Creates a new pair'], correct: 1,
    explanation: 'It takes `pair` and returns `pair[1]`. Index 1 is the second item.',
  },
  {
    id: 'lambda-2', conceptId: 'lambda', type: 'predict',
    prompt: 'What does this print?',
    code: 'double = lambda x: x * 2\nprint(double(4))',
    answers: ['8'],
    explanation: 'The lambda multiplies its input by 2, and `4 * 2` is `8`.',
  },
  // Boundary
  {
    id: 'boundary-1', conceptId: 'boundary', type: 'mc',
    prompt: 'Which condition counts a book due today as overdue?',
    choices: ['`due < today`', '`due <= today`', '`due > today`', '`due == today + 1`'], correct: 1,
    explanation: '`<=` includes the boundary, so a book due today counts.',
  },
  {
    id: 'boundary-2', conceptId: 'boundary', type: 'spot',
    prompt: 'This loop should print each item, but it crashes at the end. Click the buggy line.',
    lines: ['items = ["a", "b", "c"]', 'for i in range(len(items) + 1):', '    print(items[i])'],
    bugLines: [1],
    explanation: '`range(len(items) + 1)` goes one past the last index. Use `range(len(items))`.',
  },
  {
    id: 'boundary-3', conceptId: 'boundary', type: 'predict',
    prompt: 'What does this print?',
    code: 'score = 90\nprint(score > 90, score >= 90)',
    choices: ['True True', 'False True', 'True False', 'False False'], correct: 1,
    explanation: '`>` leaves out 90 and `>=` includes it.',
  },
  // Slicing
  {
    id: 'slice-1', conceptId: 'slicing', type: 'predict',
    prompt: 'What does this print?',
    code: 'print([5, 4, 3, 2][:2])',
    choices: ['[5, 4]', '[4, 3]', '[3, 2]', '[5, 4, 3]'], correct: 0,
    explanation: '`[:2]` takes the first two items.',
  },
  {
    id: 'slice-2', conceptId: 'slicing', type: 'fill',
    prompt: 'Fill in the slice that takes the first 3 items.',
    code: 'top = ranked[____]',
    answers: [':3', '0:3'],
    explanation: '`ranked[:3]` starts at the beginning and stops before index 3.',
  },
  // For loops
  {
    id: 'for-1', conceptId: 'forloops', type: 'predict',
    prompt: 'What does this print?',
    code: 'total = 0\nfor n in [1, 2, 3]:\n    total += n\nprint(total)',
    answers: ['6'],
    explanation: 'The loop adds 1, then 2, then 3.',
  },
  {
    id: 'for-2', conceptId: 'forloops', type: 'spot',
    prompt: 'This should sum every grade, but the total is wrong. Click the buggy line.',
    lines: ['for grade in grades:', '    total = 0', '    total += grade'],
    bugLines: [1],
    explanation: '`total` resets on every pass. Set it to 0 before the loop starts.',
  },
  // List comprehensions
  {
    id: 'comp-1', conceptId: 'listcomp', type: 'predict',
    prompt: 'What does this print?',
    code: 'print([n * 2 for n in [1, 2, 3] if n > 1])',
    choices: ['[2, 4, 6]', '[4, 6]', '[2, 3]', '[1, 2, 3]'], correct: 1,
    explanation: 'The filter keeps 2 and 3, and each one is doubled.',
  },
  {
    id: 'comp-2', conceptId: 'listcomp', type: 'fill',
    prompt: 'Fill in the keyword that filters the list.',
    code: 'late = [b for b in books ____ b["due"] < today]',
    answers: ['if'],
    explanation: '`if` at the end of a comprehension keeps only the matching items.',
  },
  // Conditionals
  {
    id: 'if-1', conceptId: 'ifelif', type: 'predict',
    prompt: 'What does this print?',
    code: 'pct = 85\nif pct >= 80:\n    print("B")\nelif pct >= 70:\n    print("C")',
    choices: ['B', 'C', 'B and C', 'Nothing'], correct: 0,
    explanation: 'Python stops at the first true condition, so only `B` prints.',
  },
  {
    id: 'bool-1', conceptId: 'boolops', type: 'mc',
    prompt: 'What is `True and False`?',
    choices: ['`True`', '`False`', '`None`', 'An error'], correct: 1,
    explanation: '`and` is only true when both sides are true.',
  },
  // CSV
  {
    id: 'csv-1', conceptId: 'csvread', type: 'mc',
    prompt: 'What does `csv.DictReader` give you for each row?',
    choices: ['A string', 'A list of characters', 'A dictionary keyed by column name', 'A number'], correct: 2,
    explanation: 'It uses the header row as keys, so you can write `row["title"]`.',
  },
  // JOINs
  {
    id: 'join-1', conceptId: 'joins', type: 'spot',
    language: 'sql',
    prompt: 'The AI wrote this to count events per user, but a user with 2 events and 3 orders shows 6. Click the buggy line.',
    lines: ['SELECT u.name, COUNT(*)', 'FROM users u', 'JOIN events e ON u.id = e.user_id', 'JOIN orders o ON u.id = o.user_id', 'GROUP BY u.name;'],
    bugLines: [3],
    explanation: 'Joining a second one-to-many table multiplies the rows: 2 × 3 = 6. Remove the join on `orders`.',
  },
  {
    id: 'join-2', conceptId: 'joins', type: 'mc',
    prompt: 'A user has 3 orders. How many rows does that user get after joining `users` to `orders`?',
    choices: ['1', '2', '3', '6'], correct: 2,
    explanation: 'A JOIN gives one row per match, so 3 orders means 3 rows.',
  },
  // GROUP BY
  {
    id: 'group-1', conceptId: 'groupby', type: 'fill',
    language: 'sql',
    prompt: 'Fill in the clause that gives one row per user.',
    code: 'SELECT user_id, COUNT(*)\nFROM events\n____ user_id;',
    answers: ['group by'],
    explanation: '`GROUP BY` collapses rows into one row per value.',
  },
]

export const problemsFor = (conceptIds: string[], limit = 5, includeSpot = true): Problem[] => {
  // Round-robin across concepts, so a set covers as many of them as it can.
  const pools = conceptIds
    .map((id) => PROBLEMS.filter((p) => p.conceptId === id && (includeSpot || p.type !== 'spot')))
    .filter((pool) => pool.length > 0)
  const out: Problem[] = []
  for (let round = 0; out.length < limit && pools.some((pool) => pool.length > round); round++) {
    for (const pool of pools) {
      if (pool[round] && out.length < limit) out.push(pool[round])
    }
  }
  return out
}
