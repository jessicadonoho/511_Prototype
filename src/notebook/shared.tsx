import type { ReactNode } from 'react'
import { MasteryDots } from '../components/common'
import { conceptById, COURSES, findItem, LEVELS, type Level } from '../data/courses'
import { SEED_HISTORY } from '../data/history'
import { useStore } from '../store/store'

export function Crumbs({ items }: { items: { label: string; route?: string }[] }) {
  const nav = useStore((s) => s.navNotebook)
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-[13px] text-ink-soft">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true">›</span>}
          {item.route ? (
            <button className="rounded hover:text-turq-dark hover:underline" onClick={() => nav(item.route!)}>
              {item.label}
            </button>
          ) : (
            <span className={i === items.length - 1 ? 'font-semibold text-ink' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function Card({ children, className = '', title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-line bg-white p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-2 flex items-center gap-2">
          {title && <h2 className="flex-1 text-[15px] font-bold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function PrimaryButton({ children, onClick, disabled, type = 'button', className = '' }: { children: ReactNode; onClick?(): void; disabled?: boolean; type?: 'button' | 'submit'; className?: string }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg bg-turq px-4 py-2 text-sm font-bold text-navy transition-colors enabled:hover:bg-[#25b0a3] disabled:bg-paper-2 disabled:text-ink-soft ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick, className = '' }: { children: ReactNode; onClick?(): void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border border-turq-dark px-3 py-1.5 text-sm font-semibold text-turq-dark transition-colors hover:bg-turq-soft ${className}`}
    >
      {children}
    </button>
  )
}

/** Level-colored chip. Single-hue ramp, with the level named in text so color isn't the only signal. */
const CHIP_CLASS: Record<Level, string> = {
  0: 'border-line bg-paper text-ink',
  1: 'border-[#a8e3dc] bg-[#eefaf8] text-ink',
  2: 'border-[#6fd3c8] bg-[#cdf1ec] text-ink',
  3: 'border-turq bg-[#8fe0d6] text-navy',
  4: 'border-turq-dark bg-turq text-navy',
}

export function ConceptChip({ id, showLevel = false }: { id: string; showLevel?: boolean }) {
  const concept = conceptById(id)
  const level = useStore((s) => s.mastery[id])
  const nav = useStore((s) => s.navNotebook)
  if (!concept) return null
  const lv = (level ?? 0) as Level
  return (
    <button
      title={`${concept.name}: ${LEVELS[lv]}`}
      onClick={() => nav(`/concept/${id}`)}
      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold hover:brightness-95 ${CHIP_CLASS[lv]}`}
    >
      {concept.name}
      {showLevel && <span className="font-normal"> · {LEVELS[lv]}</span>}
    </button>
  )
}

export function ConceptRow({ id }: { id: string }) {
  const concept = conceptById(id)
  const mastery = useStore((s) => s.mastery[id])
  const nav = useStore((s) => s.navNotebook)
  if (!concept) return null
  return (
    <button className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-paper" onClick={() => nav(`/concept/${id}`)}>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{concept.name}</span>
      <MasteryDots level={(mastery ?? 0) as Level} />
    </button>
  )
}

export function MasteryRing({ percent, size = 44 }: { percent: number | null; size?: number }) {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={percent == null ? 'No concepts yet' : `${percent}% at Familiar or above`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e3dccb" strokeWidth="4" />
      {percent != null && percent > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#0f8a80"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.26} fontWeight={700} fill="#1e2a44">
        {percent == null ? '–' : percent}
      </text>
    </svg>
  )
}

export function Sparkline({ values }: { values: number[] }) {
  const w = 120
  const h = 32
  const pts = values.map((v, i) => [values.length === 1 ? w / 2 : 4 + (i / (values.length - 1)) * (w - 8), h - 4 - (v / 4) * (h - 8)])
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} role="img" aria-label="Mastery history over recent weeks">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#0f8a80" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#0f8a80" stroke="#fff" strokeWidth="2" />
    </svg>
  )
}

export interface SessionLink {
  id: string
  date: string
  agentName: string
  prompt: string
  files: string[]
  concepts: string[]
  itemId: string
}

/** Past sessions plus today's, newest first. */
export function useSessions(): SessionLink[] {
  const phase = useStore((s) => s.phase)
  const prompt = useStore((s) => s.prompt)
  const agent = useStore((s) => s.agent)
  const customAgent = useStore((s) => s.customAgent)
  const today: SessionLink[] =
    phase === 'done'
      ? [{
          id: 'today',
          date: 'Nov 2',
          agentName: agentName(agent, customAgent),
          prompt,
          files: ['library.py'],
          concepts: ['dictget', 'sortedkey', 'lambda', 'boundary'],
          itemId: 'cs120-p2',
        }]
      : []
  return [...today, ...SEED_HISTORY]
}

const AGENT_SHORT: Record<string, string> = { claude: 'Claude Code', codex: 'Codex', kimi: 'Kimi', gemini: 'Gemini', other: 'Custom agent' }
export const agentName = (agent: string, custom: string) => (agent === 'other' && custom ? custom : AGENT_SHORT[agent])

export function SessionList({ sessions }: { sessions: SessionLink[] }) {
  const nav = useStore((s) => s.navNotebook)
  if (sessions.length === 0) return <p className="text-sm text-ink-soft">No editor sessions have touched these concepts yet.</p>
  return (
    <ul className="flex flex-col gap-1">
      {sessions.map((s) => (
        <li key={s.id}>
          <button className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-paper" onClick={() => nav(`/session/${s.id}`)}>
            <div className="text-sm font-semibold text-ink">{s.prompt}</div>
            <div className="text-xs text-ink-soft">
              {s.date} · {s.agentName} · {s.files.join(', ')}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function pageTitle(route: string): string {
  const parts = route.split('/')
  if (parts[1] === 'course' && parts[3] === 'item') {
    const found = findItem(parts[4])
    return found ? `${found.item.code} ${found.item.title}` : 'Course page'
  }
  if (parts[1] === 'course') return COURSES.find((c) => c.id === parts[2])?.code ?? 'Course'
  if (parts[1] === 'concept') return conceptById(parts[2])?.name ?? 'Concept'
  if (parts[1] === 'session') {
    return parts[2] === 'today' ? "Today's session" : (SEED_HISTORY.find((s) => s.id === parts[2])?.prompt ?? 'Session')
  }
  if (parts[1] === 'notebook') {
    return useStore.getState().customNotebooks.find((n) => n.id === parts[2])?.name ?? 'Notebook'
  }
  return route
}

export function pageSubtitle(route: string): string {
  const parts = route.split('/')
  if (parts[1] === 'course' && parts[3] === 'item') return findItem(parts[4])?.course.code ?? ''
  if (parts[1] === 'concept') {
    const course = COURSES.find((c) => c.id === conceptById(parts[2])?.courseId)
    return course ? `${course.code} concept` : 'Concept'
  }
  if (parts[1] === 'session') return 'Editor session'
  if (parts[1] === 'notebook') return 'My notebook'
  return ''
}

export const daysUntil = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round((new Date(y, m - 1, d).getTime() - new Date(2026, 10, 2).getTime()) / 86400000)
}
