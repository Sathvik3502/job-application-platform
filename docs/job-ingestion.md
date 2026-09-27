# Job ingestion

The scheduled importer reads Arbeitnow and any configured employer job boards. Supported public board APIs are Greenhouse, Lever, Ashby, and SmartRecruiters. Set comma-separated employer identifiers in `GREENHOUSE_BOARDS`, `LEVER_SITES`, `ASHBY_BOARDS`, and `SMARTRECRUITERS_COMPANIES`. Identifiers come from that employer's careers URL; these providers do not offer a single global feed of all employers. Up to three boards per provider are fetched per run.

`CUSTOM_JOB_FEEDS` can contain up to three permitted HTTPS JSON feeds, as a JSON array. Each feed should return either an array of jobs or `{ "jobs": [...] }`; records use `company`, `title`, `applicationUrl` (or `url`), and optionally `sourceJobId`/`id`, `location`, `remote`, `description`, `requirements`, and `postedAt`. Example:

```json
CUSTOM_JOB_FEEDS=[{"source":"Example Careers","url":"https://careers.example.com/jobs.json"}]
```

Custom feeds must be ones you are authorized to consume and republish. The importer does not crawl arbitrary career pages. It does not currently implement Workday's tenant-specific, undocumented CXS endpoints; configure an employer-approved JSON feed instead. Do not add a source until its current terms permit this product's use. Remotive is intentionally excluded because its published terms prohibit republishing listings on signup-gated sites. Naukri, LinkedIn, and Indeed require approved partner/API access; this project does not scrape them.

Listings are normalized, deduplicated by company/title/location/application URL, and stored in PostgreSQL with source attribution. Lever is capped at 300 listings per configured site, SmartRecruiters at 20 per company, and the run at 500 unique jobs. Sources run with bounded concurrency and timeouts; a provider failure is recorded per source and does not discard successful providers' jobs.

Vercel Cron calls `GET /api/cron/ingest` daily at 06:00 UTC. Configure `CRON_SECRET` in Vercel; Vercel sends it as a bearer token for scheduled requests. Local manual calls require the same authorization header. The importer discovers and displays listings only. It does not submit applications or bypass employer-site authentication or anti-bot controls.
