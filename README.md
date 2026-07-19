# Social Swarm — Automated Social Media Research and Publishing

Social Swarm is a self-hostable, controlled AI content pipeline for researching the internet and social media, generating platform-native posts, and publishing approved content to X/Twitter and LinkedIn.

The product direction is to run an automated social swarm that:

- Researches current topics from web search, social conversations, news, competitors, and approved source lists.
- Scores topics and keywords for relevance, freshness, business value, and engagement potential.
- Generates distinct LinkedIn and X/Twitter content from the same verified idea.
- Reviews every post for factual accuracy, quality, SEO, and platform fit.
- Requires human approval before publishing by default.
- Schedules or publishes **three posts per day** across X/Twitter and LinkedIn.
- Tracks performance and uses analytics to improve future recommendations.

The system should operate as a **controlled content pipeline**, not as fully independent agents. Each agent performs a bounded task, saves structured output, and passes that output to the next stage.

## Product Flow

```text
Business Goals
      ↓
Research Swarm
      ↓
Topic and Keyword Scoring
      ↓
Content Strategy
      ↓
LinkedIn / X Content Creation
      ↓
Quality, SEO, Fact and Compliance Review
      ↓
Human Approval
      ↓
Scheduling and Publishing
      ↓
Performance Analytics
      ↓
Learning and Optimization
```

## Daily Publishing Goal

The target publishing cadence is **three approved posts per day**.

Recommended default schedule:

| Slot | Purpose | Platforms |
| --- | --- | --- |
| Morning | Trend-aware educational or insight post | LinkedIn + X |
| Afternoon | Practical framework, opinion, or short tactical post | LinkedIn + X |
| Evening | Repurposed idea, thread, question, or conversation starter | X, optionally LinkedIn |

The same central idea may be reused across platforms, but posts must be rewritten for the platform. LinkedIn content should be professional, insight-led, and structured for business readers. X/Twitter content should be shorter, more conversational, and may include threads or question-based variants.

## Agent Pipeline

### 1. Trend Research Agent

Find relevant and timely topics from approved research sources.

Sources may include:

- SearXNG web search
- Google Trends or a replaceable trends provider
- X/Twitter search and conversations
- LinkedIn industry discussions
- Reddit communities
- YouTube search suggestions
- Industry news websites
- Competitor blogs and social accounts
- The company website and previous content

Output example:

```json
{
  "topic": "AI agents for small businesses",
  "source_count": 18,
  "trend_direction": "rising",
  "target_audience": "startup founders",
  "reason": "Increasing discussion across search and social channels",
  "sources": [],
  "suggested_angles": []
}
```

This agent should not try to scan the entire internet. It should work from configured source lists, search queries, industries, locations, and time ranges.

### 2. Social Listening Agent

Understand what people are currently discussing.

It monitors:

- Brand mentions
- Competitor mentions
- Frequently asked questions
- Complaints and pain points
- Popular opinions
- High-engagement posts
- Emerging terminology
- Hashtags and keywords

Output example:

```json
{
  "topic": "AI marketing agents",
  "audience_questions": [
    "How much does an AI agent cost?",
    "Can it automatically publish content?"
  ],
  "popular_opinions": [],
  "content_gaps": [],
  "sentiment": "positive"
}
```

### 3. SEO and Keyword Agent

Convert trends into keyword opportunities.

Scoring inputs:

- Trend growth
- Business relevance
- Audience relevance
- Search intent
- Content gap
- Social engagement potential
- Competition advantage

Suggested formula:

```text
Opportunity Score =
25% Trend Growth
+ 20% Business Relevance
+ 15% Audience Relevance
+ 15% Search Intent
+ 10% Content Gap
+ 10% Social Engagement
+ 5% Competition Advantage
```

Output example:

```json
{
  "primary_keyword": "AI agents for social media",
  "secondary_keywords": [
    "social media automation",
    "AI content workflow",
    "LinkedIn automation"
  ],
  "search_intent": "informational-commercial",
  "opportunity_score": 84,
  "recommended_format": "educational post",
  "recommended_cta": "Book a strategy call"
}
```

### 4. Topic Selection Agent

Decide what should actually be published.

Reject topics that are:

- Irrelevant to the company
- Repetitive
- Too old
- Unsupported by reliable sources
- Highly controversial without approval
- Low-value despite being trending
- Already covered recently

