# Swarm — Multi-Agent Research and Content Platform

Swarm is a self-hostable platform for turning a research goal into a verified deliverable. A supervisor decomposes the goal into specialist tasks, agents research in parallel, reviewers validate the evidence, and an output agent assembles the result as a presentation, report, or social campaign.

The application currently provides the product UI, authentication, PostgreSQL data model, skill management, project history, and usage APIs. The live agent runtime, SearXNG retrieval, Postiz publishing, Temporal workflows, and real document export described below are the target architecture and are not fully implemented yet.

## Product flow

```mermaid
flowchart LR
    A["1. Define goal"] --> B["2. Plan work"]
    B --> C["3. Approve agent team"]
    C --> D["4. Start Temporal workflow"]
    D --> E["5. Parallel research"]
    E --> F["6. Verify and synthesize"]
    F --> G["7. Generate output"]
    G --> H["8. Review, download, or publish"]

    E --> S["SearXNG"]
    H --> P["Postiz"]
```

1. **Define** — enter a research goal, audience, tone, source constraints, and output format.
2. **Plan** — the supervisor converts the goal into a dependency graph of bounded tasks.
3. **Approve** — review, edit, add, or disable proposed agents before spending begins.
4. **Execute** — a Temporal workflow dispatches ready tasks to agent workers.
5. **Research** — agents query SearXNG, retrieve pages, extract evidence, and write structured notes.
6. **Verify** — fact-checking and synthesis agents compare claims, citations, and conflicting evidence.
7. **Generate** — an output agent creates the requested PPTX, PDF, DOCX, Markdown, or social content.
8. **Deliver** — inspect sources and costs, download the artifact, or schedule approved posts through Postiz.

## Multi-agent swarm

The swarm is a dependency graph rather than an unstructured group chat. Each agent receives a clear task, allowed tools, context, budget, and expected output schema.

### Proposed agent roles

| Agent | Responsibility | Typical dependencies |
| --- | --- | --- |
| Supervisor | Plans tasks, assigns work, tracks budgets, and re-plans failures | None |
| Lead Researcher | Defines the research frame and combines specialist findings | Supervisor |
| Web Researcher | Finds current sources through SearXNG and extracts evidence | Lead Researcher |
| Domain Specialist | Evaluates topic-specific technical or business claims | Lead Researcher |
| Data Analyst | Compares quantitative evidence and prepares chart-ready data | Researchers |
| Fact Checker | Validates claims, dates, quotations, and citation coverage | Researchers and analyst |
| Writer | Produces a coherent narrative for the selected audience and tone | Verified findings |
| Output Designer | Builds the final deck, report, or content package | Writer and fact checker |
| Social Publisher | Converts approved findings into channel-specific posts | Final content approval |

### Swarm capabilities

- Parallel execution of independent tasks
- Dependency-aware handoffs between agents
- Per-agent model, tool, token, cost, and time limits
- Shared project workspace with structured notes and citations
- Human approval before execution, publishing, and sensitive actions
- Supervisor re-planning when an agent fails or evidence conflicts
- Retries and timeouts for external services
- Live progress, activity events, and agent status
- Cancellation, pause, resume, and recovery after process restarts
- Complete provenance from final claims back to source material

## Web research with SearXNG

