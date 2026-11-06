import { useEffect, useMemo, useRef, useState } from 'react'
import { InlineRich, Logo, RichText, CodeBlock } from '../components/common'
import { CHANGES, agentById } from '../data/changes'
import type { ChangeId } from '../data/code'
import { CHAT_CHIPS } from '../data/chat'
import { SEED_HISTORY, TODAY_SESSION_ID } from '../data/history'
import { ADDED_TO_NOTEBOOK, ALL_RIGHT_COPY, QUESTIONS } from '../data/questions'
import { TODAY_LABEL, conceptById } from '../data/courses'
import { useFrozen } from '../lib/hooks'
import { correctCount, logEvent, startNextSession, useStore, type ChatMsg } from '../store/store'

export function agentLabel(agent: Parameters<typeof agentById>[0], custom: string) {
  return agent === 'other' ? custom || 'Custom agent' : agentById(agent).short
}

export function ChangeNotesPanel({ width }: { width: number }) {
  const phase = useStore((s) => s.phase)
  const tab = useStore((s) => s.panelTab)
  const agent = useStore((s) => s.agent)
  const customAgent = useStore((s) => s.customAgent)
  const setPanel = useStore((s) => s.setPanel)
  const stepChange = useStore((s) => s.stepChange)
  const openNotebook = useStore((s) => s.openNotebook)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const sessionDone = phase === 'done'
  const title = sessionDone ? `Session · ${TODAY_LABEL} · ${agentLabel(agent, customAgent)}` : 'No active session'

  return (
    <aside
      className="panel-slide flex h-full shrink-0 flex-col border-l border-vs-line bg-vs-side text-vs-text"
      style={{ width }}
      aria-label="ChangeNotes panel"
    >
      <header className="shrink-0 border-t-2 border-turq px-2.5 pt-1.5 pb-1">
        <div className="flex items-center gap-1">
          <Logo size={15} />
          <span className="text-[12.5px] font-semibold text-white">ChangeNotes</span>
          <span className="flex-1" />
          <PanelIcon label="Previous change (Alt+[)" disabled={!sessionDone} onClick={() => stepChange(-1)}>↑</PanelIcon>
          <PanelIcon label="Next change (Alt+])" disabled={!sessionDone} onClick={() => stepChange(1)}>↓</PanelIcon>
          <button
            className="ml-0.5 rounded border border-turq/60 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-turq hover:bg-turq/15"
            title="Open ChangeNotes Notebook"
            onClick={() => openNotebook('panel_header')}
          >
            📓 Notebook ↗
          </button>
          <div className="relative">
            <PanelIcon
              label="More options"
              onClick={() => {
                setMenuOpen(!menuOpen)
                setSettingsOpen(false)
              }}
            >
              ⋯
            </PanelIcon>
            {menuOpen && (
              <div className="absolute top-6 right-0 z-30 w-36 rounded border border-vs-line bg-[#2d2d30] py-1 text-[12px] shadow-xl" role="menu">
                <button
                  role="menuitem"
                  className="block w-full px-3 py-1 text-left hover:bg-[#094771]"
                  onClick={() => {
                    logEvent('dead_click', { target: 'panel_settings' })
                    setSettingsOpen(true)
                  }}
                >
                  Settings
                </button>
                {settingsOpen && <ResetSessionItem />}
                <button
                  role="menuitem"
                  className="block w-full px-3 py-1 text-left hover:bg-[#094771]"
                  onClick={() => {
                    setPanel(true, 'history')
                    setMenuOpen(false)
                  }}
                >
                  Prompt history
                </button>
              </div>
            )}
          </div>
          <PanelIcon label="Collapse panel" onClick={() => setPanel(false)}>›</PanelIcon>
        </div>
        <div className="truncate pt-0.5 text-[11px] text-vs-dim">{title}</div>
      </header>

      <div className="flex shrink-0 border-b border-vs-line text-[11.5px]" role="tablist">
        {(['review', 'ask', 'history'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`flex-1 border-b-2 py-1 capitalize ${tab === t ? 'border-turq text-white' : 'border-transparent text-vs-dim hover:text-white'}`}
            onClick={() => setPanel(true, t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {tab === 'review' && (sessionDone ? <ReviewTab /> : <IdleState />)}
        {tab === 'ask' && <AskTab />}
        {tab === 'history' && <HistoryTab />}
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-vs-line px-2.5 py-1">
        <p className="min-w-0 flex-1 text-[10px] leading-tight text-vs-dim">
          🔒 Your instructor sees class-level concept trends only, never your prompts or chats.
        </p>
        <button
          className="shrink-0 rounded px-1.5 py-1 text-[11px] whitespace-nowrap text-turq hover:bg-turq/15"
          onClick={() => openNotebook('panel_footer')}
        >
          Open Notebook ↗
        </button>
      </footer>
    </aside>
  )
}

/** The facilitator's reset between participants, tucked under Settings so it stays out of a participant's way. */
function ResetSessionItem() {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 4000)
    return () => clearTimeout(t)
  }, [confirming])

  return (
    <button
      role="menuitem"
      className="block w-full px-3 py-1 text-left text-[11px] text-vs-dim hover:bg-[#094771] hover:text-white"
      onClick={() => (confirming ? startNextSession() : setConfirming(true))}
    >
      {confirming ? 'Click again to reset' : 'Reset session'}
    </button>
  )
}

function PanelIcon({ label, children, onClick, disabled }: { label: string; children: React.ReactNode; onClick(): void; disabled?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded text-[13px] text-vs-text hover:bg-white/10 disabled:opacity-35"
    >
      {children}
    </button>
  )
}

function IdleState() {
  const openNotebook = useStore((s) => s.openNotebook)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <svg width="72" height="60" viewBox="0 0 72 60" aria-hidden="true">
        <rect x="6" y="6" width="44" height="44" rx="4" fill="#2EC4B6" opacity=".2" />
        <rect x="16" y="12" width="44" height="44" rx="4" fill="#1E2A44" stroke="#2EC4B6" strokeWidth="1.5" />
        <path d="M24 26h28M24 34h20M24 42h24" stroke="#2EC4B6" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      </svg>
      <p className="text-[12.5px] leading-relaxed text-vs-text">
        Waiting for your next AI session. ChangeNotes will highlight what changed and help you understand it.
      </p>
      <button className="text-[12px] text-turq underline underline-offset-2" onClick={() => openNotebook('panel_idle')}>
        Open Notebook ↗
      </button>
    </div>
  )
}

