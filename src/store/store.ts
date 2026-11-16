import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { AGENT_SCRIPT, agentById, changeById, type AgentId } from '../data/changes'
import { EDIT_FRAMES, NO_DECISIONS, type ChangeId, type Decisions } from '../data/code'
import { matchIntent, FALLBACK_INTRO } from '../data/chat'
import { CONCEPTS, SEED_MASTERY, SEED_RECENT, conceptById, type Level } from '../data/courses'
import { hoverByToken } from '../data/hovers'
import { DEFAULT_QUESTION_POSITION, QUESTIONS } from '../data/questions'
import { SEED_CORRECT, SEED_QUESTIONS, SEED_STREAK } from '../data/progress'
import { TODAY_LECTURE_ID, conceptsTaught, sectionForConcept } from '../data/lectures'
import {
  LESSON_QUESTIONS,
  REPS_TO_ADVANCE,
  gradeResponse,
  questionsForConcept,
  type Grade,
  type LessonQuestion,
} from '../data/lessonPractice'
import { ASSIGNMENT } from '../data/assignment'
import { CLARIFY_QUESTIONS, type AiMode } from '../data/aiDetection'
import { REVIEW_TASKS, WEEKLY_REVIEW, tasksForMastery } from '../data/weeklyReview'
import { STUCK_AFTER, type SignalKind } from '../data/support'

export const STORE_KEY = 'changenotes-proto-v1'
export const DEFAULT_PROMPT = 'Add a function that finds the top 3 users with the most checkouts.'

/** Where a student starts: today's lecture in the notebook. */
export const TODAY_LECTURE_ROUTE = `/course/cs120/item/${TODAY_LECTURE_ID}`

export type AppId = 'ide' | 'notebook'
export type SidebarView = 'explorer' | 'search' | 'scm' | 'extensions' | 'changenotes'
export type PanelTab = 'review' | 'ask' | 'history'
export type BottomTab = 'terminal' | 'problems' | 'output'
export type ChangeVia = 'gutter' | 'lens' | 'sidebar' | 'nav' | 'diff' | 'panel' | 'scroll' | 'notebook'
export type NotebookVia =
  | 'statusbar'
  | 'panel_header'
  | 'panel_footer'
  | 'panel_idle'
  | 'summary_card'
  | 'dock'
  | 'ide_notes'
  | 'after_submit'
  | 'onboarding'

export interface TermLine {
  kind: 'shell' | 'agent' | 'prompt' | 'output' | 'done' | 'changenotes' | 'muted'
  text: string
}
export type Answer =
  | { skipped: true }
  | { skipped?: false; choice: number; correct: boolean; hintUsed: boolean }
export interface ChatMsg {
  id: number
  role: 'user' | 'assistant'
  text: string
  /** Epoch ms. Streaming is derived from this, so it survives switching tabs. */
  at: number
  action?: 'revert2'
  context?: string
  /** Seed/fixture messages render fully, with no streaming. */
  instant?: boolean
}
export interface CustomNotebook {
  id: string
  name: string
  type: 'exam' | 'lecture' | 'project' | 'custom'
  courseId: string
  itemIds: string[]
  conceptIds: string[]
  sessionCount: number
  examDate?: string
  dailyGoal: number
  focusWeak: boolean
  includeSpot: boolean
}
export interface LogEvent {
  ts: number
  participantId: string
  task: number | null
  event: string
  payload: Record<string, unknown>
}
export interface Variants {
  questionPosition: 'top' | 'bottom'
  toast: boolean
  hoverCards: boolean
  /** Which AI-detection option this participant sees (Iteration 2, flow step 5). */
  aiMode: AiMode
}
export interface MasteryChange {
  conceptId: string
  from: Level
  to: Level
}

/** One line of the practice panel's conversation. */
export interface PracticeTurn {
  id: number
  role: 'question' | 'student' | 'coach'
  text: string
  questionId?: string
  grade?: Grade
  at: number
  /** Skips the typing animation (restored turns and the opening question). */
  instant?: boolean
}

/** Code a student sent from the editor to a lecture in the notebook. */
export interface NotebookClip {
  id: string
  code: string
  conceptId: string
  itemId: string
  file: string
  lines: string
  at: number
}

export interface ClarifyAnswer {
  text: string
  ok: boolean
}

export interface SupportSignal {
  kind: SignalKind
  conceptId: string
  /** What set this signal off, shown to the student. */
  detail: string
}

export interface Persisted {
  frontApp: AppId | null
  open: Record<AppId, boolean>
  maximized: Record<AppId, boolean>
  notebookRoute: string
  recent: string[]
  agent: AgentId
  customAgent: string
  phase: 'idle' | 'running' | 'done'
  editFrame: number | null
  prompt: string
  terminal: TermLine[]
  decisions: Decisions
  reviewed: Record<ChangeId, boolean>
  viewed: Record<ChangeId, boolean>
  answers: Record<string, Answer>
  questionIndex: number
  questionsFinished: boolean
  panelOpen: boolean
  panelTab: PanelTab
  panelWidth: number
  sidebarOpen: boolean
  sidebarView: SidebarView
  bottomTab: BottomTab
  activeFile: string
  openTabs: string[]
  showDiff: boolean
  toast: boolean
  notebookDot: boolean
  chat: ChatMsg[]
  chatDraft: string
  mastery: Record<string, Level>
  customNotebooks: CustomNotebook[]
  lessonDone: boolean
  lessonScore: number | null
  lessonChanges: MasteryChange[]
  streak: number
  questionsAnswered: number
  questionsCorrect: number
  todayAnswered: number
  todayCorrect: number
  participantId: string
  task: number | null
  variants: Variants
  events: LogEvent[]

  // ---------- Iteration 2 ----------
  /** Onboarding is shown until a student joins their class and finishes the three steps. */
  onboarded: boolean
  /** The lecture practice panel (Theme 4). */
  practiceOpen: boolean
  practiceConcept: string | null
  practiceQuestionId: string | null
  practiceAsked: string[]
  practiceTurns: PracticeTurn[]
  practiceDraft: string
  /** Correct answers so far on each concept, out of REPS_TO_ADVANCE. */
  reps: Record<string, number>
  /** Concepts that reached 3/3 and were moved on from. */
  advanced: string[]
  /** Consecutive non-correct answers per concept, for the "stuck" signal. */
  wrongStreak: Record<string, number>
  /** Concepts where a hint has been shown. */
  hinted: string[]
  /** The in-class assignment (flow steps 2–3). */
  assignmentOpened: boolean
  assignmentSubmitted: boolean
  /** The "Would you like to review these concepts?" prompt, before and after. */
  reviewPrompt: null | 'before' | 'after'
  reviewPromptSeen: { before: boolean; after: boolean }
  /** Editable workspace files, by path. */
  fileEdits: Record<string, string>
  /** Code sent from the editor to the notebook (Theme 5). */
  clips: NotebookClip[]
  /** AI-usage detection (flow step 5). */
  aiDetected: boolean
  aiDetectedAt: number | null
  clarifyOpen: boolean
  clarifyIndex: number
  clarifyAnswers: Record<string, ClarifyAnswer>
  clarifyDone: boolean
  clarifySkipped: boolean
  /** The weekly review (Theme 6). */
  weeklyDone: boolean
  /**
   * The tasks this student was given, fixed when the review starts. Passing a task raises
   * mastery, which would otherwise re-pick a different task for that concept mid-review.
   */
  weeklyTaskIds: string[]
  weeklyAnswers: Record<string, string>
  weeklyResults: Record<string, boolean>
  weeklyIndex: number
  /** Blocked paste attempts during the weekly review. */
  pasteBlocked: number
}

