import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const cookieName = "applypilot_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-change-me");
export type Session = { userId: string; email: string };
export async function createSession(session: Session) { return new SignJWT(session).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret()); }
export async function getSession(): Promise<Session | null> { const token = (await cookies()).get(cookieName)?.value; if (!token) return null; try { return (await jwtVerify(token, secret())).payload as unknown as Session; } catch { return null; } }
export const sessionCookie = (value: string) => ({ name: cookieName, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 604800 });
