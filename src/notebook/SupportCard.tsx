import { useMemo } from 'react'
import { conceptById } from '../data/courses'
import { SIGNAL_META, SUPPORT_EMPTY, SUPPORT_FOOTER, SUPPORT_TITLE } from '../data/support'
import { logEvent, supportSignals, useStore } from '../store/store'

/**
 * Theme 3: shows *how* ChangeNotes works out that a student needs support. Each row names the
 * signal, the concept and what set it off, so the detection is visible rather than implied.
 */
export function SupportCard({ showEmpty = false }: { showEmpty?: boolean }) {
  // The selector builds a fresh array, so memoize it rather than subscribing to it directly.
  const state = useStore((s) => s)
  const signals = useMemo(() => supportSignals(state), [state])
  const openPractice = useStore((s) => s.openPractice)
  const openNotes = useStore((s) => s.openNotesForConcept)
  const nav = useStore((s) => s.navNotebook)
  const route = useStore((s) => s.notebookRoute)

  if (signals.length === 0) {
    if (!showEmpty) return null
    return (
      <section className="rounded-xl border border-line bg-white p-4">
        <h2 className="text-[15px] font-bold text-ink">{SUPPORT_TITLE}</h2>
        <p className="mt-1 text-sm text-ink-soft">{SUPPORT_EMPTY}</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-l-4 border-line border-l-turq-dark bg-turq-soft/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 flex-1 text-[15px] font-bold text-ink">{SUPPORT_TITLE}</h2>
        <span className="text-[11.5px] font-semibold text-ink-soft">
          {signals.length} {signals.length === 1 ? 'signal' : 'signals'}
        </span>
      </div>
      <ul className="mt-2 flex flex-col gap-2">
        {signals.map((signal, i) => {
          const meta = SIGNAL_META[signal.kind]
          const concept = conceptById(signal.conceptId)
          const onLecture = route.startsWith('/course/')
          return (
            <li key={`${signal.kind}-${signal.conceptId}-${i}`} className="rounded-lg border border-line bg-white p-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span aria-hidden="true" className="text-turq-dark">
                  {meta.icon}
                </span>
                <span className="text-[13px] font-bold text-ink">{meta.label}</span>
                <span className="text-[13px] text-ink-soft">·</span>
                <button
                  className="text-[13px] font-semibold text-turq-dark hover:underline"
                  onClick={() => nav(`/concept/${signal.conceptId}`)}
                >
                  {concept?.name ?? signal.conceptId}
                </button>
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">{signal.detail}</p>
              <button
                className="mt-1.5 rounded-lg border border-turq-dark px-2.5 py-0.5 text-[12px] font-semibold text-turq-dark hover:bg-turq-soft"
                onClick={() => {
                  logEvent('support_action', { kind: signal.kind, concept: signal.conceptId })
                  if (onLecture) openPractice(signal.conceptId, 'support_card')
                  else openNotes(signal.conceptId, 'support_card')
                }}
              >
                Go over this
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[11px] text-ink-soft">{SUPPORT_FOOTER}</p>
    </section>
  )
}
