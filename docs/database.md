# Database

Prisma models users, profiles, jobs, applications, answer library records, and immutable application transitions. `Application` has a unique `(userId, jobId)` constraint to prevent duplicate applications.
