import { fingerprint, type Job } from "@job-platform/shared";

type ArbeitnowRecord = {
  slug?: unknown;
  company_name?: unknown;
  title?: unknown;
  description?: unknown;
  remote?: unknown;
  url?: unknown;
  tags?: unknown;
  job_types?: unknown;
  location?: unknown;
  created_at?: unknown;
};

export type ImportedJob = Omit<Job, "id" | "postedAt"> & { postedAt: Date; sourceJobId?: string | null };

export function cleanText(value: unknown, maximumLength: number) {
  return typeof value === "string"
    ? value.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim().slice(0, maximumLength)
    : "";
}

export function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map(item => cleanText(item, 100)).filter(Boolean) : [];
}

export function normalizeArbeitnowJobs(payload: unknown): ImportedJob[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) return [];
  const records = (payload as { data: ArbeitnowRecord[] }).data;
  const normalized = records.flatMap(record => {
    const slug = cleanText(record.slug, 200);
    const company = cleanText(record.company_name, 180);
    const title = cleanText(record.title, 240);
    const applicationUrl = cleanText(record.url, 1000);
    if (!slug || !company || !title || !applicationUrl) return [];
    try {
      const url = new URL(applicationUrl);
      if (url.protocol !== "https:" || !["arbeitnow.com", "www.arbeitnow.com"].includes(url.hostname) || !/^\/(view|jobs)\//.test(url.pathname)) return [];
    } catch {
      return [];
    }
    const location = cleanText(record.location, 180) || (record.remote === true ? "Remote" : "Not specified");
    const job = {
      company,
      title,
      location,
      remote: record.remote === true,
      description: cleanText(record.description, 12000),
      requirements: [...new Set([...stringList(record.tags), ...stringList(record.job_types)])],
      source: "Arbeitnow",
      applicationUrl,
      jobHash: "",
      postedAt: new Date(typeof record.created_at === "number" ? record.created_at * 1000 : NaN),
    };
    if (Number.isNaN(job.postedAt.getTime())) job.postedAt = new Date(0);
    job.jobHash = fingerprint(job);
    return [{ ...job, sourceJobId: slug }];
  });
  return [...new Map(normalized.map(job => [job.jobHash, job])).values()];
}

export async function fetchArbeitnowJobs(fetcher: typeof fetch = fetch): Promise<ImportedJob[]> {
  const response = await fetcher("https://www.arbeitnow.com/api/job-board-api?page=1", {
    headers: { accept: "application/json", "user-agent": "ApplyPilot/1.0 (job discovery; source attribution enabled)" },
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Arbeitnow returned HTTP ${response.status}`);
  return normalizeArbeitnowJobs(await response.json());
}