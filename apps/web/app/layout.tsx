import "./globals.css";
import Link from "next/link";
export const metadata={title:"ApplyPilot",description:"Safe autonomous job application platform"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><main className="shell"><nav className="nav"><Link className="brand" href="/dashboard">Apply<i>Pilot</i></Link><div className="links"><Link href="/jobs">Jobs</Link><Link href="/applications">Applications</Link><Link href="/profile">Profile</Link><Link href="/automation">Automation</Link></div><span className="badge">MOCK MODE</span></nav>{children}</main></body></html>}
