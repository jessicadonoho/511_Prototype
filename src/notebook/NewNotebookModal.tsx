import { useEffect, useMemo, useRef, useState } from 'react'
import { COURSES, MIDTERM_DATE, conceptsForItem } from '../data/courses'
import { useStore, type CustomNotebook } from '../store/store'
import { PrimaryButton, useSessions } from './shared'

const TYPES: { id: CustomNotebook['type']; label: string; blurb: string; icon: string }[] = [
  { id: 'exam', label: 'Exam prep', blurb: 'Build a plan up to a test date.', icon: '🎯' },
  { id: 'lecture', label: 'Lecture notes', blurb: 'Collect one topic’s concepts.', icon: '📝' },
  { id: 'project', label: 'Project', blurb: 'Keep a project’s learning together.', icon: '🛠️' },
  { id: 'custom', label: 'Custom', blurb: 'Start from your own mix.', icon: '✨' },
]

export function NewNotebookModal({ preset }: { preset?: 'midterm' }) {
  const close = useStore((s) => s.closeNewNotebook)
  const addNotebook = useStore((s) => s.addNotebook)
  const nav = useStore((s) => s.navNotebook)
  const mastery = useStore((s) => s.mastery)
  const sessions = useSessions()

  const [step, setStep] = useState(1)
  const [type, setType] = useState<CustomNotebook['type'] | null>(preset === 'midterm' ? 'exam' : null)
  const [name, setName] = useState(preset === 'midterm' ? 'CS 120 Midterm Review' : '')
  const [courseId, setCourseId] = useState('cs120')
  const course = COURSES.find((c) => c.id === courseId)!
  const defaultItems = (id: string, t: CustomNotebook['type'] | null) =>
    COURSES.find((c) => c.id === id)!.items.filter((i) => t !== 'exam' || i.beforeExam).map((i) => i.id)
  const [itemIds, setItemIds] = useState<string[]>(defaultItems('cs120', preset === 'midterm' ? 'exam' : null))
  const [examDate, setExamDate] = useState(MIDTERM_DATE)
  const [dailyGoal, setDailyGoal] = useState(5)
  const [focusWeak, setFocusWeak] = useState(true)
  const [includeSpot, setIncludeSpot] = useState(true)
  const [building, setBuilding] = useState(false)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !building) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [building, close])

  useEffect(() => {
    dialog.current?.querySelector<HTMLElement>('input, button')?.focus()
  }, [step])

  const conceptIds = useMemo(() => {
    const ids = new Set<string>()
    itemIds.forEach((id) => conceptsForItem(id).forEach((c) => mastery[c.id] !== undefined && ids.add(c.id)))
    return [...ids]
  }, [itemIds, mastery])
  const sessionCount = useMemo(
    () => sessions.filter((s) => itemIds.includes(s.itemId) || s.concepts.some((c) => conceptIds.includes(c))).length,
    [sessions, itemIds, conceptIds],
  )

  const pickType = (t: CustomNotebook['type']) => {
    setType(t)
    setItemIds(defaultItems(courseId, t))
  }
  const pickCourse = (id: string) => {
    setCourseId(id)
    setItemIds(defaultItems(id, type))
  }

  const create = () => {
    const notebook: CustomNotebook = {
      id: `nb-${Date.now()}`,
      name: name.trim(),
      type: type!,
      courseId,
      itemIds,
      conceptIds,
      sessionCount,
      examDate: type === 'exam' ? examDate : undefined,
      dailyGoal,
      focusWeak,
      includeSpot,
    }
    setBuilding(true)
    setTimeout(() => {
      addNotebook(notebook)
      close()
      nav(`/notebook/${notebook.id}`)
    }, 1200)
  }

  const step1Ready = Boolean(type && name.trim())
  const step2Ready = conceptIds.length > 0 && (type !== 'exam' || Boolean(examDate))

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange(v: boolean): void }) => (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#0f8a80]" />
      {label}
    </label>
  )

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-navy/35 p-3" onMouseDown={(e) => e.target === e.currentTarget && !building && close()}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-label="Create a new notebook" className="note-scroll max-h-full w-[540px] max-w-full overflow-y-auto rounded-2xl bg-paper p-5 font-note shadow-2xl">
        {building ? (
          <div className="flex flex-col items-center gap-3 py-10" role="status">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-paper-2 border-t-turq-dark" aria-hidden="true" />
            <p className="text-sm font-bold text-ink">Building your notebook…</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h2 className="flex-1 text-lg font-extrabold text-ink">
                {step === 1 ? 'What’s it for?' : step === 2 ? 'What should it cover?' : 'How do you want to study?'}
              </h2>
              <span className="text-xs font-semibold text-ink-soft">Step {step} of 3</span>
              <button aria-label="Close" className="h-6 w-6 rounded-full text-ink-soft hover:bg-paper-2" onClick={close}>×</button>
            </div>

            {step === 1 && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Notebook type">
                  {TYPES.map((t) => (
                    <button
                      key={t.id}
                      role="radio"
                      aria-checked={type === t.id}
                      onClick={() => pickType(t.id)}
                      className={`rounded-xl border-2 p-2.5 text-left ${type === t.id ? 'border-turq-dark bg-turq-soft' : 'border-line bg-white hover:border-turq-dark'}`}
                    >
                      <div className="text-sm font-bold text-ink"><span aria-hidden="true">{t.icon}</span> {t.label}</div>
                      <div className="text-xs text-ink-soft">{t.blurb}</div>
                    </button>
                  ))}
                </div>
                <label className="text-sm font-bold text-ink">
                  Name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., CS 120 Midterm Review"
                    className="mt-1 block w-full rounded-lg border-2 border-line bg-white px-3 py-1.5 text-sm font-normal text-ink placeholder:text-ink-soft"
                  />
                </label>
                <label className="text-sm font-bold text-ink">
                  Course
                  <select
                    value={courseId}
                    onChange={(e) => pickCourse(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-2 border-line bg-white px-2 py-1.5 text-sm font-normal text-ink"
                  >
                    {COURSES.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                  </select>
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="mt-3 flex flex-col gap-3">
                <fieldset className="rounded-xl border border-line bg-white p-2.5">
                  <legend className="px-1 text-xs font-bold text-ink-soft">{course.code}</legend>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {course.items.map((item) => (
                      <label key={item.id} className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-ink">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-3.5 w-3.5 accent-[#0f8a80]"
                          checked={itemIds.includes(item.id)}
                          onChange={(e) => setItemIds(e.target.checked ? [...itemIds, item.id] : itemIds.filter((i) => i !== item.id))}
                        />
                        <span>{item.code} {item.title}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="rounded-lg bg-turq-soft px-3 py-1.5 text-sm font-bold text-ink" aria-live="polite">
                  {conceptIds.length} concepts · {sessionCount} sessions from your editor
                </p>
                {type === 'exam' && (
                  <label className="text-sm font-bold text-ink">
                    Exam date
                    <input
                      type="date"
                      value={examDate}
                      min="2026-11-03"
                      onChange={(e) => setExamDate(e.target.value)}
                      className="mt-1 block rounded-lg border-2 border-line bg-white px-2 py-1 text-sm font-normal text-ink"
                    />
                  </label>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <div className="mb-1 text-sm font-bold text-ink" id="goal-label">Daily goal</div>
                  <div className="flex gap-2" role="radiogroup" aria-labelledby="goal-label">
                    {[5, 10, 15].map((g) => (
                      <button
                        key={g}
                        role="radio"
                        aria-checked={dailyGoal === g}
                        onClick={() => setDailyGoal(g)}
                        className={`flex-1 rounded-lg border-2 py-1.5 text-sm font-semibold text-ink ${dailyGoal === g ? 'border-turq-dark bg-turq-soft' : 'border-line bg-white hover:border-turq-dark'}`}
                      >
                        {g} questions
                      </button>
                    ))}
                  </div>
                </div>
                <Toggle label="Focus on my weakest concepts" checked={focusWeak} onChange={setFocusWeak} />
                <Toggle label="Include spot-the-bug problems" checked={includeSpot} onChange={setIncludeSpot} />
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              {step > 1 && (
                <button className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-2" onClick={() => setStep(step - 1)}>
                  Back
                </button>
              )}
              <span className="flex-1 text-xs text-ink-soft">
                {step === 1 && !step1Ready ? 'Choose a type and add a name to continue.' : step === 2 && !step2Ready ? 'Choose at least one item with concepts.' : ''}
              </span>
              {step < 3 ? (
                <PrimaryButton disabled={step === 1 ? !step1Ready : !step2Ready} onClick={() => setStep(step + 1)}>Next</PrimaryButton>
              ) : (
                <PrimaryButton onClick={create}>Create notebook</PrimaryButton>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
