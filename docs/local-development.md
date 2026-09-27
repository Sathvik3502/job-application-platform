# Local development

Configure `DATABASE_URL` for PostgreSQL and `AUTH_SECRET` for local sessions, then run `npm run db:migrate` and `npm run dev`. Automatic submission is unavailable until permitted job sources and tested ATS adapters are configured. Install Playwright browsers only when implementing and testing an authorized adapter.
Configure `DATABASE_URL` and `DIRECT_URL` for PostgreSQL, `AUTH_SECRET` for local sessions, and `CRON_SECRET` for manual ingestion calls. Run `npm run db:migrate` and `npm run dev`. Resume uploads use ignored local private storage during development. Do not enable automatic submission: ATS adapters have not been configured. Install Playwright browsers only when implementing and testing a permitted adapter.
