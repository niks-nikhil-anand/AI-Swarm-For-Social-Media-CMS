# Social Swarm Implementation Plan

This plan converts the current Swarm project into an automated social media research, approval, scheduling, and publishing system for LinkedIn and X/Twitter.

The target runtime stack is:

- Next.js app
- PostgreSQL
- Prisma
- SearXNG
- Temporal
- Temporal UI
- Worker service
- Postiz
- OpenRouter-compatible LLM provider

## Goal

Build a controlled AI social content pipeline that:

- Researches the internet and social media.
- Finds useful topics and keywords.
- Generates platform-specific LinkedIn and X/Twitter posts.
- Requires approval before publishing.
- Schedules or publishes three posts per day.
- Uses Postiz for connected social accounts and publishing.
- Tracks analytics and improves recommendations.

## Phase 1: Product Model and Database

### 1. Add Core Social Publishing Models

- [x] Add Prisma models for:
  - `ContentCampaign`
  - `ContentDraft`
  - `ContentVariant`
  - `ApprovalRequest`
  - `PublishingSchedule`
  - `PublishedPost`
  - `PlatformAccount`
  - `ContentSource`
  - `TrendSignal`
  - `FactCheckResult`
  - `ContentQualityScore`
  - `ContentMetric`
  - `SystemHealthCheck`

Key relationships:

- A user has many campaigns.
- A campaign has many drafts.
- A draft has many platform variants.
- A variant can have approval requests.
- Approved variants can become scheduled posts.
- Scheduled posts are published through Postiz.
- Published posts store platform post IDs and analytics.

### 2. Add Status Enums

- [x] Add enums for:

- Draft status: `Draft`, `InReview`, `NeedsApproval`, `Approved`, `ChangesRequested`, `Rejected`, `Scheduled`, `Published`, `Failed`
- Platform: `LinkedIn`, `X`
- Approval status: `Pending`, `Approved`, `ChangesRequested`, `Rejected`, `Expired`
- Publish status: `Queued`, `Scheduled`, `Publishing`, `Published`, `Failed`, `Cancelled`
- Signal source type: `SearXNG`, `X`, `LinkedIn`, `Reddit`, `YouTube`, `News`, `Competitor`, `Website`
- Fact check status: `Verified`, `NeedsReview`, `Unsupported`, `Outdated`, `ConflictingSources`

### 3. Create Migrations

- [x] Create migration and generated Prisma client support:

```bash
npx prisma migrate dev --name add_social_publishing_models
npx prisma generate
```

Verification:

- Migration applies cleanly.
- Generated Prisma client includes new models.
- Existing auth/projects still work.

## Phase 2: Runtime Services

### 1. PostgreSQL

- [x] Use PostgreSQL as the primary product database for:

- Users
- Campaigns
- Drafts
- Approvals
- Schedules
- Published posts
- Sources
- Analytics
- Workflow read models

### 2. SearXNG

- [x] Use SearXNG for web research.

Tasks:

- [x] Keep `lib/searxng.ts`.
- [x] Add a reusable research activity in the worker.
- [x] Store search results as trend signals.
- [x] Add source filters, blocked domains, allowed domains, and freshness constraints in source models/APIs.
- [ ] Add richer evidence extraction for social publishing beyond normalized trend signals.

### 3. Temporal and Worker

- [x] Use Temporal for long-running automation:

- [x] Daily research workflows
- [x] Draft generation workflows
- [x] Approval reminder workflows
- [x] Publishing workflows
- [x] Analytics collection workflows

Worker responsibilities:

- [x] Call SearXNG.
- [x] Call LLM provider.
- [x] Save draft content.
- [x] Send approved posts to Postiz.
- [x] Update workflow state in PostgreSQL.
- [x] Collect analytics on schedule.

### 4. Temporal UI

- [x] Use Temporal UI service in Docker for:

- Inspecting active workflows.
- Debugging failures.
- Retrying failed workflows.
- Reviewing workflow history.

- [ ] Expose Temporal UI links from the app’s Workflows page.

