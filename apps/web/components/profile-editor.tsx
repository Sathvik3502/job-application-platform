"use client";

import { FormEvent, useEffect, useState } from "react";

type Profile = { fullName: string; location: string; phone?: string | null; skills: string[]; titles: string[]; yearsExperience: number; workAuthorized?: boolean | null };
const empty: Profile = { fullName: "", location: "", phone: "", skills: [], titles: [], yearsExperience: 0, workAuthorized: null };

export function ProfileEditor() {
  const [profile, setProfile] = useState(empty);
  const [message, setMessage] = useState("Loading profile...");
  useEffect(() => { fetch("/api/me").then(response => response.ok ? response.json() : Promise.reject()).then(data => { setProfile(data.profile ?? empty); setMessage(""); }).catch(() => setMessage("Sign in to edit your profile.")); }, []);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile(current => ({ ...current, [key]: value }));
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) }); setMessage(response.ok ? "Profile saved." : "Could not save profile."); }
  return <form className="card editor" onSubmit={save}><label>Full name<input value={profile.fullName} onChange={event => set("fullName", event.target.value)} required /></label><label>Location<input value={profile.location} onChange={event => set("location", event.target.value)} /></label><label>Phone<input value={profile.phone ?? ""} onChange={event => set("phone", event.target.value)} /></label><label>Years of experience<input type="number" min="0" max="60" value={profile.yearsExperience} onChange={event => set("yearsExperience", Number(event.target.value))} /></label><label>Work authorization<select value={String(profile.workAuthorized ?? "")} onChange={event => set("workAuthorized", event.target.value === "" ? null : event.target.value === "true")}><option value="">Not provided</option><option value="true">Yes</option><option value="false">No</option></select></label><label>Skills<input value={profile.skills.join(", ")} onChange={event => set("skills", event.target.value.split(",").map(value => value.trim()).filter(Boolean))} /></label><label>Target titles<input value={profile.titles.join(", ")} onChange={event => set("titles", event.target.value.split(",").map(value => value.trim()).filter(Boolean))} /></label><p className="muted">{message}</p><button disabled={!profile.fullName}>Save profile</button></form>;
}