Output example:

```json
{
  "topic": "How AI swarms improve content operations",
  "objective": "generate inbound leads",
  "audience": "marketing managers",
  "content_pillar": "AI automation",
  "primary_keyword": "AI social media automation",
  "key_points": [],
  "supporting_sources": [],
  "platforms": ["linkedin", "x"]
}
```

### 5. Fact-Checking Agent

Validate every factual claim before writing or publishing.

Responsibilities:

- Open original sources.
- Verify dates.
- Compare important claims across multiple sources.
- Flag statistics without primary sources.
- Detect outdated information.
- Store citations.
- Assign confidence scores.

Supported statuses:

```text
VERIFIED
NEEDS_REVIEW
UNSUPPORTED
OUTDATED
CONFLICTING_SOURCES
```

### 6. LinkedIn Writer

Write professional LinkedIn content.

It should produce:

- Strong opening hook
- Short paragraphs
- Practical insights
- Business perspective
- Clear takeaway
- Relevant CTA
- Three to five focused hashtags

Recommended formats:

- Educational post
- Founder story
- Case study
- Contrarian opinion
- Step-by-step framework
- Industry observation
- Product insight
- Document or carousel outline

Output example:

```json
{
  "platform": "linkedin",
  "hook": "...",
  "body": "...",
  "cta": "...",
  "hashtags": [],
  "visual_brief": "...",
  "character_count": 1450
}
```

### 7. X/Twitter Writer

Convert the same idea into X-native content.

It should generate:

- One short post
- One detailed post
- One thread
- One question-based variation
- One opinion-based variation

Output example:

```json
{
  "platform": "x",
  "single_post": "...",
  "thread": [
    "1/ ...",
    "2/ ...",
    "3/ ..."
  ],
  "hashtags": [],
  "visual_brief": "..."
}
```

### 8. Visual Content Agent

Create visual briefs or supporting assets.

Potential outputs:

- LinkedIn carousel outline
- Infographic
- Quote card
- Diagram
- Data visualization
- X image
- Blog cover image
- Short-video script

Output example:

```json
{
  "format": "linkedin_carousel",
  "dimensions": "1080x1350",
  "slides": [
    {
      "slide": 1,
      "headline": "...",
      "body": "..."
    }
  ],
  "brand_requirements": []
}
```

### 9. Content Quality Agent

Score generated content before approval.

Checks:

- Hook quality
- Clarity
- Grammar
- Repetition
- Readability
- Reader value
- Platform length
- CTA quality
- Keyword stuffing
- Excessive hashtags
- Unsupported claims

Suggested scorecard:

```json
{
  "clarity": 9,
  "brand_alignment": 8,
  "platform_fit": 9,
  "factual_confidence": 10,
  "engagement_potential": 7,
  "overall_score": 86
}
```

Default minimum score: `80/100`.

### 10. Approval Manager

Send content to a human and record the decision.

Approval view should show:

- LinkedIn preview
- X/Twitter preview
- Sources used
- Keyword report
- Quality score
- Suggested publication time
- Approve button
- Request changes button
- Reject button
- Edit option

State flow:

```text
DRAFT
   ↓
IN_REVIEW
   ↓
AWAITING_APPROVAL
   ├── APPROVED
   ├── CHANGES_REQUESTED
   └── REJECTED
```

Publishing rule:

```text
IF approved:
    schedule or publish

IF changes requested:
    return to writer

IF rejected:
    archive draft

IF no response:
    send reminder
    keep content unpublished

IF approval deadline expires:
    mark approval expired
    do not publish
```

Do not implement “post anyhow” when approval is missing. Automatic publishing should only be available for pre-approved categories such as approved product tips, evergreen templates, and event reminders. Even then, provide an emergency pause switch.

### 11. Scheduler and Publisher

Schedule and publish approved posts to X/Twitter and LinkedIn.

Responsibilities:

- Select the correct account.
- Verify token permissions.
- Check whether the content is still current.
- Prevent duplicate publication.
- Schedule by timezone.
- Upload media.
- Publish.
- Save returned platform post IDs.
- Retry temporary failures.
- Notify the team.

Publishing record:

