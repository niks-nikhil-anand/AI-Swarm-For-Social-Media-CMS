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

## Scalable Architecture for 1M+ Users

This section outlines the production-grade infrastructure required to safely and reliably serve 1 million+ concurrent users at scale.

### High-Level Infrastructure

```mermaid
flowchart TB
    CDN["CDN / CloudFlare<br/>Static assets, caching"]
    
    subgraph "API Gateway Layer"
        LB["Load Balancer<br/>Rate limiting, SSL/TLS"]
    end
    
    subgraph "Compute Layer (Auto-scaled)"
        API1["Next.js API 1"]
        API2["Next.js API 2"]
        API3["Next.js API N"]
    end
    
    subgraph "Session & Cache Layer"
        Redis["Redis Cluster<br/>Sessions, Cache<br/>Rate limit counters"]
    end
    
    subgraph "Database Layer (Primary + Replicas)"
        DBPrimary["PostgreSQL Primary<br/>Write operations"]
        DBRead1["PostgreSQL Read Replica 1"]
        DBRead2["PostgreSQL Read Replica 2"]
        DBRead3["PostgreSQL Read Replica N"]
    end
    
    subgraph "Temporal Distributed Workflow"
        TemporalServer["Temporal Server Cluster<br/>High availability"]
        ResearchQ["Research Queue"]
        ReviewQ["Review Queue"]
        OutputQ["Output Queue"]
        SocialQ["Social Queue"]
    end
    
    subgraph "Worker Pools (Auto-scaled)"
        ResearchWorkers["Research Workers<br/>100+ instances"]
        ReviewWorkers["Review Workers<br/>50+ instances"]
        OutputWorkers["Document Workers<br/>50+ instances"]
        SocialWorkers["Social Workers<br/>30+ instances"]
    end
    
    subgraph "External Services"
        SearXNG["SearXNG Instance<br/>with caching"]
        Postiz["Postiz API"]
        LLMProviders["LLM Providers<br/>OpenRouter, etc"]
    end
    
    subgraph "Storage Layer"
        S3["Object Storage<br/>S3 / MinIO<br/>Artifacts, exports"]
        SearchIndex["Elasticsearch<br/>Full-text search<br/>Evidence index"]
    end
    
    subgraph "Monitoring & Logging"
        Prometheus["Prometheus<br/>Metrics"]
        Grafana["Grafana<br/>Dashboards"]
        ELK["ELK Stack<br/>Logs, tracing"]
    end
    
    CDN --> LB
    LB --> API1 & API2 & API3
    API1 & API2 & API3 --> Redis
    API1 & API2 & API3 --> DBRead1 & DBRead2 & DBRead3
    API1 & API2 & API3 -->|writes| DBPrimary
    API1 & API2 & API3 --> TemporalServer
    
    TemporalServer --> ResearchQ & ReviewQ & OutputQ & SocialQ
    ResearchQ --> ResearchWorkers
    ReviewQ --> ReviewWorkers
    OutputQ --> OutputWorkers
    SocialQ --> SocialWorkers
    
    ResearchWorkers --> SearXNG & LLMProviders & DBPrimary
    ReviewWorkers --> LLMProviders & DBPrimary
    OutputWorkers --> S3 & LLMProviders & DBPrimary
    SocialWorkers --> Postiz & DBPrimary
    
    DBPrimary -.->|replication| DBRead1 & DBRead2 & DBRead3
    API1 & API2 & API3 --> SearchIndex
    
    API1 & API2 & API3 & ResearchWorkers & ReviewWorkers & OutputWorkers & SocialWorkers --> Prometheus
    Prometheus --> Grafana
    API1 & API2 & API3 & ResearchWorkers & ReviewWorkers & OutputWorkers & SocialWorkers --> ELK
```

### 1. Load Balancing & API Gateway

**Purpose:** Distribute traffic across multiple API instances, enforce rate limits, handle SSL/TLS termination.

