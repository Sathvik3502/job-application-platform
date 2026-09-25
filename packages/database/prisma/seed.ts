import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.upsert({ where: { email: "avery@example.test" }, update: {}, create: { email: "avery@example.test", passwordHash: await hash("DemoOnlyPassword123!", 12) } });
  await prisma.candidateProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, fullName: "Avery Patel", location: "India", skills: ["TypeScript", "React", "PostgreSQL", "Playwright"], titles: ["TypeScript Engineer"], yearsExperience: 6, workAuthorized: true } });
  await prisma.preference.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, targetRoles: ["TypeScript Engineer"], locations: ["India"], employmentTypes: ["FULL_TIME"] } });
  console.log("Seeded fake demo account: avery@example.test / DemoOnlyPassword123!");
}
main().finally(() => prisma.$disconnect());
