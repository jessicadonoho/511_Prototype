import { conceptById } from '../data/courses'
import { PROFESSOR } from '../data/lectures'
import { CLASS_NOTE, CLASS_ROWS, CLASS_SIZE, WEEKLY_REVIEW } from '../data/weeklyReview'
import { InlineRich } from '../components/common'
import { activeWeeklyTasks, useStore } from '../store/store'
import { Card, SecondaryButton } from './shared'

/**
 * A mock of the professor-facing summary the weekly review feeds (Theme 6). Aggregated by
 * concept, never by student: no names, prompts or code.
 */
export function ProfessorPage() {
  const nav = useStore((s) => s.navNotebook)
  const weeklyDone = useStore((s) => s.weeklyDone)
  const results = useStore((s) => s.weeklyResults)
  const mastery = useStore((s) => s.mastery)
  const taskIds = useStore((s) => s.weeklyTaskIds)

  // This student's own misses are folded into the counts, so the page reacts to the session.
  const myMisses = weeklyDone
    ? activeWeeklyTasks({ weeklyTaskIds: taskIds, mastery })
        .filter((t) => !results[t.id])
        .map((t) => t.conceptId)
    : []
  const rows = CLASS_ROWS.map((r) => ({
    ...r,
    missed: r.missed + (myMisses.includes(r.conceptId) ? 1 : 0),
  })).sort((a, b) => b.missed - a.missed)

  const worst = rows[0]
  const max = Math.max(...rows.map((r) => r.missed))

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-line bg-paper-2 px-3 py-2">
        <p className="text-[12px] font-bold text-ink-soft">
          Mock · professor’s view. Shown in the prototype so testers can see where the weekly review data goes. A
          student would not have this page.
        </p>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-ink">CS 120 · where the class is struggling</h1>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {PROFESSOR} · {WEEKLY_REVIEW.title} · {CLASS_SIZE} students
        </p>
      </div>

      <Card title="Concepts most often missed this week">
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const concept = conceptById(row.conceptId)
            const mine = myMisses.includes(row.conceptId)
            return (
              <li key={row.conceptId}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="min-w-0 flex-1 text-sm font-bold text-ink">{concept?.name}</span>
                  <span className="text-[12px] font-semibold text-ink">
                    {row.missed}/{CLASS_SIZE} missed
                  </span>
                  <span className="text-[12px] text-ink-soft">· {row.familiar}% at Familiar or above</span>
                  {row.flagged > 0 && (
                    <span className="rounded-full bg-[#fdf6e8] px-2 py-0.5 text-[11px] font-bold text-[#9a6a10]">
                      {row.flagged} unexplained AI
                    </span>
                  )}
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-paper-2">
                  <div
                    className={`h-full rounded-full ${mine ? 'bg-[#d9a33a]' : 'bg-turq-dark'}`}
                    style={{ width: `${Math.round((row.missed / max) * 100)}%` }}
                    role="img"
                    aria-label={`${row.missed} of ${CLASS_SIZE} students missed ${concept?.name}`}
                  />
                </div>
                {mine && <p className="mt-0.5 text-[11px] font-semibold text-[#9a6a10]">Includes your miss this week.</p>}
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title="Suggested next class">
        <p className="text-sm leading-relaxed text-ink">
          <InlineRich text={CLASS_NOTE} theme="light" />
        </p>
        <p className="mt-2 text-[12px] text-ink-soft">
          Weakest concept right now: <strong className="text-ink">{conceptById(worst.conceptId)?.name}</strong>.
          ChangeNotes can set the next weekly review to lean on it.
        </p>
      </Card>

      <Card title="What is not in here">
        <ul className="flex flex-col gap-1 text-[13px] text-ink">
          <li>No student names, and no per-student rows.</li>
          <li>No prompts, chat transcripts or practice answers.</li>
          <li>No code, other than whether a submission was flagged as unexplained AI.</li>
        </ul>
      </Card>

      <div>
        <SecondaryButton onClick={() => nav(weeklyDone ? '/review' : '/home')}>
          {weeklyDone ? 'Back to my review' : 'Back to my notebook'}
        </SecondaryButton>
      </div>
    </div>
  )
}
