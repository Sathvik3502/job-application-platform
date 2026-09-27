import { fingerprint } from "@job-platform/shared";
import { cleanText, stringList, type ImportedJob } from "./arbeitnow";

type RecordValue = Record<string, unknown>;

type JobFields = {
  source: string;
  sourceJobId?: unknown;
  company?: unknown;
  title?: unknown;
  location?: unknown;
  remote?: unknown;
  description?: unknown;
  requirements?: unknown;
  applicationUrl?: unknown;
  postedAt?: unknown;
};

type ConfiguredSource = { source: string; fetch: () => Promise<ImportedJob[]> };
type SourceResult = { source: string; received: number; error?: string };

const REQUEST_TIMEOUT_MS = 8000;
const MAX_BOARD_CONFIGS_PER_PROVIDER = 3;
const MAX_LEVER_PAGES = 3;
const SMARTRECRUITERS_LIMIT = 10;
const MAX_SMARTRECRUITERS_PAGES = 2;

function asRecord(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function cleanId(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : cleanText(value, 200);
}

function names(value: unknown) {
  return Array.isArray(value)
    ? value.map(item => cleanText(asRecord(item)?.name, 100)).filter(Boolean)
    : [];
}

function validHttpsUrl(value: unknown) {
  const text = cleanText(value, 2000);
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function makeJob(fields: JobFields): ImportedJob | null {
  const company = cleanText(fields.company, 180);
  const title = cleanText(fields.title, 240);
  const applicationUrl = validHttpsUrl(fields.applicationUrl);
  if (!company || !title || !applicationUrl) return null;
  const remote = fields.remote === true;
  const location = cleanText(fields.location, 180) || (remote ? "Remote" : "Not specified");
  const job = {
    company,
    title,
    location,
    remote,
    description: cleanText(fields.description, 12000),
    requirements: Array.isArray(fields.requirements)
      ? stringList(fields.requirements)
      : stringList(typeof fields.requirements === "string" ? [fields.requirements] : []),
    source: fields.source,
    sourceJobId: cleanId(fields.sourceJobId) || null,
    applicationUrl,
    jobHash: "",
    postedAt: fields.postedAt ? new Date(String(fields.postedAt)) : new Date(0),
  };
  if (Number.isNaN(job.postedAt.getTime())) job.postedAt = new Date(0);
  job.jobHash = fingerprint(job);
  return job;
}

function normalizeRecords(records: unknown[], map: (record: RecordValue) => JobFields | null) {
  const jobs = records.flatMap(record => {
    const value = asRecord(record);
    if (!value) return [];
    const fields = map(value);
    const job = fields ? makeJob(fields) : null;
    return job ? [job] : [];
  });
  return [...new Map(jobs.map(job => [job.jobHash, job])).values()];
}

async function getJson(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url, {
    headers: { accept: "application/json", "user-agent": "ApplyPilot/1.0 (job discovery; source attribution enabled)" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

export function normalizeGreenhouseJobs(payload: unknown, board: string): ImportedJob[] {
  const jobs = asRecord(payload)?.jobs;
  if (!Array.isArray(jobs)) throw new Error("Greenhouse returned an invalid jobs payload");
  return normalizeRecords(jobs, record => ({
    source: `Greenhouse:${board}`,
    sourceJobId: record.id,
    company: record.company_name ?? board,
    title: record.title,
    location: asRecord(record.location)?.name,
    description: record.content,
    requirements: [...names(record.departments), ...names(record.offices)],
    applicationUrl: record.absolute_url,
    postedAt: record.updated_at ?? record.first_published,
  }));
}

export async function fetchGreenhouseJobs(board: string, fetcher: typeof fetch = fetch) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`;
  return normalizeGreenhouseJobs(await getJson(url, fetcher), board);
}

export function normalizeLeverJobs(payload: unknown, site: string): ImportedJob[] {
  if (!Array.isArray(payload)) throw new Error("Lever returned an invalid jobs payload");
  return normalizeRecords(payload, record => {
    const categories = asRecord(record.categories);
    return {
      source: `Lever:${site}`,
      sourceJobId: record.id,
      company: record.company ?? site,
      title: record.text,
      location: asRecord(categories?.location)?.name ?? categories?.location,
      remote: categories?.workplaceType === "remote",
      description: record.descriptionPlain ?? record.description,
      requirements: [categories?.commitment, categories?.team, categories?.department],
      applicationUrl: record.hostedUrl ?? record.applyUrl,
      postedAt: record.createdAt,
    };
  });
}

export async function fetchLeverJobs(site: string, fetcher: typeof fetch = fetch) {
  const jobs: ImportedJob[] = [];
  for (let page = 0; page < MAX_LEVER_PAGES; page += 1) {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json&skip=${page * 100}&limit=100`;
    const payload = await getJson(url, fetcher);
    if (!Array.isArray(payload)) throw new Error("Lever returned an invalid jobs payload");
    jobs.push(...normalizeLeverJobs(payload, site));
    if (payload.length < 100) break;
  }
  return [...new Map(jobs.map(job => [job.jobHash, job])).values()];
}

export function normalizeAshbyJobs(payload: unknown, board: string): ImportedJob[] {
  const jobs = asRecord(payload)?.jobs;
  if (!Array.isArray(jobs)) throw new Error("Ashby returned an invalid jobs payload");
  return normalizeRecords(jobs.filter(job => asRecord(job)?.isListed !== false), record => ({
    source: `Ashby:${board}`,
    sourceJobId: record.id ?? record.jobId,
    company: record.companyName ?? board,
    title: record.title,
    location: record.location,
    remote: record.isRemote,
    description: record.descriptionPlain ?? record.descriptionHtml,
    requirements: [record.department, record.team, record.employmentType, record.workplaceType],
    applicationUrl: record.jobUrl,
    postedAt: record.publishedAt,
  }));
}

export async function fetchAshbyJobs(board: string, fetcher: typeof fetch = fetch) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}`;
  return normalizeAshbyJobs(await getJson(url, fetcher), board);
}

export function normalizeSmartRecruitersJob(payload: unknown, companyIdentifier: string): ImportedJob | null {
  const record = asRecord(payload);
  if (!record) return null;
  const location = asRecord(record.location);
  const sections = asRecord(asRecord(record.jobAd)?.sections);
  const description = ["companyDescription", "jobDescription", "qualifications", "additionalInformation"]
    .map(key => asString(asRecord(sections?.[key])?.text))
    .filter(Boolean)
    .join("\n\n");
  return makeJob({
    source: `SmartRecruiters:${companyIdentifier}`,
    sourceJobId: record.id,
    company: asRecord(record.company)?.name ?? companyIdentifier,
    title: record.name,
    location: [location?.city, location?.region, location?.country].filter(Boolean).join(", "),
    remote: location?.remote,
    description,
    requirements: [asRecord(record.department)?.label, asRecord(record.function)?.label, asRecord(record.typeOfEmployment)?.label, asRecord(record.experienceLevel)?.label],
    applicationUrl: record.postingUrl ?? record.applyUrl,
    postedAt: record.releasedDate,
  });
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }));
  return results;
}

export async function fetchSmartRecruitersJobs(company: string, fetcher: typeof fetch = fetch) {
  const postings: unknown[] = [];
  for (let page = 0; page < MAX_SMARTRECRUITERS_PAGES; page += 1) {
    const query = new URLSearchParams({ limit: String(SMARTRECRUITERS_LIMIT), offset: String(page * SMARTRECRUITERS_LIMIT) });
    const payload = asRecord(await getJson(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings?${query}`, fetcher));
    if (!Array.isArray(payload?.content)) throw new Error("SmartRecruiters returned an invalid postings payload");
    postings.push(...payload.content);
    if (payload.content.length < SMARTRECRUITERS_LIMIT || postings.length >= SMARTRECRUITERS_LIMIT * MAX_SMARTRECRUITERS_PAGES) break;
  }
  const details = await mapWithConcurrency(postings.slice(0, SMARTRECRUITERS_LIMIT * MAX_SMARTRECRUITERS_PAGES), 5, async posting => {
    const item = asRecord(posting);
    if (!item || typeof item.id !== "string") return null;
    const detailUrl = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings/${encodeURIComponent(item.id)}`;
    return normalizeSmartRecruitersJob(await getJson(detailUrl, fetcher), company);
  });
  const jobs = details.filter((job): job is ImportedJob => job !== null);
  return [...new Map(jobs.map(job => [job.jobHash, job])).values()];
}

function parseList(name: string) {
  return (process.env[name] ?? "").split(",").map(value => value.trim()).filter(Boolean).slice(0, MAX_BOARD_CONFIGS_PER_PROVIDER);
}

function customFeeds(): ConfiguredSource[] {
  const raw = process.env.CUSTOM_JOB_FEEDS;
  if (!raw) return [];
  let configured: unknown;
  try {
    configured = JSON.parse(raw);
  } catch {
    throw new Error("CUSTOM_JOB_FEEDS must be a JSON array");
  }
  if (!Array.isArray(configured)) throw new Error("CUSTOM_JOB_FEEDS must be a JSON array");
  return configured.slice(0, MAX_BOARD_CONFIGS_PER_PROVIDER).flatMap(value => {
    const feed = asRecord(value);
    const source = cleanText(feed?.source, 100);
    const url = validHttpsUrl(feed?.url);
    if (!source || !url) return [];
    return [{
      source,
      fetch: async () => {
        const payload = await getJson(url, fetch);
        const records = Array.isArray(payload) ? payload : asRecord(payload)?.jobs;
        if (!Array.isArray(records)) throw new Error("Custom feed returned an invalid jobs payload");
        return normalizeRecords(records, record => ({
          source,
          sourceJobId: record.sourceJobId ?? record.id,
          company: record.company,
          title: record.title,
          location: record.location,
          remote: record.remote,
          description: record.description,
          requirements: record.requirements,
          applicationUrl: record.applicationUrl ?? record.url,
          postedAt: record.postedAt,
        }));
      },
    }];
  });
}

function configuredSources(): ConfiguredSource[] {
  let feeds: ConfiguredSource[];
  try {
    feeds = customFeeds();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid custom feed configuration";
    feeds = [{ source: "CUSTOM_JOB_FEEDS", fetch: async () => { throw new Error(message); } }];
  }
  return [
    ...parseList("GREENHOUSE_BOARDS").map(board => ({ source: `Greenhouse:${board}`, fetch: () => fetchGreenhouseJobs(board) })),
    ...parseList("LEVER_SITES").map(site => ({ source: `Lever:${site}`, fetch: () => fetchLeverJobs(site) })),
    ...parseList("ASHBY_BOARDS").map(board => ({ source: `Ashby:${board}`, fetch: () => fetchAshbyJobs(board) })),
    ...parseList("SMARTRECRUITERS_COMPANIES").map(company => ({ source: `SmartRecruiters:${company}`, fetch: () => fetchSmartRecruitersJobs(company) })),
    ...feeds,
  ];
}

export async function fetchConfiguredJobSources(
  arbeitnowFetcher: () => Promise<ImportedJob[]>,
  sources: ConfiguredSource[] = configuredSources(),
) {
  const configured: ConfiguredSource[] = [{ source: "Arbeitnow", fetch: arbeitnowFetcher }, ...sources];
  const outcomes = await mapWithConcurrency(configured, 5, async source => {
    try {
      const jobs = await source.fetch();
      return { source: source.source, jobs, result: { source: source.source, received: jobs.length } satisfies SourceResult };
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 200) : "Unknown error";
      return { source: source.source, jobs: [], result: { source: source.source, received: 0, error: message } satisfies SourceResult };
    }
  });
  const results = outcomes.map(outcome => outcome.result);
  const jobs = [...new Map(outcomes.flatMap(outcome => outcome.jobs).map(job => [job.jobHash, job])).values()].slice(0, 500);
  return { jobs, results, failed: results.filter(result => result.error).length };
}