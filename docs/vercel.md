# Vercel

Import the repository with the project root set to the monorepo root (`.`), not `apps/web`. Use `npm ci` for installation and `npm run build` for the build. The root `postinstall` generates Prisma Client from `packages/database/prisma/schema.prisma`.

Configure `DATABASE_URL` with Neon’s pooled connection string and `DIRECT_URL` with its direct connection string. The direct hostname is the same endpoint with `-pooler` removed. Add `AUTH_SECRET` with a unique random value of at least 32 characters. Apply committed migrations with `npm run db:deploy` before testing account registration. Do not use `npm run db:migrate` in production.

Create a **private Vercel Blob** store and connect it to the project for production resume files. Vercel's OIDC environment variables are supplied when the store is connected. For local resume uploads, the app uses `.local-private-resumes/`, which is ignored by Git; to use the production private store locally, pull the linked Vercel development environment with `vercel env pull`.

Set `CRON_SECRET` to a separate random value. `vercel.json` schedules `GET /api/cron/ingest` daily at 06:00 UTC. The importer calls Arbeitnow's public job API once per run, retains the required source link, and records each run in PostgreSQL. Do not reuse the auth secret as the cron secret.

Keep `DRY_RUN=true`, `AUTOMATION_ENABLED=false`, and `AUTO_APPLY_ENABLED=false`. The daily Arbeitnow importer reads public listings and stores links for review; it does not submit applications. No continuously running worker or ATS adapters are available. Do not represent the cron as auto-apply. Do not run a demo seed against production.
