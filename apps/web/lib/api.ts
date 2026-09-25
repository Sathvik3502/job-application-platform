import { NextResponse } from "next/server";
import { getSession } from "./auth";
export async function requireUser() { const session = await getSession(); return session ? { session } : { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) }; }
