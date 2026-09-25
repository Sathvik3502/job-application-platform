# ApplyPilot

ApplyPilot is a local-first, safety-gated job discovery and application platform. This repository ships the first end-to-end target: a candidate profile is matched to mock jobs, eligibility is evaluated, application preparation is modeled, and a worker stops at `READY_TO_SUBMIT` by default. It never bypasses CAPTCHAs, authentication, anti-bot controls, or ambiguous factual questions.

## Architecture

`apps/web` is the Vercel-ready Next.js dashboard and short-lived API layer. `apps/worker` is a separate local worker process. `packages/matching` contains pure, deterministic matching and eligibility logic; `packages/automation` owns field classification and final safety gates; `packages/database` owns the PostgreSQL Prisma schema.

## Local development

Prerequisites: Node.js 20+, Docker Desktop, and optionally Ollama. Copy `.env.example` to `.env`, then run:

```sh
docker compose up -d
npm install
npm run db:migrate
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

## Production readiness and boundaries

The application now has PostgreSQL-backed authentication, profile, preferences, answer-library, job-list, and application-list API routes. Run the migration and supply `DATABASE_URL` and `AUTH_SECRET` before using account features. The browser worker remains intentionally separate from Vercel.

Do not enable automatic submission until a permitted, site-specific adapter has been reviewed. This repository does not bypass CAPTCHA, login prompts, robots restrictions, anti-bot systems, or ambiguous factual questions. Those conditions route work to manual review.
