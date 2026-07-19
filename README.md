# Social Swarm - Self-Learning AI Social Media Automation Platform

Social Swarm is a self-hostable, self-learning AI social media automation platform for researching trending topics, generating platform-native posts, reviewing content with human approval, scheduling posts, publishing through connected social accounts, and learning from performance analytics over time.

It is built for creators, founders, marketers, agencies and small teams that want an automated LinkedIn and X/Twitter content workflow that improves from real publishing data without losing control over quality, sources, approvals or publishing safety.

## What Is Social Swarm?

Social Swarm turns a business goal into researched, reviewed, scheduled and performance-informed social content.

Instead of asking one chatbot to write posts blindly, Social Swarm uses a controlled agent workflow:

1. Research useful topics from configured sources.
2. Deduplicate trends and collect source evidence.
3. Score opportunities by freshness, relevance and engagement potential.
4. Create draft briefs from the best signals.
5. Generate LinkedIn and X/Twitter variants.
6. Fact-check and quality-score each variant.
7. Require human approval before publishing.
8. Schedule approved posts through Postiz.
9. Store publishing records and analytics.
10. Learn from post performance and feed insights into future recommendations.

The self-learning layer does not mean the system publishes anything without permission. It means Social Swarm collects post metrics, compares performance patterns and improves recommendations for topics, hooks, formats, CTAs and posting windows. Major strategy changes should still be reviewed by a human.

## Why This Project Is Useful

Most social media automation tools focus only on scheduling. Social Swarm is different because it covers the complete content operations pipeline.

Best parts of the project:

- **Research-first content**: posts are created from source-backed trends, not random prompts.
- **Human approval by default**: content cannot publish unless it passes review.
- **Strict quality gate**: approval requires a minimum `80/100` content quality score.
- **Platform-native writing**: LinkedIn and X/Twitter posts are generated differently from the same idea.
- **Self-hostable stack**: PostgreSQL, Redis, SearXNG, Temporal, Postiz and worker services run locally with Docker Compose.
- **Durable workflows**: Temporal handles long-running research, generation, scheduling, publishing sync and analytics jobs.
- **Postiz integration**: Social Swarm can hand approved posts to a self-hosted Postiz instance for social account scheduling.
- **Self-learning analytics loop**: published posts and metric snapshots are normalized so the system can learn which topics, hooks, formats and times perform best.
- **Operational health APIs**: the app can report health for Postgres, SearXNG, Postiz, Redis and Temporal.

## Product Flow

```text
Business Goal
    -> Source Configuration
    -> Trend Research Workflow
    -> Evidence Extraction and Deduplication
    -> Topic Scoring
    -> Draft Briefs
    -> LinkedIn and X/Twitter Generation
    -> Fact Check and Quality Review
    -> Human Approval
    -> Three-Post Daily Scheduler
    -> Postiz Publishing
    -> Published Post Records
    -> Analytics Collection
    -> Learning Recommendations
    -> Better Future Content
```

## Self-Learning AI Loop

Social Swarm is designed to improve with usage.

```text
Published posts
    -> Metric snapshots at 1h, 24h, 7d and 30d
    -> Normalized analytics
    -> Pattern detection
    -> Recommendations
    -> Human review
    -> Updated future content strategy
```

The learning layer can recommend:

- Better posting times.
- Stronger opening hooks.
- Higher-performing topics.
- Better CTA styles.
- Better post length by platform.
- Underperforming formats to avoid.
- Content pillars that create more engagement or leads.

Social Swarm keeps learning recommendations separate from permanent brand rules. A human should approve meaningful strategy changes before they affect publishing.

## Core Features

- User registration, login, logout and signed HTTP-only sessions.
- Campaign management with audience, objective, timezone and publishing settings.
- Source management for SearXNG queries, competitors, keywords, hashtags, allowed domains and blocked domains.
- Trend signal APIs and worker workflow for research.
- Topic/URL deduplication and richer evidence extraction.
- Automatic recommended draft brief creation from high-value research signals.
- Content draft and platform variant APIs.
- LinkedIn writer and X/Twitter writer prompts.
- Fact-check result records and content quality score records.
- Strict `80/100` approval gate.
- Approval queue APIs with approve, request changes and reject actions.
- Publishing schedule APIs with idempotency keys and content hashes.
- Platform account sync through Postiz.
- Published post records with platform IDs.
- Analytics APIs for metrics, summaries and dashboard rollups.
- Self-learning workflow foundation for future recommendations.
- Health APIs for service checks and stored operational samples.
- API-backed dashboard pages for content queue, research, approvals, calendar, published posts, analytics, sources, workflows and settings.

