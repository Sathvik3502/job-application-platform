import { Database, Settings2 } from "lucide-react";

export function DatabaseNotice() {
  const missingUrl = !process.env.DATABASE_URL;
  return <section className="card empty-state database-notice"><span className="empty-icon"><Database size={21}/></span><h2>{missingUrl ? "Database connection is not configured" : "Database is temporarily unavailable"}</h2><p>{missingUrl ? "Add DATABASE_URL to the repository-root .env file, then restart the development server. For Vercel, configure it in Project Settings → Environment Variables." : "Check the Neon project status, connection URLs, network access, and that database migrations have been applied."}</p><div className="notice info"><Settings2 size={16}/><span>Application pages will load when the database is reachable.</span></div></section>;
}