interface Transient {
  bounceNonce: number
  jump: { id: ChangeId; nonce: number; flashOnly?: boolean } | null
  cursor: { line: number; col: number }
  selection: { start: number; end: number; text: string } | null
  newNotebook: null | { preset?: 'midterm' }
  /** Set briefly after a clip is sent, so the notebook can highlight it. */
  clipFlash: string | null
  /** A lecture section to scroll to and highlight, set when a question links back to the notes. */
  noteFocus: { sectionId: string; nonce: number } | null
}

interface Actions {
  focusApp(app: AppId): void
  closeApp(app: AppId): void
  toggleMaximize(app: AppId): void
  openNotebook(via: NotebookVia): void
  openIde(via: string, changeId?: ChangeId): void
  navNotebook(route: string): void
  selectAgent(agent: AgentId): void
  setCustomAgent(name: string): void
  submitPrompt(text: string): void
  viewChange(id: ChangeId, via: ChangeVia): void
  jumpTo(id: ChangeId, via: ChangeVia): void
  stepChange(direction: 1 | -1): void
  decide(id: ChangeId, decision: 'accepted' | 'reverted', via: string): void
  undoDecision(id: ChangeId): void
  explainChange(id: ChangeId, via: string): void
  answerQuestion(qid: string, choice: number, hintUsed: boolean): void
  skipQuestion(qid: string): void
  nextQuestion(): void
  setPanel(open: boolean, tab?: PanelTab): void
  setPanelWidth(width: number): void
  showSidebar(view: SidebarView): void
  setActiveFile(path: string): void
  closeTab(path: string): void
  setShowDiff(on: boolean, via?: string): void
  dismissToast(action: 'review' | 'later'): void
  sendChat(text: string, opts?: { chip?: boolean }): void
  askAboutHover(token: string): void
  explainHoverSimpler(token: string): void
  setDraft(text: string): void
  setCursor(line: number, col: number): void
  setSelection(sel: Transient['selection']): void
  recordPractice(results: { conceptId: string; correct: boolean }[]): MasteryChange[]
  completeLesson(results: { conceptId: string; correct: boolean }[]): void
  addNotebook(nb: CustomNotebook): void
  openNewNotebook(preset?: 'midterm'): void
  closeNewNotebook(): void
  setParticipant(id: string): void
  markTask(n: number): void
  setVariant<K extends keyof Variants>(key: K, value: Variants[K]): void
  jumpToState(state: FixtureName): void

  // ---------- Iteration 2 ----------
  finishOnboarding(): void
  restartOnboarding(): void
  openPractice(conceptId: string, via: string): void
  closePractice(): void
  setPracticeDraft(text: string): void
  submitPractice(text: string): void
  showPracticeHint(): void
  skipPracticeQuestion(): void
  advanceConcept(): void
  askReviewPrompt(when: 'before' | 'after'): void
  resolveReviewPrompt(action: 'review' | 'skip', conceptId?: string): void
  openAssignment(via: string): void
  setFileContent(path: string, text: string): void
  detectAi(via: string): void
  openClarify(via: string): void
  answerClarify(text: string): void
  skipClarify(): void
  closeClarify(): void
  submitAssignment(): void
  addClip(clip: Omit<NotebookClip, 'id' | 'at'>): void
  removeClip(id: string): void
  openNotesForConcept(conceptId: string, via: string): void
  focusNotesSection(conceptId: string, via: string): void
  beginWeekly(): void
  setWeeklyAnswer(taskId: string, text: string): void
  nextWeeklyTask(): void
  finishWeekly(): void
  notePasteBlocked(where: string): void
}

export type Store = Persisted & Transient & Actions

export const initialPersisted = (): Persisted => ({
  // The notebook is home base now, so it opens first and the editor starts closed.
  frontApp: 'notebook',
  open: { ide: false, notebook: true },
  maximized: { ide: false, notebook: false },
  notebookRoute: TODAY_LECTURE_ROUTE,
  recent: [...SEED_RECENT],
  agent: 'claude',
  customAgent: '',
  phase: 'idle',
  editFrame: null,
  prompt: '',
  terminal: readyLines('claude'),
  decisions: { ...NO_DECISIONS },
  reviewed: { 1: false, 2: false, 3: false },
  viewed: { 1: false, 2: false, 3: false },
  answers: {},
  questionIndex: 0,
  questionsFinished: false,
  // The ChangeNotes panel starts collapsed: the editor integration is secondary now (Theme 5).
  panelOpen: false,
  panelTab: 'review',
  panelWidth: 300,
  sidebarOpen: true,
  sidebarView: 'explorer',
  bottomTab: 'terminal',
  activeFile: 'library.py',
  openTabs: ['library.py', 'README.md'],
  showDiff: false,
  toast: false,
  notebookDot: false,
  chat: [],
  chatDraft: '',
  mastery: { ...SEED_MASTERY },
  customNotebooks: [],
  lessonDone: false,
  lessonScore: null,
  lessonChanges: [],
  streak: SEED_STREAK,
  questionsAnswered: SEED_QUESTIONS,
  questionsCorrect: SEED_CORRECT,
  todayAnswered: 0,
  todayCorrect: 0,
  participantId: '',
  task: null,
  variants: { questionPosition: DEFAULT_QUESTION_POSITION, toast: true, hoverCards: true, aiMode: 'A' },
  events: [],

  onboarded: false,
  practiceOpen: true,
  practiceConcept: null,
  practiceQuestionId: null,
  practiceAsked: [],
  practiceTurns: [],
  practiceDraft: '',
  reps: {},
  advanced: [],
  wrongStreak: {},
  hinted: [],
  assignmentOpened: false,
  assignmentSubmitted: false,
  reviewPrompt: null,
  reviewPromptSeen: { before: false, after: false },
  fileEdits: {},
  clips: [],
  aiDetected: false,
  aiDetectedAt: null,
  clarifyOpen: false,
  clarifyIndex: 0,
  clarifyAnswers: {},
  clarifyDone: false,
  clarifySkipped: false,
  weeklyDone: false,
  weeklyTaskIds: [],
  weeklyAnswers: {},
  weeklyResults: {},
  weeklyIndex: 0,
  pasteBlocked: 0,
})

function readyLines(agent: AgentId, custom = ''): TermLine[] {
  const a = agentById(agent)
  return [
    { kind: 'shell', text: `alex@laptop library-tracker % ${a.command}` },
    { kind: 'agent', text: `● ${custom || a.short} — ready` },
    { kind: 'muted', text: '  Type a prompt and press Enter.' },
  ]
}

