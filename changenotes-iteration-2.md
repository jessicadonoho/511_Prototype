# ChangeNotes — Prototype Iteration 2 (SI 511, Team 5 "Sticky Note")

## Context for Claude

This repo holds our ChangeNotes prototype, which we use for task testing and five-second testing. It has two parts:

1. **Notebook app**, organized by project/lecture, with practice problems, mastery tracking, and daily lessons.
2. **VS Code-like IDE** with the ChangeNotes extension, which reviews AI-made code changes with the user.

We're iterating on the prototype based on a strategy change, described below. **Before you change anything, read the existing codebase** and give a short summary of:
- the current screens/routes, plus the components that already exist for the notebook and the IDE
- how the two parts connect today, if they connect at all
- what can be reused and what needs to be built new

Then propose a plan for us to approve before you start building.

---

## Strategy change: students only

**Junior developers and their managers are no longer a focused customer segment.**

The JTBD for students is *learning to code*. The JTBD for junior developers is *producing code while gaining more advanced understanding*. The two segments differ enough that serving both in one product would compromise the experience of one or both, so we're focusing on **students** as our first customer segment.

**Implications for the prototype:**
- Take out (or hide) any copy, screens, personas, or features aimed at junior developers, managers, teams, or workplace use.
- The primary persona is now a **new student learning programming** in a class with a professor.
- The **notebook is now the primary surface**. The IDE integration is secondary and should be more subtle.

---

## Themes to implement

### 1. Focus on the notebook
- The notebook is home base, the place where a student starts.
- It holds **lecture notes**, organized by lecture.

### 2. Onboarding
- Add an onboarding flow for a new student (for example: joining their class, a first look at the notebook, and how the notebook and IDE relate).
- Keep it short. It only needs to set up the prototype flow below.

### 3. Detecting when students need support
- The prototype needs to show *how* we detect that a student needs support. The signals are:
  - the student is stuck on a concept
  - AI usage is detected in their code (see the flow below)
  - mastery ratings are low
  - patterns from the weekly review

### 4. Practice questions (important)
- **Presentation:** when a student enters the notebook for a lesson or concept, a **panel for that lesson/concept** appears with practice questions.
- **Interaction loop:**
  1. Student responds to a question.
  2. The LLM gives feedback.
  3. This repeats iteratively.
- **Mastery learning:** the student keeps going until they answer correctly **3 times**, then the LLM moves them on to the next lesson.
- Show mastery progress clearly (for example, 0/3, 1/3, 2/3, 3/3).
- Framing: this **could work as homework for the class**.
- Open question to explore in the design: how and when questions are formatted and presented.

### 5. New iteration of the IDE integration
- Focus on **understanding where students are struggling with code**.
- Give it a **more subtle presence** so it's less noticeable than the current version.
- Add the ability to **add lines of code to the notebook for review** (for example, select code, then "Add to notebook," and it appears in the relevant lecture/concept).

### 6. Weekly review
- **Assigned by the professor.**
- **Tests students based on their mastery level.**
- **Aggregates where students are struggling.** This implies a professor-facing summary view; a simple mock is fine.
- Students **write code with no copy-paste** (disable paste in the editor for this mode, and show that it's disabled).
- **Happens in class.**

---

## Prototype flow to build (main task-testing path)

Build this as a clickable end-to-end flow. Mocked/static data is fine; LLM responses can be scripted.

1. **Student starts in the notebook.**
   - Persona: a new student learning programming.
   - They're on a lecture, viewing lecture notes.

2. **After the lecture section, they get the in-class assignment.**

3. **They get the assignment from ChangeNotes and open it in the IDE.**
   - **Before and after** the assignment, prompt: *"Would you like to review these concepts?"* and show the **current mastery rating** for each related concept.

4. **Stuck on a concept:**
   - The student clicks a **notebook entry point** in the IDE (subtle, per Theme 5).
   - It takes them to the **lecture example questions** for that concept in the notebook (the practice panel from Theme 4).

5. **If AI usage is detected**, build **both options** so we can test them against each other (for example, with a toggle or two separate prototype paths):
   - **Option A, on the spot:** in the IDE, the student is asked clarifying questions about the code right away.
   - **Option B, around submission:** before or after submission, the student is asked clarifying questions about that part of the code, **with a real grade on the line**.

---

## Constraints and notes
- This is a **prototype for usability testing**, not production. Favor clickable fidelity and realistic content over backend logic.
- Keep the existing visual style and components unless they conflict with the new direction.
- Use realistic intro-programming content (for example, loops, conditionals, functions) in the lecture notes, practice questions, and assignment.
- Keep the ChangeNotes name.
- If anything above is ambiguous or conflicts with the existing code, ask before deciding.

## Deliverables
1. A summary of the existing codebase and a proposed plan (wait for approval).
2. The updated prototype covering the flow and themes above.
3. A short list of any changes or simplifications you made, and how to switch between AI-detection Options A and B.