// ---------- Review ----------

function ReviewTab() {
  const frozen = useFrozen()
  const prompt = useStore((s) => s.prompt)
  const reviewed = useStore((s) => s.reviewed)
  const decisions = useStore((s) => s.decisions)
  const position = useStore((s) => s.variants.questionPosition)
  const finished = useStore((s) => s.questionsFinished)
  const jumpTo = useStore((s) => s.jumpTo)
  const decide = useStore((s) => s.decide)
  const undo = useStore((s) => s.undoDecision)
  const cardRef = useRef<HTMLDivElement>(null)
  const [hideBar, setHideBar] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (frozen === 'ide-question') cardRef.current?.scrollIntoView({ block: 'start' })
  }, [frozen])

  // Hide the sticky shortcut once the question card itself is on screen.
  useEffect(() => {
    if (!cardRef.current || !scrollRef.current) return
    const io = new IntersectionObserver(([e]) => setHideBar(e.isIntersecting), { root: scrollRef.current, threshold: 0.05 })
    io.observe(cardRef.current)
    return () => io.disconnect()
  }, [position])

  const card = (
    <div ref={cardRef} className="scroll-mt-1">
      <QuestionCard />
    </div>
  )

  return (
    <div ref={scrollRef} className="dark-scroll flex h-full flex-col gap-2 overflow-y-auto p-2.5">
      {position === 'top' && card}
      <blockquote className="border-l-2 border-vs-line pl-2 text-[12px] leading-snug text-vs-text italic">“{prompt}”</blockquote>
      {CHANGES.map((change) => {
        const warn = change.kind === 'assumption'
        const decision = decisions[change.id]
        return (
          <article
            key={change.id}
            className={`rounded border bg-[#1e1e1e] p-2 ${warn ? 'border-diff-warn/70' : 'border-vs-line'}`}
          >
            <div className="flex items-start gap-1.5">
              <span aria-hidden="true" className={`mt-px text-[12px] ${warn ? 'text-diff-warn' : 'text-diff-add'}`}>
                {warn ? '⚠' : '＋'}
              </span>
              <h3 className="min-w-0 flex-1 text-[12.5px] leading-snug font-semibold text-white">
                {change.id}. {change.label}
              </h3>
              <span className="text-[11px] whitespace-nowrap text-vs-dim" title={reviewed[change.id] ? 'Reviewed' : 'Not reviewed yet'}>
                {reviewed[change.id] ? '✓ Reviewed' : '○ To review'}
              </span>
            </div>
            <div className={`mt-0.5 text-[11px] ${warn ? 'text-diff-warn' : 'text-diff-add'}`}>{change.typeLabel}</div>
            <p className="mt-1 text-[12px] leading-snug text-vs-text">
              <InlineRich text={change.summary} />
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11.5px]">
              <button className="text-turq underline underline-offset-2 hover:text-white" onClick={() => jumpTo(change.id, 'panel')}>
                Jump to code
              </button>
              <span className="flex-1" />
              {decision ? (
                <>
                  <span className="text-vs-dim">{decision === 'accepted' ? '✓ Accepted' : '↩ Reverted'}</span>
                  <button className="text-turq underline underline-offset-2 hover:text-white" onClick={() => undo(change.id)}>
                    Undo
                  </button>
                </>
              ) : (
                <>
                  <button className="rounded bg-turq px-2 py-0.5 font-medium text-navy hover:bg-[#4fd4c8]" onClick={() => decide(change.id, 'accepted', 'panel')}>
                    Accept
                  </button>
                  <button className="rounded border border-vs-dim px-2 py-0.5 text-vs-text hover:bg-white/10" onClick={() => decide(change.id, 'reverted', 'panel')}>
                    Revert
                  </button>
                </>
              )}
            </div>
          </article>
        )
      })}
      {position === 'bottom' && card}
      {position === 'bottom' && !finished && !hideBar && (
        <button
          className="sticky -bottom-2.5 -mx-2.5 -mb-2.5 shrink-0 border-t border-turq bg-navy py-1.5 text-[12px] font-medium text-white hover:bg-[#2a3a5e]"
          onClick={() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          Check your understanding · ~1 min ↓
        </button>
      )}
    </div>
  )
}

