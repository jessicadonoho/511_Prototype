// Works out which concept a piece of code is about, so the editor can point at the right
// notes and the right practice questions (Iteration 2, Theme 5).

export interface CodeHint {
  /** Lowercased needle. */
  needle: string
  conceptId: string
  /** Shown as the link label in the editor. */
  label: string
}

/** Order matters: the first match wins, most specific first. */
export const CODE_HINTS: CodeHint[] = [
  { needle: '.get(', conceptId: 'dictget', label: '.get() with a default' },
  { needle: '.items()', conceptId: 'dictitems', label: 'dict.items()' },
  { needle: 'lambda', conceptId: 'lambda', label: 'Lambda functions' },
  { needle: 'reverse=', conceptId: 'sortedkey', label: 'sorted() with key' },
  { needle: 'sorted(', conceptId: 'sortedkey', label: 'sorted() with key' },
  { needle: '<=', conceptId: 'boundary', label: 'Boundary conditions' },
  { needle: '[:', conceptId: 'slicing', label: 'Slicing' },
  { needle: 'for ', conceptId: 'forloops', label: 'for loops' },
  { needle: 'if ', conceptId: 'ifelif', label: 'if / elif / else' },
]

/** The concept a snippet is most likely about, or null when nothing matches. */
export function conceptForCode(code: string): CodeHint | null {
  const lower = code.toLowerCase()
  return CODE_HINTS.find((h) => lower.includes(h.needle)) ?? null
}

/** Every concept a snippet touches, in hint order, without repeats. */
export function conceptsInCode(code: string): CodeHint[] {
  const lower = code.toLowerCase()
  const out: CodeHint[] = []
  CODE_HINTS.forEach((h) => {
    if (lower.includes(h.needle) && !out.some((o) => o.conceptId === h.conceptId)) out.push(h)
  })
  return out
}
