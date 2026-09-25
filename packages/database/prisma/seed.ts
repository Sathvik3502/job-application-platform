import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	const user = await prisma.user.upsert({ where: { email: "avery@example.test" }, update: {}, create: { email: "avery@example.test", passwordHash: await hash("DemoPassword123!", 12) } });
	await prisma.candidateProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, fullName: "Avery Patel", location: "India", skills: ["TypeScript", "React", "PostgreSQL", "Playwright"], titles: ["TypeScript Engineer"], yearsExperience: 6, workAuthorized: true } });
	await prisma.userPreferences.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, targetRoles: ["TypeScript Engineer"], locations: ["India", "Remote"], employmentTypes: ["FULL_TIME"], minSalary: 1800000 } });
	await prisma.job.upsert({ where: { jobHash: "demo-northstar-v1" }, update: {}, create: { source: "Mock ATS", sourceJobId: "job_01", company: "Northstar Labs", title: "Senior TypeScript Engineer", location: "Remote - India", remote: true, description: "Build secure workflow software with TypeScript, React, PostgreSQL and Playwright.", requirements: ["TypeScript", "React", "5+ years experience", "PostgreSQL"], jobHash: "demo-northstar-v1", applicationUrl: "/test-ats", postedAt: new Date() } });
	console.log("Seeded demo account avery@example.test with password DemoPassword123! and one job.");
}

main().finally(() => prisma.$disconnect());
