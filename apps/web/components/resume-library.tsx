"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Check, FileText, Upload } from "lucide-react";

type ResumeItem = { id: string; filename: string; createdAt: string };

export function ResumeLibrary({ initialResumes }: { initialResumes: ResumeItem[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const file = new FormData(formElement).get("resume");
    if (!(file instanceof File) || file.size === 0) { setMessage("Choose a resume file first."); return; }
    setBusy(true);
    setMessage("");
    setSuggestedSkills([]);
    setSelectedSkills([]);
    try {
      const body = new FormData();
      body.set("resume", file);
      const response = await fetch("/api/resumes", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "Resume upload failed."); return; }
      const suggestions: string[] = result.suggestedSkills ?? [];
      setMessage(`Resume stored and analyzed (${result.extractedCharacters.toLocaleString()} text characters extracted).`);
      setSuggestedSkills(suggestions);
      setSelectedSkills(suggestions);
      formElement.reset();
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Try the upload again.");
    } finally {
      setBusy(false);
    }
  }

  async function addSelectedSkills() {
    setBusy(true);
    try {
      const response = await fetch("/api/profile/skills", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ skills: selectedSkills }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "Could not update your profile."); return; }
      setMessage(`${selectedSkills.length} reviewed skills added to your profile.`);
      setSelectedSkills([]);
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function toggleSkill(skill: string) {
    setSelectedSkills(current => current.includes(skill) ? current.filter(item => item !== skill) : [...current, skill]);
  }

  return <div className="resume-layout">
    <section className="card">
      <div className="section-heading"><h2>Your resumes</h2><span className="badge neutral">{initialResumes.length} stored</span></div>
      {initialResumes.length ? <div className="resume-list">{initialResumes.map(resume => <article className="resume-row" key={resume.id}>
        <span className="resume-icon"><FileText size={18}/></span>
        <div className="resume-meta"><strong>{resume.filename}</strong><span>Added {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(resume.createdAt))}</span></div>
        <a className="icon-button" href={`/api/resumes/${resume.id}/file`} aria-label={`Download ${resume.filename}`} title="Download resume"><ArrowDownToLine size={17}/></a>
      </article>)}</div> : <div className="empty-state"><span className="empty-icon"><FileText size={20}/></span><h2>No resume uploaded</h2><p>Upload a PDF, DOCX, or TXT resume. Extracted text is private to your account.</p></div>}
    </section>
    <section className="card">
      <div className="section-heading"><h2>Upload a resume</h2></div>
      <p className="muted">PDF, DOCX, or TXT · maximum 4 MB. Files are private and not shared with job sources.</p>
      <form className="resume-upload" onSubmit={upload}>
        <label className="file-picker"><Upload size={18}/><span>Choose a resume</span><input name="resume" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" required/></label>
        <button className="primary" disabled={busy}>{busy ? "Uploading and analyzing..." : "Upload and analyze"}</button>
      </form>
      <p className="editor-status" role="status">{message}</p>
      {suggestedSkills.length > 0 && <div className="resume-suggestions">
        <strong>Possible skills found</strong>
        <p className="muted">Review suggestions; only selected skills will be added to your matching profile.</p>
        <div className="suggested-skill-list">{suggestedSkills.map(skill => <label className="inline-field" key={skill}>
          <input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => toggleSkill(skill)}/><span>{skill}</span><Check size={14}/>
        </label>)}</div>
        <button type="button" className="button secondary" disabled={!selectedSkills.length || busy} onClick={addSelectedSkills}>Add selected skills to profile</button>
      </div>}
    </section>
  </div>;
}
