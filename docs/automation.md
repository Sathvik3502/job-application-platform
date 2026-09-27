# Automation

Daily job discovery imports attributed listings from Arbeitnow via Vercel Cron and stores them in PostgreSQL. Authenticated users can compare imported jobs against their candidate profile and upload a private resume for text extraction. Adding a role creates a review record and associates the user's latest resume.

External submission is unavailable: there are no ATS adapters or authorized employer credentials. Keep `AUTO_APPLY_ENABLED=false`. Any future adapter must enforce eligibility, duplicate/expiry checks, verified answers, confidence threshold, CAPTCHA/login stop conditions, explicit consent, and source terms. Never bypass anti-bot controls.
