import { useEffect, useMemo, useState } from 'react'
import { CodeBlock, InlineRich, MasteryDots, highlight } from '../components/common'
import { CHANGES } from '../data/changes'
import { COME_BACK_COPY, DAILY_LESSON, LESSON_DUE_CONCEPTS } from '../data/dailyLesson'
import { COURSES, LEVELS, TODAY_LABEL, conceptById, conceptsForItem, courseById, findItem } from '../data/courses'
import { SEED_HISTORY, YESTERDAY_SESSION_ID } from '../data/history'
import { MIDTERM_DAYS, MIDTERM_LABEL } from '../data/progress'
import { problemsFor, PROBLEM_TYPE_LABEL, PROBLEMS } from '../data/practice'
import { QUESTIONS } from '../data/questions'
import { useFrozen } from '../lib/hooks'
import { isReviewComplete, logEvent, useStore, visibleConcepts, type MasteryChange } from '../store/store'
import { MasteryChanges, PracticeRunner, ProblemView } from './PracticeRunner'
import { Card, ConceptChip, ConceptRow, Crumbs, MasteryRing, PrimaryButton, SecondaryButton, SessionList, Sparkline, daysUntil, pageSubtitle, pageTitle, useSessions } from './shared'

// ---------- Home ----------

export function HomePage() {
  const nav = useStore((s) => s.navNotebook)
  const phase = useStore((s) => s.phase)
  const reviewed = useStore((s) => s.reviewed)
  const questionsFinished = useStore((s) => s.questionsFinished)
  const lessonDone = useStore((s) => s.lessonDone)
  const lessonScore = useStore((s) => s.lessonScore)
  const mastery = useStore((s) => s.mastery)
  const recent = useStore((s) => s.recent)
  const openNew = useStore((s) => s.openNewNotebook)
  const sessions = useSessions()

  const captured = phase === 'done' && isReviewComplete({ reviewed, questionsFinished })
  const session = sessions.find((s) => s.id === (captured ? 'today' : YESTERDAY_SESSION_ID))!
  const counts = LEVELS.map((_, i) => visibleConcepts(mastery).filter((c) => mastery[c.id] === i).length)
  const total = counts.reduce((a, b) => a + b, 0)

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <h1 className="text-2xl font-extrabold text-ink lg:col-span-2">Good evening, Alex</h1>

      <section className="rounded-xl bg-navy p-4 text-white lg:row-span-1">
        <h2 className="text-[15px] font-bold">Today’s Lesson</h2>
        {lessonDone ? (
          <>
            <p className="mt-1 text-sm text-[#d7dcea]">Done for today: {lessonScore} of {DAILY_LESSON.length} correct.</p>
            <p className="mt-0.5 text-sm text-[#d7dcea]">{COME_BACK_COPY}</p>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-[#d7dcea]">5 review questions · ~3 min · 3 concepts due</p>
            <PrimaryButton className="mt-3" onClick={() => nav('/lesson')}>Start</PrimaryButton>
          </>
        )}
      </section>

      <Card title={captured ? 'Just captured from your editor' : 'Yesterday, from your editor'}>
        <button className="w-full rounded-lg text-left hover:bg-paper" onClick={() => nav(`/session/${session.id}`)}>
          <div className="text-sm font-semibold text-ink">{session.prompt}</div>
          <div className="text-xs text-ink-soft">{session.date} · {session.agentName} · {session.files.join(', ')}</div>
        </button>
        {captured ? (
          <ul className="mt-2 flex flex-col gap-1">
            {session.concepts.map((id) => {
              const concept = conceptById(id)!
              const before = concept.addedToday ? null : concept.start
              const now = mastery[id] ?? 0
              return (
                <li key={id} className="flex items-center gap-2 text-[13px] text-ink">
                  <span className="min-w-0 flex-1 truncate">{concept.name}</span>
                  {before == null ? (
                    <span className="text-xs font-bold text-turq-dark">New · {LEVELS[now]}</span>
                  ) : now > before ? (
                    <span className="text-xs font-bold text-turq-dark">↑ {LEVELS[now]}</span>
                  ) : (
                    <span className="text-xs text-ink-soft">– {LEVELS[now]}</span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1">
            {session.concepts.map((id) => <ConceptChip key={id} id={id} />)}
          </div>
        )}
      </Card>

      <Card title="Mastery snapshot">
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={LEVELS.map((l, i) => `${l}: ${counts[i]}`).join(', ')}>
          {counts.map((n, i) =>
            n > 0 ? <div key={i} style={{ flexGrow: n, flexBasis: 0, background: LEVEL_RAMP[i] }} /> : null,
          )}
        </div>
        <ul className="mt-2 grid grid-cols-5 gap-1 text-center">
          {LEVELS.map((level, i) => (
            <li key={level}>
              <div className="text-lg leading-tight font-extrabold text-ink">{counts[i]}</div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-ink-soft">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: LEVEL_RAMP[i] }} aria-hidden="true" />
                {level}
              </div>
            </li>
          ))}
        </ul>
        <span className="sr-only">{total} concepts in total.</span>
      </Card>

      <Card title="Continue studying">
        <ul className="flex flex-col">
          {recent.map((route) => (
            <li key={route}>
              <button className="flex w-full items-baseline gap-2 rounded-lg px-1 py-1 text-left hover:bg-paper" onClick={() => nav(route)}>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{pageTitle(route)}</span>
                <span className="text-xs whitespace-nowrap text-ink-soft">{pageSubtitle(route)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="lg:col-span-2" title="Upcoming">
        <button className="flex w-full items-center gap-3 rounded-lg p-1 text-left hover:bg-paper" onClick={() => openNew('midterm')}>
          <span aria-hidden="true" className="text-xl">🗓️</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">{MIDTERM_LABEL} in {MIDTERM_DAYS} days</span>
            <span className="block text-xs text-turq-dark">Create a midterm notebook →</span>
          </span>
        </button>
      </Card>
    </div>
  )
}

/** Single-hue sequential ramp, light to dark, matching mastery from New to Mastered. */
const LEVEL_RAMP = ['#c9c3b2', '#9fe3da', '#5fcfc3', '#2ca89c', '#0f6e66']

// ---------- Course ----------

export function CoursePage({ courseId }: { courseId: string }) {
  const nav = useStore((s) => s.navNotebook)
  const mastery = useStore((s) => s.mastery)
  const course = courseById(courseId)
  if (!course) return <NotFound />

  const Section = ({ kind, label }: { kind: 'lecture' | 'project'; label: string }) => (
    <Card title={label}>
      <ul className="flex flex-col gap-1">
        {course.items.filter((i) => i.kind === kind).map((item) => {
          const concepts = conceptsForItem(item.id).filter((c) => mastery[c.id] !== undefined)
          const pct = concepts.length ? Math.round((concepts.filter((c) => mastery[c.id] >= 2).length / concepts.length) * 100) : null
          return (
            <li key={item.id} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-paper">
              <MasteryRing percent={pct} />
              <div className="min-w-0 flex-1">
                <button className="text-left text-sm font-bold text-ink hover:text-turq-dark hover:underline" onClick={() => nav(`/course/${course.id}/item/${item.id}`)}>
                  {item.code} · {item.title}
                </button>
                {item.current && <span className="ml-2 rounded-full bg-turq-soft px-2 py-0.5 text-[11px] font-bold text-ink">Current</span>}
                <div className="mt-1 flex flex-wrap gap-1">
                  {concepts.map((c) => <ConceptChip key={c.id} id={c.id} />)}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )

  return (
    <div className="flex flex-col gap-3">
      <Crumbs items={[{ label: course.code }]} />
      <h1 className="-mt-2 text-2xl font-extrabold text-ink">{course.code} · {course.name}</h1>
      <p className="text-xs text-ink-soft">Rings show the % of concepts at Familiar or above.</p>
      <Section kind="lecture" label="Lectures" />
      <Section kind="project" label="Projects" />
    </div>
  )
}

export function ItemPage({ itemId }: { itemId: string }) {
  const nav = useStore((s) => s.navNotebook)
  const mastery = useStore((s) => s.mastery)
  const sessions = useSessions()
  const found = findItem(itemId)
  if (!found) return <NotFound />
  const { course, item } = found
  const crumbs = [
    { label: course.code, route: `/course/${course.id}` },
    { label: item.kind === 'lecture' ? 'Lectures' : 'Projects' },
    { label: item.code },
  ]
  const concepts = conceptsForItem(item.id).filter((c) => mastery[c.id] !== undefined)
  const conceptIds = concepts.map((c) => c.id)

  if (item.kind === 'project') {
    const timeline = sessions.filter((s) => s.itemId === item.id)
    return (
      <div className="flex flex-col gap-3">
        <Crumbs items={crumbs} />
        <h1 className="-mt-2 text-2xl font-extrabold text-ink">{item.code}: {item.title}</h1>
        <Card title="AI sessions on this project">
          {timeline.length === 0 ? (
            <p className="text-sm text-ink-soft">No AI sessions yet.</p>
          ) : (
            <ol className="ml-1 border-l-2 border-line">
              {timeline.map((s) => (
                <li key={s.id} className="relative pl-4 pb-3 last:pb-0">
                  <span className={`absolute top-1.5 -left-[6px] h-2.5 w-2.5 rounded-full ${s.id === 'today' ? 'bg-turq-dark' : 'bg-[#b5ad98]'}`} aria-hidden="true" />
                  <button className="w-full rounded-lg text-left hover:bg-paper" onClick={() => nav(`/session/${s.id}`)}>
                    <div className="text-sm font-semibold text-ink">{s.prompt}</div>
                    <div className="text-xs text-ink-soft">{s.date} · {s.agentName} · {s.files.join(', ')}</div>
                  </button>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.concepts.map((id) => <ConceptChip key={id} id={id} />)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card title="Concepts in this project" action={<SecondaryButton onClick={() => nav(`/practice/item/${item.id}`)}>Practice this project</SecondaryButton>}>
          {conceptIds.map((id) => <ConceptRow key={id} id={id} />)}
        </Card>
      </div>
    )
  }

  const touched = sessions.filter((s) => s.concepts.some((c) => conceptIds.includes(c)))
  return (
    <div className="flex flex-col gap-3">
      <Crumbs items={crumbs} />
      <div className="-mt-2 flex items-center gap-3">
        <h1 className="flex-1 text-2xl font-extrabold text-ink">{item.code} · {item.title}</h1>
        <PrimaryButton onClick={() => nav(`/practice/item/${item.id}`)}>Practice this lecture</PrimaryButton>
      </div>
      <Card title="Concepts">
        {conceptIds.length ? conceptIds.map((id) => <ConceptRow key={id} id={id} />) : <p className="text-sm text-ink-soft">No concepts yet.</p>}
      </Card>
      <Card title="Sessions from your editor">
        <SessionList sessions={touched} />
      </Card>
    </div>
  )
}

// ---------- Session ----------

export function SessionPage({ sessionId }: { sessionId: string }) {
  const nav = useStore((s) => s.navNotebook)
  const openIde = useStore((s) => s.openIde)
  const answers = useStore((s) => s.answers)
  const decisions = useStore((s) => s.decisions)
  const sessions = useSessions()
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return <NotFound message="This session hasn’t happened yet. Run the AI agent in your editor first." />
  const found = findItem(session.itemId)!
  const crumbs = [
    { label: found.course.code, route: `/course/${found.course.id}` },
    { label: 'Projects' },
    { label: found.item.code, route: `/course/${found.course.id}/item/${found.item.id}` },
    { label: `Session ${session.date}` },
  ]
  const practiceButton = (
    <SecondaryButton onClick={() => nav(`/practice/session/${session.id}`)}>Practice these concepts</SecondaryButton>
  )

  if (sessionId !== 'today') {
    const past = SEED_HISTORY.find((s) => s.id === sessionId)!
    return (
      <div className="flex flex-col gap-3">
        <Crumbs items={crumbs} />
        <blockquote className="-mt-1 border-l-4 border-turq pl-3 text-lg font-bold text-ink">“{past.prompt}”</blockquote>
        <p className="text-xs text-ink-soft">{past.date} · {past.agentName} · {past.files.join(', ')} · +{past.added} −{past.removed}</p>
        <Card title="What changed">
          <p className="mb-2 text-sm text-ink">{past.summary}</p>
          <CodeBlock code={past.snippet} language={past.language} />
        </Card>
        <Card title="Concepts" action={practiceButton}>
          <div className="flex flex-wrap gap-1">{past.concepts.map((id) => <ConceptChip key={id} id={id} showLevel />)}</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Crumbs items={crumbs} />
      <blockquote className="-mt-1 border-l-4 border-turq pl-3 text-lg font-bold text-ink">“{session.prompt}”</blockquote>
      <p className="text-xs text-ink-soft">{TODAY_LABEL} · {session.agentName} · library.py · +9 −1</p>

      <h2 className="mt-1 text-[15px] font-bold text-ink">What changed</h2>
      {CHANGES.map((change) => {
        const warn = change.kind === 'assumption'
        const decision = decisions[change.id]
        return (
          <Card key={change.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span aria-hidden="true">{warn ? '⚠' : '＋'}</span>
              <h3 className="min-w-0 flex-1 text-sm font-bold text-ink">{change.id}. {change.label}</h3>
              {decision && <span className="text-xs font-semibold text-ink-soft">{decision === 'accepted' ? '✓ Accepted' : '↩ Reverted'}</span>}
              <button className="text-xs font-bold text-turq-dark underline underline-offset-2" onClick={() => openIde('session_page', change.id)}>
                Open in editor ↗
              </button>
            </div>
            <p className="mt-1 text-xs font-semibold text-ink-soft">{change.typeLabel}</p>
            <pre className="code-light code-block mt-2 !p-0">
              {change.snippet.map((line, i) => (
                <div key={i} className="px-2.5" style={line.tinted ? { background: warn ? '#fbf0cd' : '#dff3e5', boxShadow: `inset 3px 0 ${warn ? '#b98f12' : '#3f9c5e'}` } : undefined}>
                  {highlight(line.text) }{'\n'}
                </div>
              ))}
            </pre>
            <p className="mt-2 text-sm text-ink"><InlineRich text={change.summary} theme="light" /></p>
          </Card>
        )
      })}

      <Card title="Your answers">
        {Object.keys(answers).length === 0 && <p className="text-sm text-ink-soft">You haven’t answered these questions yet. They’re waiting in the ChangeNotes panel in your editor.</p>}
        <ol className="flex flex-col gap-3">
          {QUESTIONS.map((q) => {
            const a = answers[q.id]
            if (!a) return null
            return (
              <li key={q.id} className="text-sm text-ink">
                <p className="font-semibold"><InlineRich text={q.text} theme="light" /></p>
                {a.skipped ? (
                  <p className="text-ink-soft">Skipped</p>
                ) : (
                  <p>
                    <span aria-hidden="true">{a.correct ? '✓ ' : '✗ '}</span>
                    <span className="sr-only">{a.correct ? 'Correct: ' : 'Incorrect: '}</span>
                    <InlineRich text={q.choices[a.choice]} theme="light" />
                  </p>
                )}
                <p className="text-[13px] text-ink-soft"><InlineRich text={q.explanation} theme="light" /></p>
              </li>
            )
          })}
        </ol>
      </Card>

      <Card title="Concepts" action={practiceButton}>
        <div className="flex flex-wrap gap-1">{session.concepts.map((id) => <ConceptChip key={id} id={id} showLevel />)}</div>
      </Card>
    </div>
  )
}

// ---------- Concept ----------

export function ConceptPage({ conceptId }: { conceptId: string }) {
  const nav = useStore((s) => s.navNotebook)
  const level = useStore((s) => s.mastery[conceptId])
  const sessions = useSessions()
  const concept = conceptById(conceptId)

  useEffect(() => {
    if (concept) logEvent('concept_opened', { id: conceptId })
  }, [conceptId, concept])

  if (!concept) return <NotFound />
  if (level === undefined) return <NotFound message="This concept hasn’t come up yet." />
  const course = courseById(concept.courseId)!
  const lecture = findItem(concept.itemId)!.item
  const seen = sessions.filter((s) => s.concepts.includes(conceptId))
  const problems = PROBLEMS.filter((p) => p.conceptId === conceptId)

  return (
    <div className="flex flex-col gap-3">
      <Crumbs items={[{ label: course.code, route: `/course/${course.id}` }, { label: lecture.code, route: `/course/${course.id}/item/${lecture.id}` }, { label: concept.name }]} />
      <h1 className="-mt-2 text-2xl font-extrabold text-ink">{concept.name}</h1>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="In plain language">
          <p className="text-sm leading-relaxed text-ink"><InlineRich text={concept.summary} theme="light" /></p>
        </Card>
        <Card title="Your mastery">
          <MasteryDots level={level} size={10} />
          <div className="mt-2"><Sparkline values={[...concept.history, level]} /></div>
          <p className="text-xs text-ink-soft">Last practiced: {concept.lastPracticed}</p>
        </Card>
      </div>
      <Card
        title="Practice problems"
        action={problems.length > 0 ? <PrimaryButton onClick={() => nav(`/practice/concept/${conceptId}`)}>Practice</PrimaryButton> : undefined}
      >
        {problems.length === 0 ? (
          <p className="text-sm text-ink-soft">No problems yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {problems.map((p) => (
              <li key={p.id} className="rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-semibold text-ink">{PROBLEM_TYPE_LABEL[p.type]}</li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Where you’ve seen this">
        <SessionList sessions={seen} />
      </Card>
      <Card title="Related concepts">
        <div className="flex flex-wrap gap-1">
          {concept.related.map((id) => <ConceptChip key={id} id={id} />)}
        </div>
      </Card>
    </div>
  )
}

export function AllConceptsPage() {
  const mastery = useStore((s) => s.mastery)
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-extrabold text-ink">All concepts</h1>
      {COURSES.map((course) => (
        <Card key={course.id} title={`${course.code} · ${course.name}`}>
          {visibleConcepts(mastery).filter((c) => c.courseId === course.id).map((c) => <ConceptRow key={c.id} id={c.id} />)}
        </Card>
      ))}
    </div>
  )
}

// ---------- Practice route ----------

export function PracticePage({ kind, id }: { kind: string; id: string }) {
  const nav = useStore((s) => s.navNotebook)
  const recordPractice = useStore((s) => s.recordPractice)
  const notebooks = useStore((s) => s.customNotebooks)
  const sessions = useSessions()

  const set = useMemo(() => {
    const mastery = useStore.getState().mastery
    if (kind === 'concept') {
      return { title: conceptById(id)?.name ?? 'Practice', back: `/concept/${id}`, problems: problemsFor([id]) }
    }
    if (kind === 'item') {
      const found = findItem(id)
      const ids = conceptsForItem(id).filter((c) => mastery[c.id] !== undefined).map((c) => c.id)
      return { title: found ? `${found.item.code} ${found.item.title}` : 'Practice', back: found ? `/course/${found.course.id}/item/${id}` : '/home', problems: problemsFor(ids) }
    }
    if (kind === 'session') {
      const session = sessions.find((s) => s.id === id)
      return { title: 'Session practice', back: `/session/${id}`, problems: problemsFor(session?.concepts ?? []) }
    }
    if (kind === 'notebook') {
      const nb = notebooks.find((n) => n.id === id)
      const ids = nb ? [...nb.conceptIds] : []
      if (nb?.focusWeak) ids.sort((a, b) => (mastery[a] ?? 0) - (mastery[b] ?? 0))
      return { title: nb?.name ?? 'Practice', back: `/notebook/${id}`, problems: problemsFor(ids, nb?.dailyGoal ?? 5, nb?.includeSpot ?? true) }
    }
    return { title: 'Practice', back: '/home', problems: [] }
    // A set stays fixed once it starts, even as mastery changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id])

  useEffect(() => {
    logEvent('practice_started', { kind, id })
  }, [kind, id])

  return (
    <div className="mx-auto max-w-2xl">
      <PracticeRunner problems={set.problems} title={set.title} onRecord={recordPractice} onDone={() => nav(set.back)} />
    </div>
  )
}

// ---------- Today's Lesson ----------

export function LessonPage() {
  const frozen = useFrozen()
  const nav = useStore((s) => s.navNotebook)
  const lessonDone = useStore((s) => s.lessonDone)
  const lessonScore = useStore((s) => s.lessonScore)
  const lessonChanges = useStore((s) => s.lessonChanges)
  const streak = useStore((s) => s.streak)
  const completeLesson = useStore((s) => s.completeLesson)
  const [stage, setStage] = useState<'intro' | 'questions'>(frozen === 'notebook-lesson' ? 'questions' : 'intro')
  const [index, setIndex] = useState(frozen === 'notebook-lesson' ? 2 : 0)
  const [results, setResults] = useState<{ conceptId: string; correct: boolean }[]>([])
  const [answered, setAnswered] = useState(false)

  if (lessonDone) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-line bg-white p-6 text-center">
        <h1 className="text-2xl font-extrabold text-ink">Lesson complete 🎉</h1>
        <p className="streak-pop mt-2 text-3xl font-extrabold text-ink">🔥 {streak}</p>
        <p className="text-sm text-ink-soft">{streak - 1} → {streak} day streak</p>
        <p className="mt-2 text-sm text-ink">Accuracy: {Math.round(((lessonScore ?? 0) / DAILY_LESSON.length) * 100)}% ({lessonScore} of {DAILY_LESSON.length})</p>
        <div className="mt-4 text-left">
          <MasteryChanges changes={lessonChanges as MasteryChange[]} />
        </div>
        <p className="mt-4 text-sm font-semibold text-ink">{COME_BACK_COPY}</p>
        <PrimaryButton className="mt-3" onClick={() => nav('/home')}>Back to notebook</PrimaryButton>
      </div>
    )
  }

  if (stage === 'intro') {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-line bg-white p-6">
        <h1 className="text-2xl font-extrabold text-ink">Today’s Lesson</h1>
        <p className="mt-1 text-sm text-ink">3 concepts due for review today, plus one mixed-review question.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {LESSON_DUE_CONCEPTS.map((id) => <ConceptChip key={id} id={id} />)}
        </div>
        <p className="mt-3 text-sm text-ink-soft">5 questions · ~3 min</p>
        <PrimaryButton
          className="mt-3"
          onClick={() => {
            logEvent('lesson_started', {})
            setStage('questions')
          }}
        >
          Start
        </PrimaryButton>
      </div>
    )
  }

  const problem = DAILY_LESSON[index]
  const last = index + 1 === DAILY_LESSON.length
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xs font-semibold text-ink-soft">Today’s Lesson</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={index + 1}>
          <div className="h-full rounded-full bg-turq-dark transition-all" style={{ width: `${((index + 1) / DAILY_LESSON.length) * 100}%` }} />
        </div>
        <span className="text-xs font-semibold text-ink-soft">{index + 1} of {DAILY_LESSON.length}</span>
      </div>
      <ProblemView
        key={problem.id}
        problem={problem}
        onAnswer={(correct) => {
          setResults((r) => [...r, { conceptId: problem.conceptId, correct }])
          setAnswered(true)
        }}
      />
      {answered && (
        <PrimaryButton
          className="mt-3"
          onClick={() => {
            if (last) completeLesson(results)
            else {
              setIndex(index + 1)
              setAnswered(false)
            }
          }}
        >
          {last ? 'Finish' : 'Next'}
        </PrimaryButton>
      )}
    </div>
  )
}

// ---------- Custom notebook ----------

export function CustomNotebookPage({ notebookId }: { notebookId: string }) {
  const nav = useStore((s) => s.navNotebook)
  const notebook = useStore((s) => s.customNotebooks.find((n) => n.id === notebookId))
  const mastery = useStore((s) => s.mastery)

  const plan = useMemo(() => {
    if (!notebook) return []
    const ordered = [...notebook.conceptIds].sort((a, b) => (mastery[a] ?? 0) - (mastery[b] ?? 0))
    const span = notebook.examDate ? Math.max(1, Math.min(daysUntil(notebook.examDate), 14)) : 5
    const perDay = Math.max(1, Math.ceil(ordered.length / span))
    const days: { label: string; ids: string[] }[] = []
    for (let i = 0; i < span && i * perDay < ordered.length; i++) {
      const d = new Date(2026, 10, 3 + i)
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        ids: ordered.slice(i * perDay, (i + 1) * perDay),
      })
    }
    return days
  }, [notebook, mastery])

  if (!notebook) return <NotFound />
  const remaining = notebook.examDate ? daysUntil(notebook.examDate) : null
  const course = courseById(notebook.courseId)

  return (
    <div className="flex flex-col gap-3">
      <Crumbs items={[{ label: 'My Notebooks' }, { label: notebook.name }]} />
      <div className="-mt-2 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-ink">{notebook.name}</h1>
          <p className="text-sm text-ink-soft">
            {course?.code} · {notebook.conceptIds.length} concepts · {notebook.sessionCount} sessions from your editor · {notebook.dailyGoal} questions a day
          </p>
        </div>
        {remaining != null && (
          <div className="rounded-xl bg-navy px-3 py-2 text-sm font-bold text-white">
            {notebook.type === 'exam' && /midterm/i.test(notebook.name) ? 'Midterm' : 'Exam'} in {remaining} {remaining === 1 ? 'day' : 'days'}
          </div>
        )}
        <PrimaryButton onClick={() => nav(`/practice/notebook/${notebook.id}`)}>Start practice</PrimaryButton>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Study plan">
          <ol className="flex flex-col gap-2">
            {plan.map((day) => (
              <li key={day.label} className="flex gap-3">
                <span className="w-24 shrink-0 text-xs font-bold text-ink-soft">{day.label}</span>
                <span className="flex flex-wrap gap-1">{day.ids.map((id) => <ConceptChip key={id} id={id} />)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-ink-soft">{notebook.focusWeak ? 'Weakest concepts come first.' : 'Concepts are in course order.'}</p>
        </Card>
        <Card title="Included concepts">
          {[...notebook.conceptIds]
            .sort((a, b) => (mastery[a] ?? 0) - (mastery[b] ?? 0))
            .map((id) => <ConceptRow key={id} id={id} />)}
        </Card>
      </div>
    </div>
  )
}

export function NotFound({ message = 'We couldn’t find this page.' }: { message?: string }) {
  const nav = useStore((s) => s.navNotebook)
  return (
    <div className="rounded-xl border border-line bg-white p-6 text-center">
      <p className="text-sm text-ink">{message}</p>
      <SecondaryButton className="mt-3" onClick={() => nav('/home')}>Go to Home</SecondaryButton>
    </div>
  )
}
