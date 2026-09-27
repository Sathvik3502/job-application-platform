import { describe, expect, it } from "vitest";
import { deleteResumeFile, extractResumeText, maxResumeBytes, readResume, storeResume, suggestResumeSkills, validateResumeFile } from "../../apps/web/lib/resume-files";

describe("resume validation and analysis helpers", () => {
  it("accepts plain-text resume files and rejects content/extension mismatches", () => {
    expect(validateResumeFile("resume.txt", "text/plain", Buffer.from("TypeScript engineer"))).toEqual({ extension: "txt", mimeType: "text/plain" });
    expect(() => validateResumeFile("resume.pdf", "application/pdf", Buffer.from("not a PDF"))).toThrow(/does not match/);
  });

  it("enforces the upload size limit", () => {
    expect(() => validateResumeFile("resume.txt", "text/plain", Buffer.alloc(maxResumeBytes + 1))).toThrow(/under 4 MB/);
  });

  it("suggests known skills only on token boundaries", () => {
    expect(suggestResumeSkills("Senior JavaScript and Java developer with PostgreSQL")).toEqual(["JavaScript", "Java", "PostgreSQL"]);
  });

  it("extracts text files and rejects invalid UTF-8", async () => {
    await expect(extractResumeText("txt", Buffer.from("TypeScript developer\r\nPostgreSQL"))).resolves.toBe("TypeScript developer\nPostgreSQL");
    await expect(extractResumeText("txt", Buffer.from([0xff, 0xfe]))).rejects.toThrow();
  });

  it("stores and reads a private local file under the development-only storage root", async () => {
    const previousVercel = process.env.VERCEL;
    delete process.env.VERCEL;
    const content = Buffer.from("private resume fixture");
    const key = await storeResume("unit-test-user", "resume.txt", "text/plain", content);
    try {
      expect(key.startsWith("local:")).toBe(true);
      await expect(readResume(key)).resolves.toEqual(content);
    } finally {
      await deleteResumeFile(key);
      if (previousVercel !== undefined) process.env.VERCEL = previousVercel;
    }
  });
});
