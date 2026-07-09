# Development Setup

This project uses Docker for backend services (PostgreSQL, Temporal, SearXNG) and Next.js for the frontend.

## Environment Configuration

### `.env` (Committed)
- Used by Docker services and worker
- Uses Docker service names: `postgres:5432`, `temporal:7233`
- Example: `postgresql://postgres:postgres@postgres:5432/swarm`

### `.env.local` (Local Development Only)
- Auto-generated, not committed to git
- Used by Next.js dev server running on your Mac
- Uses `localhost` to access Docker ports exposed on your host
- Example: `postgresql://postgres:postgres@localhost:5432/swarm`

## Running the Application

### 1. Start Docker Services
```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (shared database)
- **Temporal** on `localhost:7233` (workflow orchestrator)
- **Temporal UI** on `localhost:8080`
- **SearXNG** on `localhost:8888` (search engine)
- **Worker** service (processes async tasks)

### 2. Run Next.js Dev Server
```bash
npm run dev
```

The dev server will use `.env.local` and can access Docker services via localhost.

## Accessing Services

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| Temporal UI | http://localhost:8080 |
| SearXNG | http://localhost:8888 |
| PostgreSQL | localhost:5432 |

## Database

The application uses a local PostgreSQL database. Schema migrations are automatically applied when the worker starts.

To manually run migrations:
```bash
# From inside the Docker worker
docker-compose exec worker npx prisma migrate deploy

# Or from your Mac (requires DATABASE_URL with localhost)
npx prisma migrate dev
```

## Troubleshooting

**"Can't reach database server at postgres"**
- Next.js is trying to use the Docker service name
- Ensure `.env.local` exists with `localhost` instead of `postgres`
- Restart the dev server: `npm run dev`

**Worker not connecting to database**
- Check that PostgreSQL is running: `docker-compose ps`
- Worker uses Docker service names (`postgres:5432`)
- Worker automatically runs migrations on startup

**Port conflicts**
- Change docker-compose port mappings if needed
- Update `.env.local` to match new ports
