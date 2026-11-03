import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Logo } from '../components/common'
import { Desktop } from '../desktop/Desktop'
import { enterFullscreen, fullscreenSupported, toggleFullscreen, useIsFullscreen } from '../lib/fullscreen'
import { FrozenContext } from '../lib/hooks'
import { buildFixture, initialPersisted, setPersistPaused, useStore } from '../store/store'

export const SCREENS: { id: string; label: string; shows: string }[] = [
  { id: 'ide-review', label: 'IDE: review', shows: 'Right after the AI session: highlights, inline labels, Review panel, toast and Notebook dot.' },
  { id: 'ide-hover', label: 'IDE: hover card', shows: 'The .get hover card, open.' },
  { id: 'ide-question', label: 'IDE: question', shows: 'The comprehension question card (Q2) in focus.' },
  { id: 'notebook-home', label: 'Notebook: Home', shows: 'Notebook Home, post-session.' },
  { id: 'notebook-progress', label: 'Notebook: Progress', shows: 'The Progress page.' },
  { id: 'notebook-lesson', label: 'Notebook: lesson', shows: 'A Today’s Lesson question screen.' },
  { id: 'desktop-both', label: 'Desktop: both apps', shows: 'The IDE in front, with the Notebook partly visible behind it.' },
]

function applyScreen(screen: string) {
  // Always use default settings here, so a facilitator's variant toggles can't change the frozen screens.
  const fixture = (name: Parameters<typeof buildFixture>[0], patch: object = {}) =>
    useStore.setState({ ...buildFixture(name), jump: null, selection: null, newNotebook: null, ...patch })
  switch (screen) {
    case 'ide-review':
      return fixture('afterT1', { notebookDot: true })
    case 'ide-hover':
      return fixture('afterT1', { toast: false })
    case 'ide-question':
      return fixture('afterT1', {
        toast: false,
        questionIndex: 1,
        answers: { q1: { choice: 1, correct: true, hintUsed: false } },
        reviewed: { 1: true, 2: false, 3: false },
      })
    case 'notebook-home':
      return fixture('notebookPost', { notebookRoute: '/home' })
    case 'notebook-progress':
      return fixture('notebookPost', { notebookRoute: '/progress' })
    case 'notebook-lesson':
      return fixture('notebookPost', { notebookRoute: '/lesson' })
    case 'desktop-both':
      return fixture('afterT1', { toast: false, open: { ide: true, notebook: true }, frontApp: 'ide', notebookRoute: '/home' })
  }
}

/** Monaco and the charts need a moment to settle, so nothing shows until they have. */
const SETTLE_MS = 1000

export function FiveSecondScreen() {
  const { screen = '' } = useParams()
  const [params] = useSearchParams()
  const timer = Number(params.get('timer')) || 0
  const countdownOn = params.get('countdown') === '1'
  const known = SCREENS.some((s) => s.id === screen)

  const [ready, setReady] = useState(false)
  const [settled, setSettled] = useState(false)
  const [count, setCount] = useState(countdownOn ? 3 : 0)
  const [finished, setFinished] = useState(false)

  // Borrow the store for this screen without touching the participant's saved state.
  useLayoutEffect(() => {
    if (!known) return
    setPersistPaused(true)
    applyScreen(screen)
    setReady(true)
    return () => {
      setReady(false)
      useStore.setState(initialPersisted())
      setPersistPaused(false)
      void useStore.persist.rehydrate()
    }
  }, [screen, known])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setSettled(true), SETTLE_MS)
    return () => clearTimeout(t)
  }, [ready])

  useEffect(() => {
    if (!settled || count <= 0) return
    const t = setTimeout(() => setCount(count - 1), 1000)
    return () => clearTimeout(t)
  }, [settled, count])

  const visible = settled && count === 0
  useEffect(() => {
    if (!visible || !timer) return
    const t = setTimeout(() => setFinished(true), timer * 1000)
    return () => clearTimeout(t)
  }, [visible, timer])

  // No visible UI on these screens, so F toggles full screen for the facilitator.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      // Freeze the screen: keys can't reach the frozen components.
      if (e.key !== 'Escape' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  if (!known) {
    return (
      <div className="flex h-full items-center justify-center bg-[#e9e9e6] text-center text-sm text-[#333]">
        <p>
          Unknown screen. <Link className="underline" to="/five-second">See all screens</Link>
        </p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="flex h-full items-center justify-center bg-[#e9e9e6] px-6 text-center">
        <p className="text-2xl font-medium text-[#333]">What do you remember about what you just saw?</p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {ready && (
        <FrozenContext.Provider value={screen}>
          <div className="frozen absolute inset-0" style={{ opacity: visible ? 1 : 0 }} aria-hidden={!visible}>
            <Desktop layout={screen === 'desktop-both' ? 'both' : 'normal'} />
          </div>
        </FrozenContext.Provider>
      )}
      {!visible && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#e9e9e6]">
          {countdownOn && settled && <span className="text-7xl font-semibold text-[#333]">{count}…</span>}
        </div>
      )}
    </div>
  )
}

export function FiveSecondIndex() {
  const navigate = useNavigate()
  const [full, setFull] = useState(true)
  const [countdown, setCountdown] = useState(true)
  const isFull = useIsFullscreen()

  const launch = (id: string, timed: boolean) => {
    if (full) void enterFullscreen()
    const query = new URLSearchParams()
    if (timed) query.set('timer', '5')
    if (countdown) query.set('countdown', '1')
    const qs = query.toString()
    navigate(`/five-second/${id}${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="note-scroll h-full overflow-y-auto bg-paper font-note text-ink">
      <div className="mx-auto max-w-3xl p-5">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <h1 className="flex-1 text-xl font-extrabold">Five-second test screens</h1>
          <Link to="/" className="text-sm font-bold text-turq-dark underline underline-offset-2">Back to prototype</Link>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          For facilitators. Screens are frozen and don’t use a participant’s saved state. To leave a screen, press Back. Press F to toggle full screen, or Esc to exit it.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
          {fullscreenSupported() && (
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-[#0f8a80]" checked={full} onChange={(e) => setFull(e.target.checked)} />
              Launch in full screen {isFull && <span className="font-normal text-ink-soft">(on now)</span>}
            </label>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-[#0f8a80]" checked={countdown} onChange={(e) => setCountdown(e.target.checked)} />
            “3… 2… 1…” pre-roll
          </label>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {SCREENS.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{s.label} <code className="ml-1 text-xs font-normal text-ink-soft">{s.id}</code></div>
                <div className="text-xs text-ink-soft">{s.shows}</div>
              </div>
              <button className="rounded-lg bg-turq px-3 py-1.5 text-sm font-bold whitespace-nowrap text-navy hover:bg-[#25b0a3]" onClick={() => launch(s.id, true)}>
                Launch · 5s timer
              </button>
              <button className="rounded-lg border border-turq-dark px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-turq-dark hover:bg-turq-soft" onClick={() => launch(s.id, false)}>
                No timer
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
