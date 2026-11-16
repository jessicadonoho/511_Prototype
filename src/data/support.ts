// How ChangeNotes works out that a student needs support (Iteration 2, Theme 3).
//
// Four signals feed one list. The prototype shows the signals themselves, with what set each
// one off, so a participant can see *why* it thinks they are struggling rather than just
// being told. The values are derived from live session state by `supportSignals` in the store.

export type SignalKind = 'stuck' | 'ai' | 'mastery' | 'weekly'

export interface SignalMeta {
  label: string
  icon: string
  /** What the student is told. */
  blurb: string
}

export const SIGNAL_META: Record<SignalKind, SignalMeta> = {
  stuck: {
    label: 'Stuck on a concept',
    icon: '◴',
    blurb: 'Several tries on the same question without getting there.',
  },
  ai: {
    label: 'AI usage in your code',
    icon: '◆',
    blurb: 'Code that looks AI-written landed in a file you were working on.',
  },
  mastery: {
    label: 'Mastery still low',
    icon: '○',
    blurb: 'A concept that has come up in class is still below Familiar.',
  },
  weekly: {
    label: 'Pattern in your weekly review',
    icon: '▦',
    blurb: 'The same concept has been missed in the weekly review.',
  },
}

/** Threshold for the "stuck" signal: wrong or near-miss answers in a row on one concept. */
export const STUCK_AFTER = 3

export const SUPPORT_TITLE = 'ChangeNotes noticed'
export const SUPPORT_EMPTY = 'Nothing to flag right now. Signals show up here as you work.'
export const SUPPORT_FOOTER =
  'Only class-level concept trends go to Prof. Rivera. Your prompts, chats and answers stay with you.'
