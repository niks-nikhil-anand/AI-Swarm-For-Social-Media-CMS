# Swarm — Codebase Overview

## What's actually here

A Next.js 16 / React 19 / TypeScript app that renders a five-stage flow for an "AI agent swarm" product: Login → Define → Roles → Run → Output, plus History, Dashboard, SessionDetail, and Settings screens. It's a port of a plain-JSX browser prototype (`public/SWARM/Swarm.html`, still present) into proper components.

Structure:

- `app/` — Next.js entry (`layout.tsx`, `page.tsx`, `globals.css` design-token system). No `app/api/` routes exist.
- `components/swarm/` — everything: `SwarmApp.tsx` (state machine), `ui.tsx` (primitives), `data.ts` (all content + types), and one file per screen (`Login`, `Define`, `Roles`, `Run`, `Graph`, `Output`, `Pages`, `Dashboard`, `SessionDetail`, `Shell`).
- `public/icons/` — inlined SVG icon set. `public/SWARM/` — the original prototype kept for reference.
- No database, no auth backend, no `.env`, no server code of any kind. `package.json` has exactly three runtime dependencies: `next`, `react`, `react-dom`.

## What it does when you run it

Everything is a simulation driven by static data in `data.ts`:

- **Login** — a canvas particle animation; `onAuth()` fires on click, no credential check, no JWT despite the README calling it "JWT sign-in."
- **Define** — lets you type any research goal and pick an output format. That input is captured in local component state and never read again. Whatever you type, the downstream stages show the same hardcoded scenario: "impact of quantum computing on cryptography."
- **Roles** — renders the fixed 7-agent list from `AGENTS` in `data.ts`. You can toggle/edit agents in the UI, but nothing you do here changes what "runs."
- **Run** — a `clock` value ticks from 0–100 and is mapped through hardcoded `t0/t1` windows per agent to fake status/progress, plus a canned `TIMELINE` array replayed as a live-looking log (searches, URLs, notes, a scripted "escalation to Lead" at t=67). No agent, no LLM call, no search API, no token usage is real.
- **Output** — renders the fixed 10-slide `SLIDES` array with hand-drawn SVG charts and a fixed `SOURCES` list. There's no PPTX/DOCX/PDF actually generated — "output format" selected in Define has no effect on what's shown.
- **Dashboard / History** — same story: `USAGE` and `HISTORY` are static arrays, not telemetry.

There is exactly one scenario in the entire app. Changing the goal text, the format, or the approved agents has zero effect on any screen downstream of Define.

## The gap between the README and the code

The README describes a working orchestration platform ("watch the swarm research live and hand you a finished deliverable"). What exists is a high-fidelity **UI mockup** of that product — good enough to demo, incapable of doing the thing it depicts. There is no:

- Orchestrator that decomposes a goal into agents/tasks
- LLM integration (Anthropic/OpenAI/etc.) anywhere in the codebase
- Web search integration
- Document generation (pptx/docx/pdf export)
- Backend, database, or session persistence — refreshing loses everything except theme prefs (`localStorage`)
- Real auth

None of that is a criticism of the port itself — it's a faithful, well-executed conversion of a JSX prototype into a typed Next.js app, and the design-token/theming system is genuinely more than skin-deep. But "AI Swarm Research and output generation platform" as a name implies a working backend that doesn't exist yet.

## Open question

Your message cut off after "what i wanna acheiev" — I don't have the second half. Worth being specific, because the next step is completely different depending on the answer: keep this as a polished pitch/demo (in which case it's basically done — maybe wire the Define inputs into a couple more mock scenarios for variety), or build the real thing (in which case you need an orchestration backend, an LLM provider, a search API, and document generation, and the current frontend becomes the shell you wire those into rather than the product).
