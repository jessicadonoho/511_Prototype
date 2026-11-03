import { createContext, useContext, useEffect, useState } from 'react'

export function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

/** Set on five-second screens. Components read it to show their frozen state. */
export const FrozenContext = createContext<string | null>(null)
export const useFrozen = () => useContext(FrozenContext)
