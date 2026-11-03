import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Logo } from '../components/common'
import { COURSES, conceptById, type Course } from '../data/courses'
import { logEvent, useStore, visibleConcepts } from '../store/store'
import { NewNotebookModal } from './NewNotebookModal'
import { AllConceptsPage, ConceptPage, CoursePage, CustomNotebookPage, HomePage, ItemPage, LessonPage, NotFound, PracticePage, SessionPage } from './pages'
import { ProgressPage } from './ProgressPage'
import { useSessions } from './shared'

function Router() {
  const route = useStore((s) => s.notebookRoute)
  const p = route.split('/').slice(1)
  switch (p[0]) {
    case 'home':
      return <HomePage />
    case 'lesson':
      return <LessonPage />
    case 'progress':
      return <ProgressPage />
    case 'concepts':
      return <AllConceptsPage />
    case 'history':
      return <NotebookHistory />
    case 'course':
      return p[2] === 'item' ? <ItemPage key={p[3]} itemId={p[3]} /> : <CoursePage key={p[1]} courseId={p[1]} />
    case 'concept':
      return <ConceptPage key={p[1]} conceptId={p[1]} />
    case 'session':
      return <SessionPage key={p[1]} sessionId={p[1]} />
    case 'notebook':
      return <CustomNotebookPage key={p[1]} notebookId={p[1]} />
    case 'practice':
      return <PracticePage key={route} kind={p[1]} id={p[2]} />
    default:
      return <NotFound />
  }
}

export function NotebookApp() {
  const route = useStore((s) => s.notebookRoute)
  const newNotebook = useStore((s) => s.newNotebook)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [route])

  return (
    <div className="notebook-app relative flex h-full min-h-0 bg-paper font-note text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main ref={scroller} className="note-scroll min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-4xl">
            <Router />
          </div>
        </main>
      </div>
      {newNotebook && <NewNotebookModal preset={newNotebook.preset} />}
    </div>
  )
}

// ---------- Sidebar ----------

function NavItem({ route, children, indent = 0, dot }: { route: string; children: ReactNode; indent?: number; dot?: boolean }) {
  const current = useStore((s) => s.notebookRoute)
  const nav = useStore((s) => s.navNotebook)
  const active = current === route || (route !== '/home' && current.startsWith(route + '/'))
  return (
    <button
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-2 rounded-lg py-1 pr-2 text-left text-[13px] ${active ? 'bg-turq-soft font-bold text-ink' : 'text-ink hover:bg-paper-2'}`}
      style={{ paddingLeft: 8 + indent }}
      onClick={() => nav(route)}
    >
      <span className="min-w-0 flex-1 leading-snug">{children}</span>
      {dot && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-turq-dark" title="Not done yet">
          <span className="sr-only">Not done yet</span>
        </span>
      )}
    </button>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mt-3 mb-0.5 px-2 text-[11px] font-bold tracking-wide text-ink-soft uppercase">{children}</div>
}

function CourseTree({ course }: { course: Course }) {
  const route = useStore((s) => s.notebookRoute)
  const inCourse = route.startsWith(`/course/${course.id}`)
  const [open, setOpen] = useState(course.id === 'cs120')
  const expanded = open || inCourse
  const nav = useStore((s) => s.navNotebook)
  const group = (kind: 'lecture' | 'project', label: string) => (
    <>
      <div className="pt-1 pl-6 text-[11px] font-semibold text-ink-soft">{label}</div>
      {course.items.filter((i) => i.kind === kind).map((item) => (
        <NavItem key={item.id} route={`/course/${course.id}/item/${item.id}`} indent={16}>
          {item.code} {item.title}
        </NavItem>
      ))}
    </>
  )
  return (
    <div>
      <div className="flex items-center">
        <button
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${course.code}`}
          className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-[11px] text-ink-soft hover:bg-paper-2"
          onClick={() => setOpen(!expanded)}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <button
          className={`flex-1 rounded-lg px-1 py-1 text-left text-[13px] font-bold hover:bg-paper-2 ${route === `/course/${course.id}` ? 'bg-turq-soft' : ''}`}
          onClick={() => {
            setOpen(true)
            nav(`/course/${course.id}`)
          }}
        >
          {course.code}
        </button>
      </div>
      {expanded && (
        <div>
          {group('lecture', 'Lectures')}
          {group('project', 'Projects')}
        </div>
      )}
    </div>
  )
}

