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

Add Prisma models for:

- `ContentCampaign`
- `ContentDraft`
- `ContentVariant`
- `ApprovalRequest`
- `PublishingSchedule`
- `PublishedPost`
- `PlatformAccount`
- `ContentSource`
- `TrendSignal`
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

Add enums for:

- Draft status: `Draft`, `InReview`, `NeedsApproval`, `Approved`, `ChangesRequested`, `Rejected`, `Scheduled`, `Published`, `Failed`
- Platform: `LinkedIn`, `X`
- Approval status: `Pending`, `Approved`, `ChangesRequested`, `Rejected`, `Expired`
- Publish status: `Queued`, `Scheduled`, `Publishing`, `Published`, `Failed`, `Cancelled`
- Signal source type: `SearXNG`, `X`, `LinkedIn`, `Reddit`, `YouTube`, `News`, `Competitor`, `Website`

### 3. Create Migrations

Run:

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

Use PostgreSQL as the primary product database for:

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

Use SearXNG for web research.

Tasks:

- Keep `lib/searxng.ts`.
- Add a reusable research activity in the worker.
- Store search results as trend signals and evidence.
- Add source filters, blocked domains, allowed domains, and freshness constraints.

### 3. Temporal and Worker

Use Temporal for long-running automation:

- Daily research workflows
- Draft generation workflows
- Approval reminder workflows
- Publishing workflows
- Analytics collection workflows

Worker responsibilities:

- Call SearXNG.
- Call LLM provider.
- Save draft content.
- Send approved posts to Postiz.
- Update workflow state in PostgreSQL.
- Collect analytics on schedule.

### 4. Temporal UI

Use Temporal UI for:

- Inspecting active workflows.
- Debugging failures.
- Retrying failed workflows.
- Reviewing workflow history.

Expose Temporal UI links from the app’s Workflows page.

### 5. Postiz

