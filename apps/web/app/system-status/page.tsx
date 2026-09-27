import { prisma } from "@/lib/prisma";

export default async function SystemStatus() {
	let databaseConnected = false;
	let pendingApplications: number | null = null;
	try { await prisma.$queryRaw`SELECT 1`; databaseConnected = true; pendingApplications = await prisma.application.count({ where: { status: "QUEUED" } }); } catch { databaseConnected = false; }
	return <><header className="page-heading"><div><p className="eyebrow">SERVICE HEALTH</p><h1>System status</h1><p>Current availability of application services.</p></div></header><section className="card"><div className="system-list"><div className="system-row"><span>Database</span><span className={`badge ${databaseConnected ? "" : "error"}`}>{databaseConnected ? "Connected" : "Unavailable"}</span></div><div className="system-row"><span>Queued applications</span><strong>{pendingApplications ?? "Unavailable"}</strong></div><div className="system-row"><span>Job source</span><span className="badge">Arbeitnow · scheduled daily</span></div><div className="system-row"><span>External application adapters</span><span className="badge neutral">Not available</span></div><div className="system-row"><span>Background worker heartbeat</span><span className="badge neutral">Not monitored</span></div></div></section></>;
}
