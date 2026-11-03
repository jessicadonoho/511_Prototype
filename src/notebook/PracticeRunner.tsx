import { useEffect, useState } from 'react'
import { CodeBlock, InlineRich, MasteryDots, highlight } from '../components/common'
import { conceptById, type Level } from '../data/courses'
import { PROBLEM_TYPE_LABEL, type Problem } from '../data/practice'
import { logEvent, type MasteryChange } from '../store/store'
import { PrimaryButton } from './shared'

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^["']|["']$/g, '').replace(/,\s*/g, ',')

function isCorrect(problem: Problem, value: number | string | null): boolean {
  if (value == null) return false
  switch (problem.type) {
    case 'mc':
      return value === problem.correct
    case 'spot':
      return problem.bugLines.includes(value as number)
    case 'fill':
      return problem.answers.some((a) => normalize(a) === normalize(String(value)))
    case 'predict':
      return problem.choices
        ? value === problem.correct
        : (problem.answers ?? []).some((a) => normalize(a) === normalize(String(value)))
  }
}

/** Renders one problem of any type. Calls onAnswer once with the result. */
export function ProblemView({
  problem,
  onAnswer,
  initialValue,
}: {
  problem: Problem
  onAnswer(correct: boolean): void
  initialValue?: string
}) {
  const [value, setValue] = useState<number | string | null>(null)
  const [text, setText] = useState(initialValue ?? '')
  const [submitted, setSubmitted] = useState(false)
  const correct = submitted && isCorrect(problem, value)

  const submit = (v: number | string) => {
    if (submitted) return
    setValue(v)
    setSubmitted(true)
    const result = isCorrect(problem, v)
    logEvent('problem_answered', { id: problem.id, type: problem.type, correct: result })
    onAnswer(result)
  }

  const language = 'language' in problem && problem.language ? problem.language : 'python'
  const choices = problem.type === 'mc' ? problem.choices : problem.type === 'predict' ? problem.choices : undefined
  const correctIndex = problem.type === 'mc' ? problem.correct : problem.type === 'predict' ? problem.correct : undefined
  const typed = problem.type === 'fill' || (problem.type === 'predict' && !problem.choices)

  return (
    <div>
      <div className="mb-1 text-xs font-bold tracking-wide text-turq-dark uppercase">{PROBLEM_TYPE_LABEL[problem.type]}</div>
      <p className="mb-3 text-[15px] font-semibold text-ink">
        <InlineRich text={problem.prompt} theme="light" />
      </p>

      {problem.type === 'predict' && <CodeBlock code={problem.code} language={language} className="mb-3" />}

      {problem.type === 'fill' && (
        <FillCode code={problem.code} language={language} value={text} onChange={setText} disabled={submitted} onSubmit={() => text.trim() && submit(text)} />
      )}

      {problem.type === 'spot' && (
        <div className="code-light code-block mb-3 !p-1" role="group" aria-label="Code lines. Choose the buggy line.">
          {problem.lines.map((line, i) => {
            const isBug = problem.bugLines.includes(i)
            const picked = value === i
            return (
              <button
                key={i}
                disabled={submitted}
                onClick={() => submit(i)}
                className={`flex w-full items-start gap-2 rounded px-1.5 py-0.5 text-left font-mono text-xs whitespace-pre-wrap ${
                  submitted && isBug ? 'bg-[#d9f2df]' : submitted && picked ? 'bg-[#fbe3df]' : 'enabled:hover:bg-turq-soft'
                }`}
              >
                <span className="w-4 shrink-0 text-right text-ink-soft select-none">{i + 1}</span>
                <span className="min-w-0 flex-1">{highlight(line, language)}</span>
                {submitted && isBug && <span aria-label="This is the bug">✓</span>}
                {submitted && picked && !isBug && <span aria-label="Your answer">✗</span>}
              </button>
            )
          })}
        </div>
      )}

      {choices && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Answer choices">
          {choices.map((choice, i) => {
            const isRight = submitted && i === correctIndex
            const picked = submitted && value === i
            return (
              <button
                key={choice}
                disabled={submitted}
                onClick={() => submit(i)}
                className={`rounded-lg border-2 px-3 py-2 text-left text-sm text-ink disabled:cursor-default ${
                  isRight ? 'border-[#3f9c5e] bg-[#e7f6ec]' : picked ? 'border-[#c9594b] bg-[#fbeeec]' : 'border-line bg-white enabled:hover:border-turq-dark'
                }`}
              >
                {isRight && <span aria-label="Correct answer">✓ </span>}
                {picked && !isRight && <span aria-label="Your answer">✗ </span>}
                <InlineRich text={problem.type === 'predict' ? `\`${choice}\`` : choice} theme="light" />
              </button>
            )
          })}
        </div>
      )}

      {typed && !submitted && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim()) submit(text)
          }}
        >
          {problem.type === 'predict' && (
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Type the output"
              placeholder="Type the output"
              className="min-w-0 flex-1 rounded-lg border-2 border-line bg-white px-3 py-1.5 font-mono text-sm text-ink placeholder:text-ink-soft"
            />
          )}
          <PrimaryButton type="submit" disabled={!text.trim()}>Check</PrimaryButton>
        </form>
      )}

      {submitted && (
        <div className={`mt-3 rounded-lg p-3 text-sm text-ink ${correct ? 'bg-[#e7f6ec]' : 'bg-[#fdf3e1]'}`} role="status">
          <strong>{correct ? '✓ Correct. ' : 'Not quite. Here’s why: '}</strong>
          <InlineRich text={problem.explanation} theme="light" />
          {typed && !correct && 'answers' in problem && problem.answers?.[0] && (
            <div className="mt-1">
              Answer: <code className="inline-code inline-code-light">{problem.answers[0]}</code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FillCode({ code, language, value, onChange, disabled, onSubmit }: { code: string; language: string; value: string; onChange(v: string): void; disabled: boolean; onSubmit(): void }) {
  const [before, after] = code.split('____')
  return (
    <pre className="code-light code-block mb-3">
      <code>
        {highlight(before, language)}
        <input
          autoFocus
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSubmit()
            }
          }}
          aria-label="Fill in the blank"
          style={{ width: `${Math.max(6, value.length + 1)}ch` }}
          className="mx-0.5 rounded border-b-2 border-turq-dark bg-turq-soft px-1 font-mono text-xs text-ink"
        />
        {highlight(after, language)}
      </code>
    </pre>
  )
}

export function MasteryChanges({ changes }: { changes: MasteryChange[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {changes.map((c) => {
        const concept = conceptById(c.conceptId)
        const up = c.to > c.from
        return (
          <li key={c.conceptId} className="flex items-center gap-2 text-sm text-ink">
            <span className="min-w-0 flex-1 truncate font-semibold">{concept?.name}</span>
            <AnimatedDots from={c.from} to={c.to} />
            <span className={`w-12 text-right text-xs font-bold ${up ? 'text-turq-dark' : 'text-ink-soft'}`}>{up ? '↑ Up' : '– Same'}</span>
          </li>
        )
      })}
    </ul>
  )
}

function AnimatedDots({ from, to }: { from: Level; to: Level }) {
  const [level, setLevel] = useState(from)
  useEffect(() => {
    const t = setTimeout(() => setLevel(to), 450)
    return () => clearTimeout(t)
  }, [to])
  return <MasteryDots level={level} />
}

/** A full practice set: one problem per screen, then score and mastery changes. */
export function PracticeRunner({
  problems,
  title,
  onRecord,
  onDone,
  doneLabel = 'Back to notebook',
}: {
  problems: Problem[]
  title: string
  onRecord(results: { conceptId: string; correct: boolean }[]): MasteryChange[]
  onDone(): void
  doneLabel?: string
}) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<{ conceptId: string; correct: boolean }[]>([])
  const [answered, setAnswered] = useState(false)
  const [changes, setChanges] = useState<MasteryChange[] | null>(null)

  if (problems.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-white p-5">
        <p className="text-sm text-ink">There aren’t any practice problems for this yet.</p>
        <PrimaryButton className="mt-3" onClick={onDone}>{doneLabel}</PrimaryButton>
      </div>
    )
  }

  if (changes) {
    const score = results.filter((r) => r.correct).length
    return (
      <div className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-lg font-extrabold text-ink">Set complete</h2>
        <p className="mb-3 text-sm text-ink-soft">{score} of {results.length} correct</p>
        <MasteryChanges changes={changes} />
        <PrimaryButton className="mt-4" onClick={onDone}>{doneLabel}</PrimaryButton>
      </div>
    )
  }

  const problem = problems[index]
  const last = index + 1 === problems.length
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xs font-semibold text-ink-soft">{title}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-valuemin={0} aria-valuemax={problems.length} aria-valuenow={index + 1}>
          <div className="h-full rounded-full bg-turq-dark transition-all" style={{ width: `${((index + 1) / problems.length) * 100}%` }} />
        </div>
        <span className="text-xs font-semibold text-ink-soft">{index + 1} of {problems.length}</span>
      </div>
      <ProblemView
        key={problem.id}
        problem={problem}
        onAnswer={(correct) => {
          setResults((r) => [...r, { conceptId: problem.conceptId, correct }])
          setAnswered(true)
        }}
      />
      {answered && (
        <PrimaryButton
          className="mt-3"
          onClick={() => {
            if (last) setChanges(onRecord(results))
            else {
              setIndex(index + 1)
              setAnswered(false)
            }
          }}
        >
          {last ? 'See results' : 'Next'}
        </PrimaryButton>
      )}
    </div>
  )
}
