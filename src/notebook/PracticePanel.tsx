import { useEffect, useRef, useState } from 'react'
import { CodeBlock, InlineRich, Logo, RichText } from '../components/common'
import { LEVELS, conceptById, type Level } from '../data/courses'
import { conceptsTaught, sectionForConcept } from '../data/lectures'
import { LESSON_QUESTIONS, REPS_TO_ADVANCE } from '../data/lessonPractice'
import { useStore, type PracticeTurn } from '../store/store'

/** 0/3 → 3/3 progress on one concept. */
export function RepDots({ reps, size = 9 }: { reps: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1" title={`${reps} of ${REPS_TO_ADVANCE} correct`}>
      <span className="inline-flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: REPS_TO_ADVANCE }, (_, i) => (
          <span
            key={i}
            className={`rounded-full border ${i < reps ? 'border-turq-dark bg-turq-dark' : 'border-[#8d8878] bg-transparent'}`}
            style={{ width: size, height: size }}
          />
        ))}
      </span>
      <span className="text-[11px] font-bold text-ink-soft">
        {reps}/{REPS_TO_ADVANCE}
      </span>
      <span className="sr-only">correct</span>
    </span>
  )
}

/** Coach replies land after a beat, so the feedback reads as a response rather than appearing with the answer. */
function Coach({ turn }: { turn: PracticeTurn }) {
  const [shown, setShown] = useState(Boolean(turn.instant))
  useEffect(() => {
    if (turn.instant) return
    const t = setTimeout(() => setShown(true), 520)
    return () => clearTimeout(t)
  }, [turn.instant])

  if (!shown) {
    return (
      <div className="flex gap-1 px-1 py-1.5" aria-label="ChangeNotes is typing">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-turq-dark" />
        ))}
      </div>
    )
  }
  const tone =
    turn.grade === 'correct'
      ? 'border-l-[#3f9c5e] bg-[#eef8f1]'
      : turn.grade
        ? 'border-l-[#d9a33a] bg-[#fdf6e8]'
        : 'border-l-turq bg-white'
  return (
    <div className={`rounded-lg border border-line border-l-4 p-2.5 ${tone}`}>
      <div className="mb-0.5 flex items-center gap-1.5">
        <Logo size={12} />
        <span className="text-[10.5px] font-bold tracking-wide text-ink-soft uppercase">ChangeNotes</span>
        {turn.grade === 'correct' && <span className="text-[11px] font-bold text-[#2f7d4a]">✓ Correct</span>}
        {turn.grade === 'near' && <span className="text-[11px] font-bold text-[#9a6a10]">Almost</span>}
        {turn.grade === 'wrong' && <span className="text-[11px] font-bold text-[#9a6a10]">Try again</span>}
      </div>
      <RichText text={turn.text} theme="light" className="text-[13px] leading-relaxed text-ink" />
    </div>
  )
}

/**
 * The transcript above the input. The question a student is answering right now is *not*
 * here — it lives in the pinned card next to the answer box, so it can't scroll away.
 * Questions already answered stay in the transcript as a quiet divider.
 */
function Turn({ turn, current }: { turn: PracticeTurn; current: boolean }) {
  if (turn.role === 'student') {
    return (
      <div className="ml-6 self-end rounded-lg rounded-br-sm bg-navy px-2.5 py-1.5 text-[13px] leading-snug whitespace-pre-wrap text-white">
        {turn.text}
      </div>
    )
  }
  if (turn.role === 'question') {
    if (current) return null
    return (
      <div className="flex items-baseline gap-1.5 pt-1 text-[11.5px] text-ink-soft">
        <span className="font-bold tracking-wide uppercase">Asked</span>
        <span className="min-w-0 flex-1 italic">
          <InlineRich text={turn.text} theme="light" />
        </span>
      </div>
    )
  }
  return <Coach turn={turn} />
}