function QuestionCard() {
  const frozen = useFrozen()
  const index = useStore((s) => s.questionIndex)
  const answers = useStore((s) => s.answers)
  const finished = useStore((s) => s.questionsFinished)
  const answerQuestion = useStore((s) => s.answerQuestion)
  const skip = useStore((s) => s.skipQuestion)
  const next = useStore((s) => s.nextQuestion)
  const jumpTo = useStore((s) => s.jumpTo)
  const openNotebook = useStore((s) => s.openNotebook)
  const [hintOpen, setHintOpen] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)

  useEffect(() => {
    setHintOpen(false)
    setHintUsed(false)
  }, [index])

  if (finished) {
    const correct = correctCount(answers)
    const skipped = Object.values(answers).filter((a) => a.skipped).length
    return (
      <section className="rounded border border-turq bg-navy p-2.5 text-white" aria-label="Your results">
        <div className="text-[13px] font-semibold">
          {correct}/{QUESTIONS.length} correct{skipped ? ` · ${skipped} skipped` : ''}
        </div>
        {correct === QUESTIONS.length && <p className="mt-1 text-[12px] leading-snug">{ALL_RIGHT_COPY}</p>}
        <p className="mt-1.5 text-[12px] leading-snug">Added to your Notebook:</p>
        <ul className="mt-0.5 list-disc pl-4 text-[12px] leading-snug italic">
          {ADDED_TO_NOTEBOOK.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <button
          className="mt-2 w-full rounded bg-turq py-1 text-[12.5px] font-semibold text-navy hover:bg-[#4fd4c8]"
          onClick={() => openNotebook('summary_card')}
        >
          Open in Notebook ↗
        </button>
      </section>
    )
  }

  const q = QUESTIONS[index]
  const answer = answers[q.id]
  const answered = answer && !answer.skipped ? answer : null

  return (
    <section
      className={`rounded border bg-[#1e1e1e] p-2.5 ${frozen === 'ide-question' ? 'border-turq ring-1 ring-turq' : 'border-turq/70'}`}
      aria-label="Check your understanding"
    >
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-[12.5px] font-semibold text-turq">Check your understanding</h3>
        <span className="text-[11px] text-vs-dim">~1 min</span>
      </div>
      <div className="mt-0.5 text-[11px] text-vs-dim">Question {index + 1} of {QUESTIONS.length}</div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-white">
        <InlineRich text={q.text} />
      </p>
      <div className="mt-2 flex flex-col gap-1" role="group" aria-label="Answer choices">
        {q.choices.map((choice, i) => {
          const picked = answered?.choice === i
          const isRight = answered && i === q.correct
          return (
            <button
              key={choice}
              disabled={Boolean(answered)}
              onClick={() => answerQuestion(q.id, i, hintUsed)}
              className={`rounded border px-2 py-1 text-left text-[12px] leading-snug text-vs-text disabled:cursor-default ${
                isRight
                  ? 'border-diff-add bg-diff-add/15'
                  : picked
                    ? 'border-[#e0897f] bg-[#e0897f]/15'
                    : 'border-vs-line enabled:hover:border-turq enabled:hover:bg-white/5'
              }`}
            >
              {isRight && <span aria-label="Correct answer">✓ </span>}
              {picked && !isRight && <span aria-label="Your answer">✗ </span>}
              <InlineRich text={choice} />
            </button>
          )
        })}
      </div>
      {!answered && (
        <div className="mt-2 flex items-center text-[11.5px]">
          <button
            className="text-turq underline underline-offset-2 hover:text-white"
            onClick={() => {
              setHintOpen(true)
              setHintUsed(true)
              logEvent('hint_used', { id: q.id })
            }}
          >
            Hint
          </button>
          <span className="flex-1" />
          <button className="text-vs-dim underline underline-offset-2 hover:text-white" onClick={() => skip(q.id)}>
            Skip
          </button>
        </div>
      )}
      {hintOpen && !answered && (
        <p className="mt-1.5 rounded bg-white/5 px-2 py-1 text-[12px] leading-snug text-vs-text">
          <InlineRich text={q.hint} />
        </p>
      )}
      {answered && (
        <div className="mt-2">
          <p className="text-[12px] leading-snug text-vs-text">
            <strong className={answered.correct ? 'text-diff-add' : 'text-[#f0a79f]'}>
              {answered.correct ? 'That’s right. ' : 'Not quite. Here’s why: '}
            </strong>
            <InlineRich text={q.explanation} />
          </p>
          {q.id === 'q3' && (
            <button className="mt-1.5 text-[12px] font-medium text-diff-warn underline underline-offset-2" onClick={() => jumpTo(2 as ChangeId, 'panel')}>
              Review change 2 →
            </button>
          )}
          <button className="mt-2 block w-full rounded bg-turq py-1 text-[12.5px] font-semibold text-navy hover:bg-[#4fd4c8]" onClick={next}>
            {index + 1 === QUESTIONS.length ? 'See results' : 'Next question'}
          </button>
        </div>
      )}
    </section>
  )
}

