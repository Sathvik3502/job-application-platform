# ApplyPilot

ApplyPilot is a local-first, safety-gated job discovery and application platform. This repository now contains the controlled-beta foundation: authenticated users have private profiles, preferences, answers, jobs, applications, durable transitions, and database-backed automation queueing. The worker stops before external submission by default and never bypasses CAPTCHAs, authentication, anti-bot controls, or ambiguous factual questions.

## Architecture

`apps/web` is the Vercel-ready Next.js dashboard and short-lived API layer. `apps/worker` is a separate local worker process. `packages/matching` contains pure, deterministic matching and eligibility logic; `packages/automation` owns field classification and final safety gates; `packages/database` owns the PostgreSQL Prisma schema.

## Local development

Prerequisites: Node.js 20+, Docker Desktop, and optionally Ollama. Copy `.env.example` to `.env`, then run:

```sh
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
npm run worker
```

Open `http://localhost:3000/dashboard` and use `/test-ats` to exercise the multi-page fake ATS. `MOCK_MODE=true` and `DRY_RUN=true` are safe defaults. The worker will never submit while dry run is enabled. To run checks:

```sh
npm run test
npm run typecheck
npm run lint
npm run build
```

## AI and storage

Ollama is configured with `OLLAMA_BASE_URL` and `OLLAMA_MODEL`; it is optional for this deterministic MVP. The next integration point is an `AIProvider` implementation in `packages/ai`, keeping a local Ollama provider replaceable. PostgreSQL and Redis are supplied by Docker Compose. Production object storage and real ATS adapters are intentionally not enabled in the demo flow.

## Deployment

Push this folder to GitHub, import it in Vercel, and set `DATABASE_URL`, `CRON_SECRET`, and public-safe configuration. Deploy `apps/web` as the root directory (or configure the workspace command). Keep the Playwright/Ollama worker on a persistent local or VM process; Vercel should call only `/api/automation/trigger` and render the dashboard. The trigger requires `Authorization: Bearer $CRON_SECRET`.

## Current beta boundary

The web application and worker now use PostgreSQL for account data and application queue state. The seed creates `avery@example.test` with password `DemoPassword123!` for local testing only. Change or remove this account before sharing a deployment.

External job-source connectors, secure resume extraction/storage, scheduled hosting, and adapter-specific ATS browser automation are not implemented yet. The queue can prepare and gate applications, but it cannot submit a real application. Keep `DRY_RUN=true`, `AUTOMATION_ENABLED=false`, and `AUTO_APPLY_ENABLED=false` until permitted sources, adapters, credentials, rate limits, and browser integration tests are added.
