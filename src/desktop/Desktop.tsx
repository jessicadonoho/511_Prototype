import { useEffect, useState, type ReactNode } from 'react'
import { Logo } from '../components/common'
import { IdeApp, IdeMenus } from '../ide/IdeApp'
import { fullscreenSupported, toggleFullscreen, useIsFullscreen } from '../lib/fullscreen'
import { useFrozen } from '../lib/hooks'
import { NotebookApp, NotebookTitle } from '../notebook/NotebookApp'
import { useStore, type AppId } from '../store/store'

export const DOCK_HEIGHT = 48

function TrafficLights({ app, dark }: { app: AppId; dark: boolean }) {
  const close = useStore((s) => s.closeApp)
  const maximize = useStore((s) => s.toggleMaximize)
  const name = app === 'ide' ? 'Code' : 'Notebook'
  const base = `h-3 w-3 rounded-full border ${dark ? 'border-black/30' : 'border-black/15'}`
  return (
    <div className="group flex shrink-0 items-center gap-1.5">
      <button aria-label={`Close ${name}`} title="Close" className={`${base} bg-[#ff5f57]`} onClick={() => close(app)} />
      <button aria-label={`Minimize ${name}`} title="Minimize" className={`${base} bg-[#febc2e]`} onClick={() => close(app)} />
      <button aria-label={`Maximize ${name}`} title="Maximize" className={`${base} bg-[#28c840]`} onClick={() => maximize(app)} />
    </div>
  )
}

function AppWindow({
  app,
  title,
  chromeClass,
  leading,
  children,
  layout,
}: {
  app: AppId
  title: ReactNode
  chromeClass: string
  leading?: ReactNode
  children: ReactNode
  layout: 'normal' | 'both'
}) {
  const frontApp = useStore((s) => s.frontApp)
  const open = useStore((s) => s.open[app])
  const maximized = useStore((s) => s.maximized[app])
  const focus = useStore((s) => s.focusApp)
  const frozen = useFrozen()
  const front = frontApp === app
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (front) setAnimKey((k) => k + 1)
  }, [front])

  // Windows fill about 94% of the width and 88% of the height above the dock.
  const area = `calc(100vh - ${DOCK_HEIGHT}px)`
  const offset = app === 'ide' ? { left: '2%', top: `calc(${area} * 0.05)` } : { left: '4%', top: `calc(${area} * 0.08)` }
  let style: React.CSSProperties = { width: '94%', height: `calc(${area} * 0.88)`, ...offset }
  if (app === 'notebook') style = { ...style, width: '94%', left: '4%' }
  if (maximized) style = { left: 0, top: 0, width: '100%', height: area }
  // desktop-both: place the windows so both are plainly visible as separate apps.
  if (layout === 'both') {
    style =
      app === 'ide'
        ? { left: '2%', top: `calc(${area} * 0.12)`, width: '78%', height: `calc(${area} * 0.84)` }
        : { left: '42%', top: `calc(${area} * 0.03)`, width: '56%', height: `calc(${area} * 0.8)` }
  }

  return (
    <div
      role="group"
      aria-label={app === 'ide' ? 'Code editor window' : 'ChangeNotes Notebook window'}
      onMouseDown={() => focus(app)}
      style={{ ...style, position: 'absolute', zIndex: front ? 20 : 10, display: open ? 'flex' : 'none' }}
      className={`flex-col overflow-hidden shadow-2xl ${app === 'ide' ? 'rounded-lg border border-black/60' : 'rounded-2xl border border-[#cfc7b3]'}`}
    >
      {/* Inert hides a background window's contents from keyboard users. Clicks still reach the frame, which raises it. */}
      <div key={animKey} inert={!front && !frozen} className={`flex h-full min-h-0 flex-col ${front ? 'window-enter' : ''}`}>
        <div className={`flex shrink-0 items-center gap-3 px-3 ${chromeClass}`}>
          <TrafficLights app={app} dark={app === 'ide'} />
          {leading}
          <div className="pointer-events-none absolute inset-x-0 flex justify-center">{title}</div>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

function DockIcon({
  label,
  running,
  active,
  bounce,
  onClick,
  children,
}: {
  label: string
  running: boolean
  active: boolean
  bounce?: number
  onClick(): void
  children: ReactNode
}) {
  const frozen = useFrozen()
  return (
    <button
      aria-label={`${label}${running ? ' (running)' : ''}`}
      title={frozen ? undefined : label}
      aria-pressed={active}
      onClick={onClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/15"
    >
      <span key={bounce} className={bounce ? 'dock-bounce' : ''}>{children}</span>
      {running && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-white" aria-hidden="true" />}
    </button>
  )
}

function CodeIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#2b3a55" />
      <path d="M12 10 6 16l6 6M20 10l6 6-6 6" fill="none" stroke="#9fc4ff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FullscreenButton() {
  const on = useIsFullscreen()
  if (!fullscreenSupported()) return null
  const label = on ? 'Exit full screen' : 'Enter full screen'
  return (
    <button
      aria-label={label}
      title={label}
      onClick={toggleFullscreen}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-white/85 hover:bg-white/15 hover:text-white"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {on ? (
          <path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4" />
        ) : (
          <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
        )}
      </svg>
    </button>
  )
}

function Dock() {
  const frontApp = useStore((s) => s.frontApp)
  const open = useStore((s) => s.open)
  const bounce = useStore((s) => s.bounceNonce)
  const openIde = useStore((s) => s.openIde)
  const openNotebook = useStore((s) => s.openNotebook)
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center" style={{ height: DOCK_HEIGHT }}>
      <nav className="flex items-center gap-1 self-center rounded-xl border border-white/15 bg-white/15 px-1.5 py-0.5 backdrop-blur-md" aria-label="Dock">
        <DockIcon label="Code Editor" running={open.ide} active={frontApp === 'ide'} onClick={() => openIde('dock')}>
          <CodeIcon />
        </DockIcon>
        <DockIcon label="ChangeNotes Notebook" running={open.notebook} active={frontApp === 'notebook'} bounce={bounce} onClick={() => openNotebook('dock')}>
          <Logo size={30} />
        </DockIcon>
        <span className="mx-0.5 h-6 w-px bg-white/25" aria-hidden="true" />
        <FullscreenButton />
      </nav>
    </div>
  )
}

export function Desktop({ layout = 'normal' }: { layout?: 'normal' | 'both' }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#4a5266] via-[#3d4557] to-[#2f3646]">
      <AppWindow
        app="notebook"
        layout={layout}
        chromeClass="relative h-9 border-b border-line bg-paper-2"
        title={<NotebookTitle />}
      >
        <NotebookApp />
      </AppWindow>
      <AppWindow
        app="ide"
        layout={layout}
        chromeClass="relative h-[30px] bg-vs-title"
        leading={<IdeMenus />}
        title={<span className="text-[12px] text-vs-text max-[1120px]:hidden">Code — library-tracker</span>}
      >
        <IdeApp />
      </AppWindow>
      <Dock />
    </div>
  )
}