```yaml
Load Balancer Configuration:
  - Type: AWS ALB or NGINX Plus
  - Health checks: /health endpoint (should check DB connectivity)
  - Sticky sessions: Use Redis for session affinity
  - Rate limiting: 1000 requests/user/hour
  - SSL/TLS: Auto-renew with Let's Encrypt
  - Compression: gzip, brotli for responses > 1KB
```

**Implementation:**
```typescript
// app/api/health.ts - Health check endpoint
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisHealth = await redis.ping();
    
    if (redisHealth === 'PONG') {
      return Response.json({ status: 'healthy' }, { status: 200 });
    }
  } catch (error) {
    return Response.json({ status: 'unhealthy', error: error.message }, { status: 503 });
  }
}
```

### 2. Compute Layer - Horizontal Scaling

**Stateless Next.js API Instances:**
- Deploy 10-50 instances based on traffic (Kubernetes or AWS ECS/Fargate)
- CPU: 2 cores, Memory: 2GB per instance
- Auto-scaling: Scale up at 70% CPU, scale down at 30% CPU
- Container image: Use multi-stage Docker builds for minimal size

```dockerfile
# Dockerfile for Next.js
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. Session & Caching Layer - Redis Cluster

**Redis Cluster Setup (High Availability):**
- 6+ Redis nodes (master + slave replicas)
- Memory: 64GB - 256GB depending on active sessions
- TTL policies: Sessions expire after 30 days

```typescript
// lib/redis.ts - Redis client with clustering
import { createClient } from 'redis';

export const redis = createClient({
  cluster: [
    { host: process.env.REDIS_NODE_1, port: 6379 },
    { host: process.env.REDIS_NODE_2, port: 6379 },
    { host: process.env.REDIS_NODE_3, port: 6379 },
  ],
  password: process.env.REDIS_PASSWORD,
});

// Session storage strategy
export async function setSession(sessionId: string, userId: string, ttl = 2592000) {
  await redis.setEx(
    `session:${sessionId}`,
    ttl,
    JSON.stringify({ userId, createdAt: Date.now() })
  );
}

export async function getSession(sessionId: string) {
  return redis.get(`session:${sessionId}`);
}

