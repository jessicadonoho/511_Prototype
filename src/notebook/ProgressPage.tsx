import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MasteryDots } from '../components/common'
import { COURSES, type Level } from '../data/courses'
import { ACTIVITY, WEEKLY_PROGRESS } from '../data/progress'
import { useFrozen } from '../lib/hooks'
import { familiarCount, useStore, visibleConcepts } from '../store/store'
import { Card } from './shared'

type SortKey = 'name' | 'level' | 'trend' | 'last'

/** Single metric per chart, so the two scales never share one axis. */
function TrendChart({ title, data, dataKey, unit, ticks }: { title: string; data: Record<string, number | string>[]; dataKey: string; unit: string; ticks: number[] }) {
  const frozen = useFrozen()
  const latest = data[data.length - 1][dataKey]
  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-2">
        <h3 className="flex-1 text-[13px] font-bold text-ink">{title}</h3>
        <span className="text-lg font-extrabold text-ink">{latest}{unit}</span>
      </div>
      <div className="h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -22 }}>
            <CartesianGrid vertical={false} stroke="#efe9da" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#55607a' }} tickLine={false} axisLine={{ stroke: '#e3dccb' }} interval="preserveStartEnd" />
            <YAxis domain={[ticks[0], ticks[ticks.length - 1]]} ticks={ticks} tick={{ fontSize: 11, fill: '#55607a' }} tickLine={false} axisLine={false} unit={unit} />
            <Tooltip
              cursor={{ stroke: '#55607a', strokeDasharray: '3 3' }}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e3dccb', color: '#1e2a44' }}
              formatter={(value) => [`${value}${unit}`, title]}
            />
            <Line type="monotone" dataKey={dataKey} stroke="#0f8a80" strokeWidth={2} dot={{ r: 4, fill: '#0f8a80', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={!frozen} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ProgressPage() {
  const nav = useStore((s) => s.navNotebook)
  const mastery = useStore((s) => s.mastery)
  const phase = useStore((s) => s.phase)
  const streak = useStore((s) => s.streak)
  const lessonDone = useStore((s) => s.lessonDone)
  const answered = useStore((s) => s.questionsAnswered)
  const correct = useStore((s) => s.questionsCorrect)
  const todayAnswered = useStore((s) => s.todayAnswered)
  const todayCorrect = useStore((s) => s.todayCorrect)
  const [course, setCourse] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'level', dir: 1 })

  const accuracy = Math.round((correct / answered) * 100)
  const mastered = visibleConcepts(mastery).filter((c) => mastery[c.id] === 4).length

  const chartData = useMemo(() => {
    const rows: { week: string; familiar: number; accuracy: number }[] = [...WEEKLY_PROGRESS]
    if (phase === 'done') {
      rows.push({
        week: 'Today',
        familiar: familiarCount(mastery),
        accuracy: todayAnswered ? Math.round((todayCorrect / todayAnswered) * 100) : WEEKLY_PROGRESS[WEEKLY_PROGRESS.length - 1].accuracy,
      })
    }
    return rows
  }, [phase, mastery, todayAnswered, todayCorrect])

  const concepts = visibleConcepts(mastery)
  // Learning → Familiar moves within the last 4 weekly points, plus any made today.
  const moved = concepts.filter((c) => {
    const recent = c.history.slice(-4)
    const seen = recent.some((v, i) => i > 0 && recent[i - 1] <= 1 && v >= 2)
    return seen || (c.start <= 1 && mastery[c.id] >= 2)
  }).length

  const rows = useMemo(() => {
    const trend = (id: string, start: Level, history: Level[]) => {
      const previous = history.length ? history[history.length - 2] ?? start : 0
      return mastery[id] - (mastery[id] > start ? start : previous)
    }
    const list = concepts
      .filter((c) => course === 'all' || c.courseId === course)
      .map((c) => ({ c, level: mastery[c.id], trend: trend(c.id, c.start, c.history) }))
    const compare = {
      name: (a: (typeof list)[0], b: (typeof list)[0]) => a.c.name.localeCompare(b.c.name),
      level: (a: (typeof list)[0], b: (typeof list)[0]) => a.level - b.level,
      trend: (a: (typeof list)[0], b: (typeof list)[0]) => a.trend - b.trend,
      last: (a: (typeof list)[0], b: (typeof list)[0]) => a.c.daysSince - b.c.daysSince,
    }[sort.key]
    return [...list].sort((a, b) => compare(a, b) * sort.dir || a.c.name.localeCompare(b.c.name))
  }, [concepts, course, sort, mastery])

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }))
  const Th = ({ k, children, className = '' }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={`py-1 pr-2 text-left font-bold ${className}`} aria-sort={sort.key === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button className="hover:text-turq-dark" onClick={() => toggleSort(k)}>
        {children} {sort.key === k ? (sort.dir === 1 ? '↑' : '↓') : ''}
      </button>
    </th>
  )

  // Today's lesson counts toward the calendar.
  const activity = useMemo(() => {
    const days = [...ACTIVITY]
    days[days.length - 1] += todayAnswered
    return days
  }, [todayAnswered])

  const tiles = [
    { label: 'Day streak', value: `🔥 ${streak}` },
    { label: 'Questions answered', value: answered },
    { label: 'Accuracy', value: `${accuracy}%` },
    { label: 'Concepts mastered', value: mastered },
  ]

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-extrabold text-ink">Progress</h1>
      <ul className="grid grid-cols-4 gap-2">
        {tiles.map((t) => (
          <li key={t.label} className="rounded-xl border border-line bg-white px-3 py-2">
            <div className="text-xl font-extrabold text-ink">{t.value}</div>
            <div className="text-xs text-ink-soft">{t.label}</div>
          </li>
        ))}
      </ul>

      <div className="rounded-xl bg-turq-soft px-4 py-2 text-sm font-semibold text-ink">
        Your growth: you’ve moved {moved} concepts from Learning to Familiar this month.
      </div>

      <Card title="Mastery over time">
        <div className="grid grid-cols-2 gap-4">
          <TrendChart title="Concepts at Familiar or above" data={chartData} dataKey="familiar" unit="" ticks={[0, 5, 10, 15]} />
          <TrendChart title="Accuracy" data={chartData} dataKey="accuracy" unit="%" ticks={[0, 50, 100]} />
        </div>
      </Card>

      <Card
        title="Mastery by concept"
        action={
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            Course
            <select value={course} onChange={(e) => setCourse(e.target.value)} className="rounded-lg border border-line bg-white px-1.5 py-0.5 text-xs text-ink">
              <option value="all">All courses</option>
              {COURSES.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </label>
        }
      >
        <table className="w-full border-collapse text-sm">
          <thead className="border-b border-line text-xs text-ink-soft">
            <tr>
              <Th k="name">Concept</Th>
              <Th k="level">Level</Th>
              <Th k="trend">Trend</Th>
              <Th k="last">Last practiced</Th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, level, trend }) => (
              <tr key={c.id} className="border-b border-paper-2 last:border-0">
                <td className="py-1 pr-2">
                  <button className="text-left font-semibold text-ink hover:text-turq-dark hover:underline" onClick={() => nav(`/concept/${c.id}`)}>
                    {c.name}
                  </button>
                </td>
                <td className="py-1 pr-2 whitespace-nowrap"><MasteryDots level={level} /></td>
                <td className="py-1 pr-2 text-xs whitespace-nowrap text-ink-soft">{trend > 0 ? '↑ Up' : trend < 0 ? '↓ Down' : '→ Steady'}</td>
                <td className="py-1 pr-2 text-xs whitespace-nowrap text-ink-soft">{c.lastPracticed}</td>
                <td className="py-1 text-right">
                  <button className="text-xs font-bold text-turq-dark underline underline-offset-2" onClick={() => nav(`/practice/concept/${c.id}`)}>
                    Practice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Streak calendar">
        <StreakCalendar activity={activity} lessonDone={lessonDone} />
      </Card>
    </div>
  )
}

