import { useEffect, useRef } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Logo } from './components/common'
import { Desktop } from './desktop/Desktop'
import { FacilitatorPanel, isFacilitatorMode } from './facilitator/FacilitatorPanel'
import { FiveSecondIndex, FiveSecondScreen } from './fivesecond/FiveSecond'
import { useViewport } from './lib/hooks'
import { logEvent } from './store/store'

function Shell() {
  const location = useLocation()
  const first = useRef(true)
  const isFrozenScreen = /^\/five-second\/.+/.test(location.pathname)
  const facilitator = isFacilitatorMode()

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!isFrozenScreen) logEvent('route_change', { route: location.pathname + location.search })
  }, [location, isFrozenScreen])

  return (
    <>
      <Routes>
        <Route path="/five-second" element={<FiveSecondIndex />} />
        <Route path="/five-second/:screen" element={<FiveSecondScreenKeyed />} />
        <Route path="*" element={<Desktop />} />
      </Routes>
      {facilitator && !isFrozenScreen && <FacilitatorPanel />}
    </>
  )
}

function FiveSecondScreenKeyed() {
  const location = useLocation()
  return <FiveSecondScreen key={location.pathname + location.search} />
}

function TooSmall() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-paper px-6 text-center font-note text-ink">
      <Logo size={40} />
      <h1 className="text-xl font-extrabold">Please use a laptop or desktop browser</h1>
      <p className="max-w-sm text-sm text-ink-soft">This prototype needs a window at least 960 pixels wide. Try making this window wider, or open the link on a laptop.</p>
    </div>
  )
}

export default function App() {
  const { w } = useViewport()
  if (w < 960) return <TooSmall />
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
