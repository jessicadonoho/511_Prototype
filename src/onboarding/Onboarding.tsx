import { useState } from 'react'
import { InlineRich, Logo } from '../components/common'
import { CLASS_CODE } from '../data/lectures'
import { JOIN, ONBOARD_STEPS, WELCOME_NAME } from '../data/onboarding'
import { logEvent, useStore } from '../store/store'

/** A short flow for a new student: join the class, meet the notebook, see how the editor fits. */
export function Onboarding() {
  const finish = useStore((s) => s.finishOnboarding)
  const [index, setIndex] = useState(0)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [joined, setJoined] = useState(false)

  const step = ONBOARD_STEPS[index]
  const isJoin = step.id === 'join'

  const next = () => {
    if (index + 1 >= ONBOARD_STEPS.length) {
      finish()
      return
    }
    logEvent('onboarding_step', { step: ONBOARD_STEPS[index + 1].id, index: index + 1 })
    setIndex(index + 1)
  }

  const join = () => {
    if (code.trim().toUpperCase() !== CLASS_CODE) {
      setError(true)
      logEvent('onboarding_join_failed', { entered: code.trim() })
      return
    }
    setError(false)
    setJoined(true)
    logEvent('onboarding_joined', { code: CLASS_CODE })
    setTimeout(next, 700)
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2f3646]/80 px-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Set up ChangeNotes"
        className="window-enter w-full max-w-lg overflow-hidden rounded-2xl border border-[#cfc7b3] bg-paper font-note text-ink shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-line bg-paper-2 px-4 py-2">
          <Logo size={18} />
          <span className="text-[13px] font-bold">ChangeNotes</span>
          <span className="flex-1" />
          <span className="text-[11px] font-semibold text-ink-soft">{step.eyebrow}</span>
        </div>

        <div className="p-5">
          <h1 className="text-xl font-extrabold">
            {isJoin ? `Welcome, ${WELCOME_NAME}` : step.title}
          </h1>
          {isJoin && <p className="text-sm font-semibold text-ink-soft">{step.title}</p>}
          <p className="mt-2 text-sm leading-relaxed text-ink">
            <InlineRich text={step.body} theme="light" />
          </p>

          {step.points && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {step.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm text-ink">
                  <span aria-hidden="true" className="text-turq-dark">
                    ▸
                  </span>
                  <span className="min-w-0 flex-1">
                    <InlineRich text={point} theme="light" />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {isJoin && (
            <div className="mt-4">
              {joined ? (
                <p className="rounded-lg bg-turq-soft px-3 py-2 text-sm font-semibold text-ink">
                  ✓ {JOIN.joined}
                </p>
              ) : (
                <form
                  className="flex flex-wrap items-start gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    join()
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <input
                      autoFocus
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value)
                        setError(false)
                      }}
                      placeholder={JOIN.placeholder}
                      aria-label={JOIN.placeholder}
                      aria-invalid={error}
                      className="w-full rounded-lg border-2 border-line bg-white px-3 py-2 font-mono text-sm tracking-wide text-ink uppercase placeholder:font-note placeholder:normal-case placeholder:text-ink-soft"
                    />
                    <p className={`mt-1 text-xs ${error ? 'font-semibold text-[#a8372a]' : 'text-ink-soft'}`}>
                      {error ? JOIN.wrong : JOIN.hint}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={!code.trim()}
                    className="rounded-lg bg-turq px-4 py-2 text-sm font-bold text-navy enabled:hover:bg-[#25b0a3] disabled:bg-paper-2 disabled:text-ink-soft"
                  >
                    {step.cta}
                  </button>
                </form>
              )}
              <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
                {JOIN.course} · {JOIN.professor}
              </p>
            </div>
          )}

          {!isJoin && (
            <div className="mt-5 flex items-center gap-3">
              <button
                className="rounded-lg bg-turq px-4 py-2 text-sm font-bold text-navy hover:bg-[#25b0a3]"
                onClick={next}
              >
                {step.cta}
              </button>
              <button
                className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-turq-dark"
                onClick={() => {
                  logEvent('onboarding_skipped', { at: step.id })
                  finish()
                }}
              >
                Skip
              </button>
              <span className="flex-1" />
              <span className="flex gap-1.5" aria-hidden="true">
                {ONBOARD_STEPS.map((s, i) => (
                  <span
                    key={s.id}
                    className={`h-2 w-2 rounded-full ${i <= index ? 'bg-turq-dark' : 'bg-[#cfc7b3]'}`}
                  />
                ))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
