"use client";
import { useEffect, useState } from "react";
type Project = {
  projectId: string;
  name: string;
  hostname: string;
  verification: { status: string; challenge: { expiresAt: string } };
};
export default function ProjectScanChoice({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/projects", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) return;
        if (!r.ok) throw Error("Projects unavailable.");
        const d = await r.json();
        if (active) setProjects(d.projects);
      })
      .catch(() => {
        if (active) setError("Saved projects could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);
  const selected = projects.find((p) => p.projectId === value);
  return (
    <div>
      <label htmlFor="scan-project">Staging checks (optional)</label>
      <select
        id="scan-project"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Manifest only — no host requests</option>
        {projects.map((p) => (
          <option
            key={p.projectId}
            value={p.projectId}
            disabled={
              p.verification.status !== "verified" ||
              Date.parse(p.verification.challenge.expiresAt) <= Date.now()
            }
          >
            {p.name} · {p.hostname} · {p.verification.status}
          </option>
        ))}
      </select>
      <p className="fineprint">
        Choose a verified project. Proof is rechecked before four fixed passive
        requests; expired proof requires a new challenge.
      </p>
      {selected && <p>Selected host: {selected.hostname}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