// ---------- Pure transitions, shared by real actions and facilitator "jump to state" ----------

function withSessionDone(s: Persisted, prompt: string): Partial<Persisted> {
  return {
    phase: 'done',
    editFrame: null,
    prompt,
    terminal: [
      ...s.terminal.filter((l) => l.kind !== 'muted'),
      ...(s.terminal.some((l) => l.kind === 'prompt') ? [] : [{ kind: 'prompt' as const, text: prompt }]),
      ...(s.terminal.some((l) => l.text === AGENT_SCRIPT.reading)
        ? []
        : ([
            { kind: 'output', text: AGENT_SCRIPT.reading },
            { kind: 'output', text: AGENT_SCRIPT.planning },
            { kind: 'output', text: AGENT_SCRIPT.editing },
          ] as TermLine[])),
      { kind: 'done', text: AGENT_SCRIPT.done },
      { kind: 'changenotes', text: AGENT_SCRIPT.captured },
    ],
    mastery: { ...s.mastery, lambda: 0 },
    panelTab: 'review',
    toast: true,
  }
}

function withAnswer(s: Persisted, qid: string, choice: number, hintUsed: boolean): Partial<Persisted> {
  const q = QUESTIONS.find((x) => x.id === qid)!
  const correct = choice === q.correct
  const current = s.mastery[q.conceptId] ?? 0
  return {
    answers: { ...s.answers, [qid]: { choice, correct, hintUsed } },
    reviewed: { ...s.reviewed, [q.changeId]: true },
    mastery: correct ? { ...s.mastery, [q.conceptId]: Math.min(4, current + 1) as Level } : s.mastery,
    questionsAnswered: s.questionsAnswered + 1,
    questionsCorrect: s.questionsCorrect + (correct ? 1 : 0),
    todayAnswered: s.todayAnswered + 1,
    todayCorrect: s.todayCorrect + (correct ? 1 : 0),
  }
}

function withQuestionsFinished(s: Persisted): Partial<Persisted> {
  return {
    questionsFinished: true,
    notebookDot: true,
    mastery: { ...s.mastery, lambda: Math.max(s.mastery.lambda ?? 0, 1) as Level },
  }
}

let turnId = 1
const nextTurnId = () => turnId++

const LESSON_BY_ID = new Map(LESSON_QUESTIONS.map((q) => [q.id, q] as const))

function turn(role: PracticeTurn['role'], text: string, extra: Partial<PracticeTurn> = {}): PracticeTurn {
  return { id: nextTurnId(), role, text, at: Date.now(), ...extra }
}

/** The next question on a concept that hasn't been asked yet, recycling once they run out. */
function pickQuestion(conceptId: string, asked: string[]): LessonQuestion | null {
  const pool = questionsForConcept(conceptId)
  if (pool.length === 0) return null
  return pool.find((q) => !asked.includes(q.id)) ?? pool[0]
}

/** Opens the panel on a concept and asks its first question. */
function withPracticeStart(s: Persisted, conceptId: string): Partial<Persisted> {
  const q = pickQuestion(conceptId, [])
  const concept = conceptById(conceptId)
  const opening = turn(
    'coach',
    `Let's work on **${concept?.name ?? conceptId}**. Answer three of these correctly and we'll move on to the next concept in this lecture.`,
    { instant: true },
  )
  return {
    practiceOpen: true,
    practiceConcept: conceptId,
    practiceQuestionId: q?.id ?? null,
    practiceAsked: q ? [q.id] : [],
    practiceDraft: '',
    practiceTurns: q ? [opening, turn('question', q.prompt, { questionId: q.id, instant: true })] : [opening],
    reps: { ...s.reps, [conceptId]: s.reps[conceptId] ?? 0 },
  }
}

export type FixtureName = 'start' | 'lecture' | 'assignment' | 'aiDetected' | 'afterSubmit' | 'weekly' | 'legacyIde'

/** Starting states for facilitator jumps and five-second screens. Keeps the log and test settings. */
export function buildFixture(
  name: FixtureName,
  keep?: Pick<Persisted, 'participantId' | 'task' | 'variants' | 'events'>,
): Persisted {
  let s: Persisted = { ...initialPersisted(), ...(keep ?? {}) }
  if (name === 'start') return s

  // Everything past the start is post-onboarding, on today's lecture.
  s = { ...s, onboarded: true, notebookRoute: TODAY_LECTURE_ROUTE }
  const first = conceptsTaught(TODAY_LECTURE_ID)[0]
  if (first) s = { ...s, ...withPracticeStart(s, first) }
  if (name === 'lecture') return s

  if (name === 'legacyIde') {
    // The original editor review flow, before the assignment opens, for its five-second screen.
    const done = { ...s, ...withSessionDone(s, DEFAULT_PROMPT) } as Persisted
    return {
      ...done,
      panelOpen: true,
      open: { ide: true, notebook: false },
      frontApp: 'ide',
      activeFile: 'library.py',
      openTabs: ['library.py', 'README.md'],
      viewed: { 1: true, 2: true, 3: true },
    }
  }

  // The assignment is open in the editor, with the "before" prompt already answered.
  s = {
    ...s,
    assignmentOpened: true,
    reviewPromptSeen: { ...s.reviewPromptSeen, before: true },
    reps: { ...s.reps, dictget: 2 },
    open: { ide: true, notebook: true },
    frontApp: 'ide',
    activeFile: ASSIGNMENT.path,
    openTabs: [ASSIGNMENT.path, 'library.py'],
    fileEdits: { [ASSIGNMENT.path]: ASSIGNMENT.starterCode },
  }
  if (name === 'assignment') return s

  // AI-written code has landed in the assignment file and detection has fired.
  s = {
    ...s,
    fileEdits: { [ASSIGNMENT.path]: aiFilledAssignment() },
    aiDetected: true,
    aiDetectedAt: Date.now(),
    clarifyOpen: s.variants.aiMode === 'A',
  }
  if (name === 'aiDetected') return s

  s = {
    ...s,
    clarifyOpen: false,
    clarifyDone: true,
    clarifyAnswers: Object.fromEntries(CLARIFY_QUESTIONS.map((q) => [q.id, { text: '(answered)', ok: true }])),
    assignmentSubmitted: true,
    reviewPrompt: 'after',
    frontApp: 'notebook',
    notebookRoute: TODAY_LECTURE_ROUTE,
  }
  if (name === 'afterSubmit') return s

  return {
    ...s,
    reviewPrompt: null,
    reviewPromptSeen: { before: true, after: true },
    notebookRoute: '/review',
    practiceOpen: false,
    weeklyTaskIds: tasksForMastery(WEEKLY_REVIEW.conceptIds, s.mastery).map((t) => t.id),
  }
}

