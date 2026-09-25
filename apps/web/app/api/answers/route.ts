import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
const schema = z.object({ question: z.string().trim().min(3).max(500), answer: z.string().trim().min(1).max(4000), category: z.string().trim().min(2).max(50), verified: z.boolean() });
export async function GET() { const auth = await requireUser(); if ("error" in auth) return auth.error; return NextResponse.json(await prisma.answer.findMany({ where: { userId: auth.session.userId }, orderBy: { updatedAt: "desc" } })); }
export async function POST(request: NextRequest) { const auth = await requireUser(); if ("error" in auth) return auth.error; const body = schema.safeParse(await request.json()); if (!body.success) return NextResponse.json({ error: "Answer values are invalid." }, { status: 400 }); return NextResponse.json(await prisma.answer.create({ data: { ...body.data, userId: auth.session.userId } }), { status: 201 }); }
