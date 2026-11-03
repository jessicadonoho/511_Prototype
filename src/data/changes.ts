import type { ChangeId } from './code'

export type ChangeKind = 'added' | 'assumption'

export interface ChangeGroup {
  id: ChangeId
  label: string
  /** Short label used in the inline label above the code. */
  lensLabel: string
  kind: ChangeKind
  typeLabel: string
  summary: string
  /** Longer "what & why", posted to the Ask tab when someone clicks Explain. */
  explain: string
  /** Read-only snippet for the Notebook session page. */
  snippet: { text: string; tinted: boolean }[]
}

export const CHANGES: ChangeGroup[] = [
  {
    id: 1,
    label: 'New function top_borrowers',
    lensLabel: 'New function',
    kind: 'added',
    typeLabel: 'Added',
    summary: 'Counts checkouts per user with a dictionary, then sorts users by count, highest first.',
    explain:
      "`top_borrowers` does two jobs. First it builds a dictionary that tallies each user's checkouts. Then it sorts those pairs by count, highest first, and keeps the first `n`.\n\nThe AI used a dictionary because it can look up each user's running total in one step.",
    snippet: [
      { text: 'def top_borrowers(records, n=3):', tinted: true },
      { text: '    """Return the n users with the most checkouts, highest first."""', tinted: true },
      { text: '    counts = {}', tinted: true },
      { text: '    for record in records:', tinted: true },
      { text: '        user = record["user"]', tinted: true },
      { text: '        counts[user] = counts.get(user, 0) + 1', tinted: true },
      { text: '    ranked = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)', tinted: true },
      { text: '    return ranked[:n]', tinted: true },
    ],
  },
  {
    id: 2,
    label: 'Overdue rule changed',
    lensLabel: 'Overdue rule',
    kind: 'assumption',
    typeLabel: 'Modified · Changed assumption',
    summary:
      '`<` became `<=`. Books due **today** now count as overdue. You didn\'t ask for this. Is that what you want?',
    explain:
      'The AI changed `<` to `<=` in `overdue_books`. Before, a book due today was still on time. Now it counts as overdue.\n\nYou didn\'t ask for this, and it changes who gets flagged. *Beloved* is due today, so it would now show up. Check what your project spec wants, then keep or revert the change.',
    snippet: [
      { text: 'def overdue_books(records, today):', tinted: false },
      { text: '    """Return titles that are past their due date."""', tinted: false },
      { text: '    return [r["title"] for r in records if r["due"] <= today]', tinted: true },
    ],
  },
  {
    id: 3,
    label: 'Print the result',
    lensLabel: 'Print the result',
    kind: 'added',
    typeLabel: 'Added',
    summary: 'Calls the new function when you run the file.',
    explain:
      'This line runs `top_borrowers` and prints the result when you run `python library.py`. Without it, the function would exist but nothing would call it.',
    snippet: [
      { text: 'if __name__ == "__main__":', tinted: false },
      { text: '    print(overdue_books(checkouts, date.today()))', tinted: false },
      { text: '    print(top_borrowers(checkouts))', tinted: true },
    ],
  },
]

export const changeById = (id: ChangeId) => CHANGES.find((c) => c.id === id)!

export const AGENT_SCRIPT = {
  reading: '⏺ Reading library.py',
  planning: '⏺ Planning: count checkouts per user, sort by count',
  editing: '⏺ Editing library.py  (+9 −1)',
  done: '✓ Done. Added top_borrowers() and a call in __main__.',
  captured: '◧ ChangeNotes captured this session · 3 changes · review in the side panel',
  secondPrompt: '✓ No further changes needed for this demo.',
}

export const AGENTS = [
  { id: 'claude', name: 'Claude Code', short: 'Claude Code', command: 'claude' },
  { id: 'codex', name: 'Codex CLI', short: 'Codex', command: 'codex' },
  { id: 'kimi', name: 'Kimi CLI', short: 'Kimi', command: 'kimi' },
  { id: 'gemini', name: 'Gemini CLI', short: 'Gemini', command: 'gemini' },
  { id: 'other', name: 'Other (custom)', short: 'Custom agent', command: 'agent' },
] as const

export type AgentId = (typeof AGENTS)[number]['id']
export const agentById = (id: AgentId) => AGENTS.find((a) => a.id === id)!
