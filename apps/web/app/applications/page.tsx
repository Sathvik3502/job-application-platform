import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Applications() {
	const session = await getSession();
	if (!session) return <section className="card empty-state"><h2>Sign in to view your applications</h2><Link className="button" href="/login">Sign in</Link></section>;
	const applications = await prisma.application.findMany({ where: { userId: session.userId }, include: { job: true, resume: { select: { filename: true } } }, orderBy: { updatedAt: "desc" } });
	return <><header className="page-heading"><div><p className="eyebrow">YOUR PIPELINE</p><h1>Applications</h1><p>Track roles you’ve saved for review. Submission status is only updated when verified.</p></div><Link className="button secondary" href="/jobs">Find roles</Link></header><section className="card">{applications.length === 0 ? <div className="empty-state"><span className="empty-icon"><ClipboardList size={21}/></span><h2>No applications saved</h2><p>When you add a role to your review list, it will appear here with its match score and current status.</p><Link className="button" href="/jobs">Browse jobs</Link></div> : <div className="table-wrap"><table className="table"><thead><tr><th>Company</th><th>Position</th><th>Match</th><th>Resume</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>{applications.map(application => <tr key={application.id}><td>{application.job.company}</td><td>{application.job.title}</td><td>{application.matchScore}%</td><td>{application.resume?.filename ?? "Not selected"}</td><td><span className={`badge ${application.status === "SUBMITTED" ? "" : application.status === "FAILED" ? "error" : "review"}`}>{application.status.replaceAll("_", " ")}</span></td><td>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(application.updatedAt)}</td><td><a href={application.job.applicationUrl} target="_blank" rel="noreferrer" className="table-link" aria-label={`Open ${application.job.title} source listing`}><ArrowUpRight size={16}/></a></td></tr>)}</tbody></table></div>}</section></>;
}
