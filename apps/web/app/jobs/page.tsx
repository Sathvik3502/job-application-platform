import Link from "next/link";
import { BriefcaseBusiness, MapPin, Search } from "lucide-react";
import { scoreJob } from "@job-platform/matching";
import { ApplyButton } from "@/components/apply-button";
import { DatabaseNotice } from "@/components/database-notice";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Jobs({ searchParams }: { searchParams: Promise<{ q?: string; location?: string }> }) {
	const { q = "", location = "" } = await searchParams;
	const session = await getSession();
	const terms = q.trim().split(/\s+/).filter(Boolean);
	let jobs: Awaited<ReturnType<typeof prisma.job.findMany>> = [];
	let profile: Awaited<ReturnType<typeof prisma.candidateProfile.findUnique>> = null;
	try {
		jobs = await prisma.job.findMany({ where: { AND: [{ applicationUrl: { startsWith: "http", mode: "insensitive" } }, ...terms.map(term => ({ OR: [{ title: { contains: term, mode: "insensitive" as const } }, { company: { contains: term, mode: "insensitive" as const } }, { description: { contains: term, mode: "insensitive" as const } }] })), ...(location ? [{ location: { contains: location, mode: "insensitive" as const } }] : [])] }, orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }], take: 100 });
		profile = session ? await prisma.candidateProfile.findUnique({ where: { userId: session.userId } }) : null;
	} catch {
		return <><header className="page-heading"><div><p className="eyebrow">OPPORTUNITIES</p><h1>Find your next role</h1><p>Browse and compare available roles.</p></div></header><DatabaseNotice/></>;
	}
	return <>
		<header className="page-heading"><div><p className="eyebrow">OPPORTUNITIES</p><h1>Find your next role</h1><p>Search the available job catalog and compare roles with your profile.</p></div></header>
		<form className="search-bar" action="/jobs"><label><Search size={17}/><input name="q" defaultValue={q} placeholder="Role, company, or skill" aria-label="Search role, company, or skill"/></label><label><MapPin size={17}/><input name="location" defaultValue={location} placeholder="Location" aria-label="Location"/></label><button className="primary"><Search size={15}/> Search jobs</button></form>
		<div className="row list-summary"><span>{jobs.length} {jobs.length === 1 ? "opportunity" : "opportunities"}</span><span className="muted">Sorted by newest</span></div>
		{jobs.length === 0 ? <section className="card empty-state"><span className="empty-icon"><BriefcaseBusiness size={21}/></span><h2>{q || location ? "No roles match those filters" : "No jobs available yet"}</h2><p>{q || location ? "Try a broader title or location." : "The job catalog has no connected sources or imported roles at this time."}</p>{(q || location) && <Link className="button secondary" href="/jobs">Clear filters</Link>}</section> : <section className="job-list">{jobs.map(job => { const match = profile && session ? scoreJob({ fullName: profile.fullName, email: session.email, phone: profile.phone ?? undefined, location: profile.location, skills: profile.skills as string[], titles: profile.titles as string[], yearsExperience: profile.yearsExperience, workAuthorized: profile.workAuthorized ?? undefined }, { ...job, requirements: job.requirements as string[], postedAt: job.postedAt?.toISOString() ?? job.createdAt.toISOString() }) : null; return <article className="card job-card" key={job.id}><div className="row"><div><h2>{job.title}</h2><div className="job-meta"><span>{job.company}</span><span>{job.location}</span><span>{job.source}</span></div></div>{match && <div className="match-score">{match.overall}%<small>profile match</small></div>}</div><p className="job-description">{job.description}</p><div className="job-actions"><Link className="button secondary" href={`/jobs/${job.id}`}>View role details</Link>{session && <ApplyButton jobId={job.id}/>}</div></article>; })}</section>}
	</>;
}
