import { useEffect, useState } from 'react'
import { CodeBlock, InlineRich, Logo } from '../components/common'
import { AI_DETECT_REASON, CLARIFY_QUESTIONS, OPTION_A_COPY, OPTION_B_COPY } from '../data/aiDetection'
import { ASSIGNMENT } from '../data/assignment'
import { conceptById } from '../data/courses'
import { useStore } from '../store/store'

/**
 * Flow step 5. One component, two behaviours, chosen by the `aiMode` variant:
 *   Option A — appears in the editor the moment AI code lands, no grade attached.
 *   Option B — appears at submission, with the grade on the line.
 * A participant only ever sees the option they were assigned.
 */
export function ClarifyCard() {
  const open = useStore((s) => s.clarifyOpen)
  const mode = useStore((s) => s.variants.aiMode)
  const index = useStore((s) => s.clarifyIndex)
  const answers = useStore((s) => s.clarifyAnswers)
  const done = useStore((s) => s.clarifyDone)
  const answer = useStore((s) => s.answerClarify)
  const skip = useStore((s) => s.skipClarify)
  const close = useStore((s) => s.closeClarify)
  const submit = useStore((s) => s.submitAssignment)
  const openNotes = useStore((s) => s.openNotesForConcept)

  const [draft, setDraft] = useState('')
  const q = CLARIFY_QUESTIONS[index]
  const given = q ? answers[q.id] : undefined

  useEffect(() => {
    setDraft('')
  }, [index])

  if (!open) return null
  const copy = mode === 'A' ? OPTION_A_COPY : OPTION_B_COPY
  const optionB = mode === 'B'

  if (done) {
    return (
      <Shell mode={mode} onClose={optionB ? undefined : close}>
        <h2 className="text-[14px] font-bold text-white">All answered</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-vs-text">{copy.done}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {optionB ? (
            <button
              className="rounded bg-turq px-3 py-1 text-[12.5px] font-semibold text-navy hover:bg-[#4fd4c8]"
              onClick={submit}
            >
              Submit {ASSIGNMENT.code}
            </button>
          ) : (
            <button
              className="rounded bg-turq px-3 py-1 text-[12.5px] font-semibold text-navy hover:bg-[#4fd4c8]"
              onClick={close}
            >
              Back to my code
            </button>
          )}
        </div>
      </Shell>
    )
  }

  if (!q) return null
  const concept = conceptById(q.conceptId)

  return (
    <Shell mode={mode} onClose={optionB ? undefined : close}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 flex-1 text-[14px] font-bold text-white">{copy.title}</h2>
        {optionB && (
          <span className="rounded bg-diff-warn/20 px-1.5 py-0.5 text-[10.5px] font-bold text-diff-warn">
            {OPTION_B_COPY.stakes}
          </span>
        )}
        <span className="text-[11px] whitespace-nowrap text-vs-dim">
          {index + 1} of {CLARIFY_QUESTIONS.length}
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-vs-text">{copy.blurb}</p>
      <p className="mt-1 text-[11px] text-vs-dim">
        <span aria-hidden="true">◆ </span>
        {AI_DETECT_REASON}
      </p>

      <div className="mt-2.5">
        <div className="mb-0.5 text-[10.5px] font-bold tracking-wide text-vs-dim uppercase">The line in question</div>
        <CodeBlock code={q.about} theme="dark" />
      </div>

      <p className="mt-2.5 text-[13px] leading-snug font-semibold text-white">
        <InlineRich text={q.prompt} />
      </p>

      {given && !given.ok && (
        <p className="mt-1.5 rounded border border-diff-warn/60 bg-diff-warn/10 px-2 py-1 text-[12px] leading-snug text-vs-text">
          {q.weakFeedback}
        </p>
      )}
      {given?.ok && (
        <p className="mt-1.5 rounded border border-diff-add/60 bg-diff-add/10 px-2 py-1 text-[12px] leading-snug text-vs-text">
          {q.goodFeedback}
        </p>
      )}

      <form
        className="mt-2"
        onSubmit={(e) => {
          e.preventDefault()
          answer(draft)
          setDraft('')
        }}
      >
        <textarea
          value={draft}
          rows={3}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="In your own words…"
          aria-label="Explain this code in your own words"
          className="w-full resize-none rounded border border-vs-line bg-[#3c3c3c] px-2 py-1.5 text-[12.5px] text-white placeholder:text-vs-dim"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded bg-turq px-3 py-1 text-[12.5px] font-semibold text-navy enabled:hover:bg-[#4fd4c8] disabled:bg-vs-line disabled:text-vs-dim"
          >
            {index + 1 === CLARIFY_QUESTIONS.length ? 'Finish' : 'Answer'}
          </button>
          {concept && (
            <button
              type="button"
              className="text-[11.5px] text-turq underline underline-offset-2 hover:text-white"
              onClick={() => openNotes(q.conceptId, 'clarify_card')}
            >
              Open the notes on {concept.name} ↗
            </button>
          )}
          <span className="flex-1" />
          <button
            type="button"
            className="text-[11.5px] text-vs-dim underline underline-offset-2 hover:text-white"
            onClick={skip}
          >
            {copy.skip}
          </button>
        </div>
      </form>
    </Shell>
  )
}

/** Option A sits over the editor and can be dismissed. Option B blocks submission. */
function Shell({
  mode,
  onClose,
  children,
}: {
  mode: 'A' | 'B'
  onClose?: () => void
  children: React.ReactNode
}) {
  const card = (
    <div
      role="dialog"
      aria-modal={mode === 'B'}
      aria-label={mode === 'B' ? 'Explain your submission' : 'Quick check on that code'}
      className="dark-scroll toast-enter max-h-full w-[380px] max-w-full overflow-y-auto rounded border border-turq border-t-2 bg-[#252526] p-3 shadow-2xl"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Logo size={14} />
        <span className="flex-1 text-[11.5px] font-semibold text-white">ChangeNotes</span>
        <span className="text-[10.5px] font-bold text-turq">Option {mode}</span>
        {onClose && (
          <button
            aria-label="Dismiss"
            title="Dismiss"
            className="flex h-5 w-5 items-center justify-center rounded text-vs-dim hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>
      {children}
    </div>
  )

  if (mode === 'B') {
    return <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4">{card}</div>
  }
  return <div className="absolute right-4 bottom-8 z-40 max-h-[calc(100%-4rem)] max-w-[calc(100%-2rem)]">{card}</div>
}