## Agent Workflow

Social Swarm is organized as specialized agents and activities:

| Agent / Activity | Purpose |
| --- | --- |
| Trend Research Agent | Finds timely topics from configured research sources |
| Social Listening Agent | Tracks mentions, questions, pain points and content gaps |
| SEO Keyword Agent | Converts trends into keyword and search-intent opportunities |
| Topic Selection Agent | Chooses useful, relevant and safe topics |
| LinkedIn Writer | Creates professional LinkedIn posts |
| X/Twitter Writer | Creates short posts, threads and conversational variants |
| Visual Content Agent | Produces carousel, image or short-video briefs |
| Fact Checking Agent | Flags unsupported, outdated or conflicting claims |
| Content Quality Agent | Scores clarity, platform fit, CTA quality and factual confidence |
| Approval Manager | Sends posts to human review |
| Scheduler Publisher | Creates daily publishing schedules and sends posts to Postiz |
| Analytics Agent | Normalizes post performance metrics |
| Learning Agent | Finds patterns for future recommendations |

## Workflow Architecture

```mermaid
flowchart TB
    UI["Next.js Dashboard"] --> API["Next.js Route Handlers"]
    API --> Auth["Signed Session Cookie"]
    API --> Prisma["Prisma ORM"]
    Prisma --> DB[("PostgreSQL")]

    API --> Temporal["Temporal Server"]
    Temporal --> Worker["Worker Service"]
    TemporalUI["Temporal UI"] --> Temporal

    Worker --> Research["Research Activities"]
    Worker --> Generation["LLM Content Generation"]
    Worker --> Review["Fact and Quality Review"]
    Worker --> Scheduler["Scheduling Workflow"]
    Worker --> Analytics["Analytics Collection"]
    Worker --> Learning["Learning Recommendations"]

    Research --> SearXNG["SearXNG"]
    Generation --> LLM["OpenRouter-Compatible LLM"]
    Scheduler --> Postiz["Postiz"]
    Postiz --> LinkedIn["LinkedIn"]
    Postiz --> X["X/Twitter"]
    Analytics --> Learning
    Learning --> API
```

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Styling | Custom token-based dashboard UI, global CSS |
| Backend | Next.js route handlers |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Workflow engine | Temporal |
| Worker runtime | TypeScript worker with Temporal activities |
| Search | Self-hosted SearXNG |
| Queue/cache infrastructure | Redis |
| Publishing layer | Postiz |
| AI provider | OpenRouter-compatible chat completions |
| Local infrastructure | Docker Compose |
| Auth | Scrypt password hashing and signed HTTP-only session cookie |

## Runtime Services

Docker Compose runs:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- SearXNG on `localhost:8888`
- Temporal on `localhost:7233`
- Temporal UI on `localhost:8080`
- Postiz on `localhost:5001`
- Social Swarm worker service

## Repository Structure

```text
.
├── app/
│   ├── api/                  # Auth, campaigns, sources, trends, approvals, publishing, analytics, health
│   ├── dashboard/            # API-backed Social Swarm dashboard
│   ├── login/                # Login UI
│   ├── register/             # Register UI
│   └── page.tsx              # Public landing page
├── components/
│   └── swarm/                # Dashboard shell and views
├── lib/                      # Auth, Prisma, API helpers, Postiz, SearXNG, Temporal, hashing
├── prisma/
│   ├── schema.prisma         # Product database schema
│   └── migrations/           # Prisma migrations
├── prompts/                  # Agent prompts
├── workers/
│   ├── activities.ts         # Temporal activities
│   ├── workflow.ts           # Temporal workflows
│   └── index.ts              # Worker entrypoint
├── docker-compose.yml
├── Dockerfile.worker
├── IMPLEMENTATION_PLAN.md
└── package.json
```

Generated directories such as `.next/`, `generated/`, and `node_modules/` should not be edited manually.

## Environment Variables

The project uses two env files:

- `.env` for Docker services and worker service-to-service URLs.
- `.env.local` for the Next.js app running on your host machine.

Example host-local values:

