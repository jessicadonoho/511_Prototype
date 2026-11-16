// Onboarding for a new student (Iteration 2, Theme 2). Short on purpose: it only has to
// set up the flow — join a class, see the notebook, and learn how the editor relates to it.

import { CLASS_CODE, PROFESSOR } from './lectures'

export interface OnboardStep {
  id: string
  eyebrow: string
  title: string
  body: string
  /** Bullets shown under the body. */
  points?: string[]
  cta: string
}

export const ONBOARD_STEPS: OnboardStep[] = [
  {
    id: 'join',
    eyebrow: 'Step 1 of 3',
    title: 'Join your class',
    body: `Your professor gave the class a join code. Enter it to get your notebook set up with this term's lectures.`,
    cta: 'Join class',
  },
  {
    id: 'notebook',
    eyebrow: 'Step 2 of 3',
    title: 'This is your notebook',
    body: 'Your lecture notes live here, organised by lecture. When you open a lecture, a practice panel opens beside the notes with questions on what that lecture taught.',
    points: [
      'Answer a question, get feedback, and go again.',
      `Three right answers on a concept and you move on to the next one.`,
      'Your in-class assignments show up at the end of the lecture they belong to.',
    ],
    cta: 'Next',
  },
  {
    id: 'editor',
    eyebrow: 'Step 3 of 3',
    title: 'Your notebook and your editor',
    body: 'You write code in your editor. ChangeNotes sits quietly in there and keeps the two in step.',
    points: [
      'Open an assignment from your notebook and it lands in your editor.',
      'Stuck on something? There is a link back to the notes for that concept.',
      'Select any code and add it to your notebook to come back to later.',
    ],
    cta: 'Open my notebook',
  },
]

export const JOIN = {
  course: 'CS 120 · Intro to Programming (Python)',
  professor: PROFESSOR,
  code: CLASS_CODE,
  placeholder: 'Class code',
  hint: `Try ${CLASS_CODE}`,
  wrong: 'That code does not match a class. Check it with your professor.',
  joined: `You're in ${PROFESSOR}'s section.`,
}

export const WELCOME_NAME = 'Alex'