function Sidebar() {
  const lessonDone = useStore((s) => s.lessonDone)
  const notebooks = useStore((s) => s.customNotebooks)
  const openNew = useStore((s) => s.openNewNotebook)
  return (
    <aside className="note-scroll flex w-[216px] shrink-0 flex-col overflow-y-auto border-r border-line bg-[#f7f2e6] p-2 max-[1180px]:w-[190px]" aria-label="Notebook navigation">
      <NavItem route="/home">Home</NavItem>
      <NavItem route="/lesson" dot={!lessonDone}>Today’s Lesson</NavItem>
      <NavItem route="/progress">Progress</NavItem>

      <SectionLabel>Courses</SectionLabel>
      {COURSES.map((c) => <CourseTree key={c.id} course={c} />)}

      <SectionLabel>My Notebooks</SectionLabel>
      {notebooks.map((n) => (
        <NavItem key={n.id} route={`/notebook/${n.id}`}>{n.name}</NavItem>
      ))}
      <button className="rounded-lg px-2 py-1 text-left text-[13px] font-bold text-turq-dark hover:bg-paper-2" onClick={() => openNew()}>
        + New notebook
      </button>

      <div className="mt-3 border-t border-line pt-2">
        <NavItem route="/concepts">All concepts</NavItem>
        <NavItem route="/history">Prompt history</NavItem>
      </div>
    </aside>
  )
}

// ---------- Top bar ----------