[SearXNG](https://docs.searxng.org/) is the proposed self-hosted metasearch layer. It aggregates results from configured search engines and exposes a search endpoint that can return JSON.

```mermaid
flowchart LR
    Agent["Research agent"] --> Query["Search activity"]
    Query --> SearXNG["SearXNG /search"]
    SearXNG --> Results["Ranked URLs and metadata"]
    Results --> Fetcher["Safe page fetcher"]
    Fetcher --> Extractor["Content extraction"]
    Extractor --> Evidence["Evidence + citation record"]
    Evidence --> Workspace["Shared project workspace"]
```

The intended research pipeline is:

1. Generate multiple focused queries for each research task.
2. Call the private SearXNG `/search` endpoint with `format=json`.
3. Normalize and deduplicate results by canonical URL.
4. Rank results using relevance, freshness, source quality, and diversity.
5. Fetch permitted pages with strict URL, timeout, size, and content-type controls.
6. Extract text and record title, author, publication date, URL, and retrieval time.
7. Store evidence snippets separately from agent conclusions.
8. Require citation coverage before the fact checker approves a claim.

SearXNG JSON output must be enabled in its `settings.yml`. Production deployments should use a private instance, rate limits, request timeouts, and outbound-network controls rather than relying on public instances.

## Social access with Postiz

[Postiz](https://docs.postiz.com/) is the proposed open-source social scheduling and publishing layer. Swarm generates content; Postiz owns social account integrations, scheduling, and publication.

```mermaid
flowchart LR
    Research["Verified research"] --> Drafts["Channel-specific drafts"]
    Drafts --> Approval["Human approval"]
    Approval --> Postiz["Postiz Public API"]
    Postiz --> Schedule["Schedule / publish"]
    Schedule --> Analytics["Post and channel analytics"]
```

Planned behavior:

- Generate platform-specific copy from one verified source package.
- Keep social credentials and connected accounts inside Postiz.
- Retrieve available integrations before creating a post.
- Require explicit human approval before scheduling or publishing.
- Send approved posts to a self-hosted Postiz Public API using server-side credentials.
- Store the Postiz post ID, schedule, status, and publication URL against the project.
- Import platform and post analytics for campaign reporting.

Postiz calls must run on the server or in a Temporal worker. API keys must never be exposed to browser code.

## Durable execution with Temporal and Docker

[Temporal](https://docs.temporal.io/) is the proposed durable orchestration system. It supplies workflows and task queues for long-running work; Docker Compose runs the local infrastructure and worker services.

```mermaid
flowchart TB
    Next["Next.js API"] -->|start workflow| Temporal["Temporal Server"]
    Temporal --> ResearchQ["research task queue"]
    Temporal --> ReviewQ["review task queue"]
    Temporal --> OutputQ["output task queue"]
    Temporal --> SocialQ["social task queue"]

    ResearchQ --> RW["Research workers"]
    ReviewQ --> VW["Verification workers"]
    OutputQ --> OW["Document workers"]
    SocialQ --> SW["Postiz workers"]

    RW --> SearXNG["SearXNG"]
    SW --> Postiz["Postiz"]
    RW --> DB[("PostgreSQL")]
    VW --> DB
    OW --> Store["Artifact storage"]
```

### Workflow outline

```text
ResearchProjectWorkflow
├── validate project and provider configuration
├── create and approve execution plan
├── run independent research activities in parallel
├── wait for dependent tasks as evidence becomes available
├── verify citations and resolve conflicting claims
├── synthesize the approved research package
├── generate and validate the requested artifact
├── wait for human publication approval when required
└── publish through Postiz and record the result
```

Temporal should own durable execution state, retries, timers, signals, and cancellation. PostgreSQL remains the product database for users, projects, configuration, evidence, usage, and UI read models. Large generated files should live in object storage rather than PostgreSQL.

For local development, Docker Compose is expected to run PostgreSQL, Temporal, Temporal UI, SearXNG, Postiz, and the worker processes. The former `temporalio/docker-compose` repository is archived; new infrastructure work should start from Temporal's maintained `samples-server` configurations rather than copying the archived setup.

## Architecture

```mermaid
flowchart TB
    UI["Next.js 16 + React 19 UI"] --> API["Next.js route handlers"]
    API --> Auth["Signed HTTP-only session"]
    API --> Prisma["Prisma 7"]
    Prisma --> PostgreSQL[("PostgreSQL")]

    API -. target .-> Temporal["Temporal"]
    Temporal -. target .-> Workers["Agent workers"]
    Workers -. target .-> LLM["Configured LLM providers"]
    Workers -. target .-> SearXNG["SearXNG"]
    Workers -. target .-> Postiz["Postiz"]
    Workers -. target .-> Storage["Object storage"]
```

Solid arrows represent implemented paths. Dotted arrows represent planned integrations.

## Current implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Next.js application and design system | Implemented | Responsive app shell and workflow screens |
| Registration, login, logout, session protection | Implemented | Scrypt password hashes and signed HTTP-only cookie |
| PostgreSQL and Prisma schema | Implemented | Users, projects, agents, events, skills, slides, and sources |
| Skills API | Implemented | Create, list, community list, and delete metadata |
| Project history and usage APIs | Partially implemented | Read and aggregate persisted project records |
| Define → Roles → Run → Output UI | Prototype | Uses local state and a fixed demonstration scenario |
| Multi-agent planning and execution | Planned | No live LLM orchestration yet |
| SearXNG web research | Planned | No search adapter or retrieval worker yet |
| Temporal task queues and workflows | Planned | No Temporal service or workers in this repository yet |
| Real PPTX/PDF/DOCX generation | Planned | Current output is a simulated slide viewer |
| Postiz social publishing | Planned | No Postiz API integration yet |
| Provider and agent settings persistence | Planned | Settings UI currently uses local component state |

## Repository structure

```text
.
├── app/
│   ├── api/
│   │   ├── auth/              # Registration, login, logout, current user
│   │   ├── projects/          # Project history API
│   │   ├── skills/            # Skill metadata APIs
│   │   └── usage/             # Usage and cost aggregation
│   ├── dashboard/             # Usage dashboard
│   ├── login/                 # Login page
│   ├── projects/              # Project history page
│   ├── register/              # Registration page
│   ├── settings/              # Provider, roster, appearance, account UI
│   ├── skills/                # Skill management UI
│   ├── globals.css            # Design tokens and global styles
│   ├── layout.tsx             # Root layout and metadata
│   └── page.tsx               # Main swarm application
├── components/swarm/
│   ├── SwarmApp.tsx           # Client-side stage state machine
│   ├── Define.tsx             # Goal and output configuration
│   ├── Roles.tsx              # Agent approval and dependency preview
│   ├── Run.tsx                # Current simulated live execution
│   ├── Graph.tsx              # Agent dependency graph
│   ├── Output.tsx             # Current simulated output viewer
│   ├── SessionDetail.tsx      # Historic session view
│   ├── Shell.tsx              # Sidebar and top navigation
│   ├── ui.tsx                 # Shared UI primitives
│   └── data.ts                # UI types and demonstration data
├── lib/
│   ├── auth.ts                # Password hashing and session signing
│   ├── prisma.ts              # Prisma client singleton
│   ├── skills.ts              # Skill category mappings
│   └── constants/             # Provider/model constants
├── prisma/
│   ├── schema.prisma          # PostgreSQL data model
│   └── migrations/            # Database migrations
├── public/                    # Logo and SVG icon assets
├── proxy.ts                   # Optimistic page authentication redirects
├── prisma.config.ts           # Prisma datasource configuration
└── package.json               # Scripts and dependencies
```

Generated directories such as `.next/`, `generated/`, and `node_modules/` are not source code and should not be edited manually.

## Local development

### Requirements

- Node.js compatible with Next.js 16
- npm
- PostgreSQL

### Environment

Create `.env` with:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
AUTH_SECRET=replace-with-a-long-random-secret

# Reserved for the future provider integration
OPENROUTER_API_KEY=
```

Do not commit `.env` files or provider credentials.

### Run the current application

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quality checks

```bash
npm run lint
npm run build
```

## Suggested implementation order

1. Persist Define and Roles selections as `Project` and `ProjectAgent` records.
2. Add encrypted provider credentials and server-side model adapters.
3. Add Docker Compose infrastructure for Temporal and SearXNG.
4. Implement a Temporal project workflow and typed agent activity contracts.
5. Build safe SearXNG search, page retrieval, evidence, and citation services.
6. Stream Temporal progress into the existing Run screen.
7. Generate real artifacts and store them in object storage.
8. Add Postiz integration with a mandatory publication approval step.
9. Add budgets, evaluation, observability, integration tests, and failure recovery tests.

## Security principles

- Keep LLM, SearXNG, Postiz, and storage credentials server-side.
- Encrypt provider credentials at rest with a dedicated encryption key.
- Treat web content and social content as untrusted input.
- Protect page retrieval against SSRF, unsafe redirects, oversized responses, and private network targets.
- Separate evidence from generated conclusions and retain source provenance.
- Require human approval for publishing and other external side effects.
- Apply per-user authorization in every API route and worker activity.
- Use idempotency keys for document creation and social publishing.
- Record an audit event for plan changes, approvals, retries, and publications.

## Technology stack

- Next.js 16 App Router
- React 19 and TypeScript
- Prisma 7 with PostgreSQL
- Tailwind CSS 4 tooling plus a custom token-based design system
- Temporal for planned durable workflows and task queues
- SearXNG for planned self-hosted metasearch
- Postiz for planned social scheduling and publishing
- Docker Compose for planned local service orchestration

## External documentation

- [Next.js documentation](https://nextjs.org/docs)
- [Prisma documentation](https://www.prisma.io/docs)
- [Temporal documentation](https://docs.temporal.io/)
- [Temporal server samples](https://github.com/temporalio/samples-server)
- [SearXNG documentation](https://docs.searxng.org/)
- [SearXNG Search API](https://docs.searxng.org/dev/search_api)
- [Postiz documentation](https://docs.postiz.com/)
- [Postiz Public API](https://docs.postiz.com/public-api/introduction)

## License

No license file is currently included. Add a license before distributing or accepting external contributions.