/** The assignment file with the AI's answer dropped into both stubs. */
export function aiFilledAssignment(): string {
  const lines = ASSIGNMENT.starterCode.split('\n')
  const start = lines.findIndex((l) => l.startsWith('def count_checkouts'))
  const end = lines.findIndex((l) => l.startsWith('if __name__'))
  if (start === -1 || end === -1) return ASSIGNMENT.starterCode
  const AI = `def count_checkouts(records):
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
  return [...lines.slice(0, start), ...AI.split('\n'), ...lines.slice(end)].join('\n')
}

// ---------- Persistence: paused while five-second screens borrow the store ----------

let persistPaused = false
export const setPersistPaused = (paused: boolean) => {
  persistPaused = paused
}

const safeStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string) => {
    if (persistPaused) return
    try {
      localStorage.setItem(name, value)
    } catch {
      /* private mode or full storage: the prototype still works for this session */
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
  },
}

let chatId = 1

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const log = (event: string, payload: Record<string, unknown> = {}) => logEvent(event, payload)

      const settleReviewed = () => {
        const s = get()
        if (s.reviewed[1] && s.reviewed[2] && s.reviewed[3] && !s.notebookDot && !s.questionsFinished) {
          set({ notebookDot: true })
        }
      }

      const assistantReply = (text: string, extra: Partial<ChatMsg> = {}): ChatMsg => ({
        id: chatId++,
        role: 'assistant',
        text,
        at: Date.now(),
        ...extra,
      })

      const nearestChangeSummary = () => {
        const { cursor } = get()
        // Lines from data/code.ts with nothing reverted: change 2 is line 16, change 1 starts at 19, change 3 is 31.
        const id: ChangeId = cursor.line <= 17 ? 2 : cursor.line <= 28 ? 1 : 3
        const change = changeById(id)
        return `${FALLBACK_INTRO}\n\n**${change.label}.** ${change.summary}\n\nTry a chip below to go deeper.`
      }

      return {
        ...initialPersisted(),
        bounceNonce: 0,
        jump: null,
        cursor: { line: 1, col: 1 },
        selection: null,
        newNotebook: null,
        clipFlash: null,
        noteFocus: null,

        focusApp(app) {
          if (get().frontApp === app) return
          set({ frontApp: app, open: { ...get().open, [app]: true } })
          log('window_focus', { app })
        },
        closeApp(app) {
          const s = get()
          const other: AppId = app === 'ide' ? 'notebook' : 'ide'
          set({ open: { ...s.open, [app]: false }, frontApp: s.open[other] ? other : null })
          log('window_close', { app })
        },
        toggleMaximize(app) {
          set({ maximized: { ...get().maximized, [app]: !get().maximized[app] } })
        },
        openNotebook(via) {
          const s = get()
          // The dock keeps your place unless there's something new to show.
          const keepPlace = via === 'dock' && s.open.notebook && !s.notebookDot
          const relevant = isReviewComplete(s) ? '/session/today' : TODAY_LECTURE_ROUTE
          const route = keepPlace ? s.notebookRoute : relevant
          log('app_switched', { from: s.frontApp, to: 'notebook', via })
          set({
            frontApp: 'notebook',
            open: { ...s.open, notebook: true },
            bounceNonce: s.bounceNonce + 1,
            notebookDot: false,
          })
          log('window_focus', { app: 'notebook' })
          get().navNotebook(route)
        },
        openIde(via, changeId) {
          const s = get()
          log('app_switched', { from: s.frontApp, to: 'ide', via })
          set({ frontApp: 'ide', open: { ...s.open, ide: true } })
          log('window_focus', { app: 'ide' })
          if (changeId) get().jumpTo(changeId, 'notebook')
        },
        navNotebook(route) {
          const s = get()
          const isContent = /^\/(course|concept|session|notebook)\//.test(route) && route.split('/').length > 2
          const recent = isContent ? [route, ...s.recent.filter((r) => r !== route)].slice(0, 3) : s.recent
          set({ notebookRoute: route, recent })
          log('nav', { route })
        },

        selectAgent(agent) {
          const s = get()
          if (agent === s.agent) return
          log('agent_selected', { agent })
          set({
            agent,
            terminal:
              s.phase === 'idle'
                ? readyLines(agent, agent === 'other' ? s.customAgent : '')
                : [...s.terminal, { kind: 'agent', text: `● ${agentById(agent).short} — ready` }],
          })
        },
        setCustomAgent(name) {
          const s = get()
          set({
            customAgent: name,
            terminal: s.phase === 'idle' && s.agent === 'other' ? readyLines('other', name) : s.terminal,
          })
        },
        submitPrompt(raw) {
          const text = raw.trim()
          if (!text) return
          const s = get()
          if (s.phase === 'running') return
          log('prompt_submitted', { text, agent: s.agent, first: s.phase === 'idle' })
          if (s.phase === 'done') {
            set({
              terminal: [...s.terminal, { kind: 'prompt', text }, { kind: 'done', text: AGENT_SCRIPT.secondPrompt }],
            })
            return
          }
          set({
            phase: 'running',
            prompt: text,
            terminal: [...s.terminal.filter((l) => l.kind !== 'muted'), { kind: 'prompt', text }],
          })
          const addLine = (line: string) =>
            set((st) => ({ terminal: [...st.terminal, { kind: 'output', text: line }] }))
          setTimeout(() => addLine(AGENT_SCRIPT.reading), 700)
          setTimeout(() => addLine(AGENT_SCRIPT.planning), 1700)
          setTimeout(() => {
            addLine(AGENT_SCRIPT.editing)
            EDIT_FRAMES.forEach((_, i) => setTimeout(() => set({ editFrame: i }), i * 180))
          }, 2800)
          setTimeout(() => {
            set((st) => ({ ...withSessionDone(st, text) }))
            log('session_captured', { changes: 3 })
            // Running an agent is also an AI-usage signal.
            get().detectAi('agent_run')
          }, 5000)
        },

        viewChange(id, via) {
          const s = get()
          if (via === 'scroll' && s.viewed[id]) return
          set({ viewed: { ...s.viewed, [id]: true } })
          log('change_viewed', { id, via })
        },
        jumpTo(id, via) {
          const s = get()
          get().viewChange(id, via)
          const needsFile = s.activeFile !== 'library.py'
          set({
            jump: { id, nonce: (s.jump?.nonce ?? 0) + 1 },
            activeFile: 'library.py',
            openTabs: needsFile && !s.openTabs.includes('library.py') ? ['library.py', ...s.openTabs] : s.openTabs,
            showDiff: false,
          })
        },
        stepChange(direction) {
          const s = get()
          if (s.phase !== 'done') return
          const current = s.jump?.id ?? (direction === 1 ? 3 : 1)
          const next = (((current - 1 + direction + 3) % 3) + 1) as ChangeId
          get().jumpTo(next, 'nav')
        },
        decide(id, decision, via) {
          const s = get()
          log(decision === 'accepted' ? 'change_accepted' : 'change_reverted', { id, via })
          const decisions = { ...s.decisions, [id]: decision }
          const reviewed = { ...s.reviewed, [id]: true }
          // Change 3 calls the function from change 1, so reverting 1 has to take 3 with it.
          if (id === 1 && decision === 'reverted') {
            decisions[3] = 'reverted'
            reviewed[3] = true
          }
          set({ decisions, reviewed })
          settleReviewed()
        },
        undoDecision(id) {
          const s = get()
          log('change_undo', { id })
          const decisions = { ...s.decisions, [id]: null }
          if (id === 3 && s.decisions[1] === 'reverted') decisions[1] = null
          if (id === 1 && s.decisions[3] === 'reverted') decisions[3] = null
          set({ decisions })
        },
        explainChange(id, via) {
          const s = get()
          const change = changeById(id)
          log('change_explained', { id, via })
          set({
            reviewed: { ...s.reviewed, [id]: true },
            panelOpen: true,
            panelTab: 'ask',
            chat: [
              ...s.chat,
              { id: chatId++, role: 'user', text: `Explain change ${id}: ${change.label}`, at: Date.now() },
              assistantReply(change.explain, change.kind === 'assumption' ? { action: 'revert2' } : {}),
            ],
          })
          settleReviewed()
        },

        answerQuestion(qid, choice, hintUsed) {
          const s = get()
          if (s.answers[qid]) return
          const q = QUESTIONS.find((x) => x.id === qid)!
          log('question_answered', { id: qid, correct: choice === q.correct, hint_used: hintUsed, choice })
          set(withAnswer(s, qid, choice, hintUsed))
          settleReviewed()
        },
        skipQuestion(qid) {
          const s = get()
          log('question_skipped', { id: qid })
          set({ answers: { ...s.answers, [qid]: { skipped: true } } })
          get().nextQuestion()
        },
        nextQuestion() {
          const s = get()
          const next = s.questionIndex + 1
          if (next >= QUESTIONS.length) {
            set({ questionIndex: next, ...withQuestionsFinished(s) })
            log('questions_finished', {
              correct: Object.values(get().answers).filter((a) => !a.skipped && a.correct).length,
            })
          } else {
            set({ questionIndex: next })
          }
        },

        setPanel(open, tab) {
          const s = get()
          if (tab && tab !== s.panelTab) log('panel_tab', { tab })
          set({ panelOpen: open, panelTab: tab ?? s.panelTab })
        },
        setPanelWidth: (panelWidth) => set({ panelWidth }),
        showSidebar(view) {
          const s = get()
          if (s.sidebarOpen && s.sidebarView === view) {
            set({ sidebarOpen: false })
          } else {
            set({ sidebarOpen: true, sidebarView: view })
            log('sidebar_view', { view })
          }
        },
        setActiveFile(path) {
          const s = get()
          set({
            activeFile: path,
            openTabs: s.openTabs.includes(path) ? s.openTabs : [...s.openTabs, path],
            showDiff: path === 'library.py' ? s.showDiff : false,
          })
        },
        closeTab(path) {
          const s = get()
          const openTabs = s.openTabs.filter((t) => t !== path)
          if (openTabs.length === 0) return // Keep one tab open, so there's no empty editor state to design.
          set({ openTabs, activeFile: s.activeFile === path ? openTabs[openTabs.length - 1] : s.activeFile })
        },
        setShowDiff(on, via = 'toolbar') {
          const s = get()
          log('diff_toggled', { on, via })
          set({ showDiff: on, activeFile: 'library.py' })
          if (on && s.phase === 'done') ([1, 2, 3] as ChangeId[]).forEach((id) => get().viewChange(id, 'diff'))
        },
        dismissToast(action) {
          log('toast_action', { action })
          set({ toast: false })
          if (action === 'review') {
            set({ panelOpen: true, panelTab: 'review', sidebarOpen: true, sidebarView: 'changenotes' })
          }
        },

        sendChat(raw, opts) {
          const text = raw.trim()
          if (!text) return
          const s = get()
          if (opts?.chip) log('chip_clicked', { text })
          const intent = matchIntent(text)
          log('chat_sent', { text, matched_intent: intent?.id ?? 'fallback' })
          const context = s.selection
            ? `library.py · lines ${s.selection.start}–${s.selection.end}`
            : undefined
          set({
            chatDraft: '',
            panelOpen: true,
            panelTab: 'ask',
            chat: [
              ...s.chat,
              { id: chatId++, role: 'user', text, at: Date.now(), context },
              assistantReply(intent?.response ?? nearestChangeSummary(), { action: intent?.action }),
            ],
          })
        },
        askAboutHover(token) {
          log('hover_link_clicked', { token, link: 'ask_in_panel' })
          set({ panelOpen: true, panelTab: 'ask', chatDraft: `What does ${token} do?` })
        },
        explainHoverSimpler(token) {
          const s = get()
          const def = hoverByToken(token)
          log('hover_link_clicked', { token, link: 'explain_simpler' })
          set({
            panelOpen: true,
            panelTab: 'ask',
            chat: [
              ...s.chat,
              { id: chatId++, role: 'user', text: `Explain ${token} simpler`, at: Date.now() },
              assistantReply(def?.simpler ?? nearestChangeSummary()),
            ],
          })
        },
        setDraft: (chatDraft) => set({ chatDraft }),
        setCursor: (line, col) => set({ cursor: { line, col } }),
        setSelection: (selection) => set({ selection }),

        recordPractice(results) {
          const s = get()
          const byConcept = new Map<string, boolean[]>()
          results.forEach((r) => byConcept.set(r.conceptId, [...(byConcept.get(r.conceptId) ?? []), r.correct]))
          const mastery = { ...s.mastery }
          const changes: MasteryChange[] = []
          byConcept.forEach((outcomes, conceptId) => {
            const from = (mastery[conceptId] ?? 0) as Level
            const to = (outcomes.every(Boolean) ? Math.min(4, from + 1) : from) as Level
            mastery[conceptId] = to
            changes.push({ conceptId, from, to })
          })
          const correct = results.filter((r) => r.correct).length
          set({
            mastery,
            questionsAnswered: s.questionsAnswered + results.length,
            questionsCorrect: s.questionsCorrect + correct,
            todayAnswered: s.todayAnswered + results.length,
            todayCorrect: s.todayCorrect + correct,
          })
          log('practice_completed', { score: correct, total: results.length })
          return changes
        },
        completeLesson(results) {
          const changes = get().recordPractice(results)
          const score = results.filter((r) => r.correct).length
          log('lesson_completed', { score, total: results.length })
          set({ lessonDone: true, lessonScore: score, lessonChanges: changes, streak: get().streak + 1 })
        },
        addNotebook(nb) {
          set({ customNotebooks: [...get().customNotebooks, nb] })
          log('notebook_created', { type: nb.type, concepts: nb.conceptIds.length, examDate: nb.examDate ?? null })
        },
        openNewNotebook(preset) {
          log('new_notebook_opened', { preset: preset ?? null })
          set({ newNotebook: { preset } })
        },
        closeNewNotebook: () => set({ newNotebook: null }),

        setParticipant: (participantId) => set({ participantId }),
        markTask(n) {
          const s = get()
          if (s.task === n) {
            logEvent('task_end', { n })
            set({ task: null })
            return
          }
          if (s.task != null) logEvent('task_end', { n: s.task })
          set({ task: n })
          logEvent('task_start', { n })
        },
        setVariant(key, value) {
          set({ variants: { ...get().variants, [key]: value } })
          log('variant_changed', { [key]: value })
        },
        jumpToState(name) {
          const s = get()
          log('state_jump', { state: name })
          const after = get()
          set({
            ...buildFixture(name, {
              participantId: s.participantId,
              task: s.task,
              variants: s.variants,
              events: after.events,
            }),
            jump: null,
            selection: null,
            clipFlash: null,
            noteFocus: null,
          })
        },

        // ---------- Onboarding (Theme 2) ----------

        finishOnboarding() {
          const s = get()
          log('onboarding_finished', {})
          const first = conceptsTaught(TODAY_LECTURE_ID)[0]
          set({
            onboarded: true,
            frontApp: 'notebook',
            open: { ...s.open, notebook: true },
            notebookRoute: TODAY_LECTURE_ROUTE,
            ...(first ? withPracticeStart(s, first) : {}),
          })
        },
        restartOnboarding() {
          log('onboarding_restarted', {})
          set({ onboarded: false })
        },

        // ---------- Lecture practice panel (Theme 4) ----------

        openPractice(conceptId, via) {
          const s = get()
          log('practice_panel_opened', { concept: conceptId, via })
          if (s.practiceConcept === conceptId && s.practiceTurns.length > 0) {
            set({ practiceOpen: true })
            return
          }
          set(withPracticeStart(s, conceptId))
          const q = get().practiceQuestionId
          if (q) log('practice_question_shown', { id: q, concept: conceptId })
        },
        closePractice() {
          log('practice_panel_closed', { concept: get().practiceConcept })
          set({ practiceOpen: false })
        },
        setPracticeDraft: (practiceDraft) => set({ practiceDraft }),

        submitPractice(raw) {
          const text = raw.trim()
          if (!text) return
          const s = get()
          const conceptId = s.practiceConcept
          const question = LESSON_BY_ID.get(s.practiceQuestionId ?? '')
          if (!conceptId || !question) return

          const { grade, feedback } = gradeResponse(question, text)
          const reps = s.reps[conceptId] ?? 0
          const nextReps = grade === 'correct' ? Math.min(REPS_TO_ADVANCE, reps + 1) : reps
          const streak = grade === 'correct' ? 0 : (s.wrongStreak[conceptId] ?? 0) + 1

          log('practice_response', {
            id: question.id,
            concept: conceptId,
            grade,
            reps: nextReps,
            of: REPS_TO_ADVANCE,
            chars: text.length,
          })

          const turns: PracticeTurn[] = [
            ...s.practiceTurns,
            turn('student', text, { questionId: question.id, grade }),
            turn('coach', feedback, { questionId: question.id, grade }),
          ]

          const base: Partial<Persisted> = {
            practiceDraft: '',
            reps: { ...s.reps, [conceptId]: nextReps },
            wrongStreak: { ...s.wrongStreak, [conceptId]: streak },
            questionsAnswered: s.questionsAnswered + 1,
            questionsCorrect: s.questionsCorrect + (grade === 'correct' ? 1 : 0),
            todayAnswered: s.todayAnswered + 1,
            todayCorrect: s.todayCorrect + (grade === 'correct' ? 1 : 0),
          }

          if (grade !== 'correct') {
            // Mastery learning: stay on this question and let them try again.
            set({ ...base, practiceTurns: turns })
            if (streak >= STUCK_AFTER) log('student_stuck', { concept: conceptId, tries: streak })
            return
          }

          if (nextReps >= REPS_TO_ADVANCE) {
            const concept = conceptById(conceptId)
            const nextConcept = conceptsTaught(TODAY_LECTURE_ID).find(
              (id) => id !== conceptId && !s.advanced.includes(id),
            )
            const closing = nextConcept
              ? `That's ${REPS_TO_ADVANCE} out of ${REPS_TO_ADVANCE} on **${concept?.name}**. Ready for **${conceptById(nextConcept)?.name}**?`
              : `That's ${REPS_TO_ADVANCE} out of ${REPS_TO_ADVANCE} on **${concept?.name}**, and that's every concept in this lecture. Nicely done.`
            log('concept_advanced', { concept: conceptId, next: nextConcept ?? null })
            set({
              ...base,
              advanced: s.advanced.includes(conceptId) ? s.advanced : [...s.advanced, conceptId],
              practiceTurns: [...turns, turn('coach', closing)],
              practiceQuestionId: null,
            })
            return
          }

          // Correct, but not done: move to a fresh question on the same concept.
          const asked = [...s.practiceAsked]
          const nextQ = pickQuestion(conceptId, asked)
          if (nextQ) {
            asked.push(nextQ.id)
            log('practice_question_shown', { id: nextQ.id, concept: conceptId })
          }
          set({
            ...base,
            practiceAsked: asked,
            practiceQuestionId: nextQ?.id ?? null,
            practiceTurns: nextQ ? [...turns, turn('question', nextQ.prompt, { questionId: nextQ.id })] : turns,
          })
        },

        showPracticeHint() {
          const s = get()
          const question = LESSON_BY_ID.get(s.practiceQuestionId ?? '')
          if (!question) return
          log('practice_hint', { id: question.id, concept: s.practiceConcept })
          set({
            hinted: s.hinted.includes(question.id) ? s.hinted : [...s.hinted, question.id],
            practiceTurns: [...s.practiceTurns, turn('coach', `**Hint.** ${question.hint}`)],
          })
        },

        skipPracticeQuestion() {
          const s = get()
          const conceptId = s.practiceConcept
          if (!conceptId) return
          log('practice_question_skipped', { id: s.practiceQuestionId, concept: conceptId })
          const asked = [...s.practiceAsked]
          const nextQ = pickQuestion(conceptId, asked)
          if (nextQ) asked.push(nextQ.id)
          set({
            practiceAsked: asked,
            practiceQuestionId: nextQ?.id ?? null,
            practiceDraft: '',
            practiceTurns: [
              ...s.practiceTurns,
              turn('coach', 'No problem — here is a different one.'),
              ...(nextQ ? [turn('question', nextQ.prompt, { questionId: nextQ.id })] : []),
            ],
          })
        },

        advanceConcept() {
          const s = get()
          const next = conceptsTaught(TODAY_LECTURE_ID).find(
            (id) => id !== s.practiceConcept && !s.advanced.includes(id),
          )
          if (!next) {
            set({ practiceQuestionId: null })
            return
          }
          log('practice_next_concept', { concept: next })
          set(withPracticeStart(s, next))
        },

        // ---------- Assignment and the review prompts (flow steps 2–3) ----------

        askReviewPrompt(when) {
          log('review_prompt_shown', { when, mode: get().variants.aiMode })
          set({ reviewPrompt: when })
        },
        resolveReviewPrompt(action, conceptId) {
          const s = get()
          const when = s.reviewPrompt
          log('review_prompt_action', { when, action, concept: conceptId ?? null })
          set({
            reviewPrompt: null,
            reviewPromptSeen: when ? { ...s.reviewPromptSeen, [when]: true } : s.reviewPromptSeen,
          })
          if (action === 'review' && conceptId) {
            get().openNotesForConcept(conceptId, 'review_prompt')
          } else if (action === 'skip' && when === 'before') {
            get().openAssignment('review_prompt')
          }
        },
        openAssignment(via) {
          const s = get()
          log('assignment_opened', { id: ASSIGNMENT.id, via })
          set({
            assignmentOpened: true,
            frontApp: 'ide',
            open: { ...s.open, ide: true },
            activeFile: ASSIGNMENT.path,
            openTabs: s.openTabs.includes(ASSIGNMENT.path) ? s.openTabs : [ASSIGNMENT.path, ...s.openTabs],
            fileEdits: { ...s.fileEdits, [ASSIGNMENT.path]: s.fileEdits[ASSIGNMENT.path] ?? ASSIGNMENT.starterCode },
            bounceNonce: s.bounceNonce + 1,
          })
        },
        setFileContent(path, text) {
          set({ fileEdits: { ...get().fileEdits, [path]: text } })
        },

        // ---------- AI-usage detection (flow step 5) ----------

        detectAi(via) {
          const s = get()
          if (s.aiDetected) return
          log('ai_usage_detected', { via, mode: s.variants.aiMode })
          set({ aiDetected: true, aiDetectedAt: Date.now() })
          // Option A asks straight away. Option B waits for submission.
          if (s.variants.aiMode === 'A') get().openClarify('on_the_spot')
        },
        openClarify(via) {
          const s = get()
          log('clarify_opened', { via, mode: s.variants.aiMode })
          set({ clarifyOpen: true, clarifyIndex: 0, clarifySkipped: false })
        },
        answerClarify(raw) {
          const text = raw.trim()
          if (!text) return
          const s = get()
          const q = CLARIFY_QUESTIONS[s.clarifyIndex]
          if (!q) return
          const lower = text.toLowerCase()
          const ok = q.accept.some((a) => lower.includes(a.toLowerCase()))
          const current = (s.mastery[q.conceptId] ?? 0) as Level
          log('clarify_answered', { id: q.id, ok, mode: s.variants.aiMode, index: s.clarifyIndex })
          const last = s.clarifyIndex + 1 >= CLARIFY_QUESTIONS.length
          set({
            clarifyAnswers: { ...s.clarifyAnswers, [q.id]: { text, ok } },
            clarifyIndex: ok || last ? s.clarifyIndex + (last ? 0 : 1) : s.clarifyIndex,
            clarifyDone: last && ok,
            // A good explanation is a comprehension check, so it moves mastery like the editor questions do.
            mastery: ok ? { ...s.mastery, [q.conceptId]: Math.min(4, current + 1) as Level } : s.mastery,
            questionsAnswered: s.questionsAnswered + 1,
            questionsCorrect: s.questionsCorrect + (ok ? 1 : 0),
            todayAnswered: s.todayAnswered + 1,
            todayCorrect: s.todayCorrect + (ok ? 1 : 0),
          })
          if (last && ok) log('clarify_finished', { mode: s.variants.aiMode, answered: CLARIFY_QUESTIONS.length })
        },
        skipClarify() {
          const s = get()
          log('clarify_skipped', { mode: s.variants.aiMode, index: s.clarifyIndex })
          set({ clarifyOpen: false, clarifySkipped: true })
          if (s.variants.aiMode === 'B') get().submitAssignment()
        },
        closeClarify() {
          set({ clarifyOpen: false })
        },
        submitAssignment() {
          const s = get()
          // Option B puts the clarifying questions in front of submission.
          if (s.variants.aiMode === 'B' && s.aiDetected && !s.clarifyDone && !s.clarifySkipped) {
            get().openClarify('at_submission')
            return
          }
          log('assignment_submitted', {
            id: ASSIGNMENT.id,
            mode: s.variants.aiMode,
            ai_detected: s.aiDetected,
            explained: s.clarifyDone,
            flagged: s.aiDetected && !s.clarifyDone,
          })
          set({ assignmentSubmitted: true, clarifyOpen: false, notebookDot: true })
          // Flow step 3: the same prompt again, after the assignment.
          get().askReviewPrompt('after')
          get().openNotebook('after_submit')
        },

        // ---------- Editor → notebook (Theme 5) ----------

        addClip(clip) {
          const s = get()
          const id = `clip-${s.clips.length + 1}-${Date.now().toString(36)}`
          log('clip_added', { concept: clip.conceptId, item: clip.itemId, lines: clip.lines })
          set({ clips: [...s.clips, { ...clip, id, at: Date.now() }], clipFlash: id, notebookDot: true })
          setTimeout(() => {
            if (useStore.getState().clipFlash === id) useStore.setState({ clipFlash: null })
          }, 4000)
        },
        removeClip(id) {
          log('clip_removed', { id })
          set({ clips: get().clips.filter((c) => c.id !== id) })
        },
        openNotesForConcept(conceptId, via) {
          const s = get()
          const concept = conceptById(conceptId)
          const route = concept ? `/course/${concept.courseId}/item/${concept.itemId}` : TODAY_LECTURE_ROUTE
          log('notes_opened_for_concept', { concept: conceptId, via })
          set({
            frontApp: 'notebook',
            open: { ...s.open, notebook: true },
            bounceNonce: s.bounceNonce + 1,
            notebookDot: false,
          })
          get().navNotebook(route)
          get().openPractice(conceptId, via)
        },

        /**
         * "See the notes" from a practice question: scroll the lecture to the section that
         * taught the concept and highlight it, without disturbing the question in the panel.
         */
        focusNotesSection(conceptId, via) {
          const s = get()
          const current = /\/item\/([^/]+)/.exec(s.notebookRoute)?.[1]
          const found = sectionForConcept(conceptId, current)
          if (!found) return
          const concept = conceptById(conceptId)
          const route = `/course/${concept?.courseId ?? 'cs120'}/item/${found.itemId}`
          log('notes_section_focused', { concept: conceptId, section: found.section.id, via })
          set({
            frontApp: 'notebook',
            open: { ...s.open, notebook: true },
            notebookDot: false,
            noteFocus: { sectionId: found.section.id, nonce: (s.noteFocus?.nonce ?? 0) + 1 },
          })
          if (s.notebookRoute !== route) get().navNotebook(route)
        },

        // ---------- Weekly review (Theme 6) ----------

        beginWeekly() {
          const s = get()
          if (s.weeklyTaskIds.length > 0) return
          const tasks = tasksForMastery(WEEKLY_REVIEW.conceptIds, s.mastery)
          log('weekly_review_started', { tasks: tasks.length, concepts: tasks.map((t) => t.conceptId) })
          set({ weeklyTaskIds: tasks.map((t) => t.id), weeklyIndex: 0 })
        },
        setWeeklyAnswer(taskId, text) {
          set({ weeklyAnswers: { ...get().weeklyAnswers, [taskId]: text } })
        },
        nextWeeklyTask() {
          const s = get()
          const tasks = activeWeeklyTasks(s)
          const task = tasks[s.weeklyIndex]
          if (!task) return
          const answer = (s.weeklyAnswers[task.id] ?? '').toLowerCase()
          const pass = task.needs.every((n) => answer.includes(n.toLowerCase()))
          log('weekly_task_answered', { id: task.id, concept: task.conceptId, pass, index: s.weeklyIndex })
          set({
            weeklyResults: { ...s.weeklyResults, [task.id]: pass },
            weeklyIndex: s.weeklyIndex + 1,
          })
          if (s.weeklyIndex + 1 >= tasks.length) get().finishWeekly()
        },
        finishWeekly() {
          const s = get()
          const tasks = activeWeeklyTasks(s)
          const results = { ...s.weeklyResults }
          const mastery = { ...s.mastery }
          tasks.forEach((t) => {
            const current = (mastery[t.conceptId] ?? 0) as Level
            if (results[t.id]) mastery[t.conceptId] = Math.min(4, current + 1) as Level
          })
          const passed = tasks.filter((t) => results[t.id]).length
          log('weekly_review_finished', {
            passed,
            total: tasks.length,
            paste_blocked: s.pasteBlocked,
            missed: tasks.filter((t) => !results[t.id]).map((t) => t.conceptId),
          })
          set({ weeklyDone: true, mastery, streak: s.streak + 1 })
        },
        notePasteBlocked(where) {
          const s = get()
          log('paste_blocked', { where, count: s.pasteBlocked + 1 })
          set({ pasteBlocked: s.pasteBlocked + 1 })
        },
      }
    },
    {
      name: STORE_KEY,
      version: 2,
      // Iteration 2 reshaped the state, so an older saved session starts fresh but keeps its log.
      migrate: (persisted, version) => {
        const saved = persisted as Persisted
        if (version >= 2) return saved as Store
        return {
          ...initialPersisted(),
          participantId: saved?.participantId ?? '',
          events: saved?.events ?? [],
          variants: { ...initialPersisted().variants, ...(saved?.variants ?? {}) },
        } as unknown as Store
      },
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { bounceNonce, jump, cursor, selection, newNotebook, clipFlash, noteFocus, ...rest } = s
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as unknown as Store
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        chatId = Math.max(0, ...state.chat.map((m) => m.id)) + 1
        turnId = Math.max(0, ...state.practiceTurns.map((t) => t.id)) + 1
        // Restored turns shouldn't replay their typing animation.
        if (state.practiceTurns.some((t) => !t.instant)) {
          useStore.setState({ practiceTurns: state.practiceTurns.map((t) => ({ ...t, instant: true })) })
        }
        // A reload mid-edit would strand the timers, so finish the session straight away.
        if (state.phase === 'running') {
          useStore.setState(withSessionDone(state, state.prompt))
        }
      },
    },
  ),
)

