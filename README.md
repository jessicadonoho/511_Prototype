# ChangeNotes prototype

A clickable research prototype for **ChangeNotes** (Team #5 "Sticky Note", SI 511, Fall 2026), built for moderated task-based usability testing and five-second tests. *Learn while you vibe code.*

It simulates a desktop with two separate apps: a VS Code-like IDE with the ChangeNotes extension, and the ChangeNotes Notebook. All AI behavior is scripted, so every participant sees the same thing. There's no backend. The full spec is in [`PRODUCT.md`](./PRODUCT.md).

## Run it locally

You need Node 20 or newer.

```bash
npm install
npm run dev       # development server
npm run build     # type-check and build to dist/
npm run preview   # serve the built site
```

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

Add `?facilitator=1` to the URL to show the facilitator panel, for example `https://<site>/?facilitator=1`. It stays on for that browser tab, and `?facilitator=0` turns it off. Participants never see it unless the flag is set.

| Tool | What it does |
| --- | --- |
| Participant | Attaches an ID such as `P6` to every logged event |
| T1–T10 | Marks a task's start. Click again to end it, so you can compute time on task |
| Jump to state | Start, After T1, After T4, or Notebook post-session |
| Variants | Question card position, toast on/off, hover cards on/off |
| Export log | Downloads the event log as JSON or CSV |
| Reset prototype | Restores the starting state **and clears the log**, so export first |

The log and all state are stored in this browser's `localStorage` under one key, `changenotes-proto-v1`. Nothing is sent anywhere, so each test machine keeps its own log.

## Five-second tests

Open `#/five-second` for a list of all screens with Launch buttons.

Screens: `ide-review`, `ide-hover`, `ide-question`, `notebook-home`, `notebook-progress`, `notebook-lesson`, `desktop-both`

```
#/five-second/ide-review                     frozen, stays up
#/five-second/ide-review?timer=5             shows for 5 seconds, then the recall prompt
#/five-second/ide-review?timer=5&countdown=1 adds a "3… 2… 1…" pre-roll
```

These screens don't read or change a participant's saved state.

## Editing the content

All copy and seed data live in `src/data/`, so you can change them without touching components.

| File | Contents |
| --- | --- |
| `code.ts` | Workspace files and the scripted AI change |
| `changes.ts` | Change groups, terminal script, agent list |
| `hovers.ts` | Hover card definitions |
| `questions.ts` | Comprehension questions, plus the default question card position |
| `chat.ts` | Scripted chat intents (the first match wins) |
| `courses.ts` | Courses, lectures, projects, concepts, starting mastery |
| `history.ts` | Prompt history |
| `practice.ts` | Practice problems (all four types) |
| `dailyLesson.ts` | Today's Lesson |
| `progress.ts` | Weekly progress, streak, activity calendar |

The prototype's "today" is fixed at **Nov 2, 2026**, so dates and countdowns match for everyone.

## Logged events

Each event is `{ts, participantId, task, event, payload}`. Beyond the events in `PRODUCT.md` §9 and §11, the log adds `change_viewed` with `via: 'scroll'` (for when someone finds a change by scrolling), `via: 'notebook'` (from "Open in editor"), `hover_shown_1s`, `chat_response_shown`, `hint_used`, `change_explained`, `change_undo`, and `problem_answered`.

## Not built

The optional live AI mode (`VITE_LIVE_AI`) isn't included. Testing uses the scripted mode, as the spec intends.
