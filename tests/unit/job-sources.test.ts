import { describe, expect, it } from "vitest";
import { normalizeArbeitnowJobs } from "../../apps/web/lib/job-sources/arbeitnow";
import {
  fetchConfiguredJobSources,
  fetchLeverJobs,
  fetchSmartRecruitersJobs,
  normalizeAshbyJobs,
  normalizeGreenhouseJobs,
  normalizeLeverJobs,
  normalizeSmartRecruitersJob,
} from "../../apps/web/lib/job-sources/connectors";

const listing = {
  slug: "senior-engineer-example-123",
  company_name: "Example Systems",
  title: "Senior Engineer",
  description: "<p>Build <strong>reliable</strong> services &amp; tools.</p>",
  remote: true,
  url: "https://www.arbeitnow.com/jobs/companies/example/senior-engineer-example-123",
  tags: ["TypeScript", "PostgreSQL"],
  job_types: ["Full time"],
  location: "Europe",
  created_at: 1_700_000_000,
};

describe("Arbeitnow job source", () => {
  it("normalizes listings and preserves the source link", () => {
    const [job] = normalizeArbeitnowJobs({ data: [listing] });
    expect(job.source).toBe("Arbeitnow");
    expect(job.applicationUrl).toBe(listing.url);
    expect(job.description).toBe("Build reliable services & tools.");
    expect(job.requirements).toEqual(["TypeScript", "PostgreSQL", "Full time"]);
    expect(job.postedAt.toISOString()).toBe("2023-11-14T22:13:20.000Z");
  });

  it("deduplicates repeated records and rejects external or malformed links", () => {
    const jobs = normalizeArbeitnowJobs({ data: [listing, listing, { ...listing, url: "https://unrelated.example/apply" }, { ...listing, title: "" }] });
    expect(jobs).toHaveLength(1);
  });

  it("returns an empty list for invalid payloads", () => {
    expect(normalizeArbeitnowJobs({ data: "invalid" })).toEqual([]);
  });
});

describe("ATS job-board connectors", () => {
  it("normalizes Greenhouse listings and keeps their board links", () => {
    const [job] = normalizeGreenhouseJobs({ jobs: [{ id: 42, company_name: "Example", title: "Engineer", location: { name: "Remote" }, departments: [{ name: "Engineering" }], content: "<p>Build systems</p>", absolute_url: "https://boards.greenhouse.io/example/jobs/42", updated_at: "2026-01-02T00:00:00Z" }] }, "example");
    expect(job.source).toBe("Greenhouse:example");
    expect(job.sourceJobId).toBe("42");
    expect(job.applicationUrl).toBe("https://boards.greenhouse.io/example/jobs/42");
    expect(job.requirements).toContain("Engineering");
  });

  it("normalizes Lever records and paginates without making an extra request", async () => {
    const record = (id: number) => ({ id: String(id), text: `Role ${id}`, company: "Example", hostedUrl: `https://jobs.lever.co/example/${id}`, createdAt: 1_700_000_000, categories: { location: "Remote", workplaceType: "remote", team: "Engineering" }, descriptionPlain: "Build services" });
    const requests: string[] = [];
    const fetcher: typeof fetch = async input => {
      const url = String(input);
      requests.push(url);
      const skip = Number(new URL(url).searchParams.get("skip"));
      return new Response(JSON.stringify(skip === 0 ? Array.from({ length: 100 }, (_, index) => record(index)) : [record(100)]), { status: 200 });
    };
    const jobs = await fetchLeverJobs("example", fetcher);
    expect(jobs).toHaveLength(101);
    expect(requests).toHaveLength(2);
    expect(requests[1]).toContain("skip=100");
    expect(normalizeLeverJobs([record(1)], "example")[0].remote).toBe(true);
  });

  it("filters unlisted Ashby roles and rejects malformed provider payloads", () => {
    const job = { title: "Engineer", jobUrl: "https://jobs.ashbyhq.com/example/role", isListed: true, isRemote: true, descriptionPlain: "Build" };
    expect(normalizeAshbyJobs({ jobs: [job, { ...job, isListed: false }] }, "example")).toHaveLength(1);
    expect(() => normalizeGreenhouseJobs({ jobs: "invalid" }, "example")).toThrow("invalid jobs payload");
    expect(normalizeLeverJobs([{ ...job, jobUrl: "http://jobs.ashbyhq.com/example" }], "example")).toEqual([]);
  });

  it("normalizes SmartRecruiters details and fetches the published posting URL", async () => {
    const detail = { id: "123", name: "Engineer", company: { name: "Example" }, location: { city: "Toronto", country: "CA", remote: true }, releasedDate: "2026-01-02T00:00:00Z", postingUrl: "https://jobs.smartrecruiters.com/example/123", jobAd: { sections: { jobDescription: { text: "Build systems" } } } };
    const job = normalizeSmartRecruitersJob(detail, "example");
    expect(job?.description).toBe("Build systems");
    expect(job?.remote).toBe(true);
    const fetcher: typeof fetch = async input => new Response(JSON.stringify(String(input).includes("/postings?") ? { content: [{ id: "123" }] } : detail), { status: 200 });
    expect((await fetchSmartRecruitersJobs("example", fetcher))[0].applicationUrl).toBe(detail.postingUrl);
  });

  it("keeps successful feeds when another source fails", async () => {
    const [job] = normalizeAshbyJobs({ jobs: [{ title: "Engineer", jobUrl: "https://jobs.ashbyhq.com/example/role" }] }, "example");
    const result = await fetchConfiguredJobSources(async () => [], [
      { source: "Ashby:example", fetch: async () => [job] },
      { source: "Lever:unavailable", fetch: async () => { throw new Error("HTTP 503"); } },
    ]);
    expect(result.jobs).toHaveLength(1);
    expect(result.failed).toBe(1);
    expect(result.results.find(source => source.source === "Lever:unavailable")?.error).toBe("HTTP 503");
  });
});
