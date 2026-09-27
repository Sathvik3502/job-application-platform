import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DatabaseNotice } from "@/components/database-notice";
import { ResumeLibrary } from "@/components/resume-library";

export default async function Resume() {
	const session = await getSession();
	if (!session) return <section className="card empty-state"><h2>Sign in to manage your resumes</h2><Link className="button" href="/login">Sign in</Link></section>;
	try {
		const resumes = await prisma.resume.findMany({ where: { userId: session.userId }, select: { id: true, filename: true, createdAt: true }, orderBy: { createdAt: "desc" } });
		return <><header className="page-heading"><div><p className="eyebrow">DOCUMENTS</p><h1>Resume library</h1><p>Private files for your own application workflow.</p></div></header><ResumeLibrary initialResumes={resumes.map(resume => ({ ...resume, createdAt: resume.createdAt.toISOString() }))}/></>;
	} catch {
		return <><header className="page-heading"><div><p className="eyebrow">DOCUMENTS</p><h1>Resume library</h1></div></header><DatabaseNotice/></>;
	}
}
