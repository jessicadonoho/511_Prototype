import { useEffect, useMemo } from 'react'
import { CodeBlock, InlineRich, Logo, MasteryDots, highlight } from '../components/common'
import { ASSIGNMENT } from '../data/assignment'
import { LEVELS, conceptById, findItem, type Level } from '../data/courses'
import { conceptsTaught, lectureFor, type LectureSection, type NoteBlock } from '../data/lectures'
import { REPS_TO_ADVANCE } from '../data/lessonPractice'
import { logEvent, useStore } from '../store/store'
import { NotFound } from './pages'
import { RepDots } from './PracticePanel'
import { Card, Crumbs, PrimaryButton, SecondaryButton } from './shared'
import { SupportCard } from './SupportCard'

function Block({ block }: { block: NoteBlock }) {
  if (block.kind === 'prose') {
    return (
      <p className="text-[14.5px] leading-relaxed text-ink">
        <InlineRich text={block.text ?? ''} theme="light" />
      </p>
    )
  }
  if (block.kind === 'code') {
    return <CodeBlock code={block.code ?? ''} language={block.language ?? 'python'} />
  }
  if (block.kind === 'output') {
    return (
      <div>
        <div className="mb-0.5 text-[11px] font-bold tracking-wide text-ink-soft uppercase">Output</div>
        <pre className="code-light code-block border-l-4 border-l-[#b5ad98]">
          <code>{block.code}</code>
        </pre>
      </div>
    )
  }
  const watch = block.tone === 'watch'
  return (
    <aside
      className={`rounded-lg border border-l-4 p-3 text-[13.5px] leading-relaxed text-ink ${
        watch ? 'border-line border-l-[#d9a33a] bg-[#fdf6e8]' : 'border-line border-l-turq bg-turq-soft/50'
      }`}
    >
      <span className="mr-1.5 font-bold">{watch ? 'Watch out.' : 'Tip.'}</span>
      <InlineRich text={block.text ?? ''} theme="light" />
    </aside>
  )
}