// Rate limiting with Redis
export async function checkRateLimit(userId: string, limit = 1000) {
  const key = `rate_limit:${userId}:${Math.floor(Date.now() / 3600000)}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 3600);
  }
  
  return current <= limit;
}

// Caching layer
export async function getCachedData(key: string, fetcher: () => Promise<any>, ttl = 300) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetcher();
  await redis.setEx(key, ttl, JSON.stringify(data));
  return data;
}
```

### 4. Database Layer - Sharding & Read Replicas

**Database Topology:**
- Primary PostgreSQL instance (write operations)
- 3-5 read replicas (read queries, distributed across regions)
- Streaming replication with <100ms latency

**Sharding Strategy by User ID:**

```prisma
// prisma/schema.prisma - Shard-aware schema
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  shard_id        Int       @db.SmallInt // 0-255 for 256 shards
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  @@index([shard_id])
  @@index([email])
}

model Project {
  id              String    @id @default(cuid())
  user_id         String
  shard_id        Int       @db.SmallInt
  title           String
  created_at      DateTime  @default(now())
  
  @@index([user_id, shard_id])
  @@index([shard_id])
}
```

**Shard Routing Logic:**

```typescript
// lib/shard.ts - Shard management
export function getUserShardId(userId: string): number {
  const hash = userId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 256; // 256 shards
}

export function getShardDatabaseUrl(shardId: number): string {
  const shards: Record<number, string> = {
    0: process.env.DB_SHARD_0!,
    1: process.env.DB_SHARD_1!,
    // ... more shards
    255: process.env.DB_SHARD_255!,
  };
  return shards[shardId];
}

export function createShardedPrismaClient(userId: string) {
  const shardId = getUserShardId(userId);
  const databaseUrl = getShardDatabaseUrl(shardId);
  
  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });
}
```

**Connection Pooling:**

```yaml
# PgBouncer configuration for connection pooling
[databases]
swarm_shard_0 = host=db-shard-0.internal port=5432 dbname=swarm_0
swarm_shard_1 = host=db-shard-1.internal port=5432 dbname=swarm_1

[pgbouncer]
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
```

### 5. Message Queue & Temporal at Scale

**Temporal Multi-cluster Setup:**

```yaml
Temporal Clusters:
  - Primary cluster: 3-5 Temporal server nodes
  - Regional failover: 2-3 nodes in secondary region
  - Namespaces: One namespace per organization (isolation)
  - Task queues:
    * research:high - 100 max concurrent activities
    * research:normal - 1000 max concurrent activities
    * review:high - 50 max concurrent activities
    * output:standard - 50 max concurrent activities
    * social:batch - 30 max concurrent activities
```

**Worker Pool Configuration:**

```typescript
// workers/research-worker.ts - Temporal worker with auto-scaling
import { Worker } from '@temporalio/worker';
import { researchActivity, fetchPageActivity, extractEvidenceActivity } from './activities';

export async function createResearchWorker(taskQueue: string) {
  const worker = await Worker.create({
    namespace: process.env.TEMPORAL_NAMESPACE,
    taskQueue,
    workflowsPath: require.resolve('./workflows'),
    activities: {
      researchActivity,
      fetchPageActivity,
      extractEvidenceActivity,
    },
    // Scaling configuration
    maxConcurrentActivityTaskExecutions: 100,
    maxConcurrentWorkflowTaskExecutions: 50,
  });

  await worker.run();
}

// Auto-scaling based on queue depth
export async function getQueueMetrics(taskQueue: string) {
  const client = new WorkflowClient();
  const response = await client.describe(); // Returns queue depth
  
  return {
    taskQueueDepth: response.taskQueueInfo?.approximateSize || 0,
    expectedScaleOut: Math.ceil(response.taskQueueInfo?.approximateSize / 50),
  };
}
```

### 6. Storage Layer - Object Storage & Indexing

**S3/MinIO Configuration:**

```typescript
// lib/storage.ts - Object storage client
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function storeArtifact(projectId: string, fileName: string, buffer: Buffer) {
  const key = `projects/${projectId}/artifacts/${Date.now()}_${fileName}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: getContentType(fileName),
    Metadata: {
      projectId,
      uploadedAt: new Date().toISOString(),
    },
    ServerSideEncryption: 'AES256',
    // Enable versioning for recovery
    VersionId: projectId,
  }));
  
  return key;
}

export async function generateSignedUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });
  
  return getSignedUrl(s3, command, { expiresIn });
}
```

**Elasticsearch for Full-Text Search:**

```typescript
// lib/search.ts - Elasticsearch indexing
import { Client } from '@elastic/elasticsearch';

export const es = new Client({
  node: process.env.ELASTICSEARCH_NODE,
  auth: {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD,
  },
});

