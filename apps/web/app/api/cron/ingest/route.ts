import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchArbeitnowJobs } from "@/lib/job-sources/arbeitnow";
import { fetchConfiguredJobSources } from "@/lib/job-sources/connectors";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const secret = process.env.CRON_SECRET;
  if (!secret || token.length !== secret.length || token !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let run;
  try {
    run = await prisma.automationRun.create({ data: { status: "INGESTING" } });
    const ingestion = await fetchConfiguredJobSources(fetchArbeitnowJobs);
    if (ingestion.failed === ingestion.results.length) {
      const result = { received: 0, upserted: 0, sources: ingestion.results };
      await prisma.automationRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), result } });
      return NextResponse.json({ runId: run.id, ...result, error: "All configured job sources failed" }, { status: 502 });
    }
    const upserted = await prisma.$transaction(ingestion.jobs.map(job => prisma.job.upsert({
      where: { jobHash: job.jobHash },
      create: job,
      update: { source: job.source, sourceJobId: job.sourceJobId, title: job.title, location: job.location, remote: job.remote, description: job.description, requirements: job.requirements, applicationUrl: job.applicationUrl, postedAt: job.postedAt },
    })));
    const status = ingestion.failed ? "COMPLETED_WITH_ERRORS" : "COMPLETED";
    const result = { received: ingestion.jobs.length, upserted: upserted.length, sources: ingestion.results };
    await prisma.automationRun.update({ where: { id: run.id }, data: { status, finishedAt: new Date(), result } });
    return NextResponse.json({ runId: run.id, ...result, status }, { status: ingestion.failed ? 207 : 200 });
  } catch (error) {
    if (run) await prisma.automationRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), result: { source: "Arbeitnow", error: error instanceof Error ? error.message.slice(0, 300) : "Unknown error" } } }).catch(() => undefined);
    console.error("Scheduled job ingestion failed", error);
    return NextResponse.json({ error: "Job ingestion failed. Check the scheduled run status and source availability." }, { status: 502 });
  }
}