// ---------- Ask ----------

const STREAM_DELAY = 600
const WORD_MS = 25
const shownResponses = new Set<number>()

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const decisions = useStore((s) => s.decisions)
  const decide = useStore((s) => s.decide)
  const words = useMemo(() => msg.text.split(/(\s+)/), [msg.text])
  const total = words.length
  const compute = () => (msg.instant ? total : Math.floor((Date.now() - msg.at - STREAM_DELAY) / (WORD_MS / 2)))
  const [count, setCount] = useState(compute)

  useEffect(() => {
    if (count >= total) {
      if (!shownResponses.has(msg.id)) {
        shownResponses.add(msg.id)
        logEvent('chat_response_shown', { id: msg.id })
      }
      return
    }
    const t = setInterval(() => setCount(compute()), WORD_MS)
    return () => clearInterval(t)
  })

  if (msg.role === 'user') {
    return (
      <div className="ml-6 rounded bg-[#094771] px-2 py-1 text-[12px] leading-snug text-white">
        {msg.context && <div className="text-[10.5px] text-[#b9d9ee]">{msg.context}</div>}
        {msg.text}
      </div>
    )
  }
  if (count < 0) {
    return (
      <div className="flex gap-1 px-1 py-1" aria-label="ChangeNotes is typing">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-turq" />
        ))}
      </div>
    )
  }
  const done = count >= total
  const reverted = decisions[2] === 'reverted'
  return (
    <div className="text-[12px] leading-relaxed text-vs-text">
      <RichText text={words.slice(0, Math.max(count, 0)).join('')} />
      {done && msg.action === 'revert2' && (
        <button
          disabled={reverted}
          onClick={() => decide(2, 'reverted', 'chat')}
          className="mt-1 rounded border border-diff-warn px-2 py-0.5 text-[11.5px] text-diff-warn enabled:hover:bg-diff-warn/15 disabled:opacity-70"
        >
          {reverted ? '↩ Change reverted' : 'Revert this change'}
        </button>
      )}
    </div>
  )
}

