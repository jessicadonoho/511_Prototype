// Scripted chat (PRODUCT.md §5.6). First matching intent wins, so order matters.

export interface ChatIntent {
  id: string
  /** Matched as whole words, case-insensitive (so "get" doesn't match "forget"). */
  triggers: string[]
  response: string
  action?: 'revert2'
}

export const CHAT_INTENTS: ChatIntent[] = [
  {
    id: 'lambda',
    triggers: ['lambda'],
    response: `\`lambda pair: pair[1]\` is a tiny function with no name. It takes a pair like \`("maya", 3)\` and returns the second item, \`3\`.

It does the same thing as this named function:

\`\`\`python
def get_count(pair):
    return pair[1]

ranked = sorted(counts.items(), key=get_count, reverse=True)
\`\`\`

The AI used \`lambda\` because \`sorted\` only needs this function once, right there.`,
  },
  {
    id: 'boundary',
    triggers: ['<=', 'overdue', 'today', 'assumption'],
    response: `The AI changed \`<\` to \`<=\`. Before, a book due today was on time. Now it counts as overdue. You didn't ask for this.

A quick test can settle it. Try a book due today:

\`\`\`python
book = {"user": "sam", "title": "Dune", "due": date(2026, 11, 2)}
overdue_books([book], date(2026, 11, 2))
# with <   → []
# with <=  → ["Dune"]
\`\`\`

Check your project spec, then decide.`,
    action: 'revert2',
  },
  {
    id: 'shorter',
    triggers: ['counter', 'shorter', 'better way', 'simpler way'],
    response: `Yes. Python's \`collections.Counter\` can do this in two lines:

\`\`\`python
from collections import Counter

def top_borrowers(records, n=3):
    return Counter(r["user"] for r in records).most_common(n)
\`\`\`

The tradeoff: it's shorter, but the counting and sorting are less visible. While you're learning, the longer version shows you each step.`,
  },
  {
    id: 'eli5',
    triggers: ['simpler', 'eli5', 'confused', "don't understand", 'dont understand'],
    response: `Picture a whiteboard with a tally mark next to each name.

The function reads each checkout and adds a mark next to that person's name. Then it lines the names up from most marks to fewest. Finally, it keeps the top 3.`,
  },
  {
    id: 'get',
    triggers: ['get', 'keyerror', 'default'],
    response: `Here's why the AI used \`.get\`. This version crashes on a new key:

\`\`\`python
counts[user] += 1   # KeyError the first time you see a user
\`\`\`

This one is safe, because a new user starts at the default, \`0\`:

\`\`\`python
counts[user] = counts.get(user, 0) + 1
\`\`\``,
  },
  {
    id: 'sorted',
    triggers: ['sort', 'sorted', 'reverse', 'order'],
    response: `\`sorted\` makes a new list. \`key\` says what to sort by, and \`reverse=True\` puts the highest first.

\`\`\`python
pairs = [("maya", 3), ("sam", 1), ("jordan", 2)]
sorted(pairs, key=lambda p: p[1], reverse=True)
# → [("maya", 3), ("jordan", 2), ("sam", 1)]
\`\`\``,
  },
  {
    id: 'example',
    triggers: ['example'],
    response: `Let's walk through the seed data, one record at a time:

\`\`\`text
maya    → {maya: 1}
jordan  → {maya: 1, jordan: 1}
maya    → {maya: 2, jordan: 1}
sam     → {maya: 2, jordan: 1, sam: 1}
jordan  → {maya: 2, jordan: 2, sam: 1}
maya    → {maya: 3, jordan: 2, sam: 1}
\`\`\`

After sorting, the result is \`[("maya", 3), ("jordan", 2), ("sam", 1)]\`.`,
  },
]

export const FALLBACK_INTRO = "Good question. Here's what this part of the code does:"

export const CHAT_CHIPS = ['Explain simpler', 'Show an example', 'Why lambda?', 'Is there a shorter way?']

export function matchIntent(text: string): ChatIntent | null {
  const lower = text.toLowerCase()
  for (const intent of CHAT_INTENTS) {
    for (const trigger of intent.triggers) {
      if (/^\w/.test(trigger)) {
        const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        if (new RegExp(`\\b${escaped}\\b`).test(lower)) return intent
      } else if (lower.includes(trigger)) {
        return intent
      }
    }
  }
  return null
}
