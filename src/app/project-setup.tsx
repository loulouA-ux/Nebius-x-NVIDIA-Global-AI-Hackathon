"use client";

import { useEffect, useState } from "react";

type ProjectData = {
  projectId: string;
  name: string;
  hostname: string;
  verification: {
    status: "pending" | "verified" | "expired";
    method: "dns" | "file" | null;
    verifiedAt: string | null;
    challenge: { txtName: string; fileUrl: string; value: string; expiresAt: string };
    methods: readonly ["dns", "file"];
  };
};

async function requestProject(url: string, options?: RequestInit): Promise<ProjectData> {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Project request failed.");
  return data as ProjectData;
}

function stagingHostname(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || url.pathname !== "/") return null;
    if (!url.hostname.includes(".") || url.hostname.endsWith(".local")) return null;
    return url.hostname.toLowerCase();
  } catch { return null; }
}

export default function ProjectSetup() {
  const [projectName, setProjectName] = useState("");
  const [stagingUrl, setStagingUrl] = useState("");
  const [method, setMethod] = useState<"dns" | "file">("dns");
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const selected = projects.find((item) => item.projectId === selectedId);
  const host = stagingHostname(stagingUrl);

  useEffect(() => {
    let active = true;
    fetch("/api/projects", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          if (active) setNeedsSignIn(true);
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Projects could not be loaded.");
        if (active) {
          const items = data.projects as ProjectData[];
          setProjects(items);
          setSelectedId(items[0]?.projectId || "");
        }
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Projects could not be loaded."); });
    return () => { active = false; };
  }, []);

  async function perform(action: () => Promise<ProjectData>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const project = await action();
      setProjects((current) => [project, ...current.filter((item) => item.projectId !== project.projectId)]);
      setSelectedId(project.projectId);
      setMessage(success);
      setNeedsSignIn(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Project request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Set up a project.</h1>
      <p className="intro">Name the release candidate and prove control of the exact staging host.</p>
      {needsSignIn && <p className="quiet-note">Project setup requires a member session. <a href="/sign-in">Sign in with your individual access key</a>.</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status" className="quiet-note">{message}</p>}
      <section className="panel scan-form">
        <h2>Project details</h2>
        <label htmlFor="project-name">Project name</label>
        <input id="project-name" value={projectName} maxLength={80} onChange={(event) => setProjectName(event.target.value)} placeholder="e.g. Storefront staging" />
        <label htmlFor="staging-url">Staging URL</label>
        <input id="staging-url" type="url" value={stagingUrl} onChange={(event) => setStagingUrl(event.target.value)} placeholder="https://staging.example.com/" />
        <p className="fineprint">Use the HTTPS origin of a public staging host. Paths, ports, query strings and credentials are not accepted.</p>
        {stagingUrl && !host && <p role="alert" className="error">Enter a public HTTPS origin, such as https://staging.example.com/.</p>}
        {host && <p className="quiet-note">Exact host to verify: <strong>{host}</strong></p>}
        <button className="button primary" type="button" disabled={busy || !projectName.trim() || !host} onClick={() => perform(
          () => requestProject("/api/projects", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: projectName.trim(), stagingUrl }),
          }),
          "Project created. Publish the challenge below, then verify it.",
        )}>Create project and get challenge</button>
      </section>
      {projects.length > 0 && <section className="panel scan-form">
        <h2>Your projects</h2>
        <label htmlFor="saved-project">Choose a project</label>
        <select id="saved-project" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setError(""); setMessage(""); }}>
          {projects.map((project) => <option key={project.projectId} value={project.projectId}>{project.name} — {project.hostname}</option>)}
        </select>
      </section>}
      {selected && <section className="panel scan-form">
        <h2>Prove control of {selected.hostname}</h2>
        <p>Publish the current value at the exact hostname. The challenge expires at {new Date(selected.verification.challenge.expiresAt).toLocaleString("en-GB")}.</p>
        <label htmlFor="proof-method">Verification method</label>
        <select id="proof-method" value={method} onChange={(event) => setMethod(event.target.value as "dns" | "file")}>
          <option value="dns">DNS TXT record</option>
          <option value="file">Well-known file</option>
        </select>
        <p className="quiet-note">{method === "dns" ? "TXT name" : "File URL"}: <code>{method === "dns" ? selected.verification.challenge.txtName : selected.verification.challenge.fileUrl}</code></p>
        <p className="quiet-note">Exact content: <code>{selected.verification.challenge.value}</code></p>
        <p className="fineprint">Status: {selected.verification.status}{selected.verification.verifiedAt ? ` · last verified ${new Date(selected.verification.verifiedAt).toLocaleString("en-GB")}` : ""}. Host scans will recheck proof and still apply network safety limits.</p>
        <div className="project-actions">
          <button className="button primary" type="button" disabled={busy} onClick={() => perform(
            () => requestProject(`/api/projects/${selected.projectId}/verify`, {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }),
            }),
            "Control of this exact host was verified.",
          )}>{busy ? "Checking…" : "Verify ownership"}</button>
          <button className="button" type="button" disabled={busy} onClick={() => perform(
            () => requestProject(`/api/projects/${selected.projectId}/challenge`, { method: "POST" }),
            "New challenge issued. Replace the old value before verifying.",
          )}>Refresh challenge</button>
        </div>
        <p className="fineprint">Staging host scans remain unavailable until the passive checks and scan integration are complete.</p>
      </section>}
    </>
  );
}
