import { NextRequest, NextResponse } from "next/server";
import { scoreJob, eligibility } from "@job-platform/matching";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({ jobId: z.string().min(1), resumeId: z.string().min(1).optional() });

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  return NextResponse.json(await prisma.application.findMany({ where: { userId: auth.user.id }, include: { job: true, resume: true, transitions: { orderBy: { createdAt: "desc" } } }, orderBy: { updatedAt: "desc" } }));
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Application data is invalid." }, { status: 400 });
  const [job, profile, existing] = await Promise.all([
    prisma.job.findUnique({ where: { id: body.data.jobId } }),
    prisma.candidateProfile.findUnique({ where: { userId: auth.user.id } }),
    prisma.application.findUnique({ where: { userId_jobId: { userId: auth.user.id, jobId: body.data.jobId } } }),
  ]);
  if (!job || !profile) return NextResponse.json({ error: !job ? "Job not found." : "Complete your profile before applying." }, { status: 400 });
  if (existing) return NextResponse.json({ error: "This job is already in your application list." }, { status: 409 });
  const candidate = { fullName: profile.fullName, email: auth.user.email, phone: profile.phone ?? undefined, location: profile.location, skills: profile.skills as string[], titles: profile.titles as string[], yearsExperience: profile.yearsExperience, workAuthorized: profile.workAuthorized ?? undefined };
  const normalizedJob = { ...job, requirements: job.requirements as string[], postedAt: job.postedAt?.toISOString() ?? new Date().toISOString() };
  const match = scoreJob(candidate, normalizedJob);
  const gate = eligibility(candidate, normalizedJob, match);
  const status = gate.status === "ELIGIBLE" ? "READY_FOR_REVIEW" : "SKIPPED";
  const application = await prisma.application.create({ data: { userId: auth.user.id, jobId: job.id, resumeId: body.data.resumeId, status, matchScore: match.overall, eligibility: gate.status, automationConfidence: match.confidence, result: { matchedSkills: match.matchedSkills, missingSkills: match.missingSkills, evidence: match.evidence }, transitions: { create: { toStatus: status, reason: gate.reason ?? "Created from candidate review" } } }, include: { job: true, transitions: true } });
  return NextResponse.json(application, { status: 201 });
}