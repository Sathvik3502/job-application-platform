import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Analytics() {
	const session = await getSession();
	if (!session) return <section className="card empty-state"><h2>Sign in to view your insights</h2><Link className="button" href="/login">Sign in</Link></section>;
	const [total, submitted, review, average] = await Promise.all([
		prisma.application.count({ where: { userId: session.userId } }),
		prisma.application.count({ where: { userId: session.userId, status: "SUBMITTED" } }),
		prisma.application.count({ where: { userId: session.userId, status: { in: ["READY_FOR_REVIEW", "MANUAL_REVIEW", "READY_TO_SUBMIT"] } } }),
		prisma.application.aggregate({ where: { userId: session.userId }, _avg: { matchScore: true } }),
	]);
	const conversion = total ? Math.round(submitted / total * 100) : 0;
	return <><header className="page-heading"><div><p className="eyebrow">YOUR ACTIVITY</p><h1>Search insights</h1><p>Calculated from application records in your account.</p></div></header><section className="grid stats">{[{ label: "Applications tracked", value: total, note: "all statuses" }, { label: "Submitted", value: submitted, note: `${conversion}% of tracked applications` }, { label: "Awaiting review", value: review, note: "need your attention" }, { label: "Average match", value: average._avg.matchScore === null ? "—" : `${Math.round(average._avg.matchScore)}%`, note: "across your applications" }].map(item => <article className="card stat-card" key={item.label}><div className="stat-label">{item.label}</div><div className="stat">{item.value}</div><div className="stat-meta">{item.note}</div></article>)}</section>{total === 0 && <div className="notice info"><div><strong>Your insights will appear here</strong>Add roles to your application list to begin tracking your search.</div></div>}</>;
}
