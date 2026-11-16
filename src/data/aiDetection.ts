// AI-usage detection and the clarifying questions it triggers (Iteration 2, flow step 5).
//
// Two options are built so they can be tested against each other. The facilitator picks one
// per participant; a participant only ever sees the option they were assigned.
//   Option A — on the spot: the IDE asks about the code the moment it lands.
//   Option B — around submission: the questions come at submit time, with a grade on the line.

export type AiMode = 'A' | 'B'

export const AI_MODE_LABEL: Record<AiMode, string> = {
  A: 'A · On the spot',
  B: 'B · At submission',
}

export const AI_MODE_BLURB: Record<AiMode, string> = {
  A: 'Clarifying questions appear in the editor as soon as AI-written code lands. No grade attached.',
  B: 'Nothing interrupts the student. The clarifying questions come at submission, and count toward the grade.',
}

export interface ClarifyQuestion {
  id: string
  conceptId: string
  /** The lines the question is about, shown above it. */
  about: string
  prompt: string
  /** Lowercased substrings; any match counts as a real answer. */
  accept: string[]
  goodFeedback: string
  weakFeedback: string
}

export const CLARIFY_QUESTIONS: ClarifyQuestion[] = [
  {
    id: 'cl-1',
    conceptId: 'dictget',
    about: 'counts.get(record["user"], 0) + 1',
    prompt: 'This line uses `.get` with a `0`. What would go wrong if the `0` were not there?',
    accept: ['none', 'null', 'error', 'typeerror', 'crash', 'nothing', 'fail', "can't add", 'cannot add'],
    goodFeedback:
      'That is right. With no default, `.get` returns `None`, and `None + 1` raises a `TypeError`. The `0` is what lets a brand new user start counting.',
    weakFeedback:
      'Have another go. `.get` with only a key returns `None` when the key is missing. What happens when you then add `1` to that?',
  },
  {
    id: 'cl-2',
    conceptId: 'sortedkey',
    about: 'sorted(counts.items(), key=lambda pair: pair[1], reverse=True)',
    prompt: 'Why is it `pair[1]` and not `pair[0]`?',
    accept: ['count', '1 is', 'second', 'value', 'number', 'not the name', 'index 1'],
    goodFeedback:
      'Exactly. Each pair is `(name, count)`, so index `1` is the count. Using `pair[0]` would sort the users alphabetically instead.',
    weakFeedback:
      'Try once more. `.items()` gives pairs like `("maya", 3)`. Which half is at index `1`, and which half should the ranking be based on?',
  },
  {
    id: 'cl-3',
    conceptId: 'sortedkey',
    about: 'return ranked[:3]',
    prompt: 'If you removed `reverse=True`, what would this function return instead?',
    accept: ['lowest', 'fewest', 'least', 'smallest', 'bottom', 'ascending', 'reverse', 'opposite', 'backwards'],
    goodFeedback:
      'Right. Without it `sorted` runs lowest to highest, so `[:3]` would hand back the three people with the *fewest* checkouts.',
    weakFeedback:
      'Not quite. `sorted` has a default direction. If you take the first three items of a list sorted that way, whose counts do you get?',
  },
]

export const AI_DETECT_REASON = '16 lines appeared at once, matching a pattern from an AI assistant.'

/** Option A, in the editor, right away. */
export const OPTION_A_COPY = {
  title: 'Quick check on that code',
  blurb: 'This looks like it came from an AI assistant. Two questions before you move on — this is not graded.',
  done: 'Thanks. That is logged against the concept, not against your grade.',
  skip: 'Not now',
  skipped: 'Skipped. ChangeNotes noted that these lines have not been explained.',
}

/** Option B, at submission, with a grade on the line. */
export const OPTION_B_COPY = {
  title: 'Before this is graded',
  blurb:
    'ChangeNotes flagged part of this submission as AI-written. Explain it in your own words to submit. Your answers go to Prof. Rivera with the code.',
  stakes: 'Counts toward your In-class 6 grade',
  done: 'Submitted. Your explanations went with the code.',
  skip: 'Submit without explaining',
  skipped: 'Submitted and flagged as unexplained for Prof. Rivera to review.',
}