function Section({ section }: { section: LectureSection }) {
  const conceptId = section.conceptId
  const reps = useStore((s) => (conceptId ? (s.reps[conceptId] ?? 0) : 0))
  const activeConcept = useStore((s) => s.practiceConcept)
  const openPractice = useStore((s) => s.openPractice)
  const active = Boolean(conceptId) && activeConcept === conceptId

  return (
    <section className="border-t border-line pt-4 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="min-w-0 flex-1 text-[17px] font-extrabold text-ink">{section.heading}</h2>
        {conceptId && (
          <button
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap ${
              active ? 'border-turq-dark bg-turq-soft text-ink' : 'border-turq-dark text-turq-dark hover:bg-turq-soft'
            }`}
            onClick={() => openPractice(conceptId, 'note_section')}
            title="Practise this in the panel"
          >
            {active ? 'Practising' : 'Practise this'}
            <span className="font-extrabold">
              {reps}/{REPS_TO_ADVANCE}
            </span>
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-2.5">
        {section.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </section>
  )
}

function ConceptStrip({ itemId }: { itemId: string }) {
  const mastery = useStore((s) => s.mastery)
  const reps = useStore((s) => s.reps)
  const advanced = useStore((s) => s.advanced)
  const openPractice = useStore((s) => s.openPractice)
  const nav = useStore((s) => s.navNotebook)
  const taught = conceptsTaught(itemId)
  if (taught.length === 0) return null

  return (
    <Card title="What this lecture covers">
      <ul className="flex flex-col">
        {taught.map((id) => {
          const level = (mastery[id] ?? 0) as Level
          const done = advanced.includes(id)
          return (
            <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-1 py-1.5 hover:bg-paper">
              <button
                className="min-w-0 flex-1 text-left text-sm font-bold text-ink hover:text-turq-dark hover:underline"
                onClick={() => nav(`/concept/${id}`)}
              >
                {conceptLabel(id)}
              </button>
              <RepDots reps={reps[id] ?? 0} />
              <span className="w-[108px] shrink-0 text-right">
                <MasteryDots level={level} size={7} />
              </span>
              <button
                className="shrink-0 rounded-lg border border-turq-dark px-2 py-0.5 text-[12px] font-semibold text-turq-dark hover:bg-turq-soft"
                onClick={() => openPractice(id, 'concept_strip')}
              >
                {done ? 'Practise again' : 'Practise'}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-1 text-[11.5px] text-ink-soft">
        The dots on the left are this lesson's {REPS_TO_ADVANCE} correct answers. The dots on the right are your overall
        mastery rating, which moves with your accuracy across everything you do.
      </p>
    </Card>
  )
}

const conceptLabel = (id: string) => conceptById(id)?.name ?? id

/** The in-class assignment, after the lecture notes (flow step 2). */
function AssignmentCard() {
  const opened = useStore((s) => s.assignmentOpened)
  const submitted = useStore((s) => s.assignmentSubmitted)
  const seenBefore = useStore((s) => s.reviewPromptSeen.before)
  const askReviewPrompt = useStore((s) => s.askReviewPrompt)
  const openAssignment = useStore((s) => s.openAssignment)
  const openIde = useStore((s) => s.openIde)

  const start = () => {
    // Flow step 3: offer the concept review before the assignment opens.
    if (!seenBefore) askReviewPrompt('before')
    else openAssignment('lecture_card')
  }

  return (
    <section className="rounded-xl border-2 border-navy bg-navy p-4 text-white">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-turq px-2 py-0.5 text-[11px] font-extrabold text-navy">In class</span>
        <h2 className="min-w-0 flex-1 text-[15px] font-bold">
          {ASSIGNMENT.code} · {ASSIGNMENT.title}
        </h2>
        {submitted && <span className="text-[12px] font-bold text-turq">✓ Submitted</span>}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[#d7dcea]">{ASSIGNMENT.brief}</p>
      <ol className="mt-2 flex flex-col gap-1 text-[13px] text-[#d7dcea]">
        {ASSIGNMENT.requirements.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-bold text-turq">{i + 1}.</span>
            <span className="min-w-0 flex-1">
              <InlineRich text={r} />
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[12px] text-[#aab3c8]">
        Due {ASSIGNMENT.due} · about {ASSIGNMENT.minutes} min · writes to{' '}
        <code className="inline-code inline-code-dark">{ASSIGNMENT.path}</code>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {submitted ? (
          <button
            className="rounded-lg border border-turq px-3 py-1.5 text-sm font-semibold text-turq hover:bg-turq/15"
            onClick={() => openIde('assignment_card')}
          >
            Open in editor ↗
          </button>
        ) : (
          <button
            className="rounded-lg bg-turq px-4 py-2 text-sm font-bold text-navy hover:bg-[#4fd4c8]"
            onClick={start}
          >
            {opened ? 'Back to the editor ↗' : 'Open in editor ↗'}
          </button>
        )}
        <span className="text-[12px] text-[#aab3c8]">Opens in your code editor.</span>
      </div>
    </section>
  )
}

/** Code the student sent over from the editor (Theme 5). */
function ClipsCard({ itemId }: { itemId: string }) {
  // Selecting a filtered array would hand React a new reference each render, so filter after.
  const allClips = useStore((s) => s.clips)
  const clips = useMemo(() => allClips.filter((c) => c.itemId === itemId), [allClips, itemId])
  const flash = useStore((s) => s.clipFlash)
  const remove = useStore((s) => s.removeClip)
  const openPractice = useStore((s) => s.openPractice)
  if (clips.length === 0) return null

  return (
    <Card title="From your editor">
      <ul className="flex flex-col gap-2.5">
        {clips.map((clip) => (
          <li
            key={clip.id}
            className={`rounded-lg border p-2.5 ${clip.id === flash ? 'border-turq-dark bg-turq-soft/50' : 'border-line bg-paper'}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Logo size={12} />
              <span className="min-w-0 flex-1 font-mono text-[11.5px] text-ink-soft">
                {clip.file} · lines {clip.lines}
              </span>
              <button
                className="text-[11.5px] font-semibold text-turq-dark underline underline-offset-2"
                onClick={() => openPractice(clip.conceptId, 'clip')}
              >
                Practise {conceptLabel(clip.conceptId)}
              </button>
              <button
                aria-label="Remove this snippet"
                title="Remove"
                className="rounded px-1 text-ink-soft hover:bg-paper-2 hover:text-ink"
                onClick={() => remove(clip.id)}
              >
                ×
              </button>
            </div>
            <pre className="code-light code-block mt-1.5">
              <code>{highlight(clip.code)}</code>
            </pre>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function LecturePage({ itemId }: { itemId: string }) {
  const openPractice = useStore((s) => s.openPractice)
  const practiceConcept = useStore((s) => s.practiceConcept)
  const mastery = useStore((s) => s.mastery)
  const nav = useStore((s) => s.navNotebook)
  const found = findItem(itemId)
  const notes = lectureFor(itemId)
  const taught = conceptsTaught(itemId)

  useEffect(() => {
    logEvent('lecture_opened', { item: itemId, has_notes: Boolean(notes) })
  }, [itemId, notes])

  // Opening a lecture brings up its practice panel (Theme 4).
  useEffect(() => {
    if (!notes || taught.length === 0) return
    if (!practiceConcept || !taught.includes(practiceConcept)) openPractice(taught[0], 'lecture_open')
    // Only when the lecture changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  if (!found) return <NotFound />
  const { course, item } = found

  const crumbs = [
    { label: course.code, route: `/course/${course.id}` },
    { label: 'Lectures' },
    { label: item.code },
  ]

  if (!notes) {
    return (
      <div className="flex flex-col gap-3">
        <Crumbs items={crumbs} />
        <h1 className="-mt-2 text-2xl font-extrabold text-ink">
          {item.code} · {item.title}
        </h1>
        <Card title="Notes">
          <p className="text-sm text-ink-soft">
            Your professor hasn’t posted notes for this lecture yet. They’ll show up here after class.
          </p>
        </Card>
        <ConceptStrip itemId={itemId} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Crumbs items={crumbs} />
      <header className="-mt-2">
        <h1 className="text-2xl font-extrabold text-ink">
          {item.code} · {item.title}
        </h1>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {notes.date} · {notes.professor} · {notes.summary}
        </p>
      </header>

      <SupportCard />
      <ConceptStrip itemId={itemId} />
      <ClipsCard itemId={itemId} />

      <article className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
        <div className="text-[11px] font-bold tracking-wide text-ink-soft uppercase">Lecture notes</div>
        {notes.sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </article>

      {notes.assignmentId && <AssignmentCard />}

      <div className="flex flex-wrap items-center gap-2">
        <PrimaryButton onClick={() => openPractice(taught[0], 'lecture_footer')}>
          Practise this lecture
        </PrimaryButton>
        <SecondaryButton onClick={() => nav(`/practice/item/${itemId}`)}>Mixed question set</SecondaryButton>
        <span className="text-[12px] text-ink-soft">
          Mastery: {taught.map((id) => `${conceptLabel(id)} ${LEVELS[(mastery[id] ?? 0) as Level]}`).join(' · ')}
        </span>
      </div>
    </div>
  )
}
