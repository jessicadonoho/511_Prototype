import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toggleFullscreen, useIsFullscreen } from '../lib/fullscreen'
import { resetPrototype, useStore, type FixtureName, type LogEvent } from '../store/store'

const FLAG = 'changenotes-facilitator'

/** Reads ?facilitator=1 from either side of the #, and keeps it for this browser tab. */
export function isFacilitatorMode() {
  const fromUrl = (search: string) => new URLSearchParams(search).get('facilitator')
  const value = fromUrl(window.location.search) ?? fromUrl(window.location.hash.split('?')[1] ?? '')
  try {
    if (value === '1') sessionStorage.setItem(FLAG, '1')
    if (value === '0') sessionStorage.removeItem(FLAG)
    return sessionStorage.getItem(FLAG) === '1'
  } catch {
    return value === '1'
  }
}

const JUMPS: { id: FixtureName; label: string }[] = [
  { id: 'start', label: 'Start' },
  { id: 'afterT1', label: 'After T1' },
  { id: 'afterT4', label: 'After T4' },
  { id: 'notebookPost', label: 'Notebook post-session' },
]

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCsv(events: LogEvent[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = events.map((e) =>
    [new Date(e.ts).toISOString(), e.ts, e.participantId, e.task ?? '', e.event, JSON.stringify(e.payload)].map(esc).join(','),
  )
  return ['iso_time,ts,participantId,task,event,payload', ...rows].join('\n')
}

export function FacilitatorPanel() {
  const participantId = useStore((s) => s.participantId)
  const setParticipant = useStore((s) => s.setParticipant)
  const task = useStore((s) => s.task)
  const markTask = useStore((s) => s.markTask)
  const variants = useStore((s) => s.variants)
  const setVariant = useStore((s) => s.setVariant)
  const jumpToState = useStore((s) => s.jumpToState)
  const eventCount = useStore((s) => s.events.length)
  const isFull = useIsFullscreen()

  const [pos, setPos] = useState({ x: 12, y: 2 })
  const [collapsed, setCollapsed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 4000)
    return () => clearTimeout(t)
  }, [confirming])

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    const move = (ev: PointerEvent) => {
      if (!drag.current) return
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 120, ev.clientX - drag.current.dx)),
        y: Math.max(0, Math.min(window.innerHeight - 30, ev.clientY - drag.current.dy)),
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const fileBase = `changenotes-log-${participantId || 'unnamed'}`
  const buttonClass = 'rounded border border-[#888] px-1.5 py-0.5 hover:bg-white/10'

  return (
    <div
      className="fixed z-[100] w-[252px] rounded-lg border border-[#555] bg-[#111827]/95 font-ui text-[11.5px] text-white shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
      aria-label="Facilitator panel"
    >
      <div className="flex cursor-move items-center gap-1 rounded-t-lg bg-[#1f2937] px-2 py-1 select-none" onPointerDown={onPointerDown}>
        <span className="flex-1 font-semibold">Facilitator</span>
        <span className="text-[#c5ccd8]">{eventCount} events</span>
        <button aria-label={collapsed ? 'Expand facilitator panel' : 'Collapse facilitator panel'} className="w-5 rounded hover:bg-white/10" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '▸' : '▾'}
        </button>
      </div>
      {!collapsed && (
        <div className="flex max-h-[calc(100vh-60px)] flex-col gap-2 overflow-y-auto p-2">
          <label className="flex items-center gap-2">
            Participant
            <input
              value={participantId}
              onChange={(e) => setParticipant(e.target.value)}
              placeholder="P6"
              className="min-w-0 flex-1 rounded border border-[#666] bg-black/30 px-1.5 py-0.5 text-white placeholder:text-[#9aa3b2]"
            />
          </label>

          <div>
            <div className="mb-1 text-[#c5ccd8]">Mark task (click again to end)</div>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} aria-pressed={task === n} className={`rounded py-0.5 ${task === n ? 'bg-turq font-bold text-navy' : 'border border-[#666] hover:bg-white/10'}`} onClick={() => markTask(n)}>
                  T{n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-[#c5ccd8]">Jump to state</div>
            <div className="flex flex-wrap gap-1">
              {JUMPS.map((j) => <button key={j.id} className={buttonClass} onClick={() => jumpToState(j.id)}>{j.label}</button>)}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-[#c5ccd8]">Variants</div>
            <label className="flex items-center justify-between">
              Question card
              <select
                value={variants.questionPosition}
                onChange={(e) => setVariant('questionPosition', e.target.value as 'top' | 'bottom')}
                className="rounded border border-[#666] bg-[#1f2937] px-1"
              >
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
              </select>
            </label>
            <label className="flex items-center justify-between">
              Toast
              <input type="checkbox" checked={variants.toast} onChange={(e) => setVariant('toast', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between">
              Hover cards
              <input type="checkbox" checked={variants.hoverCards} onChange={(e) => setVariant('hoverCards', e.target.checked)} />
            </label>
          </div>

          <div>
            <div className="mb-1 text-[#c5ccd8]">Export log</div>
            <div className="flex gap-1">
              <button className={buttonClass} onClick={() => download(`${fileBase}.json`, JSON.stringify(useStore.getState().events, null, 2), 'application/json')}>JSON</button>
              <button className={buttonClass} onClick={() => download(`${fileBase}.csv`, toCsv(useStore.getState().events), 'text/csv')}>CSV</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-t border-[#444] pt-2">
            <button className={buttonClass} onClick={toggleFullscreen}>{isFull ? 'Exit full screen' : 'Full screen'}</button>
            <Link to="/five-second" className={buttonClass}>Five-second</Link>
          </div>

          <button
            className={`rounded py-1 font-semibold ${confirming ? 'bg-[#c9403a] text-white' : 'border border-[#c9403a] text-[#ffb4af] hover:bg-[#c9403a]/20'}`}
            onClick={() => (confirming ? resetPrototype() : setConfirming(true))}
          >
            {confirming ? 'Click again: this also clears the log' : 'Reset prototype'}
          </button>
        </div>
      )}
    </div>
  )
}