const HEAT = ['#efe9da', '#bdeae3', '#7fd6cb', '#2ca89c', '#0f6e66']
const bucket = (n: number) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4)

function StreakCalendar({ activity, lessonDone }: { activity: number[]; lessonDone: boolean }) {
  // The grid ends on Mon Nov 2, the prototype's "today". 42 days, one column per week.
  const start = new Date(2026, 8, 22)
  const weeks: number[][] = []
  for (let i = 0; i < activity.length; i += 7) weeks.push(activity.slice(i, i + 7))
  return (
    <div className="flex items-end gap-3">
      <div className="flex gap-[3px]" role="img" aria-label={`Activity for the last 6 weeks. ${activity.filter((a) => a > 0).length} active days of ${activity.length}.`}>
        {weeks.map((week, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {week.map((n, d) => {
              const date = new Date(start.getTime() + (w * 7 + d) * 86400000)
              const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return <div key={d} title={`${label}: ${n} questions`} className="h-3.5 w-3.5 rounded-[3px]" style={{ background: HEAT[bucket(n)] }} />
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-ink-soft">
        Less
        {HEAT.map((c) => <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} aria-hidden="true" />)}
        More
      </div>
      <span className="text-[11px] text-ink-soft">{lessonDone ? 'Today’s lesson is done.' : 'Today’s lesson is still open.'}</span>
    </div>
  )
}