```dotenv
DB_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/swarm
SHADOW_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/swarm_shadow
AUTH_SECRET=replace-with-a-long-random-secret

OPENROUTER_API_KEY=
GEMINI_API_KEY=

TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_CORS_ORIGINS=http://localhost:3000
NEXT_PUBLIC_TEMPORAL_UI_URL=http://localhost:8080

SEARXNG_URL=http://localhost:8888
SEARXNG_BASE_URL=http://localhost:8888/
REDIS_URL=redis://localhost:6379

POSTIZ_URL=http://localhost:5001
POSTIZ_API_KEY=
POSTIZ_PORT=5001
POSTIZ_PUBLIC_URL=http://localhost:5001
POSTIZ_PUBLIC_BACKEND_URL=http://localhost:5001/api
POSTIZ_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/swarm?schema=postiz
POSTIZ_JWT_SECRET=replace-this-postiz-jwt-secret
POSTIZ_NOT_SECURED=true
POSTIZ_API_LIMIT=90

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

X_API_KEY=
X_API_SECRET=
X_BEARER_TOKEN=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
X_URL=
```

Do not commit real credentials. Keep social platform and publishing tokens server-side.

## Local Development

Install dependencies:

```bash
npm install
```

Start infrastructure:

```bash
docker compose up -d
```

Generate Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Run the Next.js app:

```bash
npm run dev
```

Open:

- App: [http://localhost:3000](http://localhost:3000)
- Postiz: [http://localhost:5001](http://localhost:5001)
- Temporal UI: [http://localhost:8080](http://localhost:8080)
- SearXNG: [http://localhost:8888](http://localhost:8888)

Run the worker locally if you are not using the Docker worker:

```bash
npm run worker
```

## Quality Checks

```bash
npm run lint
npm run build
```

## API Areas

| Area | Routes |
| --- | --- |
| Auth | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout` |
| Campaigns | `/api/campaigns`, `/api/campaigns/[id]` |
| Sources | `/api/sources`, `/api/sources/[id]` |
| Trends | `/api/trends`, `/api/trends/run`, `/api/trends/[id]/draft` |
| Drafts and variants | `/api/content/drafts`, `/api/content/drafts/[id]`, `/api/content/drafts/[id]/generate`, `/api/content/variants/[id]` |
| Approvals | `/api/approvals`, `/api/approvals/[id]/approve`, `/api/approvals/[id]/changes`, `/api/approvals/[id]/reject` |
| Publishing | `/api/platform-accounts`, `/api/platform-accounts/sync`, `/api/schedules`, `/api/schedules/[id]/cancel`, `/api/published-posts` |
| Analytics | `/api/analytics`, `/api/analytics/summary`, `/api/analytics/metrics` |
| Health | `/api/health`, `/api/health/checks` |

## Current Status

Implemented:

- Social publishing Prisma schema and migration.
- Auth APIs.
- Campaign, source, trend, draft, variant, approval, schedule and published-post APIs.
- Analytics and health APIs.
- Postiz client and platform account sync.
- Temporal worker workflows for trend research, draft generation, approval expiry, publishing scheduling, status sync, analytics collection and learning-analysis health records.
- API-backed dashboard views.
- Login, register and public landing pages.

Still planned:

- Full direct LinkedIn OAuth flow inside Social Swarm.
- Full direct X/Twitter posting client inside Social Swarm.
- Postiz media upload support.
- Full learning recommendation UI and approval flow.
- More complete test coverage for workflow retry, publishing safety and approval rules.
- Production credential encryption and audit hardening.

## Security and Publishing Safety

Social Swarm is designed around controlled automation:

- No approval means no publishing.
- Rejected content cannot publish.
- Expired approvals cannot publish.
- Content must reach at least `80/100` quality score before approval.
- Publishing uses content hashes and idempotency keys.
- Social credentials must stay server-side.
- Postiz and direct platform credentials should never be exposed in browser code.
- Human review is required before sensitive or high-impact publishing.

## SEO Keywords

self-learning AI social media automation, automated social media research, LinkedIn automation, X Twitter scheduler, self-hosted social media scheduler, AI content workflow, social media approval workflow, AI content generation, AI social media analytics, Postiz alternative, Buffer alternative, Temporal workflow automation, SearXNG research automation, Prisma Next.js social media app.

## External Documentation

- [Next.js documentation](https://nextjs.org/docs)
- [Prisma documentation](https://www.prisma.io/docs)
- [Temporal documentation](https://docs.temporal.io/)
- [SearXNG documentation](https://docs.searxng.org/)
- [Postiz documentation](https://docs.postiz.com/)
- [X API documentation](https://docs.x.com/)
- [LinkedIn API documentation](https://learn.microsoft.com/en-us/linkedin/)

## License

No license file is currently included. Add a license before distributing or accepting external contributions.
