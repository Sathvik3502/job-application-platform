# Vercel

Import the repository as a Vercel project with **Root Directory** set to `apps/web` and **Include files outside the root directory in the Build Step** enabled. The app's `vercel.json` runs `npm ci` and `npm run build` from the monorepo root, so workspace packages and the root Prisma schema remain available while Next.js writes its `.next` output inside the Vercel project root.

Configure `DATABASE_URL` with Neon’s pooled connection string and `DIRECT_URL` with its direct connection string. The direct hostname is the same endpoint with `-pooler` removed. Add `AUTH_SECRET` with a unique random value of at least 32 characters. Apply committed migrations with `npm run db:deploy` before testing account registration. Do not use `npm run db:migrate` in production.

Create a **private Vercel Blob** store and connect it to the project for production resume files. Vercel's OIDC environment variables are supplied when the store is connected. For local resume uploads, the app uses `.local-private-resumes/`, which is ignored by Git; to use the production private store locally, pull the linked Vercel development environment with `vercel env pull`.

Set `CRON_SECRET` to a separate random value. `apps/web/vercel.json` schedules `GET /api/cron/ingest` daily at 06:00 UTC. Cron jobs are created on production deployments; verify the schedule under **Settings → Cron Jobs**. The importer reads Arbeitnow and any configured employer-board connectors, retains source links, and records each run in PostgreSQL. Do not reuse the auth secret as the cron secret.

Keep `DRY_RUN=true`, `AUTOMATION_ENABLED=false`, and `AUTO_APPLY_ENABLED=false`. Job ingestion reads listings and stores links for review; it does not submit applications. Do not represent the cron as auto-apply. Do not run a demo seed against production.
