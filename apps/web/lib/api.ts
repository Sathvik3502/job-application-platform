import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { prisma } from "./prisma";

export async function requireUser() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
    return { session, user };
  } catch {
    return { error: NextResponse.json({ error: "Database unavailable. Configure DATABASE_URL and apply migrations before using account data." }, { status: 503 }) };
  }
}