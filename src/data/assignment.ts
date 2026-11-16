// The in-class assignment a student gets after the lecture section (Iteration 2, flow steps 2–3).

export interface Assignment {
  id: string
  /** The lecture this assignment follows. */
  itemId: string
  code: string
  title: string
  due: string
  minutes: number
  brief: string
  requirements: string[]
  /** Concepts the "Would you like to review these concepts?" prompt lists. */
  conceptIds: string[]
  /** Workspace path the IDE opens. */
  path: string
  starterCode: string
}

export const ASSIGNMENT: Assignment = {
  id: 'inclass6',
  itemId: 'cs120-l6',
  code: 'In-class 6',
  title: 'Checkout counts',
  due: 'End of class today',
  minutes: 15,
  brief:
    'Use a dictionary to count how many books each person has checked out, then report the three people with the most.',
  requirements: [
    'Count checkouts per user in a dictionary, without crashing on a user you have not seen before.',
    'Return the three users with the most checkouts, highest first.',
    'Leave the `checkouts` data as it is.',
  ],
  conceptIds: ['dictget', 'dictitems', 'sortedkey'],
  path: 'in_class_6.py',
  starterCode: `# In-class 6: Checkout counts
# CS 120 · Lecture 6 (Dictionaries)
#
# 1. Count how many books each user has checked out.
# 2. Return the top 3 users, highest count first.

checkouts = [
    {"user": "maya", "title": "Dune"},
    {"user": "jordan", "title": "Beloved"},
    {"user": "maya", "title": "Kindred"},
    {"user": "sam", "title": "The Hobbit"},
    {"user": "jordan", "title": "Neuromancer"},
    {"user": "maya", "title": "Parable of the Sower"},
]


def count_checkouts(records):
    """Return a dictionary of user -> number of checkouts."""
    counts = {}
    # TODO: count each user's checkouts
    return counts


def top_three(counts):
    """Return the 3 users with the most checkouts, highest first."""
    # TODO: sort the pairs by count and keep the first 3
    return []


if __name__ == "__main__":
    print(top_three(count_checkouts(checkouts)))
`,
}

/** The AI-written solution a student might paste in. Triggers detection when it lands. */
export const AI_PASTE = `def count_checkouts(records):
    """Return a dictionary of user -> number of checkouts."""
    counts = {}
    for record in records:
        counts[record["user"]] = counts.get(record["user"], 0) + 1
    return counts


def top_three(counts):
    """Return the 3 users with the most checkouts, highest first."""
    ranked = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)
    return ranked[:3]
`

export const SUBMITTED_NOTE = 'Submitted to Prof. Rivera · In-class 6'