```json
{
  "content_id": "cnt_1082",
  "platform": "linkedin",
  "status": "published",
  "platform_post_id": "urn:li:share:...",
  "published_at": "2026-07-20T09:30:00+05:30",
  "approved_by": "user_123",
  "approval_timestamp": "...",
  "content_hash": "..."
}
```

Use an idempotency key or content hash so retries cannot publish the same post twice.

### 12. Engagement Agent

Monitor post-publication engagement.

Signals:

- Comments
- Questions
- Mentions
- Reposts
- High-value leads
- Negative reactions
- Common audience questions

It may draft replies, but sensitive or commercial responses should require approval.

### 13. Analytics Agent

Collect performance after:

- 1 hour
- 24 hours
- 7 days
- 30 days

Metrics:

- Impressions
- Engagement rate
- Likes
- Comments
- Reposts
- Saves
- Profile visits
- Link clicks
- Leads
- Conversion rate
- Follower growth

Results must be normalized because LinkedIn and X/Twitter expose different metrics.

### 14. Learning Agent

Identify patterns that improve future posts.

Examples:

- Which hooks work best
- Best posting times
- Best topic categories
- Effective post length
- Highest-performing CTAs
- Keywords that create engagement
- Topics that generate leads
- Formats that perform poorly

This agent updates recommendations, not permanent brand rules. A human should approve major strategy changes.

### 15. Content Repurposing Agent

Turn strong research into multiple assets:

```text
Research package
   ├── LinkedIn post
   ├── X post
   ├── X thread
   ├── Blog article
   ├── Newsletter
   ├── Carousel
   ├── Short-video script
   └── FAQ content
```

## Workflow Architecture

```mermaid
flowchart TB
    UI["Next.js approval dashboard"] --> API["Next.js route handlers"]
    API --> Auth["Signed HTTP-only session"]
    API --> Prisma["Prisma 7"]
    Prisma --> DB[("PostgreSQL")]

    API --> Temporal["Temporal server"]
    Temporal --> Worker["Worker service"]
    TemporalUI["Temporal UI"] --> Temporal

    Worker --> Research["Research and listening agents"]
    Worker --> Strategy["Topic and keyword scoring"]
    Worker --> Writers["LinkedIn and X writers"]
    Worker --> Review["Fact, quality and platform review"]
    Worker --> Approval["Human approval gate"]
    Worker --> Publishing["Scheduler and publisher"]
    Worker --> Analytics["Engagement and learning agents"]

    Research --> SearXNG["SearXNG"]
    Research --> SocialAPIs["X / LinkedIn / Reddit / trends adapters"]
    Writers --> LLM["LLM provider"]
    Review --> LLM
    Publishing --> Postiz["Postiz"]
    Postiz --> XAPI["X/Twitter API"]
    Postiz --> LinkedInAPI["LinkedIn API"]
    Analytics --> DB
```

## Core Runtime Services

The target local and production runtime uses these services as first-class infrastructure:

| Service | Purpose |
| --- | --- |
| PostgreSQL | Product database for users, projects, agents, approvals, schedules, evidence, generated posts and analytics |
| SearXNG | Self-hosted metasearch layer for web research |
| Temporal | Durable orchestration for research, generation, approval reminders, scheduling and analytics jobs |
| Temporal UI | Operational dashboard for inspecting workflow state, failures, retries and history |
| Worker | Executes Temporal workflows and activities, including research, LLM calls, persistence and publishing handoffs |
| Postiz | Social scheduling and publishing layer for LinkedIn and X/Twitter connected accounts |

## Publishing Integrations

Postiz is the publishing layer for social accounts.

Postiz should own:

- Connected X/Twitter and LinkedIn accounts.
- Platform-specific scheduling and publishing.
- Media upload handling where supported.
- Returned platform post IDs and publication status.

Social Swarm should own:

- Research.
- Content generation.
- Fact-checking and quality review.
- Approval state.
- Posting schedule decisions.
- Audit trail and analytics records.

Postiz calls must happen in API routes or Temporal workers, never in browser code. Social credentials must stay server-side.

## Research Integrations

Research should be adapter-based so providers can be replaced without rewriting the agent pipeline.

Supported or planned adapters:

- SearXNG for self-hosted web metasearch
- X/Twitter recent search
- LinkedIn social/content research where API access permits
- Reddit search
- Google Trends or an alternative trend source
- YouTube suggestions/search
- Company website ingestion
- Competitor RSS/blog/social monitoring

