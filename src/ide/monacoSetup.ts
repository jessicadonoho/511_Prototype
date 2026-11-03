import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import { buildLibrary } from '../data/code'
import { HOVERS, type HoverDef } from '../data/hovers'
import { logEvent, useStore } from '../store/store'

// Use the locally bundled Monaco rather than the CDN, so it works offline.
self.MonacoEnvironment = { getWorker: () => new EditorWorker() }
loader.config({ monaco })

monaco.editor.defineTheme('changenotes-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: { 'editor.background': '#1e1e1e', 'editorGutter.background': '#1e1e1e' },
})

const LOGO_URI =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"><path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v11l-6 6H4a1 1 0 0 1-1-1z" fill="#2EC4B6"/><path d="M21 15h-5a1 1 0 0 0-1 1v5z" fill="#0F8A80"/><path d="M11 6.5v6M8 9.5h6M8 15.5h6" stroke="#1E2A44" stroke-width="2" stroke-linecap="round"/></svg>',
  )

function hoverMarkdown(def: HoverDef): monaco.IMarkdownString[] {
  const arg = encodeURIComponent(JSON.stringify([def.token]))
  const example = def.example ? `\n\n\`\`\`python\n${def.example}\n\`\`\`` : ''
  return [
    {
      value: `<img src="${LOGO_URI}" width="14" height="14"/> **ChangeNotes**\n\n${def.definition}${example}\n\n[Explain simpler](command:changenotes.simpler?${arg}) &nbsp;·&nbsp; [Ask in panel →](command:changenotes.ask?${arg})`,
      isTrusted: true,
      supportHtml: true,
    },
  ]
}

/** Finds the hover token at a position. Only AI-changed lines of library.py qualify. */
export function tokenAt(model: monaco.editor.ITextModel, position: monaco.IPosition) {
  const { phase, decisions } = useStore.getState()
  if (phase !== 'done') return null
  const { ranges } = buildLibrary(decisions)
  const inChange = Object.values(ranges).some(
    (r) => r.present && position.lineNumber >= r.start && position.lineNumber <= r.end,
  )
  if (!inChange) return null
  const line = model.getLineContent(position.lineNumber)
  for (const def of HOVERS) {
    let from = line.indexOf(def.token)
    while (from !== -1) {
      const startColumn = from + 1
      const endColumn = startColumn + def.token.length
      if (position.column >= startColumn && position.column <= endColumn) {
        return {
          def,
          range: new monaco.Range(position.lineNumber, startColumn, position.lineNumber, endColumn),
        }
      }
      from = line.indexOf(def.token, from + 1)
    }
  }
  return null
}

let lastLogged: { token: string; at: number } | null = null
/** The token under the mouse, used to check a hover card stayed up for at least a second. */
export const hoverTracker = { token: null as string | null }

monaco.languages.registerHoverProvider('python', {
  provideHover(model, position) {
    if (!model.uri.path.endsWith('library.py')) return null
    if (!useStore.getState().variants.hoverCards) return null
    const found = tokenAt(model, position)
    if (!found) return null
    const token = found.def.token
    const now = Date.now()
    if (!lastLogged || lastLogged.token !== token || now - lastLogged.at > 1500) {
      logEvent('hover_shown', { token })
      setTimeout(() => {
        if (hoverTracker.token === token) logEvent('hover_shown_1s', { token })
      }, 1000)
    }
    lastLogged = { token, at: now }
    return { range: found.range, contents: hoverMarkdown(found.def) }
  },
})

monaco.editor.registerCommand('changenotes.simpler', (_accessor, token: string) => {
  useStore.getState().explainHoverSimpler(token)
})
monaco.editor.registerCommand('changenotes.ask', (_accessor, token: string) => {
  useStore.getState().askAboutHover(token)
})

export { monaco }
