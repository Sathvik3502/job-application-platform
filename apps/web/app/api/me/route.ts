import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const user = await prisma.user.findUnique({ where: { id: auth.user.id }, include: { profile: true, preferences: true, resumes: { orderBy: { createdAt: "desc" } } } });
  return NextResponse.json({ user: { id: auth.user.id, email: auth.user.email }, profile: user?.profile, preferences: user?.preferences, resumes: user?.resumes });
}