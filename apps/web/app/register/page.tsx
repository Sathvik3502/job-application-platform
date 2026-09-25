import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function Register(){return <section className="auth-shell"><h1>Build your job search system</h1><p className="muted">Start with a secure account, then add only verified career information.</p><article className="card"><AuthForm mode="register" /></article><p className="muted">Already have an account? <Link href="/login">Sign in</Link></p></section>}
