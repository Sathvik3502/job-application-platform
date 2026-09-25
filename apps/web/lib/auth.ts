import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const cookieName = "applypilot_session";

function secret() {
  const value = process.env.AUTH_SECRET || "development-only-change-me";
  return new TextEncoder().encode(value);
}

export type Session = { userId: string; email: string };

export async function createSession(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export function sessionCookie(value: string) {
  return { name: cookieName, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 604800 };
}

export { cookieName };