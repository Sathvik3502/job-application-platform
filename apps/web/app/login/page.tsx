import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
export default function Login(){return <section className="login-wrap"><Link href="/dashboard" className="brand login-brand"><span className="brand-mark">A</span><span>ApplyPilot</span></Link><p className="eyebrow">WELCOME BACK</p><h1 className="page-title">Sign in to your workspace</h1><p>Access your profile and application pipeline.</p><AuthForm mode="login"/><p className="auth-switch">New to ApplyPilot? <Link href="/register">Create an account</Link></p></section>}
