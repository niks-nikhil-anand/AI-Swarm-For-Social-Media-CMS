# Swarm — AI orchestration

Swarm is an AI agent-orchestration platform. You set a research goal in plain
language, approve a proposed team of specialist agents (a dependency DAG), then
watch the swarm research live and hand you a finished deliverable.

This repo ports the original browser prototype (`public/SWARM/`, plain JSX loaded
via Babel-standalone) into a proper **Next.js 16 / React 19 + TypeScript** app.

## The flow

| Stage | Screen | What happens |
| ----- | ------ | ------------ |
| Login | `Login` | JWT sign-in with an animated swarm-network backdrop |
| 1 · Define | `Define` | Describe the goal + pick an output format (PPTX, PDF, DOCX, …) |
| 2 · Roles | `Roles` | Approve / edit / add the proposed specialist agents; preview the team DAG |
| 3 · Run | `Run` | Live execution — animated agent graph, streaming activity log, shared workspace, supervisor re-planning |
| 4 · Output | `Output` | The generated 10-slide deck (viewer + grid), citations, generation summary |
| — | `Dashboard` | API usage & cost analytics |
| — | `History` | All projects (grid / list) |
| — | `SessionDetail` | Re-open any past project's output |
| — | `Settings` | Providers, theme, accent color, account |

## Architecture

- `app/layout.tsx` — sets `data-theme` / `data-accent` / `data-density` on `<html>`, imports the design tokens.
- `app/globals.css` — the dark-first neon/glass **design-token system** (ported from `tokens.css`).
- `app/page.tsx` — renders the client root `SwarmApp`.
- `components/swarm/` — all screens + shared UI:
  - `SwarmApp.tsx` — app root: stage state machine, toasts, persisted appearance tweaks.
  - `ui.tsx` — shared primitives (Icon, Btn, Card, Badge, Ring, Bar, Segmented, Stepper, …).
  - `data.ts` — the demo scenario (agents, timeline, slides, history, usage) + all TypeScript types.
  - `Shell.tsx`, `Login.tsx`, `Define.tsx`, `Roles.tsx`, `Graph.tsx`, `Run.tsx`, `Output.tsx`, `Pages.tsx`, `Dashboard.tsx`, `SessionDetail.tsx`.
- `public/icons/` — the inlined Flight-icon SVG set (fetched on demand by `Icon`, inheriting `currentColor`).
- `public/SWARM/` — the original prototype, kept for reference (served statically at `/SWARM/Swarm.html`).

Notes on the port: the prototype's `window.X` global pattern became ES module
exports/imports; the runtime icon fetch was repointed to `/icons/`; the dev-only
floating "tweaks panel" was dropped in favor of the Settings screen + topbar
theme toggle (appearance prefs persist to `localStorage`); the gradient id in
`SwarmMark` uses `useId()` so SSR and client hydration match.

## Getting started

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```