export function logEvent(event: string, payload: Record<string, unknown> = {}) {
  if (persistPaused) return
  const s = useStore.getState()
  const entry: LogEvent = { ts: Date.now(), participantId: s.participantId, task: s.task, event, payload }
  useStore.setState({ events: [...s.events, entry] })
}

function reloadAtStart() {
  // Stop the store and any running agent timers from writing to storage before the reload.
  persistPaused = true
  window.location.hash = '#/'
  window.location.reload()
}

/** Between participants: back to the start state, keeping the log and variant settings. */
export function startNextSession() {
  const { task } = useStore.getState()
  if (task != null) logEvent('task_end', { n: task })
  logEvent('session_ended')
  const { variants, events } = useStore.getState()
  useStore.setState(buildFixture('start', { participantId: '', task: null, variants, events }))
  reloadAtStart()
}

/** Erases everything, including the log and variant settings. */
export function resetPrototype() {
  safeStorage.removeItem(STORE_KEY)
  reloadAtStart()
}

// ---------- Selectors ----------

export const isReviewComplete = (s: Pick<Persisted, 'reviewed' | 'questionsFinished'>) =>
  s.questionsFinished || (s.reviewed[1] && s.reviewed[2] && s.reviewed[3])

export const unreviewedCount = (s: Pick<Persisted, 'reviewed'>) =>
  ([1, 2, 3] as ChangeId[]).filter((id) => !s.reviewed[id]).length

