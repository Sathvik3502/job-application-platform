import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { get, put } from "@vercel/blob";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const maxResumeBytes = 4 * 1024 * 1024;
const localRoot = resolve(process.cwd(), ".local-private-resumes");
const skillCatalog = ["JavaScript", "TypeScript", "Python", "Java", "C#", ".NET", "Go", "Golang", "Rust", "Ruby", "PHP", "C++", "React", "Next.js", "Angular", "Vue", "Node.js", "Express", "HTML", "CSS", "Tailwind", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Linux", "Git", "GraphQL", "REST API", "Playwright", "Cypress", "Jest", "Vitest", "CI/CD", "Machine Learning", "Data Analysis", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Figma", "Agile", "Scrum"];

export function suggestResumeSkills(text: string) {
  const normalized = text.toLowerCase();
  return skillCatalog.filter(skill => {
    const needle = skill.toLowerCase();
    let offset = normalized.indexOf(needle);
    while (offset >= 0) {
      const before = normalized[offset - 1] ?? " ";
      const after = normalized[offset + needle.length] ?? " ";
      if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;
      offset = normalized.indexOf(needle, offset + 1);
    }
    return false;
  });
}

export function validateResumeFile(filename: string, mimeType: string, buffer: Buffer) {
  if (!buffer.length || buffer.length > maxResumeBytes) throw new Error("Choose a non-empty PDF, DOCX, or TXT file under 4 MB.");
  const extension = filename.toLowerCase().split(".").pop();
  if (extension === "pdf" && mimeType === "application/pdf" && buffer.subarray(0, 5).toString("ascii") === "%PDF-") return { extension, mimeType };
  if (extension === "docx" && mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && buffer[0] === 0x50 && buffer[1] === 0x4b) return { extension, mimeType };
  if (extension === "txt" && (mimeType === "text/plain" || mimeType === "application/octet-stream")) return { extension, mimeType: "text/plain" };
  throw new Error("File content does not match a supported PDF, DOCX, or TXT file.");
}

export async function extractResumeText(extension: string, buffer: Buffer) {
  let text: string;
  if (extension === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const info = await parser.getInfo();
      if (info.total > 50) throw new Error("PDF has more than 50 pages.");
      const result = await parser.getText({ first: 50 });
      text = result.text;
    } finally {
      await parser.destroy();
    }
  } else if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  }
  const cleaned = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").replace(/\r\n?/g, "\n").trim();
  if (!cleaned) throw new Error("No readable text was found in this file.");
  if (cleaned.length > 250_000) throw new Error("Extracted resume text is too large to store safely.");
  return cleaned;
}

export async function storeResume(userId: string, filename: string, mimeType: string, buffer: Buffer) {
  const id = randomUUID();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || `resume-${id}`;
  if (process.env.VERCEL === "1") {
    const blob = await put(`resumes/${userId}/${id}-${safeName}`, buffer, { access: "private", addRandomSuffix: true, contentType: mimeType });
    return blob.pathname;
  }
  const pathname = `${userId}/${id}-${safeName}`;
  const target = resolve(localRoot, pathname);
  if (!target.startsWith(`${localRoot}/`) && !target.startsWith(`${localRoot}\\`)) throw new Error("Invalid storage path.");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buffer, { flag: "wx", mode: 0o600 });
  return `local:${pathname}`;
}

export async function readResume(storageKey: string) {
  if (storageKey.startsWith("local:")) {
    const pathname = storageKey.slice("local:".length);
    const target = resolve(localRoot, pathname);
    if (!target.startsWith(`${localRoot}/`) && !target.startsWith(`${localRoot}\\`)) throw new Error("Invalid storage path.");
    return readFile(target);
  }
  const result = await get(storageKey, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) throw new Error("Resume file not found.");
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

export async function deleteResumeFile(storageKey: string) {
  if (storageKey.startsWith("local:")) {
    const target = resolve(localRoot, storageKey.slice("local:".length));
    if (!target.startsWith(`${localRoot}/`) && !target.startsWith(`${localRoot}\\`)) throw new Error("Invalid storage path.");
    await rm(target, { force: true });
    return;
  }
  const { del } = await import("@vercel/blob");
  await del(storageKey);
}