export function PracticePanel({ itemId, width = 360 }: { itemId: string; width?: number }) {
  const open = useStore((s) => s.practiceOpen)
  const conceptId = useStore((s) => s.practiceConcept)
  const questionId = useStore((s) => s.practiceQuestionId)
  const turns = useStore((s) => s.practiceTurns)
  const draft = useStore((s) => s.practiceDraft)
  const reps = useStore((s) => s.reps)
  const advanced = useStore((s) => s.advanced)
  const mastery = useStore((s) => s.mastery)
  const hinted = useStore((s) => s.hinted)
  const setDraft = useStore((s) => s.setPracticeDraft)
  const submit = useStore((s) => s.submitPractice)
  const hint = useStore((s) => s.showPracticeHint)
  const skip = useStore((s) => s.skipPracticeQuestion)
  const advance = useStore((s) => s.advanceConcept)
  const openPractice = useStore((s) => s.openPractice)
  const close = useStore((s) => s.closePractice)

  const scroller = useRef<HTMLDivElement>(null)
  const taught = conceptsTaught(itemId)
  const concept = conceptId ? conceptById(conceptId) : null
  const currentReps = conceptId ? (reps[conceptId] ?? 0) : 0
  const allDone = taught.length > 0 && taught.every((id) => advanced.includes(id))

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [turns.length])

  if (!open) {
    return (
      <button
        className="flex w-8 shrink-0 flex-col items-center gap-2 border-l border-line bg-[#f7f2e6] pt-3 text-[11px] font-bold text-turq-dark hover:bg-paper-2"
        aria-label="Open the practice panel"
        title="Open the practice panel"
        onClick={() => openPractice(conceptId ?? taught[0], 'panel_rail')}
      >
        <Logo size={16} />
        <span aria-hidden="true">‹</span>
        <span className="[writing-mode:vertical-rl]">Practice</span>
      </button>
    )
  }

  return (
    <aside
      className="panel-slide flex shrink-0 flex-col border-l border-line bg-[#f7f2e6]"
      style={{ width }}
      aria-label="Practice panel"
    >
      <header className="shrink-0 border-b border-line px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Logo size={14} />
          <h2 className="flex-1 text-[13px] font-extrabold text-ink">Practice</h2>
          <button
            aria-label="Collapse the practice panel"
            title="Collapse"
            className="flex h-5 w-5 items-center justify-center rounded text-ink-soft hover:bg-paper-2"
            onClick={close}
          >
            ›
          </button>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">
          Answer {REPS_TO_ADVANCE} correctly to move on to the next concept.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {taught.map((id) => {
            const c = conceptById(id)
            const done = advanced.includes(id)
            const active = id === conceptId
            return (
              <button
                key={id}
                aria-current={active ? 'true' : undefined}
                onClick={() => openPractice(id, 'panel_pill')}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                  active ? 'border-turq-dark bg-white text-ink' : 'border-line bg-paper text-ink-soft hover:bg-white'
                }`}
              >
                {done && <span aria-label="Done">✓</span>}
                {c?.name}
                <span className="font-bold text-turq-dark">
                  {reps[id] ?? 0}/{REPS_TO_ADVANCE}
                </span>
              </button>
            )
          })}
        </div>
      </header>

      {concept && (
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-white px-3 py-1.5">
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-ink">{concept.name}</span>
          <RepDots reps={currentReps} />
          <span className="text-[11px] whitespace-nowrap text-ink-soft" title="Your mastery rating for this concept">
            {LEVELS[(mastery[conceptId!] ?? 0) as Level]}
          </span>
        </div>
      )}

      <div ref={scroller} className="note-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3" aria-live="polite">
        {turns.length === 0 && (
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Pick a concept above to start practising what this lecture covered.
          </p>
        )}
        {turns.map((t) => (
          <Turn key={t.id} turn={t} current={t.role === 'question' && t.questionId === questionId} />
        ))}
      </div>

      <div className="shrink-0 border-t border-line bg-white">
        {questionId ? (
          <>
            <QuestionCard questionId={questionId} itemId={itemId} />
            <form
              className="px-2.5 pt-2 pb-2.5"
              onSubmit={(e) => {
                e.preventDefault()
                submit(draft)
              }}
            >
              <textarea
                value={draft}
                rows={2}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit(draft)
                  }
                }}
                placeholder="Type your answer…"
                aria-label="Type your answer"
                className="w-full resize-none rounded-lg border-2 border-line bg-white px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink-soft focus-visible:border-turq-dark"
              />
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="rounded-lg bg-turq px-3 py-1.5 text-[13px] font-bold text-navy enabled:hover:bg-[#25b0a3] disabled:bg-paper-2 disabled:text-ink-soft"
                >
                  Respond
                </button>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-turq-dark underline underline-offset-2 hover:text-ink disabled:text-ink-soft disabled:no-underline"
                  disabled={hinted.includes(questionId)}
                  onClick={hint}
                >
                  {hinted.includes(questionId) ? 'Hint shown' : 'Hint'}
                </button>
                <span className="flex-1" />
                <button
                  type="button"
                  className="text-[12px] text-ink-soft underline underline-offset-2 hover:text-ink"
                  onClick={skip}
                >
                  Different question
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-2.5">
            {allDone ? (
              <div className="text-center">
                <p className="text-[13px] font-bold text-ink">
                  Every concept in this lecture is at {REPS_TO_ADVANCE}/{REPS_TO_ADVANCE} 🎉
                </p>
                <p className="mt-0.5 text-[12px] text-ink-soft">Your next lecture's questions will build on these.</p>
              </div>
            ) : conceptId ? (
              <button
                className="w-full rounded-lg bg-turq px-3 py-2 text-[13px] font-bold text-navy hover:bg-[#25b0a3]"
                onClick={advance}
              >
                Next concept →
              </button>
            ) : (
              <button
                className="w-full rounded-lg bg-turq px-3 py-2 text-[13px] font-bold text-navy hover:bg-[#25b0a3]"
                onClick={() => openPractice(taught[0], 'panel_start')}
              >
                Start practising
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

// Built once; the question bank is static.
const LESSON_LOOKUP = new Map(LESSON_QUESTIONS.map((q) => [q.id, q] as const))

/**
 * The question being answered, pinned directly above the answer box: the prompt, the code it
 * is about, a link to the lecture section it came from, and the instruction for what to type.
 * None of it scrolls away while the student is thinking.
 */
function QuestionCard({ questionId, itemId }: { questionId: string; itemId: string }) {
  const q = LESSON_LOOKUP.get(questionId)
  const focusNotes = useStore((s) => s.focusNotesSection)
  if (!q) return null
  const notes = sectionForConcept(q.conceptId, itemId)

  return (
    <div className="border-b border-line bg-turq-soft/40 px-2.5 py-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[10.5px] font-bold tracking-wide text-turq-dark uppercase">Question</span>
        <span className="flex-1" />
        {notes && (
          <button
            className="flex min-w-0 max-w-[68%] items-baseline gap-1 text-[11.5px] font-semibold text-turq-dark hover:text-ink"
            title={`Jump to the notes: ${notes.section.heading}`}
            onClick={() => focusNotes(q.conceptId, 'question_card')}
          >
            <span className="truncate underline underline-offset-2">Notes: {notes.section.heading}</span>
            <span aria-hidden="true">↗</span>
          </button>
        )}
      </div>

      <p className="mt-1 text-[13.5px] leading-snug font-semibold text-ink">
        <InlineRich text={q.prompt} theme="light" />
      </p>

      {q.code && (
        <CodeBlock
          code={q.code}
          language={q.language === 'sql' ? 'sql' : 'python'}
          className="code-snippet mt-1.5"
        />
      )}

      <p className="mt-1.5 flex items-baseline gap-1 text-[11.5px] text-ink-soft">
        <span aria-hidden="true" className="font-bold text-turq-dark">
          ↓
        </span>
        <span className="min-w-0 flex-1">
          <InlineRich text={q.askFor} theme="light" />
        </span>
      </p>
    </div>
  )
}
