"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password"), fullName: form.get("fullName") }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || "Request failed."); return; }
      router.push("/dashboard");
      router.refresh();
    } catch { setMessage("Could not reach the server. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  return <form className="card editor" onSubmit={submit}>{mode === "register" && <label>Full name<input name="fullName" autoComplete="name" required minLength={2} /></label>}<label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 12 : 1} /></label>{message && <p className="warn" role="alert">{message}</p>}<button className="primary" disabled={busy}>{busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}</button></form>;
}