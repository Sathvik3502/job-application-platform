import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function Login(){return <section className="auth-shell"><h1>Welcome back</h1><p className="muted">Sign in to your private job search workspace.</p><article className="card"><AuthForm mode="login" /></article><p className="muted">New here? <Link href="/register">Create an account</Link></p></section>}