export async function indexEvidence(projectId: string, evidence: Evidence) {
  await es.index({
    index: `evidence-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    document: {
      projectId,
      content: evidence.content,
      source: evidence.source,
      timestamp: new Date(),
      shard_id: getUserShardId(evidence.userId),
    },
  });
}

export async function searchEvidence(userId: string, query: string) {
  const result = await es.search({
    index: 'evidence-*',
    query: {
      bool: {
        must: [
          { multi_match: { query, fields: ['content', 'source'] } },
          { term: { 'shard_id': getUserShardId(userId) } },
        ],
      },
    },
    size: 50,
  });
  
  return result.hits.hits;
}
```

### 7. Monitoring & Observability

**Metrics Collection (Prometheus):**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'next-api'
    static_configs:
      - targets: ['localhost:9090']
    
  - job_name: 'temporal'
    static_configs:
      - targets: ['localhost:9090']
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:6379']
```

**Custom Metrics:**

```typescript
// lib/metrics.ts - Application metrics
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const apiRequestDuration = new Histogram({
  name: 'api_request_duration_ms',
  help: 'API request duration in milliseconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [10, 50, 100, 500, 1000, 5000],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_ms',
  help: 'Database query duration',
  labelNames: ['query_type', 'table'],
  buckets: [1, 5, 10, 50, 100, 500],
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Total active users',
  labelNames: ['shard_id'],
});

export const workflowExecutionCounter = new Counter({
  name: 'workflow_executions_total',
  help: 'Total workflow executions',
  labelNames: ['workflow_type', 'status'],
});

// Middleware for request tracking
export function metricsMiddleware(req: NextRequest, res: NextResponse) {
  const start = Date.now();
  const originalStatus = res.status;
  
  return () => {
    const duration = Date.now() - start;
    apiRequestDuration
      .labels(req.method, req.nextUrl.pathname, originalStatus)
      .observe(duration);
  };
}
```

**Distributed Tracing (Jaeger/OpenTelemetry):**

```typescript
// lib/tracing.ts
import { NodeTracerProvider } from '@opentelemetry/node';
import { registerInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT,
});

const tracerProvider = new NodeTracerProvider();
tracerProvider.addSpanProcessor(new BatchSpanProcessor(jaegerExporter));

registerInstrumentations({ tracerProvider });
```

### 8. Implementation Roadmap for 1M+ Scale

**Phase 1: Foundation (Weeks 1-4)**
- [ ] Set up Redis cluster (sessions, caching, rate limiting)
- [ ] Implement shard routing logic in Prisma client
- [ ] Deploy load balancer with health checks
- [ ] Add comprehensive logging (ELK stack)
- [ ] Database read replicas with streaming replication

**Phase 2: Worker Infrastructure (Weeks 5-8)**
- [ ] Temporal multi-cluster setup with namespaces
- [ ] Containerize all worker services
- [ ] Implement Kubernetes deployment manifests
- [ ] Auto-scaling policies for worker pools
- [ ] Queue depth monitoring and alerts

**Phase 3: Storage & Search (Weeks 9-12)**
- [ ] S3/MinIO configuration for artifact storage
- [ ] Elasticsearch cluster for evidence indexing
- [ ] CDN integration for static assets
- [ ] Archive old projects to cold storage (S3 Glacier)
- [ ] Backup and disaster recovery procedures

**Phase 4: Optimization (Weeks 13-16)**
- [ ] Database query optimization (indexes, query plans)
- [ ] API response caching strategies
- [ ] Worker pool tuning based on metrics
- [ ] Cost optimization review
- [ ] Load testing with 1M+ simulated users

**Phase 5: Production Hardening (Weeks 17-20)**
- [ ] Chaos engineering tests (failure scenarios)
- [ ] Security audit and penetration testing
- [ ] DDOS mitigation strategies
- [ ] Multi-region failover testing
- [ ] Runbooks and incident response procedures

### 9. Performance Targets for 1M Users

| Metric | Target | Monitoring |
|--------|--------|------------|
| **API Response Time (p99)** | < 500ms | Prometheus + Grafana |
| **Database Query Time (p95)** | < 100ms | DataDog / NewRelic |
| **Workflow Completion Time** | < 30 min (typical) | Temporal Web UI |
| **Error Rate** | < 0.1% | CloudWatch / Sentry |
| **Cache Hit Ratio** | > 85% | Redis INFO command |
| **Worker Availability** | > 99.9% | Temporal metrics |
| **Search Index Latency** | < 200ms | Elasticsearch metrics |

### 10. Cost Estimation (1M Active Users)

```
Monthly Infrastructure Costs (Approximate):

Compute:
  - Next.js API (30 instances): $2,000
  - Temporal Server (6 nodes): $3,000
  - Worker Pools (400+ instances): $15,000

Database:
  - PostgreSQL Primary (256 shards): $25,000
  - Read Replicas (3 per shard): $30,000
  - PgBouncer connection pooling: $1,000

Cache & Queue:
  - Redis Cluster (256GB): $5,000
  - Temporal Persistence: $3,000

Storage & Search:
  - S3/Object Storage: $2,000
  - Elasticsearch (high volume): $8,000
  - CDN: $3,000

Monitoring & Logging:
  - Prometheus + Grafana: $1,000
  - ELK Stack: $2,000
  - Jaeger Tracing: $1,000
  - PagerDuty / Incident Management: $1,500

Total Estimated: ~$100,500/month (~$0.10 per user/month)
```

---

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
