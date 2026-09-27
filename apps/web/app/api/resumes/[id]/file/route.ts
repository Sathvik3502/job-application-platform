import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { readResume } from "@/lib/resume-files";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const resume = await prisma.resume.findFirst({ where: { id, userId: auth.user.id }, select: { filename: true, storageKey: true } });
  if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  try {
    const content = await readResume(resume.storageKey);
    const extension = resume.filename.toLowerCase().split(".").pop();
    const contentType = extension === "pdf" ? "application/pdf" : extension === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/plain; charset=utf-8";
    const filename = resume.filename.replace(/[\r\n"\\]/g, "_");
    return new NextResponse(new Uint8Array(content), { headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${filename}"`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Resume file is unavailable." }, { status: 503 });
  }
}
