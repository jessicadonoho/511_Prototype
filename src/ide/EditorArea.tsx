import { DiffEditor, Editor, type OnMount } from '@monaco-editor/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Logo } from '../components/common'
import { CHANGES } from '../data/changes'
import { buildLibrary, EDIT_FRAMES, FILE_TREE, LIBRARY_BEFORE, STATIC_FILES, isEditable, type ChangeId } from '../data/code'
import { ASSIGNMENT } from '../data/assignment'
import { conceptForCode, conceptsInCode } from '../data/conceptMatch'
import { conceptById, findItem } from '../data/courses'
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

function fileContent(path: string, libraryCode: string, edits: Record<string, string>) {
  if (path === 'library.py') return libraryCode
  if (edits[path] !== undefined) return edits[path]
  if (path === ASSIGNMENT.path) return ASSIGNMENT.starterCode
  return STATIC_FILES[path] ?? ''
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
  const fileEdits = useStore((s) => s.fileEdits)
  const setFileContent = useStore((s) => s.setFileContent)

  const [editor, setEditor] = useState<CodeEditor | null>(null)
  const [contentWidth, setContentWidth] = useState(600)
  const [selectionButton, setSelectionButton] = useState<{ top: number; left: number } | null>(null)
  const [addedFlash, setAddedFlash] = useState<string | null>(null)
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
    // A burst of pasted lines in a file the student is writing is our AI-usage signal (flow step 5).
    subs.push(
      editor.onDidPaste((e) => {
        const model = editor.getModel()
        const path = store().activeFile
        if (!model || !isEditable(path)) return
        const pasted = model.getValueInRange(e.range)
        const lines = e.range.endLineNumber - e.range.startLineNumber + 1
        if (lines >= 4 || pasted.length > 160) store().detectAi('paste')
      }),
    )

    setContentWidth(editor.getLayoutInfo().contentWidth)
    const actions = [
      editor.addAction({
        id: 'changenotes.askSelection',
        label: 'Ask ChangeNotes',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 0,
        run: () => askSelection(),
      }),
      editor.addAction({
        id: 'changenotes.addToNotebook',
        label: 'Add to notebook',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1,
        run: () => addSelectionToNotebook(),
      }),
      editor.addAction({
        id: 'changenotes.openNotes',
        label: 'Open the notes for this concept',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 2,
        run: (ed) => {
          const model = ed.getModel()
          const line = ed.getPosition()?.lineNumber ?? 1
          const hint = model ? conceptForCode(model.getLineContent(line)) : null
          store().openNotesForConcept(hint?.conceptId ?? ASSIGNMENT.conceptIds[0], 'editor_context_menu')
        },
      }),
    ]
    return () => {
      subs.forEach((s) => s.dispose())
      actions.forEach((a) => a.dispose())
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

  useEffect(() => {
    if (!addedFlash) return
    // Long enough that the "Open it" link is still there when someone reaches for it.
    const t = setTimeout(() => setAddedFlash(null), 7000)
    return () => clearTimeout(t)
  }, [addedFlash])

  const askSelection = () => {
    const s = useStore.getState()
    s.setPanel(true, 'ask')
    s.setDraft('')
    setSelectionButton(null)
  }

  /** Theme 5: send the selected lines to the lecture that taught the concept they use. */
  const addSelectionToNotebook = () => {
    const s = useStore.getState()
    const sel = s.selection
    if (!sel) return
    const hint = conceptForCode(sel.text) ?? conceptForCode(s.activeFile === ASSIGNMENT.path ? '.get(' : '')
    const conceptId = hint?.conceptId ?? ASSIGNMENT.conceptIds[0]
    const concept = conceptById(conceptId)
    s.addClip({
      code: sel.text.replace(/\s+$/, ''),
      conceptId,
      itemId: concept?.itemId ?? ASSIGNMENT.itemId,
      file: s.activeFile,
      lines: sel.start === sel.end ? String(sel.start) : `${sel.start}–${sel.end}`,
    })
    setSelectionButton(null)
    setAddedFlash(concept?.name ?? 'your notebook')
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
      {activeFile === ASSIGNMENT.path && <AssignmentBar />}
      {activeFile !== ASSIGNMENT.path && <NotesStrip code={fileContent(activeFile, library.code, fileEdits)} />}
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
            value={fileContent(activeFile, library.code, fileEdits)}
            theme="changenotes-dark"
            options={{ ...BASE_OPTIONS, readOnly: !isEditable(activeFile) }}
            onMount={handleMount}
            onChange={(value) => {
              if (isEditable(activeFile) && value !== undefined) setFileContent(activeFile, value)
            }}
            keepCurrentModel
            loading={<span className="text-xs text-vs-dim">Loading editor…</span>}
          />
        )}
        {selectionButton && !inDiff && (
          <div
            className="absolute z-20 flex items-center gap-1"
            style={{ top: selectionButton.top, left: selectionButton.left }}
          >
            <button
              className="flex items-center gap-1.5 rounded border border-turq bg-navy px-2 py-1 text-[11.5px] text-white shadow-lg hover:bg-[#2a3a5e]"
              onMouseDown={(e) => e.preventDefault()}
              onClick={askSelection}
            >
              <Logo size={12} /> Ask ChangeNotes
            </button>
            <button
              className="flex items-center gap-1.5 rounded border border-vs-line bg-[#2d2d30] px-2 py-1 text-[11.5px] text-vs-text shadow-lg hover:border-turq hover:text-white"
              onMouseDown={(e) => e.preventDefault()}
              onClick={addSelectionToNotebook}
              title="Send these lines to the lecture that covers them"
            >
              Add to notebook ↗
            </button>
          </div>
        )}
        {addedFlash && (
          <div
            role="status"
            className="toast-enter absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded border border-turq bg-[#252526] px-3 py-1.5 text-[12px] text-white shadow-xl"
          >
            Added to your notebook under <strong className="text-turq">{addedFlash}</strong>.{' '}
            <button
              className="cn-quiet-link"
              onClick={() => {
                useStore.getState().openNotebook('ide_notes')
                setAddedFlash(null)
              }}
            >
              Open it ↗
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Theme 5: the assignment's own slim bar. It carries the submit button and a quiet way back to
 * the notes for the concepts this assignment uses — the entry point for a student who is stuck.
 */
function AssignmentBar() {
  const submitted = useStore((s) => s.assignmentSubmitted)
  const aiDetected = useStore((s) => s.aiDetected)
  const clarifyDone = useStore((s) => s.clarifyDone)
  const mode = useStore((s) => s.variants.aiMode)
  const submit = useStore((s) => s.submitAssignment)
  const openNotes = useStore((s) => s.openNotesForConcept)
  const found = findItem(ASSIGNMENT.itemId)

  return (
    <div className="flex h-[26px] shrink-0 items-center gap-2 border-b border-vs-line bg-[#252526] px-3 text-[11.5px] whitespace-nowrap">
      <Logo size={12} />
      <span className="text-vs-text">
        {ASSIGNMENT.code} · {ASSIGNMENT.title}
      </span>
      <span className="text-vs-dim max-[1120px]:hidden">due {ASSIGNMENT.due.toLowerCase()}</span>
      {aiDetected && (
        <span
          className="text-diff-warn"
          title={clarifyDone ? 'AI-written code, explained' : 'AI-written code, not explained yet'}
        >
          ◆ {clarifyDone ? 'AI code explained' : 'AI code flagged'}
        </span>
      )}
      <span className="flex-1" />
      <span className="text-vs-dim max-[1180px]:hidden">
        {found ? `${found.item.code} notes:` : 'Notes:'}
      </span>
      {ASSIGNMENT.conceptIds.map((id, i) => (
        <span key={id} className="flex items-center gap-2">
          {i > 0 && <span className="text-vs-line">·</span>}
          <button className="cn-quiet-link" onClick={() => openNotes(id, 'assignment_bar')}>
            {conceptById(id)?.name}
          </button>
        </span>
      ))}
      {submitted ? (
        <span className="ml-1 font-semibold text-diff-add">✓ Submitted</span>
      ) : (
        <button
          className="ml-1 rounded bg-turq px-2 py-0.5 font-semibold text-navy hover:bg-[#4fd4c8]"
          onClick={submit}
          title={mode === 'B' ? 'ChangeNotes may ask you to explain flagged code first' : undefined}
        >
          Submit
        </button>
      )}
    </div>
  )
}

/** The same quiet entry point for ordinary files: whatever concepts the open file touches. */
function NotesStrip({ code }: { code: string }) {
  const openNotes = useStore((s) => s.openNotesForConcept)
  const hints = conceptsInCode(code).slice(0, 3)
  if (hints.length === 0) return null
  return (
    <div className="flex h-[22px] shrink-0 items-center gap-2 border-b border-vs-line/60 px-3 text-[11px] whitespace-nowrap text-vs-dim">
      <Logo size={11} />
      <span className="max-[1120px]:hidden">In your notes:</span>
      {hints.map((hint, i) => (
        <span key={hint.conceptId} className="flex items-center gap-2">
          {i > 0 && <span className="text-vs-line">·</span>}
          <button className="cn-quiet-link" onClick={() => openNotes(hint.conceptId, 'notes_strip')}>
            {hint.label}
          </button>
        </span>
      ))}
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