function AskTab() {
  const chat = useStore((s) => s.chat)
  const draft = useStore((s) => s.chatDraft)
  const setDraft = useStore((s) => s.setDraft)
  const sendChat = useStore((s) => s.sendChat)
  const selection = useStore((s) => s.selection)
  const cursorLine = useStore((s) => s.cursor.line)
  const activeFile = useStore((s) => s.activeFile)
  const inputRef = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (draft) inputRef.current?.focus()
  }, [draft])

  // Keep the newest words in view while a response streams.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const t = setInterval(() => {
      const last = chat[chat.length - 1]
      if (last && Date.now() - last.at < 12000) el.scrollTop = el.scrollHeight
    }, 120)
    return () => clearInterval(t)
  }, [chat])

  const context = selection
    ? `${activeFile} · lines ${selection.start}–${selection.end}`
    : `${activeFile} · line ${cursorLine}`

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 truncate border-b border-vs-line px-2.5 py-1 text-[11px] text-vs-dim">
        Asking about: <span className="text-turq">{context}</span>
      </div>
      <div ref={scroller} className="dark-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5" aria-live="polite">
        {chat.length === 0 && (
          <p className="text-[12px] leading-relaxed text-vs-dim">
            Ask anything about this change. You can also select code in the editor and choose “Ask ChangeNotes.”
          </p>
        )}
        {chat.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
      </div>
      <div className="flex shrink-0 flex-wrap gap-1 px-2.5 pb-1.5">
        {CHAT_CHIPS.map((chip) => (
          <button
            key={chip}
            className="rounded-full border border-turq/50 px-2 py-0.5 text-[11px] text-[#9fdcd5] hover:bg-turq/15"
            onClick={() => sendChat(chip, { chip: true })}
          >
            {chip}
          </button>
        ))}
      </div>
      <form
        className="flex shrink-0 gap-1 border-t border-vs-line p-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          sendChat(draft)
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about this code…"
          aria-label="Ask about this code"
          className="min-w-0 flex-1 rounded border border-vs-line bg-[#3c3c3c] px-2 py-1 text-[12px] text-white placeholder:text-vs-dim"
        />
        <button type="submit" className="rounded bg-turq px-2.5 text-[12px] font-semibold text-navy hover:bg-[#4fd4c8]">
          Send
        </button>
      </form>
    </div>
  )
}

