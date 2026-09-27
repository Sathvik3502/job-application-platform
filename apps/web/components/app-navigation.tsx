"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BriefcaseBusiness, ChartNoAxesCombined, CircleHelp, FileText, LayoutDashboard, ListChecks, LogIn, LogOut, Settings2, UserRound, UserRoundPlus } from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/jobs", label: "Find jobs", icon: BriefcaseBusiness },
  { href: "/applications", label: "Applications", icon: ListChecks },
  { href: "/profile", label: "My profile", icon: UserRound },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/preferences", label: "Preferences", icon: Settings2 },
  { href: "/automation", label: "Automation", icon: Activity },
  { href: "/analytics", label: "Insights", icon: ChartNoAxesCombined },
];

export function AppNavigation({ email }: { email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  async function signOut() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }
  return <>
    <aside className="sidebar">
      <Link href="/dashboard" className="brand"><span className="brand-mark">A</span><span>ApplyPilot<small>CAREER WORKSPACE</small></span></Link>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-item ${pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></Link>)}
      </nav>
      <div className="sidebar-bottom">
        <Link className="nav-item" href="/system-status"><CircleHelp size={18} strokeWidth={1.8} /><span>System status</span></Link>
        {email ? <div className="account-panel"><div className="avatar">{email.slice(0, 1).toUpperCase()}</div><div className="account-copy"><strong>{email.split("@")[0]}</strong><span>{email}</span></div><button className="icon-button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button></div> : <div className="auth-links"><Link href="/login"><LogIn size={17} /> Sign in</Link><Link href="/register"><UserRoundPlus size={17} /> Create account</Link></div>}
      </div>
    </aside>
    <header className="mobile-header"><Link href="/dashboard" className="brand"><span className="brand-mark">A</span><span>ApplyPilot</span></Link><div className="mobile-account">{email ? <><span className="avatar small">{email.slice(0, 1).toUpperCase()}</span><span>{email}</span><button className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button></> : <Link href="/login">Sign in</Link>}</div></header>
    <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.slice(0, 5).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""}><Icon size={19} /><span>{label}</span></Link>)}</nav>
  </>;
}