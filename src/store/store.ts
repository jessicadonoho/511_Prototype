import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { AGENT_SCRIPT, agentById, changeById, type AgentId } from '../data/changes'
import { EDIT_FRAMES, NO_DECISIONS, type ChangeId, type Decisions } from '../data/code'
import { matchIntent, FALLBACK_INTRO } from '../data/chat'
import { CONCEPTS, SEED_MASTERY, SEED_RECENT, type Level } from '../data/courses'
import { hoverByToken } from '../data/hovers'
import { DEFAULT_QUESTION_POSITION, QUESTIONS } from '../data/questions'
import { SEED_CORRECT, SEED_QUESTIONS, SEED_STREAK } from '../data/progress'

export const STORE_KEY = 'changenotes-proto-v1'
export const DEFAULT_PROMPT = 'Add a function that finds the top 3 users with the most checkouts.'

export type AppId = 'ide' | 'notebook'
export type SidebarView = 'explorer' | 'search' | 'scm' | 'extensions' | 'changenotes'
export type PanelTab = 'review' | 'ask' | 'history'
export type BottomTab = 'terminal' | 'problems' | 'output'
export type ChangeVia = 'gutter' | 'lens' | 'sidebar' | 'nav' | 'diff' | 'panel' | 'scroll' | 'notebook'
export type NotebookVia = 'statusbar' | 'panel_header' | 'panel_footer' | 'panel_idle' | 'summary_card' | 'dock'

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
}
export interface MasteryChange {
  conceptId: string
  from: Level
  to: Level
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
}

interface Transient {
  bounceNonce: number
  jump: { id: ChangeId; nonce: number; flashOnly?: boolean } | null
  cursor: { line: number; col: number }
  selection: { start: number; end: number; text: string } | null
  newNotebook: null | { preset?: 'midterm' }
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
}

export type Store = Persisted & Transient & Actions

export const initialPersisted = (): Persisted => ({
  frontApp: 'ide',
  open: { ide: true, notebook: false },
  maximized: { ide: false, notebook: false },
  notebookRoute: '/home',
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
  panelOpen: true,
  panelTab: 'review',
  panelWidth: 320,
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
  variants: { questionPosition: DEFAULT_QUESTION_POSITION, toast: true, hoverCards: true },
  events: [],
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
    panelOpen: true,
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

export type FixtureName = 'start' | 'afterT1' | 'afterT4' | 'notebookPost'

/** Starting states for facilitator jumps and five-second screens. Keeps the log and test settings. */
export function buildFixture(name: FixtureName, keep?: Pick<Persisted, 'participantId' | 'task' | 'variants' | 'events'>): Persisted {
  let s: Persisted = { ...initialPersisted(), ...(keep ?? {}) }
  if (name === 'start') return s
  s = { ...s, ...withSessionDone(s, DEFAULT_PROMPT) }
  if (name === 'afterT1') return s
  s = { ...s, ...withAnswer(s, 'q1', 1, false), toast: false }
  s = { ...s, ...withAnswer(s, 'q2', 0, false) }
  s = { ...s, ...withAnswer(s, 'q3', 1, false) }
  s = { ...s, ...withQuestionsFinished(s), questionIndex: 3, viewed: { 1: true, 2: true, 3: true } }
  if (name === 'afterT4') return s
  return {
    ...s,
    decisions: { 1: 'accepted', 2: 'accepted', 3: 'accepted' },
    reviewed: { 1: true, 2: true, 3: true },
    frontApp: 'notebook',
    open: { ide: true, notebook: true },
    notebookRoute: '/session/today',
    notebookDot: false,
    recent: ['/session/today', ...s.recent].slice(0, 3),
  }
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
          const relevant = isReviewComplete(s) ? '/session/today' : '/home'
          // The dock keeps your place unless there's something new to show.
          const keepPlace = via === 'dock' && s.open.notebook && !s.notebookDot
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
          })
        },
      }
    },
    {
      name: STORE_KEY,
      version: 1,
      // Browsers that already ran the prototype saved the old bottom default. Move them to top and keep their log.
      migrate: (persisted, version) => {
        const saved = persisted as Persisted
        return (version < 1 ? { ...saved, variants: { ...saved.variants, questionPosition: 'top' } } : saved) as Store
      },
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { bounceNonce, jump, cursor, selection, newNotebook, ...rest } = s
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as unknown as Store
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        chatId = Math.max(0, ...state.chat.map((m) => m.id)) + 1
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
