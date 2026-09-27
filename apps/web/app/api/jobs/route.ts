import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const jobs = await prisma.job.findMany({ where: { applicationUrl: { startsWith: "http", mode: "insensitive" } }, orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }], take: 100 });
  return NextResponse.json(jobs);
}