export const familiarCount = (mastery: Record<string, Level>) =>
  CONCEPTS.filter((c) => (mastery[c.id] ?? -1) >= 2).length

export const visibleConcepts = (mastery: Record<string, Level>) =>
  CONCEPTS.filter((c) => mastery[c.id] !== undefined)

export const correctCount = (answers: Record<string, Answer>) =>
  Object.values(answers).filter((a) => !a.skipped && a.correct).length

/** This week's review tasks, chosen for the student's current mastery. */
export const weeklyTasks = (mastery: Record<string, Level>) =>
  tasksForMastery(WEEKLY_REVIEW.conceptIds, mastery)

/**
 * The tasks this student is actually taking. Once the review starts the set is fixed, so a
 * mastery change part-way through can't swap a question or mis-report which one was missed.
 */
export function activeWeeklyTasks(s: Pick<Persisted, 'weeklyTaskIds' | 'mastery'>) {
  if (s.weeklyTaskIds.length === 0) return weeklyTasks(s.mastery)
  return s.weeklyTaskIds.map((id) => REVIEW_TASKS.find((t) => t.id === id)).filter((t) => t !== undefined)
}

export const weeklyTaskById = (id: string) => REVIEW_TASKS.find((t) => t.id === id)

/** The live reason ChangeNotes thinks a student needs support (Theme 3). */
export function supportSignals(s: Persisted): SupportSignal[] {
  const out: SupportSignal[] = []

  // 1. Stuck: several non-correct answers in a row on one concept.
  Object.entries(s.wrongStreak).forEach(([conceptId, tries]) => {
    if (tries >= STUCK_AFTER) {
      out.push({
        kind: 'stuck',
        conceptId,
        detail: `${tries} tries in a row on this concept in the practice panel without landing it.`,
      })
    }
  })

  // 2. AI usage detected in their code.
  if (s.aiDetected) {
    const explained = s.clarifyDone
    ASSIGNMENT.conceptIds.slice(0, 1).forEach((conceptId) =>
      out.push({
        kind: 'ai',
        conceptId,
        detail: explained
          ? 'AI-written code in In-class 6, which you explained in your own words.'
          : 'AI-written code in In-class 6 that has not been explained yet.',
      }),
    )
  }

  // 3. Mastery still low on a concept this lecture taught.
  conceptsTaught(TODAY_LECTURE_ID).forEach((conceptId) => {
    const level = s.mastery[conceptId] ?? 0
    if (level < 2 && !out.some((sig) => sig.conceptId === conceptId && sig.kind === 'mastery')) {
      out.push({
        kind: 'mastery',
        conceptId,
        detail: `Covered in today's lecture, and still below Familiar.`,
      })
    }
  })

  // 4. Patterns from the weekly review.
  if (s.weeklyDone) {
    activeWeeklyTasks(s).forEach((task) => {
      if (!s.weeklyResults[task.id]) {
        out.push({ kind: 'weekly', conceptId: task.conceptId, detail: task.failNote })
      }
    })
  }

  return out
}
