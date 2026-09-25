"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApplyButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function apply() { const response = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId }) }); const data = await response.json(); setMessage(response.ok ? "Added to your review queue." : data.error || "Could not add application."); if (response.ok) router.refresh(); }
  return <><button onClick={apply}>Add to review queue</button>{message && <p className="muted">{message}</p>}</>;
}