import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({ targetRoles: z.array(z.string().trim().min(1).max(100)).max(30), locations: z.array(z.string().trim().min(1).max(120)).max(30), employmentTypes: z.array(z.string().trim().min(1).max(40)).max(10), remotePreference: z.enum(["REMOTE_ONLY", "REMOTE_OR_HYBRID", "ANY"]), minSalary: z.number().int().min(0).nullable(), maxSalary: z.number().int().min(0).nullable(), mode: z.enum(["REVIEW", "HYBRID", "AUTO"]), minimumScore: z.number().int().min(0).max(100), autoApplyThreshold: z.number().int().min(0).max(100), maxApplicationsPerRun: z.number().int().min(1).max(100), maxApplicationsPerDay: z.number().int().min(1).max(500), automationEnabled: z.boolean(), autoApplyEnabled: z.boolean() });

export async function PUT(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = schema.safeParse(await request.json());
  if (!body.success || (body.data.autoApplyEnabled && !body.data.automationEnabled)) return NextResponse.json({ error: "Preferences are invalid or auto-apply is enabled without automation." }, { status: 400 });
  const preferences = await prisma.userPreferences.upsert({ where: { userId: auth.user.id }, update: body.data, create: { ...body.data, userId: auth.user.id } });
  return NextResponse.json(preferences);
}