## Current Implementation Status

| Area | Status | Notes |
| --- | --- | --- |
| Next.js application and design system | Implemented | Responsive app shell and workflow screens |
| Registration, login, logout, session protection | Implemented | Scrypt password hashes and signed HTTP-only cookie |
| PostgreSQL and Prisma schema | Implemented | Users, projects, agents, events, skills, slides, sections, references, search results and evidence |
| Project history and detail pages | Implemented | Persisted project records, agents, activity, sources and output views |
| Usage and analytics APIs | Partially implemented | Aggregates project usage from persisted records |
| Skills API | Implemented | Create, list, community list and delete metadata |
| Define -> Roles -> Run -> Output UI | Partially implemented | Creates projects and displays live/persisted state, with demo fallback |
| SearXNG web search | Partially implemented | Server-side search client and project search API exist |
| Temporal workflow and worker | Partially implemented | Workflow, activities and worker entry point exist |
| LLM agent execution | Partially implemented | OpenRouter-style server-side model chain exists |
| Generated deck/document persistence | Partially implemented | Workers can save slides, sections and references |
| Social listening adapters | Planned | X/LinkedIn/Reddit/trends adapters still need implementation |
| Approval queue | Planned | Required before production publishing |
| X/Twitter publishing | Planned | Needs auth, API client, idempotency and audit trail |
| LinkedIn publishing | Planned | Needs auth, media upload support, API client and audit trail |
| Three-post daily scheduler | Planned | Needs schedule model, Temporal cron/schedules and timezone support |
| Postiz integration | Planned | Required publishing layer for connected LinkedIn and X/Twitter accounts |

## Repository Structure

```text
.
├── app/
│   ├── api/
│   │   ├── analytics/         # Usage analytics endpoints
│   │   ├── auth/              # Registration, login, logout, current user
│   │   ├── projects/          # Projects, state, workflow start/status
│   │   ├── search/            # SearXNG-backed project search
│   │   ├── skills/            # Skill metadata APIs
│   │   └── usage/             # Usage aggregation
│   ├── dashboard/             # Usage dashboard
│   ├── login/                 # Login page
│   ├── projects/              # Project history and detail pages
│   ├── register/              # Registration page
│   ├── settings/              # Provider, roster, appearance, account UI
│   ├── skills/                # Skill management UI
│   ├── globals.css            # Design tokens and global styles
│   ├── layout.tsx             # Root layout and metadata
│   └── page.tsx               # Main swarm application
├── components/
│   ├── projects/              # Project detail view
│   └── swarm/                 # Main Swarm UI components
├── generated/                 # Generated Prisma client
├── lib/
│   ├── auth.ts                # Password hashing and session signing
│   ├── llm.ts                 # Server-side LLM client
│   ├── prisma.ts              # Prisma client singleton
│   ├── searxng.ts             # SearXNG client
│   ├── skills.ts              # Skill category mappings
│   ├── temporal.ts            # Temporal client helpers
│   └── constants/             # Agent prompts and provider constants
├── prisma/
│   ├── schema.prisma          # PostgreSQL data model
│   └── migrations/            # Database migrations
├── public/                    # Logo and SVG icon assets
├── workers/
│   ├── activities.ts          # Temporal activities
│   ├── index.ts               # Worker entry point
│   └── workflow.ts            # Research workflow definition
├── docker-compose.yml         # Local Postgres, Temporal, Temporal UI, SearXNG and worker
├── Dockerfile.worker          # Worker container
├── proxy.ts                   # Page authentication redirects
├── prisma.config.ts           # Prisma datasource configuration
└── package.json               # Scripts and dependencies
```

Generated directories such as `.next/`, `generated/`, and `node_modules/` should not be edited manually.

## Local Development

### Requirements

- Node.js compatible with Next.js 16
- npm
- Docker and Docker Compose
- PostgreSQL, SearXNG, Temporal, Temporal UI, Postiz and worker services

### Environment

The project uses two environment files:

- `.env` for Docker services and the worker.
- `.env.local` for the Next.js dev server on the host machine.

