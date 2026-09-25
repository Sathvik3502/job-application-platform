import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, sessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email().max(254), password: z.string().min(12).max(128), fullName: z.string().trim().min(2).max(100) });

export async function POST(request: NextRequest) {
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Use a valid email, name, and a password of at least 12 characters." }, { status: 400 });
  const email = body.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "An account already exists for that email." }, { status: 409 });
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hash(body.data.password, 12),
      profile: { create: { fullName: body.data.fullName, location: "", skills: [], titles: [], yearsExperience: 0 } },
      preferences: { create: { targetRoles: [], locations: [], employmentTypes: ["FULL_TIME"] } },
    },
  });
  const response = NextResponse.json({ ok: true, user: { email: user.email } }, { status: 201 });
  response.cookies.set(sessionCookie(await createSession({ userId: user.id, email: user.email })));
  return response;
}