// ---------- History ----------

function HistoryTab() {
  const phase = useStore((s) => s.phase)
  const prompt = useStore((s) => s.prompt)
  const agent = useStore((s) => s.agent)
  const customAgent = useStore((s) => s.customAgent)
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const entries = useMemo(() => {
    const today =
      phase === 'done'
        ? [{
            id: TODAY_SESSION_ID,
            date: TODAY_LABEL,
            agentName: agentLabel(agent, customAgent),
            prompt,
            files: ['library.py'],
            added: 9,
            removed: 1,
            concepts: ['dictget', 'sortedkey', 'lambda', 'boundary'],
            summary: CHANGES.map((c) => `${c.label}: ${c.summary}`).join(' '),
            language: 'python' as const,
            snippet: '',
          }]
        : []
    return [...today, ...SEED_HISTORY]
  }, [phase, prompt, agent, customAgent])

  const q = query.trim().toLowerCase()
  const filtered = entries.filter(
    (e) =>
      !q ||
      e.prompt.toLowerCase().includes(q) ||
      e.files.some((f) => f.toLowerCase().includes(q)) ||
      e.concepts.some((c) => conceptById(c)?.name.toLowerCase().includes(q)),
  )

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 p-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => query && logEvent('history_search', { query, where: 'ide' })}
          placeholder="Search prompts, files, concepts…"
          aria-label="Search prompt history"
          className="w-full rounded border border-vs-line bg-[#3c3c3c] px-2 py-1 text-[12px] text-white placeholder:text-vs-dim"
        />
      </div>
      <ul className="dark-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 && <li className="p-2 text-[12px] text-vs-dim">No prompts match “{query}”.</li>}
        {filtered.map((e) => (
          <li key={e.id} className="mb-1.5 rounded border border-vs-line bg-[#1e1e1e]">
            <button
              className="w-full p-2 text-left hover:bg-white/5"
              aria-expanded={openId === e.id}
              onClick={() => {
                setOpenId(openId === e.id ? null : e.id)
                logEvent('history_opened', { id: e.id })
              }}
            >
              <div className="flex gap-2 text-[11px] text-vs-dim">
                <span>{e.date}</span>
                <span className="text-turq">{e.agentName}</span>
                {e.id === TODAY_SESSION_ID && <span className="text-diff-add">Today</span>}
              </div>
              <div className="mt-0.5 text-[12px] leading-snug text-white">{e.prompt}</div>
              <div className="mt-0.5 font-mono text-[11px] text-vs-dim">
                +{e.added} −{e.removed} · {e.files.join(', ')}
              </div>
            </button>
            {openId === e.id && (
              <div className="border-t border-vs-line p-2 text-[12px] leading-snug text-vs-text">
                {e.id === TODAY_SESSION_ID ? (
                  <ul className="flex flex-col gap-1">
                    {CHANGES.map((c) => (
                      <li key={c.id}>
                        <strong className="text-white">{c.label}.</strong> <InlineRich text={c.summary} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <p>{e.summary}</p>
                    <CodeBlock code={e.snippet} language={e.language} theme="dark" className="mt-1.5" />
                    <p className="mt-1 text-[11px] text-vs-dim">Read-only: from an earlier session.</p>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