### 5. Postiz

- [x] Use Postiz as the publishing and scheduling layer.

Postiz owns:

- Connected LinkedIn accounts.
- Connected X/Twitter accounts.
- Platform publishing.
- Media uploads where supported.
- Platform post IDs.

Social Swarm owns:

- Research.
- Draft generation.
- Approval state.
- Schedule decisions.
- Audit records.
- Analytics display.

Environment variables:

```dotenv
POSTIZ_URL=http://localhost:5001
POSTIZ_API_KEY=
```

- [x] Add Postiz service to Docker Compose.
- [x] Add Postiz env variables to `.env`, `.env.local`, and README.

## Phase 3: Research Pipeline

### 1. Source Configuration

- [x] Add Sources API where users configure:

- SearXNG search queries.
- Competitor websites.
- Competitor social accounts.
- Keywords.
- Hashtags.
- Reddit communities.
- Industry terms.
- Blocked domains.
- Approved domains.

- [ ] Build the Sources UI page.

### 2. Trend Research Workflow

- [x] Create a Temporal workflow:

```text
DailyTrendResearchWorkflow
├── load user source configuration ✅
├── run SearXNG searches ✅
├── collect social/trend adapter results ⏳
├── normalize signals ✅
├── deduplicate URLs/topics ⏳
├── score topic opportunities ✅
├── save TrendSignal records ✅
└── create recommended draft briefs ⏳
```

### 3. Topic Scoring

- [x] Add first-pass topic scoring using:

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

Store:

- [x] Topic
- [x] Source count
- [x] Opportunity score
- [x] Suggested angle
- [ ] Suggested platform
- [x] Supporting URLs
- [x] Freshness
- [x] Audience relevance

## Phase 4: Content Generation

### 1. Draft Brief Creation

- [x] Create `ContentDraft` records from selected trend signals.

Each draft should include:

- Topic
- Objective
- Audience
- Content pillar
- Primary keyword
- Supporting sources
- Suggested CTA
- Target platforms

### 2. LinkedIn Writer Activity

- [x] Generate LinkedIn content with:

- Hook
- Body
- CTA
- Hashtags
- Visual brief
- Character count

### 3. X/Twitter Writer Activity

- [x] Generate X/Twitter content with:

- Short post
- Detailed post
- Thread
- Question variation
- Opinion variation
- Hashtags
- Visual brief

### 4. Visual Brief Activity

- [x] Generate optional visual directions:

- Carousel outline
- Quote card
- Infographic concept
- Diagram
- Short-video script

### 5. Save Platform Variants

- [x] Save generated content as `ContentVariant` rows.

Each variant should store:

- Platform
- Hook
- Body
- Thread items
- Hashtags
- Visual brief
- Source references
- Model used
- Token usage

## Phase 5: Fact Check and Quality Review

### 1. Fact Checking

- [x] Add first-pass factual claim validation before approval.

Statuses:

- `Verified`
- `NeedsReview`
- `Unsupported`
- `Outdated`
- `ConflictingSources`

Store:

- [x] Claim
- [x] Verification status
- [ ] Source URL
- [x] Confidence score
- [x] Notes

### 2. Content Quality Score

- [x] Score content for:

- Hook quality
- Clarity
- Readability
- Reader value
- Platform fit
- CTA quality
- Hashtag quality
- Unsupported claims

Minimum score:

```text
80/100
```

Only content that passes fact and quality checks should enter the approval queue.

- [x] Create quality score records.
- [x] Store quality score on content variants.
- [ ] Enforce final `80/100` approval gate strictly. Current worker creates approval requests for generated variants with a lower temporary gate while prompts and scoring are still being tuned.

## Phase 6: Approval System

### 1. Approval Queue Page

- [x] Add Approval APIs for:

- Queue list
- Sources used
- Fact-check result
- Quality score
- Approve button
- Request changes button
- Reject button
- Edit draft button

- [ ] Build the full Approvals UI page with LinkedIn/X previews and suggested publish time.

