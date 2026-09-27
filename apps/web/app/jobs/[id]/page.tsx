import { ArrowUpRight, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { scoreJob, eligibility } from "@job-platform/matching";
import { ApplyButton } from "@/components/apply-button";
import { DatabaseNotice } from "@/components/database-notice";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let job: Awaited<ReturnType<typeof prisma.job.findFirst>> = null;
  try {
    job = await prisma.job.findFirst({ where: { id, applicationUrl: { startsWith: "http", mode: "insensitive" } } });
  } catch {
    return <><header className="page-heading"><div><p className="eyebrow">ROLE DETAILS</p><h1>Role details</h1></div></header><DatabaseNotice/></>;
  }
  if (!job) notFound();
  const session = await getSession();
  let profile: Awaited<ReturnType<typeof prisma.candidateProfile.findUnique>> = null;
  try {
    profile = session ? await prisma.candidateProfile.findUnique({ where: { userId: session.userId } }) : null;
  } catch {
    return <><header className="page-heading"><div><p className="eyebrow">ROLE DETAILS</p><h1>{job.title}</h1></div></header><DatabaseNotice/></>;
  }
  const candidate = profile && session ? { fullName: profile.fullName, email: session.email, phone: profile.phone ?? undefined, location: profile.location, skills: profile.skills as string[], titles: profile.titles as string[], yearsExperience: profile.yearsExperience, workAuthorized: profile.workAuthorized ?? undefined } : null;
  const normalizedJob = { ...job, requirements: job.requirements as string[], postedAt: job.postedAt?.toISOString() ?? job.createdAt.toISOString() };
  const match = candidate ? scoreJob(candidate, normalizedJob) : null;
  const gate = candidate && match ? eligibility(candidate, normalizedJob, match) : null;
  return <><header className="page-heading"><div><p className="eyebrow">ROLE DETAILS</p><h1>{job.title}</h1><p>{job.company} · {job.location}</p></div><a className="button secondary" href={job.applicationUrl} target="_blank" rel="noreferrer">View source listing <ArrowUpRight size={15}/></a></header><section className="job-detail-grid"><article className="card"><div className="section-heading"><h2>About the role</h2></div><p className="job-description">{job.description}</p><h2 className="detail-subheading">Requirements</h2><ul className="requirement-list">{normalizedJob.requirements.map(requirement => <li key={requirement}>{requirement}</li>)}</ul></article><aside className="card match-panel">{match ? <><p className="eyebrow">PROFILE MATCH</p><div className="detail-match">{match.overall}<span>%</span></div><span className={`badge ${gate?.status === "ELIGIBLE" ? "" : "review"}`}>{gate?.status?.replaceAll("_", " ")}</span><div className="match-breakdown">{[["Skills", match.skills], ["Experience", match.experience], ["Role", match.role], ["Location", match.location], ["Salary", match.salary]].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value}%</strong></div>)}</div><div className="evidence-list"><h3>Matched skills</h3>{match.matchedSkills.length ? match.matchedSkills.map(skill => <span className="evidence-chip" key={skill}><Check size={13}/>{skill}</span>) : <p className="muted">Add skills to your profile to improve role comparisons.</p>}</div><ApplyButton jobId={job.id}/><p className="fine-print">Adding a role saves it for your review. It does not submit an application.</p></> : <><p className="eyebrow">PROFILE MATCH</p><h2>Sign in to compare this role</h2><p className="muted">Your profile is used to calculate a private match breakdown.</p></>}</aside></section></>;
}
