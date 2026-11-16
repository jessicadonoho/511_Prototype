# ChangeNotes prototype

A clickable research prototype for **ChangeNotes** (Team #5 "Sticky Note", SI 511, Fall 2026), built for moderated task-based usability testing and five-second tests. *Learn while you vibe code.*

**Iteration 2 (students only).** The customer segment is now **a new student learning to program in a class with a professor**. Junior developers, managers and workplace framing are out. The **notebook is home base**: lecture notes with a practice panel beside them, in-class assignments, a professor-assigned weekly review. The **code editor is secondary** and deliberately quiet. The brief is in [`changenotes-iteration-2.md`](./changenotes-iteration-2.md); the iteration 1 spec is in [`PRODUCT.md`](./PRODUCT.md), kept for reference.

It simulates a desktop with two apps: the ChangeNotes Notebook and a VS Code-like editor with the ChangeNotes extension. All AI behavior is scripted, so every participant sees the same thing. There's no backend.

## Run it locally

You need Node 20 or newer.

```bash
npm install
npm run dev       # development server
npm run build     # type-check and build to dist/
npm run preview   # serve the built site
```

## The flow being tested

1. **Onboarding.** A new student joins their class with the code `CS120-F26`, meets the notebook, and sees how it relates to their editor. Skippable; replay it from the facilitator panel.
2. **The lecture.** The student lands on **CS 120 · L6 Dictionaries**, with lecture notes and a **practice panel docked beside them**.
3. **Practice loop.** Answer in your own words → scripted LLM feedback → go again. A wrong or near-miss answer keeps you on the same question; a right one moves you to a new one. **Three correct and the panel moves you to the next concept** (`0/3` → `3/3`).
4. **The in-class assignment.** At the end of the notes, *In-class 6 · Checkout counts*. Opening it asks **"Would you like to review these concepts?"** with the current mastery rating for each, then opens `in_class_6.py` in the editor. The same prompt appears again after submission.
5. **Stuck?** The editor has a quiet row of links back to the notes for the concepts in the open file. Clicking one brings the notebook forward with the practice panel on that concept.
6. **AI usage detected.** Pasting four or more lines into the assignment file (or running the terminal agent) flags it. What happens next depends on the variant — see below.
7. **Weekly review.** Assigned by Prof. Rivera, taken in class. Questions are chosen for the student's own mastery level, **pasting is turned off** and the notice says so. Results roll up into a mock professor view.

### Switching AI-detection Option A and Option B

Both options are built, and a participant only ever sees the one they were assigned. Switch in the facilitator panel under **Variants → AI detection**; the choice is attached to every logged event as `mode`.

| | When it fires | Framing |
| --- | --- | --- |
| **Option A** · On the spot | In the editor, the moment AI-written code lands | Not graded, dismissible |
| **Option B** · At submission | When the student presses **Submit** | "Counts toward your In-class 6 grade", blocks submission unless skipped |

### How support detection is shown

**Where I need a hand** in the sidebar, and the *ChangeNotes noticed* card on Home and on each lecture, list the live signals with **what set each one off**:

| Signal | Fires when |
| --- | --- |
| Stuck on a concept | 3 non-correct answers in a row on one concept in the practice panel |
| AI usage in your code | AI-written code landed in a file, with whether it has been explained |
| Mastery still low | A concept today's lecture taught is still below Familiar |
| Pattern in your weekly review | A concept missed in the weekly review |

## Deploy to GitHub Pages

The repo includes a workflow (`.github/workflows/deploy.yml`) that builds and publishes the site every time you push to `main`.

1. On GitHub, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. You can follow the deploy in the **Actions** tab.
3. The site appears at `https://<your-username>.github.io/<repo-name>/`.

Asset paths are relative and routes use `HashRouter`, so you don't need to configure the repo name anywhere. The `dist/` folder also works as is on Netlify, Vercel or any static host.

GitHub Pages sites are public on free plans, even when the repo is private.

## Full screen

Use the **full-screen button in the dock**, or the one in the facilitator panel. Press **Esc** to exit. The simulated desktop scales up to fill the screen.

On five-second screens, there's no visible UI, so press **F** to toggle full screen. The `#/five-second` index can also launch each screen in full screen directly.

Browsers only allow full screen after a click or key press, so a link alone can't open a page in full screen.

## Running a test session

**To reset between participants without the facilitator panel:** in the ChangeNotes side panel of the editor, click **⋯ → Settings → Reset session**, then click again to confirm. It does the same thing as **Start next session** below. The panel starts collapsed — click the ChangeNotes rail on the right edge of the editor, or **ChangeNotes** in the status bar, to open it.

Add `?facilitator=1` to the URL to show the facilitator panel, for example `https://<site>/?facilitator=1`. It stays on for that browser tab, and `?facilitator=0` turns it off. Participants never see it unless the flag is set. Drag it by its title bar if it covers something, and collapse it with the ▾.

| Tool | What it does |
| --- | --- |
| Participant | Attaches an ID such as `P6` to every logged event |
| T1–T10 | Marks a task's start. Click again to end it, so you can compute time on task |
| Jump to state | Start, On the lecture, Assignment open, AI detected, After submit, Weekly review, Editor AI review |
| Variants | **AI detection A/B**, question card position, toast on/off, hover cards on/off |
| Replay onboarding | Shows the onboarding flow again without clearing anything else |
| Export log | Downloads the log for all sessions as JSON or CSV. Filter by `participantId` to split it |
| Start next session | Use between participants. Restores the starting state and clears the participant ID, but keeps the log and variants |
| Erase everything | Restores the starting state and default variants **and deletes the log**, so export first |

Both reset buttons need a second click to confirm. They also reload the page, which exits full screen.

The log and all state are stored in this browser's `localStorage` under one key, `changenotes-proto-v1`. Nothing is sent anywhere, so each test machine keeps its own log. A session saved by an earlier version of the prototype is migrated to a fresh iteration 2 state, keeping its log.

## Five-second tests

Open `#/five-second` for a list of all screens with Launch buttons.

Screens: `notebook-lecture`, `practice-panel`, `notebook-home`, `review-prompt`, `ide-assignment`, `ai-option-a`, `ai-option-b`, `weekly-review`, `professor-view`, `notebook-progress`, `ide-review`, `desktop-both`

```
#/five-second/notebook-lecture                     frozen, stays up
#/five-second/notebook-lecture?timer=5             shows for 5 seconds, then the recall prompt
#/five-second/notebook-lecture?timer=5&countdown=1 adds a "3… 2… 1…" pre-roll
```

These screens don't read or change a participant's saved state, and they always use default variant settings, so a facilitator's A/B toggle can't change what a frozen screen shows. (`ai-option-a` and `ai-option-b` pin their own mode.)

## Editing the content

All copy and seed data live in `src/data/`, so you can change them without touching components.

| File | Contents |
| --- | --- |
| `lectures.ts` | **Lecture notes**, by lecture and section, and which concept each section teaches |
| `lessonPractice.ts` | **Practice panel questions**, with scripted feedback for right, near-miss and wrong answers |
| `assignment.ts` | The in-class assignment, its starter file and the AI-written version |
| `aiDetection.ts` | Option A / Option B copy and the clarifying questions |
| `weeklyReview.ts` | Weekly review tasks by mastery band, and the professor's class aggregate |
| `onboarding.ts` | The three onboarding steps and the class join code |
| `support.ts` | Support-signal labels and the "stuck" threshold |
| `conceptMatch.ts` | Which concept a piece of code is about, for the editor's notes links and "Add to notebook" |
| `courses.ts` | Courses, lectures, projects, concepts, starting mastery |
| `practice.ts` | Practice problems for the mixed sets and Today's Lesson (all four types) |
| `dailyLesson.ts` | Today's Lesson |
| `progress.ts` | Weekly progress, streak, activity calendar |
| `code.ts` | Workspace files, which ones are editable, and the scripted AI change |
| `changes.ts` | Change groups, terminal script, agent list |
| `hovers.ts` | Hover card definitions |
| `questions.ts` | Comprehension questions for the editor's AI-change review |
| `chat.ts` | Scripted chat intents (the first match wins) |
| `history.ts` | Prompt history |

The prototype's "today" is fixed at **Nov 2, 2026**, so dates and countdowns match for everyone.

## Logged events

Each event is `{ts, participantId, task, event, payload}`. Iteration 2 adds:

| Event | Payload |
| --- | --- |
| `onboarding_step`, `onboarding_joined`, `onboarding_skipped`, `onboarding_finished` | `step`, `code` |
| `lecture_opened` | `item`, `has_notes` |
| `practice_panel_opened`, `practice_panel_closed` | `concept`, `via` (which entry point was used) |
| `practice_question_shown` | `id`, `concept` |
| `practice_response` | `id`, `concept`, `grade` (`correct` / `near` / `wrong`), `reps`, `of`, `chars` |
| `practice_hint`, `practice_question_skipped` | `id`, `concept` |
| `concept_advanced`, `practice_next_concept` | `concept`, `next` |
| `student_stuck` | `concept`, `tries` |
| `review_prompt_shown`, `review_prompt_action` | `when` (`before` / `after`), `action`, `concept` |
| `assignment_opened`, `assignment_submitted` | `id`, `via`, `mode`, `ai_detected`, `explained`, `flagged` |
| `ai_usage_detected` | `via` (`paste` / `agent_run`), `mode` |
| `clarify_opened`, `clarify_answered`, `clarify_finished`, `clarify_skipped` | `id`, `ok`, `mode`, `index` |
| `clip_added`, `clip_removed` | `concept`, `item`, `lines` |
| `notes_opened_for_concept` | `concept`, `via` |
| `weekly_review_started`, `weekly_task_answered`, `weekly_review_finished` | `tasks`, `pass`, `passed`, `missed`, `paste_blocked` |
| `paste_blocked` | `where`, `count` |
| `support_action` | `kind`, `concept` |

The iteration 1 events are still logged where those features are still reachable (`change_viewed`, `hover_shown`, `question_answered`, `chat_sent`, `practice_completed`, `lesson_completed`, `notebook_created`, …).

## Changes and simplifications in iteration 2

- **Nothing was deleted, only demoted.** The editor's accept/revert review, its comprehension-question card, hover cards, prompt history, My Notebooks and Today's Lesson all still work. The ChangeNotes panel now starts **collapsed**, its inline labels sit at 55% opacity until you reach for them, and the three demoted notebook pages live under **More** in the sidebar. Use the **Editor AI review** jump to get to the old flow.
- **Mastery stayed on the 0–4 scale.** The `0/3 → 3/3` reps gate *moving to the next concept in a lesson* only. The 0–4 rating (New → Mastered) still moves with accuracy, as before: Today's Lesson, mixed practice sets, the editor's questions, a good answer to an AI clarifying question, and a passed weekly review task. Both are shown side by side in the lecture's concept strip, with a line explaining the difference.
- **Practice answers are free text**, graded against scripted accept strings and expected near-misses. A near-miss gets its own targeted reply and keeps you on the same question — that's the iterative loop. Unrecognised answers fall back to a generic nudge, so a participant never hits a dead end.
- **AI detection is scripted but real** where it can be: pasting 4+ lines (or >160 characters) into the assignment file genuinely fires it. Running the terminal agent fires it too, so the old editor path still reaches the new flow.
- **The weekly review uses a plain textarea, not Monaco.** Paste is blocked with `onPaste`/`onDrop`, the blocked count is shown and logged, and "running" the code checks for expected tokens rather than executing anything.
- **The professor view is a mock** with a visible banner saying so. Its numbers are seeded, except that this student's own weekly-review misses are added to the counts so the page reacts to the session.
- **CS 240 (Databases) is still in the notebook** as a second class, but only CS 120 has lecture notes. Opening a CS 240 lecture shows a "notes not posted yet" state.
- **Lecture notes exist for CS 120 L4–L7.** L8 has no notes yet, on purpose, so the empty state is testable.
- An old saved session is **migrated to a fresh iteration 2 state**, keeping its event log, rather than being half-upgraded.

## Not built

The optional live AI mode (`VITE_LIVE_AI`) isn't included. Testing uses the scripted mode, as the spec intends. The professor view is a static mock, not a second logged-in role.
