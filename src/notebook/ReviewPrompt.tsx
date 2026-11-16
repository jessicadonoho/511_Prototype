import { MasteryDots, Logo } from '../components/common'
import { ASSIGNMENT } from '../data/assignment'
import { LEVELS, conceptById, type Level } from '../data/courses'
import { REPS_TO_ADVANCE } from '../data/lessonPractice'
import { useStore } from '../store/store'

/**
 * Flow step 3: before and after the assignment, ask whether the student wants to review the
 * related concepts, and show the current mastery rating for each one.
 */
export function ReviewPrompt() {
  const when = useStore((s) => s.reviewPrompt)
  const mastery = useStore((s) => s.mastery)
  const reps = useStore((s) => s.reps)
  const resolve = useStore((s) => s.resolveReviewPrompt)
  const submitted = useStore((s) => s.assignmentSubmitted)
  if (!when) return null

  const after = when === 'after'
  const weakest = [...ASSIGNMENT.conceptIds].sort((a, b) => (mastery[a] ?? 0) - (mastery[b] ?? 0))[0]

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1e2a44]/45 px-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Would you like to review these concepts?"
        className="window-enter w-full max-w-md overflow-hidden rounded-2xl border border-[#cfc7b3] bg-paper shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-line bg-paper-2 px-4 py-2">
          <Logo size={16} />
          <span className="flex-1 text-[12.5px] font-bold text-ink">ChangeNotes</span>
          <span className="text-[11px] font-semibold text-ink-soft">
            {after ? `After ${ASSIGNMENT.code}` : `Before ${ASSIGNMENT.code}`}
          </span>
        </div>
        <div className="p-5">
          <h2 className="text-lg font-extrabold text-ink">Would you like to review these concepts?</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            {after
              ? `${ASSIGNMENT.code} is ${submitted ? 'submitted' : 'closed'}. Here's where you stand on what it used.`
              : `${ASSIGNMENT.code} uses these three. Here's where you stand on each.`}
          </p>

          <ul className="mt-3 flex flex-col gap-1">
            {ASSIGNMENT.conceptIds.map((id) => {
              const level = (mastery[id] ?? 0) as Level
              const low = level < 2
              return (
                <li
                  key={id}
                  className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-2.5 py-2 ${
                    low ? 'border-[#d9a33a]/60 bg-[#fdf6e8]' : 'border-line bg-white'
                  }`}
                >
                  <span className="min-w-0 flex-1 text-sm font-bold text-ink">{conceptById(id)?.name}</span>
                  <span className="text-[11.5px] font-semibold text-ink-soft">
                    {reps[id] ?? 0}/{REPS_TO_ADVANCE} this lesson
                  </span>
                  <MasteryDots level={level} size={7} />
                  <button
                    className="shrink-0 rounded-lg border border-turq-dark px-2 py-0.5 text-[12px] font-semibold text-turq-dark hover:bg-turq-soft"
                    onClick={() => resolve('review', id)}
                  >
                    Review
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="mt-2 text-[11.5px] text-ink-soft">
            Lowest right now: <strong className="text-ink">{conceptById(weakest)?.name}</strong> ·{' '}
            {LEVELS[(mastery[weakest] ?? 0) as Level]}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              className="rounded-lg bg-turq px-4 py-2 text-sm font-bold text-navy hover:bg-[#25b0a3]"
              onClick={() => resolve('review', weakest)}
            >
              Review {conceptById(weakest)?.name}
            </button>
            <button
              className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-2"
              onClick={() => resolve('skip')}
            >
              {after ? 'Not now' : 'Go straight to the assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
