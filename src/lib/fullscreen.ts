import { useEffect, useState } from 'react'

// Safari still needs the webkit-prefixed API.
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
}
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }

const doc = () => document as FsDocument

export const isFullscreen = () => Boolean(doc().fullscreenElement ?? doc().webkitFullscreenElement)

export const fullscreenSupported = () => {
  const el = document.documentElement as FsElement
  return Boolean(el.requestFullscreen ?? el.webkitRequestFullscreen)
}

/** Browsers only allow this from a user gesture such as a click or key press. */
export async function enterFullscreen() {
  if (isFullscreen()) return
  const el = document.documentElement as FsElement
  try {
    await (el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.())
  } catch {
    /* Blocked, for example inside an iframe. The prototype keeps working in a normal window. */
  }
}

export async function exitFullscreen() {
  if (!isFullscreen()) return
  try {
    await (doc().exitFullscreen ? doc().exitFullscreen() : doc().webkitExitFullscreen?.())
  } catch {
    /* ignore */
  }
}

export const toggleFullscreen = () => (isFullscreen() ? exitFullscreen() : enterFullscreen())

export function useIsFullscreen() {
  const [on, setOn] = useState(isFullscreen)
  useEffect(() => {
    const update = () => setOn(isFullscreen())
    document.addEventListener('fullscreenchange', update)
    document.addEventListener('webkitfullscreenchange', update)
    return () => {
      document.removeEventListener('fullscreenchange', update)
      document.removeEventListener('webkitfullscreenchange', update)
    }
  }, [])
  return on
}
