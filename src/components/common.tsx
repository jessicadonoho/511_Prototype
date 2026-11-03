import { Fragment, type ReactNode } from 'react'
import { LEVELS, type Level } from '../data/courses'

export function Logo({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v11l-6 6H4a1 1 0 0 1-1-1z" fill="#2EC4B6" />
      <path d="M21 15h-5a1 1 0 0 0-1 1v5z" fill="#0F8A80" />
      <path d="M11 6.5v6M8 9.5h6M8 15.5h6" stroke="#1E2A44" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ---------- Small syntax highlighter ----------
// Monaco's token colors are global to one theme, so read-only snippets use this instead.
// It works in both the dark IDE and the light Notebook.

const PY_KEYWORDS = 'def|return|for|in|if|elif|else|from|import|with|as|lambda|and|or|not|True|False|None'
const SQL_KEYWORDS = 'SELECT|FROM|JOIN|ON|GROUP|BY|WHERE|ORDER|COUNT'
const BUILTINS = 'print|sorted|len|range|open|list|date'

export function highlight(code: string, language = 'python'): ReactNode[] {
  const keywords = language === 'sql' ? SQL_KEYWORDS : PY_KEYWORDS
  const pattern = new RegExp(
    `(#.*$|--.*$)|("""[^]*?"""|"[^"\\n]*"|'[^'\\n]*')|\\b(${keywords})\\b|\\b(${BUILTINS})\\b|\\b(\\d+)\\b`,
    'gm',
  )
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of code.matchAll(pattern)) {
    if (m.index > last) out.push(code.slice(last, m.index))
    const cls = m[1] ? 'tok-comment' : m[2] ? 'tok-string' : m[3] ? 'tok-keyword' : m[4] ? 'tok-builtin' : 'tok-number'
    out.push(
      <span key={i++} className={cls}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

export function CodeBlock({
  code,
  language = 'python',
  theme = 'light',
  className = '',
}: {
  code: string
  language?: string
  theme?: 'light' | 'dark'
  className?: string
}) {
  return (
    <pre className={`code-${theme} code-block ${className}`}>
      <code>{highlight(code, language === 'text' ? 'none' : language)}</code>
    </pre>
  )
}

// ---------- Inline **bold**, *italic* and `code`; fenced blocks ----------

function Inline({ text, theme }: { text: string; theme: 'light' | 'dark' }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 1)
          return (
            <code key={i} className={`inline-code inline-code-${theme}`}>
              {part.slice(1, -1)}
            </code>
          )
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
          return <strong key={i}>{part.slice(2, -2)}</strong>
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}

export function RichText({ text, theme = 'dark', className = '' }: { text: string; theme?: 'light' | 'dark'; className?: string }) {
  // An unclosed fence during streaming still renders as code.
  // Splitting gives a repeating [prose, language, code, closing-fence capture].
  const segments = text.split(/```(\w*)\n?/)
  const out: ReactNode[] = []
  for (let i = 0; i < segments.length; i += 4) {
    pushProse(segments[i], `p${i}`, out, theme)
    if (i + 2 < segments.length) {
      out.push(
        <CodeBlock
          key={`c${i}`}
          code={segments[i + 2].replace(/\n$/, '')}
          language={segments[i + 1] || 'python'}
          theme={theme}
          className="my-1.5"
        />,
      )
    }
  }
  return <div className={className}>{out}</div>
}

function pushProse(prose: string, key: string, out: ReactNode[], theme: 'light' | 'dark') {
  prose
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .forEach((p, j) =>
      out.push(
        <p key={`${key}-${j}`} className="my-1">
          <Inline text={p.trim()} theme={theme} />
        </p>,
      ),
    )
}

export function InlineRich({ text, theme = 'dark' }: { text: string; theme?: 'light' | 'dark' }) {
  return <Inline text={text} theme={theme} />
}

// ---------- Mastery dots ----------

export function MasteryDots({ level, size = 8, showLabel = true }: { level: Level; size?: number; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={LEVELS[level]}>
      <span className="inline-flex gap-[3px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`mastery-dot rounded-full border ${i < level ? 'border-turq-dark bg-turq-dark' : 'border-[#8d8878] bg-transparent'}`}
            style={{ width: size, height: size }}
          />
        ))}
      </span>
      {showLabel ? (
        <span className="text-xs text-ink-soft">{LEVELS[level]}</span>
      ) : (
        <span className="sr-only">{LEVELS[level]}</span>
      )}
    </span>
  )
}
