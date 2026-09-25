import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
const schema = z.object({ fullName: z.string().trim().min(2).max(100), location: z.string().max(120), country: z.string().max(80).optional(), phone: z.string().max(40).optional(), linkedin: z.string().url().optional().or(z.literal("")), portfolio: z.string().url().optional().or(z.literal("")), skills: z.array(z.string().trim().min(1).max(60)).max(60), titles: z.array(z.string().trim().min(1).max(100)).max(20), yearsExperience: z.number().int().min(0).max(60), workAuthorized: z.boolean().nullable().optional(), sponsorshipRequired: z.boolean().nullable().optional() });
export async function PUT(request: NextRequest) { const auth = await requireUser(); if ("error" in auth) return auth.error; const body = schema.safeParse(await request.json()); if (!body.success) return NextResponse.json({ error: "Profile values are invalid." }, { status: 400 }); const profile = await prisma.candidateProfile.update({ where: { userId: auth.session.userId }, data: body.data }); return NextResponse.json(profile); }
