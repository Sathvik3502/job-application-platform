import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
export default function Register(){return <section className="login-wrap"><Link href="/dashboard" className="brand login-brand"><span className="brand-mark">A</span><span>ApplyPilot</span></Link><p className="eyebrow">GET STARTED</p><h1 className="page-title">Create your workspace</h1><p>Your profile and application history are private to your account.</p><AuthForm mode="register"/><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></section>}