Required values:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/swarm
AUTH_SECRET=replace-with-a-long-random-secret
OPENROUTER_API_KEY=
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
SEARXNG_URL=http://localhost:8888
NEXT_PUBLIC_TEMPORAL_UI_URL=http://localhost:8080
POSTIZ_URL=http://localhost:5000
POSTIZ_API_KEY=
```

Do not commit real credentials.

### Run Infrastructure

```bash
docker-compose up -d
```

This starts:

- PostgreSQL on `localhost:5432`
- Temporal on `localhost:7233`
- Temporal UI on `localhost:8080`
- SearXNG on `localhost:8888`
- Postiz on `localhost:5000`
- Worker service

The expected Docker Compose stack for this product is PostgreSQL, SearXNG, Postiz, Temporal, Temporal UI and the worker.

### Run the App

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Worker

The worker can run through Docker Compose. For local host execution:

```bash
npm run worker
```

### Quality Checks

```bash
npm run lint
npm run build
```

## Implementation Roadmap

### Phase 1: Convert Product Model to Social Publishing

- [ ] Add content campaign, content draft, approval, publishing schedule and platform account models.
- [ ] Add content pillar configuration.
- [ ] Replace generic output formats with social campaign outputs.
- [ ] Make the dashboard show daily publishing readiness and approval backlog.

### Phase 2: Research and Social Listening

- [ ] Expand SearXNG research into a reusable research activity.
- [ ] Add source configuration for industries, competitors, keywords and locations.
- [ ] Add social listening adapters for X/Twitter, LinkedIn where available, Reddit and trends providers.
- [ ] Store raw signals separately from generated insights.

### Phase 3: Content Generation

- [ ] Add topic scoring and selection activities.
- [ ] Add LinkedIn writer and X/Twitter writer prompts with strict JSON contracts.
- [ ] Add visual brief generation.

### Phase 4: Review and Approval

- [ ] Add fact-checking and quality score records.
- [ ] Build approval queue UI with previews, sources and edit controls.
- [ ] Require explicit approval before publishing.
- [ ] Add emergency pause switch.

### Phase 5: Scheduling and Publishing

- [ ] Add three-post daily schedule generator by timezone.
- [ ] Add idempotency keys/content hashes.
- [ ] Add Postiz publishing client.
- [ ] Connect approved posts to Postiz schedules for X/Twitter and LinkedIn.
- [ ] Record platform post IDs and publication status.

### Phase 6: Analytics and Learning

- [ ] Collect engagement metrics after 1 hour, 24 hours, 7 days and 30 days.
- [ ] Normalize LinkedIn and X/Twitter metrics.
- [ ] Build performance dashboard.
- [ ] Feed learnings back into recommendations after human review.

## Security and Safety Principles

- Keep LLM, search, social platform and storage credentials server-side.
- Encrypt provider and platform credentials at rest.
- Treat web and social content as untrusted input.
- Protect page retrieval against SSRF, unsafe redirects, oversized responses and private network targets.
- Separate raw evidence from generated conclusions.
- Retain source provenance for every factual claim.
- Require human approval before publishing by default.
- Never publish when approval is missing, rejected or expired.
- Use idempotency keys for social publishing.
- Record audit events for approvals, changes, retries and publications.
- Provide an emergency pause switch for all scheduled publishing.

## Technology Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Prisma 7 with PostgreSQL
- Tailwind CSS 4 tooling plus a custom token-based design system
- Temporal for durable workflows and task queues
- Temporal UI for workflow inspection and debugging
- SearXNG for self-hosted metasearch
- Worker service for workflow activities and publishing handoffs
- Postiz for LinkedIn and X/Twitter scheduling and publishing
- OpenRouter-compatible LLM calls
- Docker Compose for local infrastructure
- Planned: X/Twitter API
- Planned: LinkedIn Posts API

## External Documentation

- [Next.js documentation](https://nextjs.org/docs)
- [Prisma documentation](https://www.prisma.io/docs)
- [Temporal documentation](https://docs.temporal.io/)
- [SearXNG documentation](https://docs.searxng.org/)
- [SearXNG Search API](https://docs.searxng.org/dev/search_api)
- [X API documentation](https://docs.x.com/)
- [LinkedIn Marketing API documentation](https://learn.microsoft.com/en-us/linkedin/marketing/)
- [Postiz documentation](https://docs.postiz.com/)

## License

No license file is currently included. Add a license before distributing or accepting external contributions.
