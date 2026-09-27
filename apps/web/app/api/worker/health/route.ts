import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		await prisma.$queryRaw`SELECT 1`;
		const queuedApplications = await prisma.application.count({ where: { status: "QUEUED" } });
		return NextResponse.json({ database: "connected", queuedApplications, workerHeartbeat: "not monitored", jobSources: "Arbeitnow scheduled daily", applicationAdapters: "not configured" });
	} catch {
		return NextResponse.json({ database: "unavailable", workerHeartbeat: "not monitored", jobSources: "Arbeitnow scheduled daily", applicationAdapters: "not configured" }, { status: 503 });
	}
}
