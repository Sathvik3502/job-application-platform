import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({ skills: z.array(z.string().trim().min(1).max(80)).max(100) });

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Choose valid skills to add." }, { status: 400 });
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: auth.user.id } });
  if (!profile) return NextResponse.json({ error: "Create your candidate profile before adding skills." }, { status: 409 });
  const existingSkills = Array.isArray(profile.skills) ? profile.skills.filter((skill): skill is string => typeof skill === "string") : [];
  const combined = [...existingSkills];
  for (const skill of body.data.skills) if (!combined.some(existing => existing.toLowerCase() === skill.toLowerCase())) combined.push(skill);
  const updated = await prisma.candidateProfile.update({ where: { userId: auth.user.id }, data: { skills: combined } });
  return NextResponse.json({ skills: updated.skills });
}
