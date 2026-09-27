import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, sessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: NextRequest) {
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  try {
    const user = await prisma.user.findUnique({ where: { email: body.data.email.toLowerCase() } });
    if (!user || !(await compare(body.data.password, user.passwordHash))) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie(await createSession({ userId: user.id, email: user.email })));
    return response;
  } catch (error) {
    console.error("Login database error", error);
    const message = process.env.DATABASE_URL ? "The database could not be reached. Check the Neon connection, network access, and migration status." : "DATABASE_URL is not configured. Add it to the repository-root .env file and restart the development server.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}