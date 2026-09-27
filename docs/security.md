# Security

Resume originals use private Vercel Blob storage in production and user-scoped generated paths; development files are written outside public assets under the ignored `.local-private-resumes/` directory. Uploads are capped at 4 MB and checked by extension, MIME type, and file signature before PDF/DOCX/TXT text extraction. Resume downloads verify the owning user and set `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`.

Passwords are hashed with bcrypt. Sessions use signed HTTP-only cookies and production requires a strong `AUTH_SECRET`. User data APIs scope reads and writes to the authenticated user. The scheduled importer uses a separate `CRON_SECRET`; never expose it to the browser or commit it. ATS submission is not implemented, and CAPTCHA/authentication controls must never be bypassed.
