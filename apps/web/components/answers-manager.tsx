"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, ShieldCheck } from "lucide-react";

type SavedAnswer = { id: string; question: string; answer: string; category: string; verified: boolean };

export function AnswersManager({ initialAnswers }: { initialAnswers: SavedAnswer[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/answers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: form.get("question"), answer: form.get("answer"), category: form.get("category"), verified: form.get("verified") === "on" }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error ?? "Could not save answer."); return; }
      formElement.reset();
      setMessage("Answer saved.");
      router.refresh();
    } catch { setMessage("Could not reach the server. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="answer-layout"><section className="card"><div className="section-heading"><h2>Your saved answers</h2><span className="badge neutral">{initialAnswers.length} saved</span></div>{initialAnswers.length ? <div className="answer-list">{initialAnswers.map(item => <article className="answer-item" key={item.id}><div className="row"><strong>{item.question}</strong><span className={`badge ${item.verified ? "" : "review"}`}>{item.verified ? "Verified by you" : "Unverified"}</span></div><p>{item.answer}</p><span className="muted answer-category">{item.category}</span></article>)}</div> : <div className="empty-state"><span className="empty-icon"><ShieldCheck size={21}/></span><h2>No saved answers</h2><p>Save details you may need to enter on application forms. They are only used when you choose to provide them.</p></div>}</section><section className="card answer-form-card"><div className="section-heading"><h2>Add an answer</h2><Plus size={17}/></div><form className="editor editor-single" onSubmit={save}><label>Question or field<input name="question" required maxLength={300} placeholder="For example: Work authorization"/></label><label>Your answer<textarea name="answer" required maxLength={2000} placeholder="Enter an accurate answer"/></label><label>Category<select name="category" defaultValue="GENERAL"><option value="GENERAL">General</option><option value="WORK_AUTHORIZATION">Work authorization</option><option value="EXPERIENCE">Experience</option><option value="COMPENSATION">Compensation</option><option value="AVAILABILITY">Availability</option></select></label><label className="inline-field"><input type="checkbox" name="verified"/><span>I have checked this answer for accuracy</span><Check size={15}/></label><p className="editor-status" role="status">{message}</p><button className="primary" disabled={busy}>{busy ? "Saving..." : "Save answer"}</button></form></section></div>;
}
