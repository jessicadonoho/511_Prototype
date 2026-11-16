// Lecture notes, the notebook's primary content (Iteration 2, Theme 1).
// Notes are organized by lecture. Each section can teach one concept, which is what
// the practice panel keys off when a student opens that lecture.

export interface NoteBlock {
  kind: 'prose' | 'code' | 'callout' | 'output'
  text?: string
  code?: string
  language?: 'python' | 'sql' | 'text'
  /** Callouts only. */
  tone?: 'tip' | 'watch'
}

export interface LectureSection {
  id: string
  heading: string
  /** The concept this section teaches. Drives the practice panel. */
  conceptId?: string
  blocks: NoteBlock[]
}

export interface LectureNotes {
  itemId: string
  date: string
  professor: string
  /** One line under the title. */
  summary: string
  sections: LectureSection[]
  /** The in-class assignment that follows the lecture, if any. */
  assignmentId?: string
}

export const PROFESSOR = 'Prof. Rivera'
export const CLASS_CODE = 'CS120-F26'

export const LECTURES: LectureNotes[] = [
  {
    itemId: 'cs120-l4',
    date: 'Oct 19',
    professor: PROFESSOR,
    summary: 'Making code take different paths, and getting the edges right.',
    sections: [
      {
        id: 'l4-s1',
        heading: 'Choosing a path with if / elif / else',
        conceptId: 'ifelif',
        blocks: [
          { kind: 'prose', text: 'A program often needs to do different things depending on its data. `if` runs a block only when its condition is true.' },
          { kind: 'code', code: 'pct = 85\n\nif pct >= 90:\n    print("A")\nelif pct >= 80:\n    print("B")\nelse:\n    print("C or below")' },
          { kind: 'prose', text: 'Python checks the conditions from the top and **stops at the first one that is true**. Above, `pct >= 90` is false and `pct >= 80` is true, so only `B` prints. The `else` block runs when nothing above it matched.' },
          { kind: 'callout', tone: 'watch', text: 'Order matters. If you put `pct >= 80` first, every score of 90 or more would also print `B`, because Python would never reach the `A` branch.' },
        ],
      },
      {
        id: 'l4-s2',
        heading: 'Combining conditions with and / or / not',
        conceptId: 'boolops',
        blocks: [
          { kind: 'prose', text: 'Conditions can be joined into one. `and` is true only when both sides are true. `or` is true when at least one side is. `not` flips a value.' },
          { kind: 'code', code: 'print(True and False)   # False\nprint(True or False)    # True\nprint(not True)         # False' },
          { kind: 'prose', text: 'This is how you express a rule with two parts, like "checked out and not yet returned".' },
          { kind: 'code', code: 'if record["out"] and not record["returned"]:\n    print("still out")' },
        ],
      },
      {
        id: 'l4-s3',
        heading: 'Boundary conditions: < versus <=',
        conceptId: 'boundary',
        blocks: [
          { kind: 'prose', text: 'A **boundary** is the exact value where a rule flips. `<` leaves the boundary out; `<=` includes it.' },
          { kind: 'code', code: 'score = 90\nprint(score > 90)    # False\nprint(score >= 90)   # True' },
          { kind: 'prose', text: 'One character decides whether a score of exactly 90 counts. The same choice decides whether a book due *today* is overdue.' },
          { kind: 'callout', tone: 'watch', text: 'Most off-by-one bugs live on a boundary. When you write a comparison, always ask yourself what happens at the exact value.' },
        ],
      },
    ],
  },
  {
    itemId: 'cs120-l5',
    date: 'Oct 23',
    professor: PROFESSOR,
    summary: 'Doing something to every item in a sequence.',
    sections: [
      {
        id: 'l5-s1',
        heading: 'for loops',
        conceptId: 'forloops',
        blocks: [
          { kind: 'prose', text: 'A `for` loop runs its block once for each item in a sequence. The loop variable holds the current item.' },
          { kind: 'code', code: 'total = 0\nfor n in [1, 2, 3]:\n    total += n\nprint(total)' },
          { kind: 'output', code: '6', language: 'text' },
          { kind: 'callout', tone: 'watch', text: 'Set up your accumulator *before* the loop. If `total = 0` is inside the loop, it resets on every pass and you end up with only the last item.' },
        ],
      },
      {
        id: 'l5-s2',
        heading: 'List comprehensions',
        conceptId: 'listcomp',
        blocks: [
          { kind: 'prose', text: 'A comprehension builds a new list from an existing sequence in one line. The optional `if` at the end filters.' },
          { kind: 'code', code: 'nums = [1, 2, 3]\nprint([n * 2 for n in nums])            # [2, 4, 6]\nprint([n * 2 for n in nums if n > 1])   # [4, 6]' },
          { kind: 'prose', text: 'Read it left to right as "give me `n * 2`, for each `n` in `nums`, when `n > 1`".' },
        ],
      },
      {
        id: 'l5-s3',
        heading: 'Slicing',
        conceptId: 'slicing',
        blocks: [
          { kind: 'prose', text: '`items[start:stop]` copies part of a list. The slice stops *before* `stop`, and leaving out `start` means "from the beginning".' },
          { kind: 'code', code: 'ranked = [5, 4, 3, 2]\nprint(ranked[:2])    # [5, 4]\nprint(ranked[1:3])   # [4, 3]' },
          { kind: 'callout', tone: 'tip', text: '`ranked[:3]` is the usual way to take a top 3 after sorting.' },
        ],
      },
    ],
  },
  {
    itemId: 'cs120-l6',
    date: 'Nov 2',
    professor: PROFESSOR,
    summary: 'Storing values under a label, and counting things.',
    assignmentId: 'inclass6',
    sections: [
      {
        id: 'l6-s1',
        heading: 'What a dictionary is',
        blocks: [
          { kind: 'prose', text: 'A list finds things by position. A **dictionary** finds things by a label, called a *key*. Each key maps to one value.' },
          { kind: 'code', code: 'stock = {"pens": 4, "ink": 2}\nprint(stock["pens"])   # 4' },
          { kind: 'prose', text: 'Keys are usually strings. Use a dictionary whenever "by name" is a more natural question than "by position".' },
        ],
      },
      {
        id: 'l6-s2',
        heading: 'Looking up a key safely with .get()',
        conceptId: 'dictget',
        blocks: [
          { kind: 'prose', text: 'Square brackets raise a `KeyError` if the key is missing. `d.get(key, default)` returns the default instead, so your program keeps running.' },
          { kind: 'code', code: 'stock = {"pens": 4}\n\nprint(stock.get("pens", 0))   # 4\nprint(stock.get("ink", 0))    # 0\nprint(stock["ink"])           # KeyError' },
          { kind: 'callout', tone: 'tip', text: 'Read `.get` as asking politely: "do you have this key? If not, give me this backup value instead."' },
        ],
      },
      {
        id: 'l6-s3',
        heading: 'Counting with a dictionary',
        conceptId: 'dictget',
        blocks: [
          { kind: 'prose', text: 'Counting is the most common use of `.get`. The dictionary is a tally sheet, and each key gets a row the first time it appears.' },
          { kind: 'code', code: 'counts = {}\nfor record in records:\n    user = record["user"]\n    counts[user] = counts.get(user, 0) + 1' },
          { kind: 'prose', text: 'On the first sight of `maya`, `counts.get("maya", 0)` returns `0`, so `0 + 1` stores `1`. The next time it returns `1`, so it stores `2`.' },
          { kind: 'callout', tone: 'watch', text: 'Writing `counts[user] += 1` instead crashes on the first record for each user, because there is nothing there yet to add to.' },
        ],
      },
      {
        id: 'l6-s4',
        heading: 'Looping over keys and values with .items()',
        conceptId: 'dictitems',
        blocks: [
          { kind: 'prose', text: '`.items()` gives you each key and value together as a pair, so the two stay joined while you loop or sort.' },
          { kind: 'code', code: 'counts = {"maya": 3, "sam": 1}\n\nfor name, count in counts.items():\n    print(name, count)' },
          { kind: 'output', code: 'maya 3\nsam 1', language: 'text' },
          { kind: 'prose', text: 'The loop unpacks each pair into two variables. Next lecture we sort these pairs to find the top borrowers.' },
        ],
      },
    ],
  },
  {
    itemId: 'cs120-l7',
    date: 'Nov 6',
    professor: PROFESSOR,
    summary: 'Putting things in order, and tiny one-line functions.',
    sections: [
      {
        id: 'l7-s1',
        heading: 'sorted() with a key',
        conceptId: 'sortedkey',
        blocks: [
          { kind: 'prose', text: '`sorted(items)` returns a **new** sorted list and leaves the original alone. `key=` says what to sort by, and `reverse=True` flips the order.' },
          { kind: 'code', code: 'words = ["kiwi", "fig", "banana"]\nprint(sorted(words, key=len))   # [\'fig\', \'kiwi\', \'banana\']' },
          { kind: 'callout', tone: 'tip', text: '`sorted` is stable: items that tie keep the order they were already in.' },
        ],
      },
      {
        id: 'l7-s2',
        heading: 'Lambda functions',
        conceptId: 'lambda',
        blocks: [
          { kind: 'prose', text: 'A `lambda` is a small unnamed function written inline. It is handy when a function is only needed once, such as the `key` for `sorted`.' },
          { kind: 'code', code: 'pairs = [("maya", 3), ("sam", 1)]\nranked = sorted(pairs, key=lambda pair: pair[1], reverse=True)' },
          { kind: 'prose', text: '`lambda pair: pair[1]` means "given a pair, return its second item" — here, the count. It is the same as writing a two-line named function.' },
        ],
      },
    ],
  },
]

export const lectureFor = (itemId: string) => LECTURES.find((l) => l.itemId === itemId)

/** Today's lecture: where a student starts the prototype flow. */
export const TODAY_LECTURE_ID = 'cs120-l6'

/** Concepts a lecture's notes actually teach, in note order, without repeats. */
export function conceptsTaught(itemId: string): string[] {
  const notes = lectureFor(itemId)
  if (!notes) return []
  const out: string[] = []
  notes.sections.forEach((s) => {
    if (s.conceptId && !out.includes(s.conceptId)) out.push(s.conceptId)
  })
  return out
}
