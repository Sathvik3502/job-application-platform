# Vercel

Deploy only `apps/web`. Configure a PostgreSQL connection and `CRON_SECRET`. Vercel Cron can invoke the protected trigger, which must enqueue quickly. Do not run Ollama, Redis workers, browser loops or Playwright in a Vercel function.
