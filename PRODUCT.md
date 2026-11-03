# ChangeNotes — Clickable Prototype Spec

> **Who this is for:** Claude Code (CLI). Build the prototype described below.
> **Who it's for after that:** Team #5 "Sticky Note" (SI 511, Fall 2026), who will use it for **moderated task-based usability testing** and **five-second tests** with students and early-career developers.
> **Tagline:** *Learn while you vibe code.* · *From working code to understood code.*

---

## 1. Context (read this first)

ChangeNotes is an IDE extension plus a companion notebook app for students and junior developers who code with AI agents. Our research found:

- AI code can **look right and still be wrong**, and only people with strong fundamentals catch it (4 of 5 interviewees).
- Learners **lower the bar for "understanding"**. They ship working code they can't explain.
- Users want **smaller, reviewable changes with the reasoning shown**. One participant said, "I don't like the agent changing code directly. I don't understand what's happening." Another asked for "a meaningful diff… which code and assumptions changed."
- Existing learning modes (Claude Code Learning/Explanatory, ChatGPT Study Mode, Gemini Guided Learning) are **opt-in, single-session, single-tool**, and **keep no record** of what the user has learned.

ChangeNotes differentiates by:
1. Working at the **review step**, after the AI writes code.
2. Working **across IDEs and across CLI agents** (Claude Code, Codex, Kimi, Gemini CLI, etc.).
3. Keeping a **persistent record of understanding** in a notebook, with practice problems, mastery tracking and spaced review (inspired by Duolingo's Birdbrain and spaced repetition).

**Feature list (from our Product Vision & Strategy doc):**
- Diff-style highlighting of what the AI changed, **grouped by decision**, with **changed assumptions flagged**
- **Hover explanations / syntax definitions** anchored to the code (like the Ivie research tool)
- **1–3 comprehension questions** about the change, with hints and feedback, in a side panel
- A **chat side panel** for follow-up questions ("explain simpler", "show an example")
- **Searchable prompt history**
- A **Notebook** (premium) that collects concepts, explanations and new problem sets from past sessions, and tracks mastery over time
- Adaptive behavior: "If you answer correctly, the tool asks fewer questions on that concept."
- Privacy: instructors see class-level concept gaps, not individual conversations

---

## 2. Prototype goals

This is a **research prototype, not a product.** Optimize for:

1. **Believability.** The IDE should feel like VS Code. The notebook should feel like a separate, polished app.
2. **Determinism.** Every participant gets the same AI output, questions and data. No real LLM calls by default. All AI behavior is scripted.
3. **Task completability.** Every test task (Section 9) can be completed end to end without dead ends.
4. **Five-second-test readiness.** Specific screens can be shown frozen, full-screen, with an optional 5-second timer (Section 10).
5. **Measurability.** Log interaction events with timestamps so the team can measure time-on-task and errors (Section 11).
6. **Easy reset.** One click returns everything to the starting state between participants.

---

## 3. Tech stack & constraints

- **Vite + React + TypeScript**
- **Tailwind CSS** for styling
- **Monaco Editor** (`monaco-editor` + `@monaco-editor/react`) for the editor. Configure the loader to use the **locally bundled** `monaco-editor` package, not the CDN, so it works offline and loads fast. Use Monaco's real APIs for decorations, gutter markers, hover providers and code lenses (or a visual equivalent).
- **Zustand** for state, persisted to `localStorage` under one namespaced key (`changenotes-proto-v1`) so a reset only needs to clear one key
- **Recharts** for progress charts
- **HashRouter** (react-router) so it can be deployed as a static site (GitHub Pages / Netlify / Vercel) and shared as a link for remote tests
- No backend. No auth. All content lives in `src/data/*.ts` so the team can edit copy without touching components.
- Target viewport: **1280×720**, roughly the usable browser area on a 13" laptop with the browser toolbar showing. It must stay fully usable down to **1024×640**, so participants on small laptops or sharing their screen over Zoom don't have to scroll or zoom out. Below 960px wide, show a friendly "Please use a laptop or desktop browser" screen.
- **Scale the simulated desktop to fit the viewport.** App windows open at about 94% of the viewport width and 88% of its height (minus the dock), never larger. Keep the dock compact (about 48px tall). Inside the IDE, use VS Code's compact density: 13px editor font, 22px row height, a 240px left sidebar, a 320px right ChangeNotes panel that can be resized or collapsed, and a terminal panel about 180px tall. Nothing important (the ChangeNotes panel, status bar, terminal input or dock) may be cut off at 1024×640.
- `npm run dev`, `npm run build` and `npm run preview` must all work. Include a README with setup and deploy steps.

**Optional (build last, off by default):** a "live AI" mode behind `VITE_LIVE_AI=true` that sends free-text chat questions to an LLM API. The scripted mode is what testing uses.

---

## 4. Overall structure: two apps on a simulated desktop

The prototype must make it **obvious that the IDE and the Notebook are two separate apps.** Render a simple simulated desktop:

- A neutral desktop background with a **dock / taskbar** along the bottom containing two app icons:
  - **Code Editor** (VS Code-like icon, generic, *not* the real VS Code logo). App name in title bar: **"Code — library-tracker"**
  - **ChangeNotes Notebook** (its own distinct icon: a sticky-note/notebook glyph in the ChangeNotes brand color)
- Each app lives in its **own window** with its own title bar (traffic-light or min/max/close buttons, app name, distinct chrome).
- Only one window is in front at a time. Clicking a dock icon brings that app forward with a short open/focus animation (scale + fade, ~200ms). The dock shows a dot under running apps.
- When the IDE launches the Notebook (via "Open in Notebook"), the Notebook dock icon **bounces once**, then the Notebook window comes forward. This should read clearly as "another app opened."
- **Visual contrast between apps:**
  - IDE: dark theme, VS Code-like density, monospace-heavy
  - Notebook: light theme, warm paper/off-white background, friendly sans-serif, roomier spacing, ChangeNotes brand color as the accent
- Inside the IDE, the extension's UI (side panel, status bar item, code lenses) uses the ChangeNotes accent color and logo so participants can tell **"this part is the extension"** apart from the editor itself.

**Brand:** Name "ChangeNotes". Accent color: **turquoise** (`#2EC4B6`) paired with a deep ink navy (`#1E2A44`). Use a darker turquoise (`#0F8A80`) for turquoise text or links on the light Notebook background, and navy text on turquoise fills, so everything meets WCAG AA. Turquoise also stays distinct from the diff colors (green = added, amber = changed assumption). Make sure the "added" green and the turquoise accent can't be confused: use a yellow-leaning green such as `#73C991` for diffs. Logo: a simple folded-corner sticky note in turquoise with a small diff "±" mark. Draw it as inline SVG.

**Tier:** The Notebook is a premium feature per our strategy. Show a small "Premium" badge in the Notebook title bar. **Do not** add paywalls that block tasks.

---

## 5. Seed scenario & data

The participant plays **Alex, a student in CS 120 · Intro to Programming (Python)**, working on **Project 2: Library Checkout Tracker**.

### 5.1 Workspace files (Explorer)
```
library-tracker/
├── library.py        ← opens by default
├── test_library.py
├── data/checkouts.csv
└── README.md
```

### 5.2 `library.py`: starting content
```python
# library.py — CS 120 Project 2: Library Checkout Tracker
from datetime import date

checkouts = [
    {"user": "maya",  "title": "Dune",               "due": date(2026, 11, 10)},
    {"user": "jordan","title": "Beloved",            "due": date(2026, 11, 2)},
    {"user": "maya",  "title": "Kindred",            "due": date(2026, 10, 28)},
    {"user": "sam",   "title": "The Hobbit",         "due": date(2026, 11, 15)},
    {"user": "jordan","title": "Neuromancer",        "due": date(2026, 11, 1)},
    {"user": "maya",  "title": "Parable of the Sower","due": date(2026, 11, 20)},
]


def overdue_books(records, today):
    """Return titles that are past their due date."""
    return [r["title"] for r in records if r["due"] < today]


if __name__ == "__main__":
    print(overdue_books(checkouts, date.today()))
```

### 5.3 The scripted AI change
Regardless of what the participant types, the agent produces this result. It is a "mostly right" change with **three change groups**, one of which **silently changes an assumption**:

```python
# library.py — CS 120 Project 2: Library Checkout Tracker
from datetime import date

checkouts = [ ...unchanged... ]


def overdue_books(records, today):
    """Return titles that are past their due date."""
    return [r["title"] for r in records if r["due"] <= today]   # ← CHANGE 2 (modified)


def top_borrowers(records, n=3):                                # ← CHANGE 1 (added)
    """Return the n users with the most checkouts, highest first."""
    counts = {}
    for record in records:
        user = record["user"]
        counts[user] = counts.get(user, 0) + 1
    ranked = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)
    return ranked[:n]


if __name__ == "__main__":
    print(overdue_books(checkouts, date.today()))
    print(top_borrowers(checkouts))                             # ← CHANGE 3 (added)
```

**Change groups (grouped by decision, as in our Comprehension Diff idea):**

| # | Label | Type | Lines | Summary shown to user |
|---|---|---|---|---|
| 1 | New function `top_borrowers` | Added | the function body | "Counts checkouts per user with a dictionary, then sorts users by count, highest first." |
| 2 | Overdue rule changed | **Modified · Changed assumption** ⚠ | the `return` in `overdue_books` | "`<` became `<=`. Books due **today** now count as overdue. You didn't ask for this. Is that what you want?" |
| 3 | Print the result | Added | last `print` line | "Calls the new function when you run the file." |

The participant should be able to **Accept** or **Revert** change 2 individually. Reverting restores `<`. Log which one they choose; it's a key research signal.

### 5.4 Hover definitions (Monaco hover provider)
When the user hovers these tokens **inside AI-changed lines**, show a ChangeNotes-branded hover card. Each card has a header with the logo + "ChangeNotes", a 1–2 sentence plain-language definition, a tiny example, and two links: **"Explain simpler"** and **"Ask in panel →"**. The second one opens the side panel chat pre-filled with the token.

| Token | Definition (plain language) | Mini example |
|---|---|---|
| `.get` | `dict.get(key, default)` returns the value for `key`, or `default` if the key isn't there, instead of crashing with a KeyError. | `{"a": 1}.get("b", 0)  # → 0` |
| `counts = {}` | Creates an empty dictionary to store user → count pairs. | |
| `.items()` | Gives you each (key, value) pair in a dictionary, so you can loop over or sort both together. | `{"maya": 3}.items()  # → [("maya", 3)]` |
| `sorted` | Returns a **new** sorted list; it doesn't change the original. | |
| `key=` | Tells `sorted` *what* to sort by. Here: the count in each pair. | |
| `lambda` | A tiny unnamed function written inline. `lambda pair: pair[1]` means "given a pair, return its second item." | |
| `reverse=True` | Sort from highest to lowest instead of lowest to highest. | |
| `[:n]` | Slicing: take the first `n` items of the list. | `[5,4,3,2][:2]  # → [5, 4]` |
| `<=` | "Less than **or equal to**." Including equal changes who counts as overdue on the due date itself. | |

Regular (non-AI) code shows Monaco's normal, plainer hover, or none at all. This keeps the extension's contribution distinguishable.

### 5.5 Comprehension questions (side panel)
Show **3 questions**, one at a time, multiple choice, each with a **Hint** button, feedback after answering, and a short explanation. Show progress ("Question 1 of 3") and an estimated time ("~1 min"). Include a **Skip** link (testing whether people skip is a key research question, so log it).

1. **"The first time `maya` appears, what does `counts.get(user, 0)` return?"**
   - ✅ `0` · `None` · A `KeyError` · `1`
   - Hint: "What's the second argument to `.get` for?"
   - Explanation: "`maya` isn't in `counts` yet, so `.get` returns the default, `0`. Then `+ 1` makes it 1."
2. **"Two users both have 2 checkouts. Which one comes first in `ranked`?"**
   - ✅ Whoever appeared first in `records` · Alphabetical order · Random each time · Whoever has the later due date
   - Hint: "Does `sorted` reorder items that are tied?"
   - Explanation: "Python's `sorted` is *stable*: tied items keep their original order. Here that's the order users were first counted."
3. **"After this change, is a book due *today* considered overdue?"** *(tied to change group 2)*
   - ✅ Yes, because `<=` includes today · No, `<=` means strictly before · Only if it's after noon · It depends on `n`
   - Explanation: "The AI changed `<` to `<=`. That's a behavior change you didn't request. Check whether your project spec wants it."
   - After answering, show a nudge: **"Review change 2 →"**, which scrolls to and highlights that change.

After the questions: show a summary card ("2/3 correct · Added to your Notebook: *Dictionaries: .get() with default*, *sorted() with key*, *Boundary conditions*") with a button **"Open in Notebook ↗"**, which launches the Notebook app (Section 7) on the session page.

**Adaptive copy (static for the prototype):** if the user gets all 3 right, show "Nice. You'll see fewer questions on these concepts next time."

### 5.6 Scripted chat responses (side panel "Ask")
Match free-text questions by keyword. Always fall back gracefully.

| Trigger (any of) | Response gist |
|---|---|
| `lambda` | Explain `lambda pair: pair[1]` and show the equivalent named function `def get_count(pair): return pair[1]`. |
| `get`, `keyerror`, `default` | Compare `counts[user] += 1` (crashes on a new key) with `counts.get(user, 0) + 1`. |
| `sort`, `sorted`, `reverse`, `order` | Explain `sorted(..., key=..., reverse=True)` with a 3-item example. |
| `<=`, `overdue`, `today`, `assumption` | Explain the boundary change and suggest a test: "a book due today." Offer to "Revert this change." |
| `counter`, `simpler`, `shorter`, `better way` | Show the `collections.Counter(...).most_common(n)` alternative and note the tradeoff (shorter, less visible). |
| `simpler`, `eli5`, `confused`, `don't understand` | Re-explain the whole function in 3 plain sentences with an analogy (tally marks on a whiteboard). |
| `example` | Walk the seed data step by step: maya→1, jordan→1, maya→2… |
| *(fallback)* | "Good question. Here's what this part of the code does…" + a short summary of the change group nearest the cursor, plus suggested follow-up chips. |

Suggested chips under the input: **"Explain simpler"**, **"Show an example"**, **"Why lambda?"**, **"Is there a shorter way?"**
Simulate streaming: reveal responses word by word at ~25ms per word, with a typing indicator first (~600ms). Code in responses renders as syntax-highlighted blocks.

### 5.7 Notebook seed data
**Courses → Lectures & Projects**
- **CS 120 · Intro to Programming (Python)**
  - Lectures: L4 Conditionals & Booleans · L5 Lists & Loops · L6 Dictionaries · L7 Sorting & Lambdas · L8 Files & CSV
  - Projects: Project 1 Grade Calculator · **Project 2 Library Checkout Tracker** (current)
- **CS 240 · Databases**
  - Lectures: L3 SELECT & WHERE · L4 JOINs · L5 GROUP BY & Aggregates
  - Projects: Lab 2 Event Analytics
- **Custom notebooks:** *(empty; the participant creates one in Task 7)*

**Concepts and starting mastery** (5 levels: New → Learning → Familiar → Proficient → Mastered, shown as 0–4 dots plus a label):

| Concept | Course / Lecture | Start level | After today's session |
|---|---|---|---|
| for loops | CS120 L5 | Proficient | — |
| List comprehensions | CS120 L5 | Familiar | Familiar |
| Slicing | CS120 L5 | Proficient | Proficient |
| Dictionaries: `.get()` with default | CS120 L6 | Learning | **↑ Familiar** (if Q1 correct) |
| `dict.items()` | CS120 L6 | Familiar | — |
| `sorted()` with `key` | CS120 L7 | Learning | ↑ / – based on Q2 |
| Lambda functions | CS120 L7 | **New** (added today) | Learning |
| Boundary conditions (`<` vs `<=`) | CS120 L4 | Learning | ↑ / – based on Q3 |
| JOINs can duplicate rows | CS240 L4 | Learning | — |
| GROUP BY | CS240 L5 | Familiar | — |

Mastery updates live from the participant's answers in the IDE. That connection between the two apps is the core of the product story.

**Progress history (seed):** 5 weeks of weekly data points for "concepts at Familiar or above" (e.g., 3 → 4 → 6 → 6 → 8) and accuracy (58% → 61% → 70% → 68% → 76%). Today's session adds the final point. Streak: **6 days**. Questions answered: 142.

**Prompt history (seed):** 8 earlier prompts across both courses with dates, agent used (mix of Claude Code, Codex, Kimi), files touched, and concepts tagged. Today's prompt is added at the top after Task 1.

---

## 6. App A: the IDE (VS Code-like) + ChangeNotes extension

### 6.1 Layout (match VS Code's mental model)
- **Activity bar** (far left, icons): Explorer, Search, Source Control, Extensions, and **ChangeNotes** (logo icon, with a badge showing the number of unreviewed AI changes, e.g. "3")
- **Primary sidebar:** Explorer by default. When the ChangeNotes icon is selected, it shows the **AI Changes view** (6.3).
- **Editor area** with tabs (`library.py` open, plus `README.md` as a second tab)
- **Bottom panel** with tabs: **TERMINAL** (active), PROBLEMS, OUTPUT
- **Secondary sidebar (right): ChangeNotes panel** (6.4). It is collapsible and opens automatically after an AI session finishes.
- **Status bar:** branch `main`, `Python 3.12`, `Ln/Col`, and two ChangeNotes items on the right side:
  - **"◧ ChangeNotes: 3 changes to review"** (click → opens the AI Changes view). After review: "◧ ChangeNotes: reviewed ✓".
  - **"📓 Notebook"**: a persistent one-click launcher for the Notebook app, styled like VS Code's "Go Live" button (an icon plus a short label at the far right of the status bar, with a tooltip "Open ChangeNotes Notebook"). It is always visible, even before an AI session. After the review it shows a small dot to signal new notebook content. Click → dock bounce → the Notebook opens on the most relevant page (today's session page after the review, Home otherwise).
