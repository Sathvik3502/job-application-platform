import Link from "next/link";
import { BriefcaseBusiness, CheckCheck, Clock3, Send } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DatabaseNotice } from "@/components/database-notice";

export default async function Dashboard() {
	const session = await getSession();
	if (!session) return <section className="login-wrap"><p className="eyebrow">YOUR CAREER WORKSPACE</p><h1 className="page-title">Make your next move with clarity.</h1><p>Keep your profile, job search, and application pipeline organized in one private workspace.</p><Link className="button" href="/register">Create your account</Link></section>;
	let profile: Awaited<ReturnType<typeof prisma.candidateProfile.findUnique>> = null;
	let totalJobs = 0;
	let totalApplications = 0;
	let inReview = 0;
	let submitted = 0;
	let recent: Array<{ id: string; job: { company: string; title: string }; matchScore: number; status: string }> = [];
	try {
	[profile, totalJobs, totalApplications, inReview, submitted, recent] = await Promise.all([
		prisma.candidateProfile.findUnique({ where: { userId: session.userId } }),
		prisma.job.count(),
		prisma.application.count({ where: { userId: session.userId } }),
		prisma.application.count({ where: { userId: session.userId, status: { in: ["READY_FOR_REVIEW", "MANUAL_REVIEW", "READY_TO_SUBMIT"] } } }),
		prisma.application.count({ where: { userId: session.userId, status: "SUBMITTED" } }),
		prisma.application.findMany({ where: { userId: session.userId }, include: { job: true }, orderBy: { updatedAt: "desc" }, take: 6 }),
	]);
	} catch {
		return <><header className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Your dashboard</h1></div></header><DatabaseNotice/></>;
	}
	const firstName = profile?.fullName.trim().split(/\s+/)[0] || session.email.split("@")[0];
	const skillCount = Array.isArray(profile?.skills) ? profile.skills.length : 0;
	const stats = [{ label: "Available jobs", value: totalJobs, icon: BriefcaseBusiness, note: "in the job catalog" }, { label: "Applications", value: totalApplications, icon: Send, note: "in your pipeline" }, { label: "Needs your review", value: inReview, icon: Clock3, note: "awaiting your attention" }, { label: "Submitted", value: submitted, icon: CheckCheck, note: "recorded as submitted" }];
	return <>
		<header className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Good to see you, {firstName}</h1><p>Here’s where your job search stands today.</p></div><div className="page-actions"><Link className="button" href="/jobs"><BriefcaseBusiness size={16}/> Browse jobs</Link></div></header>
		<section className="grid stats">{stats.map(({ label, value, icon: Icon, note }) => <article className="card stat-card" key={label}><span className="stat-icon"><Icon size={17}/></span><div className="stat-label">{label}</div><div className="stat">{value}</div><div className="stat-meta">{note}</div></article>)}</section>
		<div className="dashboard-grid"><section className="card"><div className="section-heading"><h2>Latest applications</h2><Link href="/applications">View all <span aria-hidden="true">→</span></Link></div>{recent.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Company</th><th>Position</th><th>Match</th><th>Status</th></tr></thead><tbody>{recent.map(item => <tr key={item.id}><td>{item.job.company}</td><td>{item.job.title}</td><td>{item.matchScore}%</td><td><span className={`badge ${item.status === "SUBMITTED" ? "" : "review"}`}>{item.status.replaceAll("_", " ")}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><h2>Your pipeline starts here</h2><p>Browse the available jobs, compare matches against your profile, then add relevant opportunities to your review list.</p><Link className="button secondary" href="/jobs">Explore jobs</Link></div>}</section>
			<aside className="card"><p className="eyebrow">PROFILE CHECK</p><h2 className="page-title" style={{fontSize:18}}>Make your matches count</h2><p className="muted">{skillCount ? `Your profile has ${skillCount} skills for matching.` : "Add your experience and skills to get useful match scores."}</p><div className="section-heading"><Link href="/profile">Review profile details <span aria-hidden="true">→</span></Link></div><div className="notice info"><div><strong>Applications stay in your control</strong>Automatic job discovery and external application submission are not connected yet. Your saved applications are for review.</div></div></aside></div>
	</>;
}