Do not include a “post anyway” action.

### 2. Approval State Machine

- [x] Add approval state machine API support:

```text
Draft
   ↓
In Review
   ↓
Awaiting Approval
   ├── Approved
   ├── Changes Requested
   └── Rejected
```

Rules:

- [x] Approved content can be scheduled.
- [x] Changes requested returns to generation/editing.
- [x] Rejected content is archived.
- [x] No response keeps content unpublished.
- [x] Expired approval keeps content unpublished.

### 3. Emergency Pause

- [x] Add campaign pause field/API support.
- [ ] Add global emergency pause switch UI.

When enabled:

- Stop scheduling new posts.
- Do not publish queued posts.
- Keep research and drafting allowed.
- Show paused status globally.

## Phase 7: Three-Post Daily Scheduler

### 1. Schedule Settings

- [x] Add campaign schedule fields/API support for:

- Timezone
- Target posts per day
- Morning slot
- Afternoon slot
- Evening slot
- Enabled platforms
- Approval required

- [ ] Add full schedule settings UI.

Default:

```text
3 posts per day
Morning, Afternoon, Evening
Platforms: LinkedIn and X/Twitter
Approval required: true
```

### 2. Scheduling Workflow

- [x] Create a Temporal workflow:

```text
DailyPublishingSchedulerWorkflow
├── load approved variants ✅
├── load posting settings ✅
├── choose three daily slots ✅
├── prevent duplicate topics ⏳
├── create PublishingSchedule rows ✅
├── send scheduled posts to Postiz ✅
└── record schedule status ✅
```

### 3. Duplicate Protection

Use:

- [x] Content hash
- [x] Platform
- [x] Scheduled date
- [ ] Topic ID

- [x] Prevent the same content/platform/scheduled time from being posted twice.

## Phase 8: Postiz Publishing

### 1. Postiz Client

- [x] Create:

```text
lib/postiz.ts
```

Responsibilities:

- [x] Authenticate with Postiz.
- [x] List connected accounts.
- [x] Create scheduled posts.
- [ ] Upload media if needed.
- [x] Fetch publication status.
- [x] Fetch returned platform post IDs.

### 2. Publishing Activity

- [x] Create a worker activity:

```text
publishToPostizActivity
```

Input:

- Content variant ID
- Platform
- Account ID
- Scheduled time
- Text
- Media
- Idempotency key

Output:

- Postiz post ID
- Platform post ID if available
- Status
- Error if failed

### 3. Save Publishing Records

Persist:

- [x] Postiz post ID
- [x] Platform post ID
- [x] Status
- [x] Scheduled time
- [x] Published time
- [x] Approval metadata
- [x] Content hash

## Phase 9: Dashboard and Pages

### 1. App Shell

- [x] Build a persistent dashboard shell with:

- Sidebar
- Top bar
- Emergency pause button
- Create campaign button
- User menu

Sidebar pages:

- Dashboard
- Content Queue
- Research
- Approvals
- Calendar
- Published Posts
- Analytics
- Sources
- Workflows
- Settings

### 2. Dashboard

- [x] Dashboard UI mock exists for:

- Today’s 3 publishing slots
- Approval queue
- Active swarm runs
- Research signals
- Scheduled preview
- Recent performance
- System health

### 3. Content Queue

- [ ] Build complete Content Queue UI backed by APIs.

Show all drafts and variants with:

- Status
- Platform
- Topic
- Quality score
- Fact-check status
- Scheduled time
- Actions

### 4. Research

- [ ] Build complete Research UI backed by APIs.

Show:

- Trend signals
- Opportunity scores
- Source evidence
- Suggested angles
- Create draft action

### 5. Approvals

- [ ] Build complete Approvals UI backed by APIs.

Show:

- Queue
- Preview
- Sources
- Fact checks
- Quality score
- Approval actions

### 6. Calendar

- [ ] Build complete Calendar UI backed by APIs.

Show:

- Weekly calendar
- Three-post cadence
- Scheduled status
- Platform filters
- Rescheduling controls

