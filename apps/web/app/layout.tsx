import "./globals.css";
import Link from "next/link";
export const metadata={title:"ApplyPilot",description:"Safe autonomous job application platform"};
export default function Layout({children}:{children:React.ReactNode}){const mockMode=process.env.MOCK_MODE!=="false";const dryRun=process.env.DRY_RUN!=="false";const mode=mockMode?"MOCK MODE":dryRun?"DRY RUN":"LIVE MODE";return <html lang="en"><body><main className="shell"><nav className="nav"><Link className="brand" href="/dashboard">Apply<i>Pilot</i></Link><div className="links"><Link href="/jobs">Jobs</Link><Link href="/applications">Applications</Link><Link href="/profile">Profile</Link><Link href="/automation">Automation</Link></div><span className={mockMode?"badge":"badge review"}>{mode}</span></nav>{children}</main></body></html>}