Use Postiz as the publishing and scheduling layer.

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
POSTIZ_URL=http://localhost:5000
POSTIZ_API_KEY=
```

## Phase 3: Research Pipeline

### 1. Source Configuration

Build a Sources page where users configure:

- SearXNG search queries.
- Competitor websites.
- Competitor social accounts.
- Keywords.
- Hashtags.
- Reddit communities.
- Industry terms.
- Blocked domains.
- Approved domains.

### 2. Trend Research Workflow

Create a Temporal workflow:

```text
DailyTrendResearchWorkflow
├── load user source configuration
├── run SearXNG searches
├── collect social/trend adapter results
├── normalize signals
├── deduplicate URLs/topics
├── score topic opportunities
├── save TrendSignal records
└── create recommended draft briefs
```

### 3. Topic Scoring

Score each topic using:

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

- Topic
- Source count
- Opportunity score
- Suggested angle
- Suggested platform
- Supporting URLs
- Freshness
- Audience relevance

## Phase 4: Content Generation

### 1. Draft Brief Creation

Create `ContentDraft` records from selected trend signals.

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

Generate LinkedIn content with:

- Hook
- Body
- CTA
- Hashtags
- Visual brief
- Character count

### 3. X/Twitter Writer Activity

Generate X/Twitter content with:

- Short post
- Detailed post
- Thread
- Question variation
- Opinion variation
- Hashtags
- Visual brief

### 4. Visual Brief Activity

Generate optional visual directions:

- Carousel outline
- Quote card
- Infographic concept
- Diagram
- Short-video script

### 5. Save Platform Variants

Save generated content as `ContentVariant` rows.

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

Validate factual claims before approval.

Statuses:

- `Verified`
- `NeedsReview`
- `Unsupported`
- `Outdated`
- `ConflictingSources`

Store:

- Claim
- Verification status
- Source URL
- Confidence score
- Notes

### 2. Content Quality Score

Score content for:

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

## Phase 6: Approval System

### 1. Approval Queue Page

Build an Approvals page with:

- Queue list
- LinkedIn preview
- X/Twitter preview
- Sources used
- Fact-check result
- Quality score
- Suggested publish time
- Approve button
- Request changes button
- Reject button
- Edit draft button

Do not include a “post anyway” action.

### 2. Approval State Machine

Use this flow:

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

- Approved content can be scheduled.
- Changes requested returns to generation/editing.
- Rejected content is archived.
- No response keeps content unpublished.
- Expired approval keeps content unpublished.

### 3. Emergency Pause

Add an emergency pause switch.

When enabled:

- Stop scheduling new posts.
- Do not publish queued posts.
- Keep research and drafting allowed.
- Show paused status globally.

## Phase 7: Three-Post Daily Scheduler

### 1. Schedule Settings

Add settings for:

- Timezone
- Target posts per day
- Morning slot
- Afternoon slot
- Evening slot
- Enabled platforms
- Approval required

Default:

```text
3 posts per day
Morning, Afternoon, Evening
Platforms: LinkedIn and X/Twitter
Approval required: true
```

### 2. Scheduling Workflow

Create a Temporal workflow:

```text
DailyPublishingSchedulerWorkflow
├── load approved variants
├── load posting settings
├── choose three daily slots
├── prevent duplicate topics
├── create PublishingSchedule rows
├── send scheduled posts to Postiz
└── record schedule status
```

### 3. Duplicate Protection

Use:

- Content hash
- Platform
- Scheduled date
- Topic ID

Prevent the same content from being posted twice.

## Phase 8: Postiz Publishing

### 1. Postiz Client

Create:

```text
lib/postiz.ts
```

Responsibilities:

- Authenticate with Postiz.
- List connected accounts.
- Create scheduled posts.
- Upload media if needed.
- Fetch publication status.
- Fetch returned platform post IDs.

### 2. Publishing Activity

Create a worker activity:

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

- Postiz post ID
- Platform post ID
- Status
- Scheduled time
- Published time
- Approval metadata
- Content hash

## Phase 9: Dashboard and Pages

### 1. App Shell

Build a persistent layout:

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

Show:

- Today’s 3 publishing slots
- Approval queue
- Active swarm runs
- Research signals
- Scheduled preview
- Recent performance
- System health

### 3. Content Queue

Show all drafts and variants with:

- Status
- Platform
- Topic
- Quality score
- Fact-check status
- Scheduled time
- Actions

### 4. Research

Show:

- Trend signals
- Opportunity scores
- Source evidence
- Suggested angles
- Create draft action

### 5. Approvals

Show:

- Queue
- Preview
- Sources
- Fact checks
- Quality score
- Approval actions

### 6. Calendar

Show:

- Weekly calendar
- Three-post cadence
- Scheduled status
- Platform filters
- Rescheduling controls

### 7. Published Posts

Show:

- Published time
- Platform
- Topic
- Platform URL
- Platform post ID
- Engagement metrics

### 8. Analytics

Show:

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

### 9. Sources

Show:

- Source list
- Keywords
- Hashtags
- Competitors
- Blocked domains
- Reliability score
- Last checked time

### 10. Workflows

Show:

- Temporal workflows
- Worker queue metrics
- Failed jobs
- Retry actions
- Link to Temporal UI
- Service health

### 11. Settings

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

Collect metrics after:

- 1 hour
- 24 hours
- 7 days
- 30 days

### 2. Metrics

Track:

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

Generate recommendations for:

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

1. Add database models and migrations.
2. Add Postiz client.
3. Add content draft and approval APIs.
4. Build Content Queue and Approvals pages.
5. Add SearXNG research workflow.
6. Add LinkedIn and X/Twitter generation activities.
7. Add fact-check and quality scoring.
8. Add three-post daily scheduler.
9. Add Postiz publishing activity.
10. Add Calendar and Published Posts pages.
11. Add Analytics collection workflow.
12. Add Workflows page and Temporal UI links.
13. Add service health checks.
14. Add full test coverage for approval and publishing safety.

## Non-Negotiable Rules

- No approval means no publishing.
- Rejected content must never publish.
- Expired approval must never publish.
- Emergency pause must stop all publishing.
- Worker retries must not duplicate posts.
- Social credentials must never reach browser code.
- Every generated post must keep source provenance.
- Every published post must have an audit trail.