### 7. Published Posts

- [ ] Build complete Published Posts UI backed by APIs.

Show:

- Published time
- Platform
- Topic
- Platform URL
- Platform post ID
- Engagement metrics

### 8. Analytics

- [x] Add Analytics APIs for:

- Impressions
- Engagement rate
- Likes
- Comments
- Reposts/shares
- Link clicks
- Follower growth
- Best topics
- Best hooks
- Best posting times

- [ ] Build complete Analytics UI backed by APIs.

### 9. Sources

- [x] Add Sources APIs for:

- Source list
- Keywords
- Hashtags
- Competitors
- Blocked domains
- Reliability score
- Last checked time

- [ ] Build complete Sources UI backed by APIs.

### 10. Workflows

- [x] Add health APIs for:

- Temporal workflows
- Worker queue metrics
- Failed jobs
- Retry actions
- Link to Temporal UI
- Service health

- [ ] Build complete Workflows UI backed by worker/Temporal APIs.

### 11. Settings

- [ ] Build complete Settings UI backed by APIs.

Show:

- Workspace settings
- Content pillars
- Posting schedule
- Postiz account connections
- Approval rules
- Emergency pause controls
- Provider/API keys
- Team members
- Notifications

## Phase 10: Analytics and Learning

### 1. Collection Schedule

- [x] Add analytics collection workflow windows:

- 1 hour
- 24 hours
- 7 days
- 30 days

### 2. Metrics

- [x] Track normalized metric records for:

- Impressions
- Engagement rate
- Likes
- Comments
- Reposts/shares
- Saves
- Link clicks
- Follower growth
- Leads
- Conversion rate

### 3. Learning Recommendations

- [ ] Generate recommendations for:

- Best posting times
- Best hooks
- Best topics
- Best content pillars
- Best CTAs
- Best post length
- Underperforming formats

Human approval should be required before major strategy changes are applied.

## Phase 11: Testing and Verification

### 1. Unit Tests

Test:

- Topic scoring
- Schedule generation
- Content hash creation
- Approval state transitions
- Postiz client behavior with mocked responses

### 2. Integration Tests

Test:

- Create campaign
- Generate draft
- Approve draft
- Schedule approved post
- Publish through Postiz mock
- Save platform IDs

### 3. Workflow Tests

Test:

- Research workflow success
- Research workflow failure
- Publishing workflow retry
- Approval expiration
- Emergency pause behavior

### 4. UI Tests

Test:

- Approval buttons
- Emergency pause button
- Dashboard counts
- Calendar scheduling
- Workflows page links to Temporal UI

## Phase 12: Production Safety

Before enabling real publishing:

- Verify Postiz credentials are server-side only.
- Verify approval is required by default.
- Verify rejected content cannot publish.
- Verify expired approvals cannot publish.
- Verify emergency pause blocks publishing.
- Verify idempotency prevents duplicate posts.
- Verify audit records are created for every publish.
- Verify worker retry cannot duplicate publication.

## Suggested Build Order

1. [x] Add database models and migrations.
2. [x] Add Postiz client.
3. [x] Add content draft and approval APIs.
4. [ ] Build Content Queue and Approvals pages.
5. [x] Add SearXNG research workflow.
6. [x] Add LinkedIn and X/Twitter generation activities.
7. [x] Add fact-check and quality scoring.
8. [x] Add three-post daily scheduler.
9. [x] Add Postiz publishing activity.
10. [ ] Add Calendar and Published Posts pages.
11. [x] Add Analytics collection workflow.
12. [ ] Add Workflows page and Temporal UI links.
13. [x] Add service health checks.
14. [ ] Add full test coverage for approval and publishing safety.

## Non-Negotiable Rules

- No approval means no publishing.
- Rejected content must never publish.
- Expired approval must never publish.
- Emergency pause must stop all publishing.
- Worker retries must not duplicate posts.
- Social credentials must never reach browser code.
- Every generated post must keep source provenance.
- Every published post must have an audit trail.
