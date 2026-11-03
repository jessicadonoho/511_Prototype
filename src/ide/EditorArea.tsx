import { DiffEditor, Editor, type OnMount } from '@monaco-editor/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Logo } from '../components/common'
import { CHANGES } from '../data/changes'
import { buildLibrary, EDIT_FRAMES, FILE_TREE, LIBRARY_BEFORE, STATIC_FILES, type ChangeId } from '../data/code'
import { useFrozen } from '../lib/hooks'
import { useStore } from '../store/store'
import { hoverTracker, monaco, tokenAt } from './monacoSetup'

type CodeEditor = monaco.editor.IStandaloneCodeEditor

const BASE_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  readOnlyMessage: { value: 'This is a prototype, so you can’t edit this file. Ask the AI agent in the terminal instead.' },
  fontSize: 13,
  lineHeight: 22,
  fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
  minimap: { enabled: false },
  glyphMargin: true,
  lineDecorationsWidth: 10,
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  wrappingIndent: 'indent',
  automaticLayout: true,
  renderLineHighlight: 'none',
  overviewRulerLanes: 3,
  contextmenu: true,
  fixedOverflowWidgets: false,
  hover: { delay: 250, sticky: true },
  stickyScroll: { enabled: false },
}

function languageFor(path: string) {
  return FILE_TREE.find((f) => f.path === path)?.language ?? 'plaintext'
}

function fileContent(path: string, libraryCode: string) {
  return path === 'library.py' ? libraryCode : (STATIC_FILES[path] ?? '')
}

