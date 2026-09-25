import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
export async function GET() { const auth = await requireUser(); if ("error" in auth) return auth.error; const user = await prisma.user.findUnique({ where: { id: auth.session.userId }, select: { id: true, email: true, profile: true, preferences: true } }); return NextResponse.json(user); }
