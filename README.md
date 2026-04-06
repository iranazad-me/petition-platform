# Iran Azad — Student Petition Platform

Privacy-first signing platform for the **"بیانیه‌ی دانشجویان ایران"**, built with TanStack Start and PostgreSQL.

This app is Persian-first (RTL), stores no raw national ID/student ID values, and uses a non-OTP anti-fraud model based on nonce + behavioral/rate/risk controls.

## What this app does

- Renders the statement from `statement.md`
- Collects signatures with consent-based public masking options
- Prevents duplicates using irreversible HMAC hashes
- Applies anti-abuse controls (session-bound nonce with replay protection once consumed, replay checks, risk scoring, rate limits)
- Shows live aggregate stats by university and faculty
- Publishes a public anti-fraud transparency page

## Tech stack

- **Framework/runtime:** TanStack Start + React + Vite (SSR build output in `dist/server/server.js`)
- **Routing:** TanStack Router (file-based routes)
- **Database:** PostgreSQL + Drizzle ORM
- **Styling:** Tailwind CSS 4
- **Lint/format:** Biome
- **Testing:** Vitest
- **Package manager:** pnpm (`pnpm@10.33.0`)

## Application routes

UI routes:

- `/` — petition, signing form, recent signatures
- `/stats` — live dashboard
- `/about-security` — anti-fraud transparency
- `/about` — project overview

HTTP API routes:

- `GET /api/health` — liveness probe
- `GET /api/ready` — readiness probe (DB check)
- `GET /api/stats` — live aggregate stats
- `GET /api/signatures/recent` — latest public signatures
- `GET /api/fraud-transparency` — anti-fraud transparency text

## Data model (high-level)

- `petitions` — petition metadata and statement text
- `signatures` — masked display fields + hashed identity/fingerprint fields
- `fraud_signals` — hashed abuse signals + risk decision/reasons
- `submission_nonces` — session-bound nonce + csrf token + expiry + used status

For full architecture and data-flow details, see [`architecture.md`](./architecture.md).

## Environment setup

Copy and configure:

```bash
cp .env.local.example .env.local
```

Required:

- `DATABASE_URL`
- `PETITION_HMAC_SECRET` (long random secret; rotate carefully)

Optional:

- `NODE_ENV` (defaults to runtime environment)
- `PORT` (default app port is `3000`)

## Local development

```bash
corepack enable
pnpm install
pnpm dev
```

## Database workflow

After schema updates in `src/db/schema.ts`:

```bash
pnpm db:generate
pnpm db:migrate
```

## Quality gates

Run before merge/release:

```bash
pnpm typecheck
pnpm check:fix
pnpm check
pnpm test
pnpm build
```

## Production run options

### Option A: Docker (recommended)

Build:

```bash
docker build -t iranazad:latest .
```

Run:

```bash
docker run --rm -p 3000:3000 --env-file .env.local iranazad:latest
```

Container characteristics:

- Multi-stage build
- Non-root runtime user
- Starts with `node dist/server/server.js`

### Option B: Direct Node runtime

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

`pnpm start` validates the server artifact before launching.

## Deployment checklist (minimum)

- Use managed PostgreSQL with backups
- Set `PETITION_HMAC_SECRET` to a strong random value
- Run `pnpm db:migrate` during release
- Configure health checks:
  - liveness: `/api/health`
  - readiness: `/api/ready`
- Use rolling/blue-green deploys with automatic rollback
- Place app behind HTTPS reverse proxy / load balancer

## Public Deployment

This application is deployed on our staging server:
- **URL:** http://91.107.243.10:3000
- **Status:** Development/Staging Environment

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for local development setup.

## Deployment

Deployment to staging is automated via:
```bash
pnpm deploy:staging
```

## License

This project is not currently licensed. Consider adding an appropriate license before making the repository public.

## Repository structure

- `src/routes` — UI pages and API endpoints
- `src/lib/petition.ts` — signing pipeline, anti-fraud, stats
- `src/lib/security.ts` — normalization, masking, risk logic
- `src/lib/statement.ts` — statement markdown parsing
- `src/db/schema.ts` — Drizzle schema
- `drizzle/` — SQL migrations