export function EditorArea() {
  const frozen = useFrozen()
  const activeFile = useStore((s) => s.activeFile)
  const openTabs = useStore((s) => s.openTabs)
  const phase = useStore((s) => s.phase)
  const editFrame = useStore((s) => s.editFrame)
  const decisions = useStore((s) => s.decisions)
  const showDiff = useStore((s) => s.showDiff)
  const jump = useStore((s) => s.jump)
  const setActiveFile = useStore((s) => s.setActiveFile)
  const closeTab = useStore((s) => s.closeTab)
  const setShowDiff = useStore((s) => s.setShowDiff)

  const [editor, setEditor] = useState<CodeEditor | null>(null)
  const [contentWidth, setContentWidth] = useState(600)
  const [selectionButton, setSelectionButton] = useState<{ top: number; left: number } | null>(null)
  const decorations = useRef<monaco.editor.IEditorDecorationsCollection | null>(null)
  const flash = useRef<monaco.editor.IEditorDecorationsCollection | null>(null)
  const zoneIds = useRef<string[]>([])
  const lensWidgets = useRef<monaco.editor.IOverlayWidget[]>([])
  const programmaticScrollUntil = useRef(0)

  const library = useMemo(() => {
    if (phase === 'idle') return { code: LIBRARY_BEFORE, ranges: null }
    if (phase === 'running') {
      return { code: editFrame == null ? LIBRARY_BEFORE : EDIT_FRAMES[editFrame], ranges: null }
    }
    return buildLibrary(decisions)
  }, [phase, editFrame, decisions])

  const onLibrary = activeFile === 'library.py'
  const inDiff = showDiff && onLibrary

  const handleMount: OnMount = useCallback((ed) => {
    // A new editor instance (for example, after leaving the diff view) needs fresh decorations.
    decorations.current = null
    flash.current = null
    zoneIds.current = []
    lensWidgets.current = []
    setEditor(ed as unknown as CodeEditor)
  }, [])

  // The diff view unmounts the regular editor, so drop the stale instance.
  useEffect(() => {
    if (inDiff) setEditor(null)
  }, [inDiff])

  // Wire up editor events once.
  useEffect(() => {
    if (!editor) return
    const store = useStore.getState
    const subs = [
      editor.onDidChangeCursorPosition((e) => store().setCursor(e.position.lineNumber, e.position.column)),
      editor.onDidChangeCursorSelection((e) => {
        const sel = e.selection
        const model = editor.getModel()
        if (sel.isEmpty() || !model) {
          store().setSelection(null)
          setSelectionButton(null)
          return
        }
        store().setSelection({
          start: sel.startLineNumber,
          end: sel.endLineNumber,
          text: model.getValueInRange(sel),
        })
        const pos = editor.getScrolledVisiblePosition(sel.getEndPosition())
        setSelectionButton(pos ? { top: pos.top + pos.height + 2, left: Math.max(8, pos.left - 40) } : null)
      }),
      editor.onMouseDown((e) => {
        const T = monaco.editor.MouseTargetType
        const line = e.target.position?.lineNumber
        if (!line || !currentRanges()) return
        if (e.target.type === T.GUTTER_GLYPH_MARGIN || e.target.type === T.GUTTER_LINE_DECORATIONS || e.target.type === T.GUTTER_LINE_NUMBERS) {
          const id = changeAtLine(line)
          if (id) store().viewChange(id, 'gutter')
        }
      }),
      editor.onMouseMove((e) => {
        const pos = e.target.position
        const model = editor.getModel()
        hoverTracker.token = pos && model ? (tokenAt(model, pos)?.def.token ?? null) : null
      }),
      editor.onDidLayoutChange((layout) => setContentWidth(layout.contentWidth)),
      editor.onMouseLeave(() => {
        hoverTracker.token = null
      }),
      editor.onDidScrollChange((e) => {
        if (!e.scrollTopChanged || Date.now() < programmaticScrollUntil.current) return
        const ranges = currentRanges()
        if (!ranges) return
        const visible = editor.getVisibleRanges()[0]
        if (!visible) return
        ;(Object.entries(ranges) as unknown as [string, { start: number; present: boolean }][]).forEach(([id, r]) => {
          if (r.present && r.start >= visible.startLineNumber && r.start <= visible.endLineNumber) {
            store().viewChange(Number(id) as ChangeId, 'scroll')
          }
        })
      }),
    ]
    setContentWidth(editor.getLayoutInfo().contentWidth)
    const action = editor.addAction({
      id: 'changenotes.askSelection',
      label: 'Ask ChangeNotes',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 0,
      run: () => askSelection(),
    })
    return () => {
      subs.forEach((s) => s.dispose())
      action.dispose()
    }
  }, [editor])

  // Decorations and inline labels.
  useEffect(() => {
    if (!editor) return
    if (!decorations.current) decorations.current = editor.createDecorationsCollection()
    const ranges = onLibrary ? library.ranges : null

    const lensClick = (id: ChangeId, fn: () => void) => (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      useStore.getState().viewChange(id, 'lens')
      fn()
    }

    const newDecorations: monaco.editor.IModelDeltaDecoration[] = []
    if (ranges) {
      CHANGES.forEach((change) => {
        const r = ranges[change.id]
        if (!r.present) return
        const warn = change.kind === 'assumption'
        const color = warn ? '#e2b93d' : '#73c991'
        newDecorations.push({
          range: new monaco.Range(r.start, 1, r.end, 1),
          options: {
            isWholeLine: true,
            className: warn ? 'cn-line-assumption' : 'cn-line-added',
            linesDecorationsClassName: warn ? 'cn-gutter-assumption' : 'cn-gutter-added',
            glyphMarginClassName: warn ? 'cn-glyph-assumption' : 'cn-glyph-added',
            glyphMarginHoverMessage: { value: warn ? '⚠ Modified · Changed assumption' : '＋ Added by the AI agent' },
            overviewRuler: { color, position: monaco.editor.OverviewRulerLane.Left },
            minimap: { color, position: monaco.editor.MinimapPosition.Inline },
          },
        })
      })
    }
    decorations.current.set(newDecorations)

    editor.changeViewZones((accessor) => {
      zoneIds.current.forEach((id) => accessor.removeZone(id))
      zoneIds.current = []
      lensWidgets.current.forEach((w) => editor.removeOverlayWidget(w))
      lensWidgets.current = []
      if (!ranges) return
      CHANGES.forEach((change) => {
        const r = ranges[change.id]
        const decision = useStore.getState().decisions[change.id]
        const layout = editor.getLayoutInfo()
        const dom = document.createElement('div')
        dom.className = 'cn-lens'
        dom.dataset.change = String(change.id)

        const add = (tag: 'span' | 'b', text: string, cls = '') => {
          const el = document.createElement(tag)
          el.textContent = text
          if (cls) el.className = cls
          dom.appendChild(el)
        }
        const addButton = (text: string, fn: () => void) => {
          const b = document.createElement('button')
          b.type = 'button'
          b.textContent = text
          b.addEventListener('mousedown', (e) => e.stopPropagation())
          b.addEventListener('click', lensClick(change.id, fn))
          dom.appendChild(b)
        }
        // Narrow windows use a shorter label, so Accept and Revert are never cut off.
        const compact = layout.contentWidth < 480
        add('b', compact ? `◧ ${change.id} of 3` : `◧ AI change ${change.id} of 3`)
        if (!compact || change.kind !== 'assumption') add('span', `· ${change.lensLabel}`)
        if (change.kind === 'assumption') add('span', '⚠ Changed assumption', 'cn-chip')
        const store = useStore.getState()
        if (decision) {
          add('span', decision === 'accepted' ? '· ✓ Accepted' : '· ↩ Reverted', 'cn-status')
          addButton('Undo', () => store.undoDecision(change.id))
        } else {
          add('span', '·')
          addButton('Explain', () => store.explainChange(change.id, 'lens'))
          add('span', '·')
          addButton('Accept', () => store.decide(change.id, 'accepted', 'lens'))
          add('span', '·')
          addButton('Revert', () => store.decide(change.id, 'reverted', 'lens'))
        }
        // View zones sit underneath Monaco's text layer and can't be clicked. So the zone only
        // reserves the space, and the label floats above it as an overlay widget (as peek views do).
        dom.style.left = `${layout.contentLeft}px`
        dom.style.width = `${layout.contentWidth - 16}px`
        const widget: monaco.editor.IOverlayWidget = {
          getId: () => `changenotes.lens.${change.id}`,
          getDomNode: () => dom,
          getPosition: () => null,
        }
        editor.addOverlayWidget(widget)
        lensWidgets.current.push(widget)
        zoneIds.current.push(
          accessor.addZone({
            afterLineNumber: r.start - 1,
            heightInPx: 22,
            domNode: document.createElement('div'),
            onDomNodeTop: (top) => {
              dom.style.top = `${top}px`
            },
          }),
        )
      })
    })
  }, [editor, library, onLibrary, activeFile, contentWidth])

  // When a session finishes (or a screen loads after one), bring the first AI change into view.
  useEffect(() => {
    if (!editor || phase !== 'done' || !onLibrary || frozen === 'ide-hover') return
    const t = setTimeout(() => {
      programmaticScrollUntil.current = Date.now() + 400
      editor.setScrollTop(editor.getTopForLineNumber(14))
    }, 60)
    return () => clearTimeout(t)
    // Only on finishing or a new editor instance, so it never fights the participant's scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, phase])

  // Jump requests from the sidebar, panel, nav buttons or the Notebook.
  useEffect(() => {
    if (!jump || !editor || !onLibrary || showDiff) return
    const t = setTimeout(() => {
      const ranges = currentRanges()
      if (!ranges) return
      const r = ranges[jump.id]
      programmaticScrollUntil.current = Date.now() + 600
      editor.revealLinesInCenter(r.start, r.end, monaco.editor.ScrollType.Smooth)
      editor.setPosition({ lineNumber: r.start, column: 1 })
      if (!flash.current) flash.current = editor.createDecorationsCollection()
      flash.current.set([{ range: new monaco.Range(r.start, 1, r.end, 1), options: { isWholeLine: true, className: 'cn-flash' } }])
      setTimeout(() => flash.current?.clear(), 1300)
    }, 30)
    return () => clearTimeout(t)
  }, [jump, editor, onLibrary, showDiff])

  // ide-hover five-second screen: open the .get card and leave it open.
  useEffect(() => {
    if (!editor || frozen !== 'ide-hover') return
    const t = setTimeout(() => {
      const ranges = currentRanges()
      if (!ranges) return
      const line = 24
      const model = editor.getModel()
      const col = (model?.getLineContent(line).indexOf('.get') ?? 0) + 2
      editor.revealLineInCenter(line)
      editor.setPosition({ lineNumber: line, column: col })
      editor.focus()
      editor.trigger('five-second', 'editor.action.showHover', { focus: 'noAutoFocus' })
    }, 350)
    return () => clearTimeout(t)
  }, [editor, frozen])

  // Monaco hover cards also open from the keyboard: Cmd/Ctrl+K Cmd/Ctrl+I is built in.

  const askSelection = () => {
    const s = useStore.getState()
    s.setPanel(true, 'ask')
    s.setDraft('')
    setSelectionButton(null)
  }

  const tabName = (path: string) => FILE_TREE.find((f) => f.path === path)?.name ?? path

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-vs-bg">
      <div className="flex h-[30px] shrink-0 items-stretch bg-vs-side" role="tablist" aria-label="Open editors">
        <div className="flex min-w-0 flex-1 overflow-hidden">
          {openTabs.map((path) => {
            const active = path === activeFile
            return (
              <div
                key={path}
                className={`group flex items-center gap-1 border-r border-vs-line pr-1 pl-3 text-[12px] ${active ? 'border-t border-t-[#3794ff] bg-vs-bg text-white' : 'bg-[#2d2d2d] text-vs-dim'}`}
              >
                <button role="tab" aria-selected={active} className="truncate" onClick={() => setActiveFile(path)}>
                  {tabName(path)}
                </button>
                <button
                  aria-label={`Close ${tabName(path)}`}
                  className="w-4 rounded text-vs-dim opacity-60 hover:bg-white/10 hover:opacity-100"
                  onClick={() => closeTab(path)}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        {phase === 'done' && (
          <button
            className={`flex shrink-0 items-center gap-1.5 px-2.5 text-[11.5px] ${showDiff ? 'bg-turq/20 text-turq' : 'text-[#9fdcd5] hover:bg-white/5'}`}
            aria-pressed={showDiff}
            onClick={() => setShowDiff(!showDiff)}
          >
            <Logo size={12} />
            {showDiff ? 'Hide diff' : 'Show as diff'}
          </button>
        )}
      </div>
      <div className="flex h-[22px] shrink-0 items-center px-3 text-[11.5px] text-vs-dim">
        library-tracker › {activeFile.split('/').join(' › ')}
      </div>
      <div className="relative min-h-0 flex-1">
        {inDiff ? (
          <DiffEditor
            original={LIBRARY_BEFORE}
            modified={library.code}
            language="python"
            theme="changenotes-dark"
            originalModelPath="inmemory://diff/before.py"
            modifiedModelPath="inmemory://diff/after.py"
            // Keep the models, or Monaco throws when the diff closes. They're reused on reopen, so refresh the text.
            keepCurrentOriginalModel
            keepCurrentModifiedModel
            onMount={(diff) => diff.getModifiedEditor().setValue(library.code)}
            options={{
              ...BASE_OPTIONS,
              renderSideBySide: true,
              useInlineViewWhenSpaceIsLimited: false,
              glyphMargin: false,
              originalEditable: false,
              // Collapse unchanged code, so the changes are in view right away, even in a narrow window.
              hideUnchangedRegions: { enabled: true, contextLineCount: 2, minimumLineCount: 3, revealLineCount: 10 },
            }}
          />
        ) : (
          <Editor
            path={activeFile}
            language={languageFor(activeFile)}
            value={fileContent(activeFile, library.code)}
            theme="changenotes-dark"
            options={BASE_OPTIONS}
            onMount={handleMount}
            keepCurrentModel
            loading={<span className="text-xs text-vs-dim">Loading editor…</span>}
          />
        )}
        {selectionButton && !inDiff && (
          <button
            className="absolute z-20 flex items-center gap-1.5 rounded border border-turq bg-navy px-2 py-1 text-[11.5px] text-white shadow-lg hover:bg-[#2a3a5e]"
            style={{ top: selectionButton.top, left: selectionButton.left }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={askSelection}
          >
            <Logo size={12} /> Ask ChangeNotes
          </button>
        )}
      </div>
    </div>
  )
}

function currentRanges() {
  const { phase, decisions } = useStore.getState()
  return phase === 'done' ? buildLibrary(decisions).ranges : null
}

function changeAtLine(line: number): ChangeId | null {
  const ranges = currentRanges()
  if (!ranges) return null
  for (const id of [1, 2, 3] as ChangeId[]) {
    const r = ranges[id]
    if (r.present && line >= r.start && line <= r.end) return id
  }
  return null
}
