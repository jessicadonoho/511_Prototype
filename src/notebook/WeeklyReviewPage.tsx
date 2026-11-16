import { useEffect, useMemo, useRef, useState } from 'react'
import { CodeBlock, InlineRich, MasteryDots } from '../components/common'
import { LEVELS, conceptById, type Level } from '../data/courses'
import { WEEKLY_REVIEW } from '../data/weeklyReview'
import { activeWeeklyTasks, logEvent, useStore, weeklyTasks } from '../store/store'
import { Card, PrimaryButton, SecondaryButton } from './shared'

/**
 * Theme 6. Assigned by the professor, taken in class, and the questions are chosen for the
 * student's own mastery level. Pasting is turned off, and the notice says so.
 */
export function WeeklyReviewPage() {
  const mastery = useStore((s) => s.mastery)
  const done = useStore((s) => s.weeklyDone)
  const index = useStore((s) => s.weeklyIndex)
  const answers = useStore((s) => s.weeklyAnswers)
  const results = useStore((s) => s.weeklyResults)
  const blocked = useStore((s) => s.pasteBlocked)
  const taskIds = useStore((s) => s.weeklyTaskIds)
  const beginWeekly = useStore((s) => s.beginWeekly)
  const setAnswer = useStore((s) => s.setWeeklyAnswer)
  const nextTask = useStore((s) => s.nextWeeklyTask)
  const notePaste = useStore((s) => s.notePasteBlocked)
  const nav = useStore((s) => s.navNotebook)
  const [started, setStarted] = useState(index > 0)
  const [checked, setChecked] = useState(false)
  const [pasteFlash, setPasteFlash] = useState(false)
  const area = useRef<HTMLTextAreaElement>(null)

  // The store pins the task list when the review starts, so passing one can't swap the rest.
  const tasks = useMemo(
    () => (taskIds.length ? activeWeeklyTasks({ weeklyTaskIds: taskIds, mastery }) : weeklyTasks(mastery)),
    [taskIds, mastery],
  )
  const task = tasks[index]

  useEffect(() => {
    if (!pasteFlash) return
    const t = setTimeout(() => setPasteFlash(false), 2600)
    return () => clearTimeout(t)
  }, [pasteFlash])

  useEffect(() => {
    setChecked(false)
    area.current?.focus()
  }, [index])

  if (done) {
    const passed = tasks.filter((t) => results[t.id]).length
    const missed = tasks.filter((t) => !results[t.id])
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{WEEKLY_REVIEW.title} · complete</h1>
        <Card>
          <p className="text-lg font-extrabold text-ink">
            {passed} of {tasks.length} passed
          </p>
          <p className="text-sm text-ink-soft">
            {blocked > 0
              ? `Pasting was blocked ${blocked} ${blocked === 1 ? 'time' : 'times'}, so this is all your own typing.`
              : 'All typed by hand — pasting was turned off.'}
          </p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {tasks.map((t) => {
              const pass = results[t.id]
              const level = (mastery[t.conceptId] ?? 0) as Level
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-1.5 first:border-0">
                  <span aria-hidden="true" className={pass ? 'text-[#2f7d4a]' : 'text-[#9a6a10]'}>
                    {pass ? '✓' : '✗'}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-bold text-ink">{conceptById(t.conceptId)?.name}</span>
                  <span className="text-[12px] text-ink-soft">{pass ? t.passNote : t.failNote}</span>
                  <MasteryDots level={level} size={7} />
                </li>
              )
            })}
          </ul>
        </Card>
        {missed.length > 0 && (
          <Card title="What Prof. Rivera sees">
            <p className="text-sm text-ink">
              Your misses go into the class aggregate as concept counts, with no names or code attached:{' '}
              <strong>{missed.map((t) => conceptById(t.conceptId)?.name).join(', ')}</strong>.
            </p>
            <SecondaryButton className="mt-2" onClick={() => nav('/professor')}>
              See the professor’s view →
            </SecondaryButton>
          </Card>
        )}
        <div>
          <PrimaryButton onClick={() => nav('/home')}>Back to my notebook</PrimaryButton>
        </div>
      </div>
    )
  }

  if (!started || !task) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{WEEKLY_REVIEW.title}</h1>
        <Card>
          <p className="text-sm text-ink-soft">
            Assigned by {WEEKLY_REVIEW.assignedBy} · {WEEKLY_REVIEW.when} · about {WEEKLY_REVIEW.minutes} min
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">{WEEKLY_REVIEW.intro}</p>
          <div className="mt-3 rounded-lg border border-l-4 border-line border-l-[#d9a33a] bg-[#fdf6e8] p-3">
            <p className="text-[13.5px] font-bold text-ink">⌨ {WEEKLY_REVIEW.pasteNotice}</p>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">
              Cmd/Ctrl+V does nothing in the answer box for this review. Everything else works as usual.
            </p>
          </div>
          <h2 className="mt-4 text-[13px] font-bold tracking-wide text-ink-soft uppercase">
            Your {tasks.length} questions
          </h2>
          <ul className="mt-1 flex flex-col gap-1">
            {tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                <span className="min-w-0 flex-1 font-semibold text-ink">{conceptById(t.conceptId)?.name}</span>
                <span className="text-[12px] text-ink-soft">
                  picked for {LEVELS[(mastery[t.conceptId] ?? 0) as Level]}
                </span>
                <MasteryDots level={(mastery[t.conceptId] ?? 0) as Level} size={7} />
              </li>
            ))}
          </ul>
          <PrimaryButton
            className="mt-4"
            onClick={() => {
              beginWeekly()
              setStarted(true)
            }}
          >
            Start the review
          </PrimaryButton>
        </Card>
      </div>
    )
  }

  const answer = answers[task.id] ?? ''
  const pass = checked ? task.needs.every((n) => answer.toLowerCase().includes(n.toLowerCase())) : null
  const concept = conceptById(task.conceptId)
  const last = index + 1 === tasks.length

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-ink-soft">{WEEKLY_REVIEW.title}</span>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={tasks.length}
          aria-valuenow={index + 1}
        >
          <div
            className="h-full rounded-full bg-turq-dark transition-all"
            style={{ width: `${((index + 1) / tasks.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-ink-soft">
          {index + 1} of {tasks.length}
        </span>
      </div>

      <div className="rounded-xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-bold tracking-wide text-turq-dark uppercase">{concept?.name}</span>
          <span className="text-[11.5px] text-ink-soft">
            picked for your level: {LEVELS[(mastery[task.conceptId] ?? 0) as Level]}
          </span>
        </div>
        <p className="mt-1.5 text-[15px] font-semibold text-ink">
          <InlineRich text={task.prompt} theme="light" />
        </p>
        <div className="mt-3">
          <div className="mb-0.5 text-[11px] font-bold tracking-wide text-ink-soft uppercase">Starter</div>
          <CodeBlock code={task.starter} />
        </div>

        <label className="mt-3 block text-[11px] font-bold tracking-wide text-ink-soft uppercase" htmlFor="wr-answer">
          Your code
        </label>
        <textarea
          id="wr-answer"
          ref={area}
          value={answer}
          rows={6}
          spellCheck={false}
          disabled={checked}
          onChange={(e) => setAnswer(task.id, e.target.value)}
          onPaste={(e) => {
            e.preventDefault()
            notePaste('weekly_review')
            setPasteFlash(true)
          }}
          onDrop={(e) => {
            e.preventDefault()
            notePaste('weekly_review_drop')
            setPasteFlash(true)
          }}
          placeholder="Type your answer here"
          aria-describedby="wr-paste"
          className="mt-1 w-full resize-y rounded-lg border-2 border-line bg-paper px-3 py-2 font-mono text-[13px] text-ink placeholder:font-note placeholder:text-ink-soft focus-visible:border-turq-dark disabled:bg-paper-2"
        />
        <p
          id="wr-paste"
          className={`mt-1 flex items-center gap-1.5 text-[12px] font-semibold ${pasteFlash ? 'text-[#a8372a]' : 'text-ink-soft'}`}
          role={pasteFlash ? 'alert' : undefined}
        >
          <span aria-hidden="true">⌨</span>
          {pasteFlash ? 'Paste blocked — type it out for this review.' : WEEKLY_REVIEW.pasteNotice}
          {blocked > 0 && !pasteFlash && <span className="font-normal">({blocked} blocked so far)</span>}
        </p>

        {checked && (
          <div className={`mt-3 rounded-lg p-3 text-sm text-ink ${pass ? 'bg-[#e7f6ec]' : 'bg-[#fdf3e1]'}`} role="status">
            <strong>{pass ? '✓ Passed. ' : 'Not passing yet. '}</strong>
            {pass ? task.passNote : task.failNote}
            {!pass && (
              <p className="mt-1 text-[12.5px] text-ink-soft">
                Prof. Rivera will see that this concept was missed, as a count with no code attached.
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {checked ? (
            <PrimaryButton onClick={nextTask}>{last ? 'Finish the review' : 'Next question'}</PrimaryButton>
          ) : (
            <PrimaryButton disabled={!answer.trim()} onClick={() => setChecked(true)}>
              Run my code
            </PrimaryButton>
          )}
          {!checked && (
            <button
              className="text-[13px] text-ink-soft underline underline-offset-2 hover:text-ink"
              onClick={() => {
                setChecked(true)
                logEvent('weekly_task_given_up', { id: task.id })
              }}
            >
              I don’t know this one
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