function TopBar() {
  const streak = useStore((s) => s.streak)
  const nav = useStore((s) => s.navNotebook)
  const mastery = useStore((s) => s.mastery)
  const sessions = useSessions()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: { label: string; hint: string; route: string }[] = []
    visibleConcepts(mastery).forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)) out.push({ label: c.name, hint: 'Concept', route: `/concept/${c.id}` })
    })
    COURSES.forEach((course) =>
      course.items.forEach((item) => {
        if (`${item.code} ${item.title}`.toLowerCase().includes(q)) {
          out.push({ label: `${item.code} ${item.title}`, hint: course.code, route: `/course/${course.id}/item/${item.id}` })
        }
      }),
    )
    sessions.forEach((s) => {
      const concepts = s.concepts.map((c) => conceptById(c)?.name ?? '').join(' ')
      if (`${s.prompt} ${s.files.join(' ')} ${concepts}`.toLowerCase().includes(q)) {
        out.push({ label: s.prompt, hint: `Session · ${s.date}`, route: `/session/${s.id}` })
      }
    })
    return out.slice(0, 7)
  }, [query, mastery, sessions])

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
      <div className="relative min-w-0 flex-1">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150)
            if (query) logEvent('notebook_search', { query })
          }}
          placeholder="Search concepts, lectures, code…"
          aria-label="Search concepts, lectures, code"
          className="w-full max-w-md rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-ink placeholder:text-ink-soft"
        />
        {open && query.trim() && (
          <ul className="absolute top-full left-0 z-30 mt-1 w-full max-w-md overflow-hidden rounded-xl border border-line bg-white shadow-lg">
            {results.length === 0 && <li className="px-3 py-2 text-sm text-ink-soft">No results for “{query}”.</li>}
            {results.map((r) => (
              <li key={r.route}>
                <button
                  className="flex w-full items-baseline gap-2 px-3 py-1.5 text-left hover:bg-paper"
                  onClick={() => {
                    nav(r.route)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{r.label}</span>
                  <span className="text-xs whitespace-nowrap text-ink-soft">{r.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className="text-sm font-bold text-ink" title={`${streak} day streak`} aria-label={`${streak} day streak`}>🔥 {streak}</span>
      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white" aria-hidden="true">A</span>
        Alex
      </span>
    </header>
  )
}

export function NotebookTitle() {
  return (
    <div className="flex items-center gap-2 text-[13px] font-bold text-ink">
      <Logo size={16} />
      ChangeNotes Notebook
      <span className="rounded-full bg-navy px-2 py-px text-[10.5px] font-bold text-white">Premium</span>
    </div>
  )
}

// ---------- Prompt history ----------

function NotebookHistory() {
  const sessions = useSessions()
  const nav = useStore((s) => s.navNotebook)
  const [query, setQuery] = useState('')
  const [course, setCourse] = useState('all')
  const [agent, setAgent] = useState('all')
  const [date, setDate] = useState('all')

  const agents = useMemo(() => [...new Set(sessions.map((s) => s.agentName))], [sessions])
  const courseOf = (itemId: string) => COURSES.find((c) => c.items.some((i) => i.id === itemId))
  const filtered = sessions.filter((s) => {
    const q = query.trim().toLowerCase()
    const concepts = s.concepts.map((c) => conceptById(c)?.name ?? '').join(' ')
    if (q && !`${s.prompt} ${s.files.join(' ')} ${concepts}`.toLowerCase().includes(q)) return false
    if (course !== 'all' && courseOf(s.itemId)?.id !== course) return false
    if (agent !== 'all' && s.agentName !== agent) return false
    if (date === 'nov' && !s.date.startsWith('Nov')) return false
    if (date === 'oct' && !s.date.startsWith('Oct')) return false
    return true
  })

  const selectClass = 'rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink'
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-extrabold text-ink">Prompt history</h1>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => query && logEvent('history_search', { query, where: 'notebook' })}
          placeholder="Search prompts, files, concepts…"
          aria-label="Search prompt history"
          className="min-w-[180px] flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft"
        />
        <select aria-label="Filter by course" value={course} onChange={(e) => setCourse(e.target.value)} className={selectClass}>
          <option value="all">All courses</option>
          {COURSES.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <select aria-label="Filter by agent" value={agent} onChange={(e) => setAgent(e.target.value)} className={selectClass}>
          <option value="all">All agents</option>
          {agents.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select aria-label="Filter by date" value={date} onChange={(e) => setDate(e.target.value)} className={selectClass}>
          <option value="all">Any date</option>
          <option value="nov">November</option>
          <option value="oct">October</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="border-b border-line bg-paper text-left text-xs text-ink-soft">
            <tr>
              <th className="px-3 py-1.5 font-bold">Date</th>
              <th className="px-2 py-1.5 font-bold">Prompt</th>
              <th className="px-2 py-1.5 font-bold">Agent</th>
              <th className="px-2 py-1.5 font-bold">Files</th>
              <th className="px-2 py-1.5 font-bold">Course</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-ink-soft">No prompts match these filters.</td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-paper-2 last:border-0 hover:bg-paper">
                <td className="px-3 py-1.5 text-xs whitespace-nowrap text-ink-soft">{s.date}</td>
                <td className="px-2 py-1.5">
                  <button className="text-left font-semibold text-ink hover:text-turq-dark hover:underline" onClick={() => nav(`/session/${s.id}`)}>{s.prompt}</button>
                </td>
                <td className="px-2 py-1.5 text-xs whitespace-nowrap text-ink-soft">{s.agentName}</td>
                <td className="px-2 py-1.5 font-mono text-xs text-ink-soft">{s.files.join(', ')}</td>
                <td className="px-2 py-1.5 text-xs whitespace-nowrap text-ink-soft">{courseOf(s.itemId)?.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
