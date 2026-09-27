import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { extractResumeText, maxResumeBytes, storeResume, validateResumeFile, deleteResumeFile, suggestResumeSkills } from "@/lib/resume-files";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const resumes = await prisma.resume.findMany({ where: { userId: auth.user.id }, select: { id: true, filename: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(resumes);
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxResumeBytes + 64_000) return NextResponse.json({ error: "Resume upload must be under 4 MB." }, { status: 413 });
  let storageKey: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("resume");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a resume file to upload." }, { status: 400 });
    if (file.size > maxResumeBytes) return NextResponse.json({ error: "Resume upload must be under 4 MB." }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const validated = validateResumeFile(file.name, file.type, bytes);
    let extractedText: string;
    try {
      extractedText = await extractResumeText(validated.extension, bytes);
    } catch {
      return NextResponse.json({ error: "We could not extract readable text. Try a text-based PDF or DOCX file." }, { status: 400 });
    }
    storageKey = await storeResume(auth.user.id, file.name, validated.mimeType, bytes);
    const resume = await prisma.resume.create({ data: { userId: auth.user.id, filename: file.name.slice(0, 255), storageKey, extractedText } });
    return NextResponse.json({ id: resume.id, filename: resume.filename, extractedCharacters: extractedText.length, suggestedSkills: suggestResumeSkills(extractedText), createdAt: resume.createdAt }, { status: 201 });
  } catch (error) {
    if (storageKey) await deleteResumeFile(storageKey).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Resume upload failed.";
    const status = /under 4 MB|supported|match|choose/i.test(message) ? 400 : 503;
    return NextResponse.json({ error: status === 503 ? "Private resume storage is unavailable. Configure a private Vercel Blob store for production and try again." : message }, { status });
  }
}
