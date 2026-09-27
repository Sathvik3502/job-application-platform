# ApplyPilot

ApplyPilot is a private job-search workspace with accounts, candidate profiles, preferences, saved answers, job matching, private resume upload/analysis, and an application review list. It imports attributed listings from Arbeitnow on a daily Vercel Cron schedule. It does not submit external applications.

## Architecture

`apps/web` is the Vercel-ready Next.js dashboard and short-lived API layer. `apps/worker` is a separate local worker process. `packages/matching` contains pure, deterministic matching and eligibility logic; `packages/automation` owns field classification and final safety gates; `packages/database` owns the PostgreSQL Prisma schema.

## Local development

Prerequisites: Node.js 20+ and PostgreSQL. Set `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, and `CRON_SECRET` in the repository-root `.env`, then run:

```sh
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000/register` to create an account. To run checks:

```sh
npm run test
npm run typecheck
npm run lint
npm run build
```

## AI and storage

Resume parsing and private storage are implemented. Vercel deployments require a connected private Blob store; local development stores files under an ignored directory. AI enrichment and ATS submission adapters are not configured. PostgreSQL is required for accounts and application records. Redis is not currently used by the web workflow.

## Deployment

Push this folder to GitHub, import it in Vercel, set the repository root as the project root, and configure `DATABASE_URL` and a strong `AUTH_SECRET`. The separate worker is not a continuously running production service yet; the automation trigger only queues eligible review records and does not submit external applications.

## Current beta boundary

The web application uses PostgreSQL for account data, imported jobs, resumes' extracted text, and application review state. Original resume files stay in private Vercel Blob storage in production; local development uses the ignored `.local-private-resumes/` folder. No demo account or seeded test job is included.

The current public source is Arbeitnow and is fetched once daily; it is not a comprehensive global job-market feed. Remotive's public API is intentionally not used because its terms prohibit republishing listings on account/signup-gated sites. Job discovery and resume extraction are implemented, but no employer ATS submission adapter or continuously running application worker exists. Keep `AUTO_APPLY_ENABLED=false`; do not claim the site applies while users are away.
