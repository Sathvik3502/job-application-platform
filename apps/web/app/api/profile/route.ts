import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({ fullName: z.string().trim().min(2).max(100), location: z.string().trim().max(120), phone: z.string().trim().max(40).optional(), skills: z.array(z.string().trim().min(1).max(80)).max(100), titles: z.array(z.string().trim().min(1).max(100)).max(30), yearsExperience: z.number().int().min(0).max(60), workAuthorized: z.boolean().nullable().optional() });

export async function PUT(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Profile data is invalid." }, { status: 400 });
  const profile = await prisma.candidateProfile.upsert({ where: { userId: auth.user.id }, update: body.data, create: { ...body.data, userId: auth.user.id } });
  return NextResponse.json(profile);
}