- Menus (File, Edit, View…) can be non-functional but should be present. Clicking a dead menu item does nothing (no errors).

### 6.2 Terminal + CLI agent (Task 1)
- The terminal starts with a shell prompt: `alex@laptop library-tracker %`
- Above the terminal tabs, a small **agent selector** dropdown: **Claude Code** (default) · **Codex CLI** · **Kimi CLI** · **Gemini CLI** · **Other (custom)**. This communicates "works with any agent."
- On load, the terminal shows that the agent session is running, styled generically per agent (header line like `● Claude Code — ready` / `● Codex — ready`). **Do not** copy real product logos or ASCII art. Use plain text names only.
- The participant types a prompt in the terminal input and presses Enter. Accept **any** text. (The facilitator's task sheet will suggest: *"Add a function that finds the top 3 users with the most checkouts."*)
- Scripted agent output (~4–6 seconds total), streamed line by line:
  ```
  ⏺ Reading library.py
  ⏺ Planning: count checkouts per user, sort by count
  ⏺ Editing library.py  (+9 −1)
  ✓ Done. Added top_borrowers() and a call in __main__.
  ```
- While the agent "edits," the editor content updates (animated line insertions are a nice touch but not required).
- Right after: a small ChangeNotes line appears in the terminal: `◧ ChangeNotes captured this session · 3 changes · review in the side panel`. The ChangeNotes panel slides open, and a non-blocking toast appears bottom-right: **"AI changed 3 parts of library.py. Review them?"** [Review] [Later].
- Typing a second prompt after the first gives a polite scripted reply: "✓ No further changes needed for this demo." Do not break state.

### 6.3 Finding AI changes (Task 2)
Make AI changes **easy to find** in multiple redundant ways (we're testing which ones people use):
- **Gutter markers:** green bar = added, amber bar = modified/assumption change
- **Line background tint:** subtle green / amber
- **Inline label above each group** (CodeLens style): `◧ AI change 1 of 3 · New function · Explain · Accept · Revert`. Group 2 shows a ⚠ "Changed assumption" chip.
- **Scrollbar/minimap markers** in the same colors
- **AI Changes view** in the left sidebar: a list grouped by file, then by change group, each with label, type chip, line range and a review status (○ unreviewed / ✓ reviewed). Clicking an item scrolls the editor to it and flashes the range.
- **Next / Previous change** buttons (↑ ↓) in the ChangeNotes panel header, with keyboard shortcuts `Alt+]` / `Alt+[`
- **Toggle "Show as diff"**: switches the editor to a side-by-side diff (Monaco DiffEditor) of before/after
- A change group is marked "reviewed" when the user clicks Accept, clicks Explain, or answers its related question.

### 6.4 ChangeNotes side panel (right)
Header: logo + "ChangeNotes", the session title ("Session · Nov 2 · Claude Code"), ↑↓ change navigation, a visible **"📓 Notebook ↗"** icon button (not hidden in a menu), and a ⋯ menu (Settings, Prompt history).

Three tabs:
1. **Review** (default after a session)
   - The prompt the user typed (quoted)
   - Change-group cards (label, type, 1–2 sentence "what & why" explanation, Jump to code, Accept/Revert)
   - The **Check your understanding** card (Section 5.5) at the bottom, or pinned at the top after the user has looked at the changes. Decide which works better and leave a config flag to switch.
2. **Ask** — chat (Section 5.6). It shows a context chip at the top: "Asking about: library.py · lines 10–17", which updates with the editor selection or cursor. An input with send button, plus suggestion chips.
3. **History** — searchable prompt history (seed + today). A search box filters by prompt text, file or concept. Each entry shows the date, agent icon/name, prompt, and "+9 −1 · library.py". Clicking one shows that session's change summary (read-only for older ones).

Footer: small privacy line: "🔒 Your instructor sees class-level concept trends only, never your prompts or chats." Plus an **"Open Notebook ↗"** button.

**Selecting code → "Ask ChangeNotes"**: right-click context menu item and a small floating button on selection. Both open the Ask tab with the selection as context.

### 6.5 Empty / pre-session state
Before Task 1 (the status bar Notebook button is already visible), the ChangeNotes panel shows an idle state: "Waiting for your next AI session. ChangeNotes will highlight what changed and help you understand it." Include a small illustration and a link: "Open Notebook ↗".

---

## 7. App B: ChangeNotes Notebook (separate app)

### 7.1 Layout
- Window title: **"ChangeNotes Notebook"** + Premium badge
- **Left sidebar:**
  - Home
  - Today's Lesson (with a dot if not done)
  - Progress
  - *Courses* (collapsible tree): **CS 120** → Lectures / Projects → items; **CS 240** → …
  - *My Notebooks* (custom): list, plus **"+ New notebook"**
  - All concepts
  - Prompt history
- **Top bar:** global search ("Search concepts, lectures, code…"), streak flame "🔥 6", avatar "Alex"
- Breadcrumbs on content pages, e.g. `CS 120 › Projects › Project 2 › Session Nov 2`

### 7.2 Home
- Greeting: "Good evening, Alex"
- **Today's Lesson card** (primary CTA): "5 review questions · ~3 min · 3 concepts due" → **Start**
- **Just captured from your editor** card: today's session (once Task 1–4 is done) with the concepts added and their mastery change arrows. Before the session, show yesterday's session instead.
- **Mastery snapshot:** small bar of counts per level (New / Learning / Familiar / Proficient / Mastered)
- **Continue studying:** 3 recently visited notebook pages
- **Upcoming:** "CS 120 Midterm in 9 days". Clicking it suggests "Create a midterm notebook" (a shortcut into Task 7).

### 7.3 Course / Lecture / Project pages
- **Course page:** list of lectures and projects with a mastery ring for each (% of that item's concepts at Familiar+), and concept chips colored by level.
- **Lecture page (e.g., L6 Dictionaries):** concept list with mastery dots, the **sessions from your editor** that touched these concepts, and **"Practice this lecture"** (starts a 5-question set).
- **Project page (Project 2):** a timeline of AI sessions for this project (prompt, agent, date, files, concepts), each linking to a session page.
- **Session page (today's):** the prompt, the code snippet of each change group (read-only, syntax highlighted, with AI-changed lines tinted as in the IDE), the explanation, **your answers** to the 3 questions (✓ / ✗ with explanation), concepts tagged, and **"Practice these concepts"**.

### 7.4 Concept page
For each concept: a plain-language summary, a "where you've seen this" list (sessions/files), a mastery level with a history sparkline, **practice problems**, and related concepts.

**Practice problem types** (build all four; 2–3 per main concept is enough, so write the content in `src/data/practice.ts`):
1. **Multiple choice**
2. **Predict the output.** Show a code snippet, the user picks or types the output.
3. **Fill in the blank.** Code with a gap, e.g. `counts[user] = counts.____(user, 0) + 1`
4. **Spot the bug.** An "almost right" AI snippet; the user clicks the buggy line. Example: the CS 240 JOIN that double-counts users with multiple events, or `range(len(x) + 1)`. This ties directly to Theme 1 of our research.

After each answer: correct/incorrect state, a short explanation, and "Next". At the end of a set: score, mastery changes with a small animation (dots filling in), and "Back to notebook".

### 7.5 Create a new notebook (Task 7)
"+ New notebook" opens a 3-step modal:
1. **What's it for?** Cards: **Exam prep** · Lecture notes · Project · Custom. Name field (placeholder: "e.g., CS 120 Midterm Review"). Course dropdown.
2. **What should it cover?** Checklist of lectures/projects from the chosen course (pre-check the ones before the exam). A preview shows "12 concepts · 4 sessions from your editor". For Exam prep, add a **date picker** for the exam date.
3. **How do you want to study?** Daily goal (5 / 10 / 15 questions), toggles: "Focus on my weakest concepts" (on), "Include spot-the-bug problems" (on). → **Create notebook**

Result: a new notebook page appears under *My Notebooks* with a countdown ("Midterm in 9 days"), a generated **study plan** (day-by-day list of concepts, weakest first), included concepts with mastery, and a **Start practice** button. Show a brief "Building your notebook…" loading state (~1.2s) for realism.

### 7.6 Today's Lesson (daily review)
- Entry from Home or the sidebar
- Intro screen: "3 concepts due for review today", concept chips, ~3 min, **Start**
- **5 questions**, one per screen, mixed types, with a progress bar. Selection logic: concepts at New/Learning first, then the oldest "last reviewed". Hard-coding the selection for the prototype is fine; it should include at least one concept from today's IDE session if that session has been completed.
- Feedback per question (correct / not quite + explanation)
- End screen: "Lesson complete 🎉", streak +1 (6 → 7 with an animation), accuracy, mastery changes per concept, "Come back tomorrow: 2 concepts due." Mark the lesson done (the sidebar dot clears).

Sample lesson content (write it in `src/data/dailyLesson.ts`):
1. Predict the output: `print({"a": 1}.get("b", 5))` → `5`
2. Fill in the blank: `sorted(scores.items(), key=lambda p: p[1], ______=True)` → `reverse`
3. MC: "Which condition counts a book due today as overdue?" → `due <= today`
4. Spot the bug (SQL): `SELECT u.name, COUNT(*) FROM users u JOIN events e ON u.id = e.user_id JOIN orders o ON u.id = o.user_id GROUP BY u.name;` Why are the counts too high? → joining two one-to-many tables multiplies rows
5. Predict the output: `print(sorted([3, 1, 2], reverse=True)[:2])` → `[3, 2]`

### 7.7 Progress page
- **Mastery over time:** line chart (weekly) of concepts at Familiar+ and accuracy %
- **Mastery by concept:** sortable table/list with level dots, trend arrow, last practiced and a "Practice" button. Filter by course.
- **Streak calendar:** a heatmap of the last 6 weeks
- **Stats tiles:** streak, questions answered, accuracy, concepts mastered
- **"Your growth" callout:** "You've moved 4 concepts from Learning to Familiar this month." Tied to real seed data.

### 7.8 Notebook prompt history
The same searchable history as the IDE's History tab, in a fuller table layout. Filters: course, agent, date.

---

## 8. Cross-app connections (important for the story)
- Answers in the IDE **update mastery** in the Notebook immediately (shared Zustand store).
- **Ways to reach the Notebook from the IDE** (redundant on purpose; we're testing which one people find): the **status bar "📓 Notebook" button** (Go Live style), the **"📓 Notebook ↗" button in the ChangeNotes panel header**, the panel footer button, the "Open in Notebook ↗" button on the post-question summary card, and the dock icon. Each one → dock bounce → Notebook window opens on the relevant page (session page after the review; Home otherwise).
- The Notebook session page has **"Open in editor ↗"**, which brings the IDE window forward and jumps to that change.
- Today's prompt appears in both histories.

---

## 9. Usability test tasks (the prototype must support all of these)

The facilitator reads these aloud. The prototype must not reveal the "answer path" in a way that makes the task trivial (e.g., don't add a giant "Task 3 here" banner).

| # | Task (as read to participant) | Success = | Key events to log |
|---|---|---|---|
| T1 | "Use the AI agent in the terminal to add a function that finds the top 3 users with the most checkouts." | Prompt submitted, code appears | `agent_selected`, `prompt_submitted` |
| T2 | "Find all the code the AI just changed." | All 3 change groups visited (scrolled to or clicked) | `change_viewed{id, via}`, where `via` is one of gutter, lens, sidebar, nav, diff or panel |
| T3 | "Find out what `.get` does in the new code." | Hover card for `.get` shown ≥1s, or asked in chat | `hover_shown{token}`, `hover_link_clicked` |
| T4 | "Answer ChangeNotes' questions about the change." | All 3 answered (or skipped, which is logged) | `question_answered{id, correct, hint_used}`, `question_skipped` |
| T5 | "You're not sure why the AI used `lambda`. Ask about it." | Chat message sent and response shown | `chat_sent{text, matched_intent}`, `chip_clicked` |
| T6 | "Did the AI change anything you didn't ask for? Decide whether to keep it." | Change 2 accepted or reverted | `change_accepted/reverted{id}` |
| T7 | "Open your notebook and find what was saved from this session." | Session page or concept page reached | `app_switched{from, to, via}` (via is statusbar, panel_header, panel_footer, summary_card or dock), `nav{route}` |
| T8 | "Create a notebook to study for your CS 120 midterm." | Notebook created | `notebook_created{type, concepts, examDate}` |
| T9 | "Do today's review." | Daily lesson completed | `lesson_started/completed{score}` |
| T10 | "Which concept do you need to work on most? How has your progress changed?" | Progress page visited (verbal answer recorded by notetaker) | `nav{route:'/progress'}`, `concept_opened` |

---

## 10. Five-second test mode

Route: `#/five-second/:screen` renders a **frozen, full-screen, non-interactive** screenshot-like state (real components, seeded state, pointer events disabled, no dock tooltips, no animations).

Screens:
- `ide-review`: the IDE right after the AI session. Gutter highlights, code lenses, the ChangeNotes panel on Review with change cards, toast visible, and the status bar Notebook button with its new-content dot.
- `ide-hover`: the IDE with the `.get` hover card open
- `ide-question`: the IDE with the comprehension question card (Q2) in focus
- `notebook-home`: Notebook Home (post-session state)
- `notebook-progress`: the Progress page
- `notebook-lesson`: a Today's Lesson question screen
- `desktop-both`: the desktop with the IDE in front and the Notebook window partially visible behind it (tests "are these two apps?")

Query params:
- `?timer=5`: shows the screen for exactly 5 seconds, then switches to a blank neutral screen reading "What do you remember about what you just saw?" (no other UI)
- `?countdown=1`: shows a "3… 2… 1…" pre-roll before the screen appears

Also provide an index page `#/five-second` listing all screens with Launch buttons (one with the timer, one without) for the facilitator.

---

## 11. Facilitator tools & event logging

- **Facilitator panel:** shown only with `?facilitator=1` (persist the flag in sessionStorage). It is a small draggable floating panel with:
  - Participant ID field (e.g., P6). It is attached to all logged events.
  - **Reset prototype** (clears the store and reloads to the start state)
  - **Jump to state:** Start · After T1 (code generated) · After T4 (questions answered) · Notebook post-session. Use these so the team can test later tasks independently.
  - Variant toggles: question card position (top/bottom), toast on/off, hover cards on/off. These support quick A/B comparisons.
  - **Export log (JSON)** and **Export log (CSV)**
  - A current task marker ("Mark start of T3" buttons T1–T10). Logged as `task_start{n}` / `task_end{n}` so time-on-task is computable.
- **Event log:** an array of `{ts, participantId, task, event, payload}`, persisted in localStorage. Log every event in Section 9 plus `route_change`, `window_focus{app}`, and `dead_click` (clicks on non-functional menus/items, useful for spotting confusion).
- Nothing about the facilitator mode should be visible to participants when the flag is off.

---

## 12. Content & tone guidelines
- Plain language, short sentences, encouraging but not cutesy. Write for an intro-programming student.
- Explanations say **what** changed and **why**, not just what.
- Don't shame wrong answers: "Not quite. Here's why…"
- Flag AI risk honestly but briefly: "You didn't ask for this. Is that what you want?"
- Use "AI agent" generically. Agent names appear only in the selector and history.

## 13. Accessibility
- All interactive elements are keyboard reachable with visible focus rings
- Color is never the only signal: diff markers also have icons/labels (＋ added, ✎ modified, ⚠ assumption)
- WCAG AA contrast in both the dark IDE and the light Notebook
- Hover cards are also reachable by keyboard (focus the token + `Ctrl/Cmd+K Ctrl/Cmd+I`, or a "Show explanation" code-lens action)
- Respect `prefers-reduced-motion` (disable the bounce/streak animations)

## 14. Out of scope
Real LLM calls (except the optional flag), real file system access, real git, authentication, payments, instructor dashboard, mobile layouts, JetBrains-style UI, multiple scenarios beyond the one in Section 5.

---

## 15. Suggested build order (milestones)
1. **Shell:** desktop, dock, two windows, app switching, routing, store with reset, facilitator panel skeleton, event logger
2. **IDE chrome:** activity bar, explorer, tabs, Monaco with seed file, terminal UI, status bar
3. **Agent flow:** agent selector, prompt → streamed output → scripted code change
4. **Change highlighting:** decorations, gutter, code lenses, sidebar AI Changes view, next/prev, diff toggle, accept/revert
5. **Hover cards** (Section 5.4)
6. **ChangeNotes panel:** Review tab + comprehension questions, Ask tab + scripted chat, History tab
7. **Notebook:** layout + Home, course/lecture/project/session/concept pages
8. **Practice problems** (4 types) + **Today's Lesson**
9. **Create notebook** flow
10. **Progress page** + charts
11. **Cross-app links** + live mastery updates
12. **Five-second mode** + index
13. **Polish:** animations, empty states, accessibility pass, README, deploy instructions

After each milestone, run `npm run build` to make sure it compiles. At the end, click through **every task in Section 9** and every five-second screen in Section 10 to confirm there are no dead ends or console errors.

## 16. Definition of done
- [ ] All 10 tasks in Section 9 can be completed from a fresh reset, without facilitator help, and log the listed events
- [ ] All 7 five-second screens render deterministically, and the `?timer=5` flow works
- [ ] IDE and Notebook are clearly separate apps (separate windows, dock icons, title bars, visual themes)
- [ ] The Notebook can be opened from the IDE status bar (Go Live style) and from the ChangeNotes panel header
- [ ] Every screen is fully usable at 1024×640 with nothing cut off
- [ ] Mastery in the Notebook reflects answers given in the IDE
- [ ] Reset returns everything to the seed state
- [ ] `npm run build` succeeds with no TypeScript errors, and the README explains setup and static deployment
- [ ] No real brand logos for VS Code, Claude, Codex, Kimi or Gemini are used. Text names only.

---

## Prompts

**Prompt: Claude Opus 5.5 Medium**
Okay, we are wanting to make a prototype for task testing and also five second testing. This prototype should be based on our documents which describe an extension in the IDE and the features we want there. Write a product md file for me to give to claude cli to write the code for this. This prototype should have a vs-code like IDE as part of it. As well as an app to the notebook app that they can access. A task they should be able to complete in the app is the ability to 'type in a prompt' to CLI agent (claude, codex, kimi, any model really), have the code populate, be able to find it easily, hover over it and see definitions and it should ask a question about the code in a side panel (kind of like copilot/codex/etc chat). have it clear that the notebook is a separate app from the IDE. The notebook portion should be organized based on project, lecture, etc. As well as have the option to create a new notebook (maybe to study based on a course midterm or such). The notebook should offer practice problems, signify how the progress has grown, mastery level, etc. Further, maybe have a daily lesson thing with review questions.

**Prompt: Claude Opus 5.5**
go through the notes I left on this doc and amend the md
