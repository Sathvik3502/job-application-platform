import "./globals.css";
import "./workflows.css";
import "./job-detail.css";
import "./resume.css";
import { getSession } from "@/lib/auth";
import { AppNavigation } from "@/components/app-navigation";

export const metadata = { title: "ApplyPilot | Job search workspace", description: "A private workspace for organizing and reviewing job applications." };

export default async function Layout({ children }: { children: React.ReactNode }) {
	const session = await getSession();
	return <html lang="en"><body><div className="app-frame"><AppNavigation email={session?.email ?? null} /><main className="main-content"><div className="content-width">{children}</div></main></div></body></html>;
}
