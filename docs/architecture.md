# Architecture

The web application is stateless and Vercel-compatible. It exposes a protected trigger and worker health endpoint. A separately deployed worker polls or claims queued work from PostgreSQL/Redis, uses isolated Playwright contexts, and writes application state transitions. Browser work never runs in Vercel.
