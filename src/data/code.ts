// Workspace files and the scripted AI change (PRODUCT.md §5.1–5.3).

export type ChangeId = 1 | 2 | 3
export type Decision = 'accepted' | 'reverted' | null
export type Decisions = Record<ChangeId, Decision>

export interface LineRange {
  start: number
  end: number
  /** False when the change was reverted: `start` is only an anchor for its label. */
  present: boolean
}

const HEADER = `# library.py — CS 120 Project 2: Library Checkout Tracker
from datetime import date

checkouts = [
    {"user": "maya",  "title": "Dune",               "due": date(2026, 11, 10)},
    {"user": "jordan","title": "Beloved",            "due": date(2026, 11, 2)},
    {"user": "maya",  "title": "Kindred",            "due": date(2026, 10, 28)},
    {"user": "sam",   "title": "The Hobbit",         "due": date(2026, 11, 15)},
    {"user": "jordan","title": "Neuromancer",        "due": date(2026, 11, 1)},
    {"user": "maya",  "title": "Parable of the Sower","due": date(2026, 11, 20)},
]


def overdue_books(records, today):
    """Return titles that are past their due date."""`.split('\n')

const RETURN_OLD = `    return [r["title"] for r in records if r["due"] < today]`
const RETURN_NEW = `    return [r["title"] for r in records if r["due"] <= today]`

const TOP_BORROWERS = `def top_borrowers(records, n=3):
    """Return the n users with the most checkouts, highest first."""
    counts = {}
    for record in records:
        user = record["user"]
        counts[user] = counts.get(user, 0) + 1
    ranked = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)
    return ranked[:n]`.split('\n')

const MAIN = `if __name__ == "__main__":
    print(overdue_books(checkouts, date.today()))`.split('\n')

const PRINT_NEW = `    print(top_borrowers(checkouts))`

export const NO_DECISIONS: Decisions = { 1: null, 2: null, 3: null }

/** Builds library.py for a set of accept/revert decisions and locates each change in it. */
export function buildLibrary(decisions: Decisions = NO_DECISIONS): {
  code: string
  ranges: Record<ChangeId, LineRange>
} {
  const lines = [...HEADER]
  const ranges = {} as Record<ChangeId, LineRange>

  // Change 2: the return in overdue_books
  const keep2 = decisions[2] !== 'reverted'
  lines.push(keep2 ? RETURN_NEW : RETURN_OLD)
  ranges[2] = { start: lines.length, end: lines.length, present: keep2 }
  lines.push('', '')

  // Change 1: the new function
  const keep1 = decisions[1] !== 'reverted'
  const start1 = lines.length + 1
  if (keep1) {
    lines.push(...TOP_BORROWERS)
    ranges[1] = { start: start1, end: lines.length, present: true }
    lines.push('', '')
  } else {
    ranges[1] = { start: start1, end: start1, present: false }
  }

  // Change 3: the print in __main__
  lines.push(...MAIN)
  const keep3 = decisions[3] !== 'reverted'
  if (keep3) {
    lines.push(PRINT_NEW)
    ranges[3] = { start: lines.length, end: lines.length, present: true }
  } else {
    ranges[3] = { start: lines.length, end: lines.length, present: false }
  }
  return { code: lines.join('\n') + '\n', ranges }
}

export const LIBRARY_BEFORE = [...HEADER, RETURN_OLD, '', '', ...MAIN].join('\n') + '\n'
export const LIBRARY_AFTER = buildLibrary().code

/** Frames shown while the agent "edits", so lines appear one at a time. */
export const EDIT_FRAMES: string[] = (() => {
  const frames: string[] = []
  const head = [...HEADER, RETURN_NEW, '', '']
  frames.push([...head, ...MAIN].join('\n') + '\n')
  for (let i = 1; i <= TOP_BORROWERS.length; i++) {
    frames.push([...head, ...TOP_BORROWERS.slice(0, i), '', '', ...MAIN].join('\n') + '\n')
  }
  frames.push(LIBRARY_AFTER)
  return frames
})()

export interface WorkspaceFile {
  path: string
  name: string
  language: string
}

export const FILE_TREE: WorkspaceFile[] = [
  { path: 'library.py', name: 'library.py', language: 'python' },
  { path: 'test_library.py', name: 'test_library.py', language: 'python' },
  { path: 'data/checkouts.csv', name: 'checkouts.csv', language: 'plaintext' },
  { path: 'README.md', name: 'README.md', language: 'markdown' },
]

export const STATIC_FILES: Record<string, string> = {
  'test_library.py': `# test_library.py
from datetime import date
from library import overdue_books

SAMPLE = [
    {"user": "maya", "title": "Dune", "due": date(2026, 11, 10)},
    {"user": "sam", "title": "Kindred", "due": date(2026, 10, 28)},
]


def test_overdue_books():
    assert overdue_books(SAMPLE, date(2026, 11, 2)) == ["Kindred"]
`,
  'data/checkouts.csv': `user,title,due
maya,Dune,2026-11-10
jordan,Beloved,2026-11-02
maya,Kindred,2026-10-28
sam,The Hobbit,2026-11-15
jordan,Neuromancer,2026-11-01
maya,Parable of the Sower,2026-11-20
`,
  'README.md': `# Project 2: Library Checkout Tracker

CS 120 · Intro to Programming (Python)

Track who has checked out which books, and report on them.

## Requirements

1. List the titles that are overdue.
2. Report the users with the most checkouts.

Run the tracker with \`python library.py\`.
Run the tests with \`pytest\`.
`,
}
