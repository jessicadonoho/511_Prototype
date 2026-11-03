import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Logo } from '../components/common'
import { AGENTS, CHANGES, type AgentId } from '../data/changes'
import { buildLibrary, FILE_TREE, type ChangeId } from '../data/code'
import { useViewport } from '../lib/hooks'
import { isReviewComplete, logEvent, unreviewedCount, useStore, type SidebarView } from '../store/store'
import { ChangeNotesPanel } from './ChangeNotesPanel'
import { EditorArea } from './EditorArea'

export function IdeApp() {
  const { w, h } = useViewport()
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const panelOpen = useStore((s) => s.panelOpen)
  const panelWidthRaw = useStore((s) => s.panelWidth)
  const setPanelWidth = useStore((s) => s.setPanelWidth)
  const setPanel = useStore((s) => s.setPanel)
  const stepChange = useStore((s) => s.stepChange)
  const frontApp = useStore((s) => s.frontApp)

  // VS Code's compact density at 1280 wide. Narrower windows give the editor more of the room.
  const narrow = w < 1180
  const sidebarWidth = narrow ? 180 : 240
  const panelWidth = narrow ? Math.min(panelWidthRaw, 272) : panelWidthRaw
  const terminalHeight = h < 700 ? 132 : 180

  // Alt+] and Alt+[ step through changes. e.code keeps it working on Mac, where Alt types a symbol.
  useEffect(() => {
    if (frontApp !== 'ide') return
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return
      if (e.code === 'BracketRight') {
        e.preventDefault()
        stepChange(1)
      } else if (e.code === 'BracketLeft') {
        e.preventDefault()
        stepChange(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [frontApp, stepChange])

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = panelWidth
    const move = (ev: PointerEvent) => setPanelWidth(Math.min(480, Math.max(260, startWidth + startX - ev.clientX)))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-vs-bg font-ui text-vs-text">
      <div className="flex min-h-0 flex-1">
        <ActivityBar />
        {sidebarOpen && <Sidebar width={sidebarWidth} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <EditorArea />
            <Toast />
          </div>
          <TerminalPanel height={terminalHeight} />
        </div>
        {panelOpen ? (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize ChangeNotes panel"
              className="w-1 shrink-0 cursor-col-resize bg-vs-line/40 hover:bg-turq"
              onPointerDown={startResize}
            />
            <ChangeNotesPanel width={panelWidth} />
          </>
        ) : (
          <button
            className="flex w-7 shrink-0 flex-col items-center gap-2 border-l border-vs-line bg-vs-side pt-2 text-[11px] text-turq hover:bg-white/5"
            aria-label="Open ChangeNotes panel"
            title="Open ChangeNotes panel"
            onClick={() => setPanel(true)}
          >
            <Logo size={16} />
            ‹
          </button>
        )}
      </div>
      <StatusBar />
    </div>
  )
}

// ---------- Menu bar (shown in the window's title bar) ----------

export function IdeMenus() {
  const [hint, setHint] = useState<string | null>(null)
  return (
    <nav className="flex items-center gap-0.5 text-[12px] text-vs-text" aria-label="Application menu">
      {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'].map((m) => (
        <button
          key={m}
          aria-haspopup="false"
          className={`rounded px-1.5 py-0.5 hover:bg-white/10 ${hint === m ? 'bg-white/10' : ''}`}
          onClick={() => {
            setHint(m)
            setTimeout(() => setHint(null), 150)
            logEvent('dead_click', { target: `menu_${m.toLowerCase()}` })
          }}
        >
          {m}
        </button>
      ))}
    </nav>
  )
}

// ---------- Activity bar ----------

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const ACTIVITY: { view: SidebarView; label: string; icon: ReactNode }[] = [
  { view: 'explorer', label: 'Explorer', icon: <Svg><path d="M14 3H7a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" /><path d="M14 3v4h4M3 7v13a1 1 0 0 0 1 1h10" /></Svg> },
  { view: 'search', label: 'Search', icon: <Svg><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8" /></Svg> },
  { view: 'scm', label: 'Source Control', icon: <Svg><circle cx="7" cy="5" r="2" /><circle cx="7" cy="19" r="2" /><circle cx="17" cy="8" r="2" /><path d="M7 7v10M17 10c0 4-10 2-10 6" /></Svg> },
  { view: 'extensions', label: 'Extensions', icon: <Svg><rect x="3" y="10" width="5" height="5" /><rect x="3" y="16" width="5" height="5" /><rect x="9" y="16" width="5" height="5" /><rect x="14" y="4" width="6" height="6" /></Svg> },
]

function ActivityBar() {
  const view = useStore((s) => s.sidebarView)
  const open = useStore((s) => s.sidebarOpen)
  const show = useStore((s) => s.showSidebar)
  const phase = useStore((s) => s.phase)
  const reviewed = useStore((s) => s.reviewed)
  const count = phase === 'done' ? unreviewedCount({ reviewed }) : 0

  const cls = (v: SidebarView) =>
    `relative flex h-11 w-full items-center justify-center border-l-2 ${open && view === v ? 'border-white text-white' : 'border-transparent text-vs-dim hover:text-white'}`

  return (
    <nav className="flex w-11 shrink-0 flex-col bg-vs-bar" aria-label="Activity bar">
      {ACTIVITY.map((a) => (
        <button key={a.view} className={cls(a.view)} title={a.label} aria-label={a.label} onClick={() => show(a.view)}>
          {a.icon}
        </button>
      ))}
      <button
        className={cls('changenotes')}
        title="ChangeNotes: AI changes"
        aria-label={`ChangeNotes: ${count} AI changes to review`}
        onClick={() => show('changenotes')}
      >
        <Logo size={22} />
        {count > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-turq px-1 text-[10px] font-bold text-navy">
            {count}
          </span>
        )}
      </button>
    </nav>
  )
}

// ---------- Sidebar ----------

function Sidebar({ width }: { width: number }) {
  const view = useStore((s) => s.sidebarView)
  const title: Record<SidebarView, string> = {
    explorer: 'Explorer',
    search: 'Search',
    scm: 'Source Control',
    extensions: 'Extensions',
    changenotes: 'AI Changes',
  }
  return (
    <aside className="flex shrink-0 flex-col border-r border-vs-line bg-vs-side" style={{ width }} aria-label={title[view]}>
      <div className={`flex h-[30px] shrink-0 items-center gap-1.5 px-3 text-[11px] tracking-wide uppercase ${view === 'changenotes' ? 'text-turq' : 'text-vs-dim'}`}>
        {view === 'changenotes' && <Logo size={13} />}
        {title[view]}
      </div>
      <div className="dark-scroll min-h-0 flex-1 overflow-y-auto">
        {view === 'explorer' && <Explorer />}
        {view === 'search' && <SearchView />}
        {view === 'scm' && <ScmView />}
        {view === 'extensions' && <ExtensionsView />}
        {view === 'changenotes' && <AiChangesView />}
      </div>
    </aside>
  )
}

function FileRow({ path, name, indent, badge }: { path: string; name: string; indent: number; badge?: string }) {
  const active = useStore((s) => s.activeFile === path)
  const setActive = useStore((s) => s.setActiveFile)
  return (
    <button
      className={`flex h-[22px] w-full items-center gap-1.5 pr-2 text-left text-[12.5px] ${active ? 'bg-[#37373d] text-white' : 'text-vs-text hover:bg-white/5'}`}
      style={{ paddingLeft: indent }}
      onClick={() => setActive(path)}
    >
      <span className="truncate">{name}</span>
      {badge && <span className="ml-auto text-[11px] font-semibold text-diff-warn" title="Modified">{badge}</span>}
    </button>
  )
}

function Explorer() {
  const phase = useStore((s) => s.phase)
  return (
    <div>
      <div className="flex h-[22px] items-center px-2 text-[11.5px] font-bold text-vs-text uppercase">▾ library-tracker</div>
      <FileRow path="library.py" name="library.py" indent={22} badge={phase === 'done' ? 'M' : undefined} />
      <FileRow path="test_library.py" name="test_library.py" indent={22} />
      <div className="flex h-[22px] items-center pl-[14px] text-[12.5px] text-vs-text">▾ data</div>
      <FileRow path="data/checkouts.csv" name="checkouts.csv" indent={32} />
      <FileRow path="README.md" name="README.md" indent={22} />
    </div>
  )
}

function SearchView() {
  const setActive = useStore((s) => s.setActiveFile)
  const [q, setQ] = useState('')
  const matches = q.trim() ? FILE_TREE.filter((f) => f.name.toLowerCase().includes(q.trim().toLowerCase())) : []
  return (
    <div className="p-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search files"
        aria-label="Search files"
        className="w-full rounded border border-vs-line bg-[#3c3c3c] px-2 py-1 text-[12px] text-white placeholder:text-vs-dim"
      />
      {matches.map((f) => (
        <button key={f.path} className="block w-full truncate px-1 py-0.5 text-left text-[12px] hover:bg-white/5" onClick={() => setActive(f.path)}>
          {f.path}
        </button>
      ))}
    </div>
  )
}

function ScmView() {
  const phase = useStore((s) => s.phase)
  return (
    <div className="p-3 text-[12px] leading-relaxed text-vs-dim">
      <div>Branch: main</div>
      {phase === 'done' ? <FileRow path="library.py" name="library.py" indent={0} badge="M" /> : <p className="mt-1">No changes yet.</p>}
    </div>
  )
}

function ExtensionsView() {
  return (
    <div className="p-2">
      <div className="flex gap-2 rounded bg-white/5 p-2">
        <Logo size={28} />
        <div className="min-w-0 text-[12px] leading-snug">
          <div className="font-semibold text-white">ChangeNotes</div>
          <div className="text-vs-dim">Learn while you vibe code.</div>
          <div className="mt-0.5 text-[11px] text-turq">Installed</div>
        </div>
      </div>
    </div>
  )
}

function AiChangesView() {
  const phase = useStore((s) => s.phase)
  const reviewed = useStore((s) => s.reviewed)
  const decisions = useStore((s) => s.decisions)
  const showDiff = useStore((s) => s.showDiff)
  const setShowDiff = useStore((s) => s.setShowDiff)
  const jumpTo = useStore((s) => s.jumpTo)
  const ranges = useMemo(() => buildLibrary(decisions).ranges, [decisions])

  if (phase !== 'done') {
    return <p className="p-3 text-[12px] leading-relaxed text-vs-dim">No AI changes yet. Run the AI agent in the terminal, and its changes will show up here.</p>
  }
  return (
    <div className="pb-2">
      <div className="flex h-[22px] items-center px-2 text-[12px] font-semibold text-white">▾ library.py</div>
      <ul>
        {CHANGES.map((c) => {
          const r = ranges[c.id]
          const warn = c.kind === 'assumption'
          return (
            <li key={c.id}>
              <button className="w-full py-1 pr-2 pl-4 text-left hover:bg-white/5" onClick={() => jumpTo(c.id as ChangeId, 'sidebar')}>
                <div className="flex items-start gap-1.5 text-[12px] leading-snug text-white">
                  <span aria-hidden="true" className={warn ? 'text-diff-warn' : 'text-diff-add'}>{warn ? '⚠' : '＋'}</span>
                  <span className="min-w-0 flex-1">{c.label}</span>
                  <span aria-label={reviewed[c.id] ? 'Reviewed' : 'Not reviewed yet'} title={reviewed[c.id] ? 'Reviewed' : 'Not reviewed yet'} className="text-vs-dim">
                    {reviewed[c.id] ? '✓' : '○'}
                  </span>
                </div>
                <div className={`pl-[18px] text-[11px] leading-snug ${warn ? 'text-diff-warn' : 'text-diff-add'}`}>{c.typeLabel}</div>
                <div className="pl-[18px] font-mono text-[11px] text-vs-dim">
                  {r.present ? `Ln ${r.start}${r.end !== r.start ? `–${r.end}` : ''}` : 'Reverted'}
                  {decisions[c.id] === 'accepted' ? ' · accepted' : ''}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="px-3 pt-2">
        <button className="w-full rounded border border-turq/60 py-1 text-[11.5px] text-turq hover:bg-turq/15" aria-pressed={showDiff} onClick={() => setShowDiff(!showDiff, 'sidebar')}>
          {showDiff ? 'Hide diff' : 'Show as diff'}
        </button>
      </div>
    </div>
  )
}

// ---------- Terminal ----------

function TerminalPanel({ height }: { height: number }) {
  const tab = useStore((s) => s.bottomTab)
  const agent = useStore((s) => s.agent)
  const customAgent = useStore((s) => s.customAgent)
  const selectAgent = useStore((s) => s.selectAgent)
  const setCustomAgent = useStore((s) => s.setCustomAgent)
  const phase = useStore((s) => s.phase)

  const setTab = (bottomTab: 'terminal' | 'problems' | 'output') => useStore.setState({ bottomTab })

  return (
    <section className="flex shrink-0 flex-col border-t border-vs-line bg-vs-bg" style={{ height }} aria-label="Bottom panel">
      <div className="flex h-[26px] shrink-0 items-center gap-3 px-3">
        {(['terminal', 'problems', 'output'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-full border-b text-[11px] tracking-wide uppercase ${tab === t ? 'border-white text-white' : 'border-transparent text-vs-dim hover:text-white'}`}
          >
            {t}
          </button>
        ))}
        <span className="flex-1" />
        <label className="flex items-center gap-1.5 text-[11px] text-vs-dim">
          Agent
          <select
            value={agent}
            disabled={phase === 'running'}
            onChange={(e) => selectAgent(e.target.value as AgentId)}
            className="rounded border border-vs-line bg-[#3c3c3c] px-1 py-px text-[11px] text-white"
          >
            {AGENTS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        {agent === 'other' && (
          <input
            value={customAgent}
            onChange={(e) => setCustomAgent(e.target.value)}
            placeholder="Agent name"
            aria-label="Custom agent name"
            className="w-24 rounded border border-vs-line bg-[#3c3c3c] px-1 py-px text-[11px] text-white placeholder:text-vs-dim"
          />
        )}
      </div>
      <div className="min-h-0 flex-1">
        {tab === 'terminal' && <Terminal />}
        {tab === 'problems' && <p className="px-3 py-1 text-[12px] text-vs-dim">No problems have been detected in the workspace.</p>}
        {tab === 'output' && (
          <p className="px-3 py-1 font-mono text-[12px] text-vs-dim">
            {phase === 'done' ? 'ChangeNotes: session captured, 3 changes in library.py' : 'ChangeNotes: watching for AI sessions'}
          </p>
        )}
      </div>
    </section>
  )
}

const LINE_CLASS: Record<string, string> = {
  shell: 'text-vs-text',
  agent: 'text-diff-add',
  muted: 'text-vs-dim',
  prompt: 'text-white',
  output: 'text-vs-text',
  done: 'text-diff-add',
  changenotes: 'text-turq',
}

function Terminal() {
  const lines = useStore((s) => s.terminal)
  const phase = useStore((s) => s.phase)
  const submit = useStore((s) => s.submitPrompt)
  const [value, setValue] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [lines, phase])

  return (
    <div
      ref={scroller}
      className="dark-scroll h-full cursor-text overflow-y-auto px-3 pb-1 font-mono text-[12px] leading-[18px]"
      onClick={() => {
        if (!window.getSelection()?.toString()) input.current?.focus()
      }}
    >
      {lines.map((line, i) => (
        <div key={i} className={`break-words whitespace-pre-wrap ${LINE_CLASS[line.kind]}`}>
          {line.kind === 'prompt' ? `❯ ${line.text}` : line.text}
        </div>
      ))}
      {phase === 'running' ? (
        <div className="text-vs-dim">
          <span className="caret">▋</span>
        </div>
      ) : (
        <form
          className="flex items-center"
          onSubmit={(e) => {
            e.preventDefault()
            submit(value)
            setValue('')
          }}
        >
          <span className="pr-[1ch] text-white">❯</span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Terminal input. Type a prompt for the AI agent and press Enter."
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-white caret-white outline-none focus-visible:outline-none"
          />
        </form>
      )}
    </div>
  )
}

// ---------- Status bar ----------

function StatusBar() {
  const phase = useStore((s) => s.phase)
  const reviewed = useStore((s) => s.reviewed)
  const questionsFinished = useStore((s) => s.questionsFinished)
  const cursor = useStore((s) => s.cursor)
  const dot = useStore((s) => s.notebookDot)
  const show = useStore((s) => s.showSidebar)
  const sidebarView = useStore((s) => s.sidebarView)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const openNotebook = useStore((s) => s.openNotebook)
  const remaining = unreviewedCount({ reviewed })
  const done = phase === 'done'

  let label = 'ChangeNotes: idle'
  if (phase === 'running') label = 'ChangeNotes: watching…'
  if (done) {
    label = remaining === 0 || isReviewComplete({ reviewed, questionsFinished }) && remaining === 0
      ? 'ChangeNotes: reviewed ✓'
      : `ChangeNotes: ${remaining} ${remaining === 1 ? 'change' : 'changes'} to review`
  }

  const dead = (target: string) => () => logEvent('dead_click', { target })

  return (
    <footer className="flex h-[22px] shrink-0 items-stretch bg-[#0066b8] text-[11.5px] whitespace-nowrap text-white" aria-label="Status bar">
      <button className="px-2 hover:bg-white/15" onClick={dead('status_branch')}>⎇ main</button>
      <span className="flex-1" />
      <span className="flex items-center px-2 max-[1120px]:hidden">Ln {cursor.line}, Col {cursor.col}</span>
      <button className="px-2 hover:bg-white/15 max-[1120px]:hidden" onClick={dead('status_python')}>Python 3.12</button>
      <button
        className="flex items-center gap-1 bg-turq px-2 font-medium text-navy hover:bg-[#4fd4c8]"
        onClick={() => {
          if (!(sidebarOpen && sidebarView === 'changenotes')) show('changenotes')
        }}
      >
        ◧ {label}
      </button>
      <button
        className="relative flex items-center gap-1 bg-navy px-2 font-medium text-white hover:bg-[#2a3a5e]"
        title="Open ChangeNotes Notebook"
        aria-label={dot ? 'Open ChangeNotes Notebook. New content.' : 'Open ChangeNotes Notebook'}
        onClick={() => openNotebook('statusbar')}
      >
        📓 Notebook
        {dot && <span className="ml-0.5 h-2 w-2 rounded-full bg-turq" aria-hidden="true" />}
      </button>
    </footer>
  )
}

// ---------- Toast ----------

function Toast() {
  const visible = useStore((s) => s.toast)
  const enabled = useStore((s) => s.variants.toast)
  const dismiss = useStore((s) => s.dismissToast)
  const jumpTo = useStore((s) => s.jumpTo)
  if (!visible || !enabled) return null
  return (
    <div
      role="status"
      className="toast-enter absolute right-5 bottom-2 z-30 w-[270px] rounded border border-vs-line border-l-4 border-l-turq bg-[#2d2d30] p-2.5 text-[12.5px] leading-snug text-white shadow-xl"
    >
      <div className="flex items-start gap-1.5">
        <Logo size={15} className="mt-px" />
        <span>AI changed 3 parts of library.py. Review them?</span>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          className="rounded bg-turq px-2.5 py-0.5 text-[12px] font-semibold text-navy hover:bg-[#4fd4c8]"
          onClick={() => {
            dismiss('review')
            jumpTo(1, 'panel')
          }}
        >
          Review
        </button>
        <button className="rounded px-2.5 py-0.5 text-[12px] text-vs-text hover:bg-white/10" onClick={() => dismiss('later')}>
          Later
        </button>
      </div>
    </div>
  )
}
