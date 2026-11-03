import type { AgentId } from './changes'

// Prompt history (PRODUCT.md §5.7). Today's session is added on top at runtime.

export interface PastSession {
  id: string
  date: string
  agent: AgentId | string
  agentName: string
  prompt: string
  files: string[]
  added: number
  removed: number
  concepts: string[]
  courseId: string
  itemId: string
  summary: string
  language: 'python' | 'sql'
  snippet: string
}

export const SEED_HISTORY: PastSession[] = [
  {
    id: 's8', date: 'Nov 1', agent: 'claude', agentName: 'Claude Code',
    prompt: 'Add a function that returns the titles of all books a user has checked out',
    files: ['library.py'], added: 3, removed: 0, concepts: ['listcomp', 'forloops'],
    courseId: 'cs120', itemId: 'cs120-p2',
    summary: 'Added a list comprehension that filters checkouts by user.',
    language: 'python',
    snippet: 'def titles_for(records, user):\n    return [r["title"] for r in records if r["user"] == user]',
  },
  {
    id: 's7', date: 'Oct 30', agent: 'codex', agentName: 'Codex',
    prompt: 'Sort the checkouts by due date so the soonest is first',
    files: ['library.py'], added: 2, removed: 1, concepts: ['sortedkey'],
    courseId: 'cs120', itemId: 'cs120-p2',
    summary: 'Used sorted() with a key to order records by their due date.',
    language: 'python',
    snippet: 'by_due = sorted(checkouts, key=lambda r: r["due"])',
  },
  {
    id: 's6', date: 'Oct 28', agent: 'claude', agentName: 'Claude Code',
    prompt: 'Load checkouts from data/checkouts.csv instead of hardcoding them',
    files: ['library.py', 'data/checkouts.csv'], added: 6, removed: 0, concepts: ['csvread', 'forloops'],
    courseId: 'cs120', itemId: 'cs120-p2',
    summary: 'Read each CSV row as a dictionary with csv.DictReader.',
    language: 'python',
    snippet: 'with open("data/checkouts.csv") as f:\n    rows = list(csv.DictReader(f))',
  },
  {
    id: 's5', date: 'Oct 25', agent: 'kimi', agentName: 'Kimi',
    prompt: 'Write a query for the number of events and orders per user',
    files: ['analytics.sql'], added: 5, removed: 0, concepts: ['joins', 'groupby'],
    courseId: 'cs240', itemId: 'cs240-p1',
    summary: 'Joined users to events and orders, then grouped by user. The counts came out too high.',
    language: 'sql',
    snippet: 'SELECT u.name, COUNT(*)\nFROM users u\nJOIN events e ON u.id = e.user_id\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.name;',
  },
  {
    id: 's4', date: 'Oct 22', agent: 'codex', agentName: 'Codex',
    prompt: 'Show only the top 5 scores',
    files: ['grades.py'], added: 1, removed: 1, concepts: ['slicing', 'sortedkey'],
    courseId: 'cs120', itemId: 'cs120-p1',
    summary: 'Sorted scores from highest to lowest and sliced the first five.',
    language: 'python',
    snippet: 'top_scores = sorted(scores, reverse=True)[:5]',
  },
  {
    id: 's3', date: 'Oct 20', agent: 'claude', agentName: 'Claude Code',
    prompt: 'Add letter grades based on the percentage',
    files: ['grades.py'], added: 8, removed: 0, concepts: ['ifelif', 'boundary'],
    courseId: 'cs120', itemId: 'cs120-p1',
    summary: 'Added an if / elif chain with a cutoff for each letter grade.',
    language: 'python',
    snippet: 'if pct >= 90:\n    return "A"\nelif pct >= 80:\n    return "B"',
  },
  {
    id: 's2', date: 'Oct 16', agent: 'kimi', agentName: 'Kimi',
    prompt: 'Count how many events each user has',
    files: ['analytics.sql'], added: 3, removed: 0, concepts: ['groupby'],
    courseId: 'cs240', itemId: 'cs240-p1',
    summary: 'Grouped events by user and counted each group.',
    language: 'sql',
    snippet: 'SELECT user_id, COUNT(*)\nFROM events\nGROUP BY user_id;',
  },
  {
    id: 's1', date: 'Oct 12', agent: 'claude', agentName: 'Claude Code',
    prompt: 'Calculate the average of a list of grades',
    files: ['grades.py'], added: 4, removed: 0, concepts: ['forloops'],
    courseId: 'cs120', itemId: 'cs120-p1',
    summary: 'Summed the grades with a loop, then divided by the count.',
    language: 'python',
    snippet: 'total = 0\nfor grade in grades:\n    total += grade\naverage = total / len(grades)',
  },
]

export const TODAY_SESSION_ID = 'today'
export const YESTERDAY_SESSION_ID = 's8'
