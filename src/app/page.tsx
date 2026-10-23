"use client";
import { useState } from "react";
import {
  CheckCheck,
  LayoutDashboard,
  ShieldAlert,
  ArrowUpRight,
  ArrowLeft,
  FileSearch,
  ScanLine,
  ListChecks,
  CircleCheck,
  CircleDashed,
  ExternalLink,
  ChevronRight,
  LoaderCircle,
  Package,
  FlaskConical,
  Info,
} from "lucide-react";
import type { Finding, ScanReport } from "@/lib/types";

type View = "overview" | "scan" | "findings" | "actions";
const defaultManifest = JSON.stringify(
  {
    name: "my-app",
    lockfileVersion: 3,
    packages: {
      "": { name: "my-app" },
      "node_modules/lodash": { version: "4.17.20" },
    },
  },
  null,
  2,
);
export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [selected, setSelected] = useState<Finding | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("package-lock.json");
  const [content, setContent] = useState(defaultManifest);
  const [research, setResearch] = useState(false);
  function navigate(v: View) {
    setView(v);
    setSelected(null);
    setError("");
  }
  async function scan(mode: "demo" | "live") {
    setBusy(true);
    setError("");
    setSelected(null);
    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "demo" ? { mode } : { mode, filename, content, research },
        ),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "The scan could not finish.");
      setReport(data);
      setView("overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to run scan.");
    } finally {
      setBusy(false);
    }
  }
  const nav = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "scan", label: "New scan", icon: ScanLine },
    { id: "findings", label: "Findings", icon: ShieldAlert },
    { id: "actions", label: "Recommended actions", icon: ListChecks },
  ] as const;
  const blocked =
    report?.findings.filter((f) => f.severity === "high").length ?? 0;
  const incomplete =
    report?.checks.filter(
      (c) => c.state === "incomplete" || c.state === "snapshot",
    ).length ?? 0;
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Agent Shielda home">
          <span className="brand-mark">
            <CheckCheck size={22} />
          </span>
          Agent Shielda
        </a>
        <span className="tagline">Check before you ship.</span>
        <span className="build-badge">
          Local build <span>0.1</span>
        </span>
      </header>
      <div className="shell">
        <aside>
          <div className="workspace">
            <span className="avatar">H</span>
            <div>
              HeySalad<span>Development workspace</span>
            </div>
          </div>
          <div className="nav-label">WORKSPACE</div>
          <nav aria-label="Main navigation">
            {nav.map((n) => (
              <button
                key={n.id}
                aria-current={view === n.id ? "page" : undefined}
                onClick={() => navigate(n.id)}
              >
                <n.icon size={17} />
                {n.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span className="tiny-mark">
              <CheckCheck size={19} />
            </span>
            <p>
              A little confidence.
              <br />
              Before every release.
            </p>
            <small>Built by HeySalad</small>
          </div>
        </aside>
        <main>
          <div className="breadcrumb">
            WORKSPACE <ChevronRight size={12} />{" "}
            {selected
              ? "FINDING DETAILS"
              : view === "scan"
                ? "NEW SCAN"
                : view === "actions"
                  ? "RECOMMENDED ACTIONS"
                  : view === "findings"
                    ? "FINDINGS"
                    : "OVERVIEW"}
          </div>
          {error && (
            <div role="alert" className="error">
              <ShieldAlert size={18} />
              {error}
            </div>
          )}
          {busy ? (
            <section className="loading" role="status">
              <LoaderCircle className="spin" size={30} />
              <h1>Checking your next release.</h1>
              <p>Reading inputs and collecting evidence.</p>
              <p className="muted">
                Live requests are bounded. Findings appear when the scan
                finishes.
              </p>
            </section>
          ) : selected ? (
            <>
              <button className="back" onClick={() => setSelected(null)}>
                <ArrowLeft size={15} />
                Back to report
              </button>
              <span className={"severity " + selected.severity}>
                {selected.severity === "review" ? "Review" : selected.severity}
              </span>
              <h1 className="detail-title">{selected.title}</h1>
              <p className="intro">{selected.description}</p>
              <section className="panel">
                <h2>Evidence</h2>
                {selected.evidence.map((e, i) => (
                  <div className="evidence" key={i}>
                    <div className="code-label">{e.location}</div>
                    <pre>{e.excerpt}</pre>
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noreferrer">
                        Read source advisory <ExternalLink size={13} />
                      </a>
                    )}
                    {e.retrievedAt && (
                      <small>
                        Retrieved{" "}
                        {new Date(e.retrievedAt).toLocaleDateString("en-GB")}
                      </small>
                    )}
                  </div>
                ))}
              </section>
              <section className="panel">
                <h2>Recommended action</h2>
                <p>{selected.action}</p>
                <div className="quiet-note">
                  <Info size={16} />
                  No code has been changed. Resolution requires independent
                  verification.
                </div>
              </section>
              {report?.explanations
                .filter((e) => e.findingId === selected.id)
                .map((e, i) => (
                  <section className="panel" key={i}>
                    <h2>Nemotron note</h2>
                    <p>{e.explanation}</p>
                    <small>
                      AI-generated explanation. Check against the evidence
                      above.
                    </small>
                  </section>
                ))}
            </>
          ) : view === "scan" ? (
            <>
              <h1>Check a project.</h1>
              <p className="intro">
                Start with dependency evidence. Keep the next step clear.
              </p>
              <div className="scan-grid">
                <section className="panel scan-form">
                  <h2>Paste a dependency manifest</h2>
                  <p className="muted">
                    Exact pins only · up to 50 resolved packages · 200 KB
                    maximum
                  </p>
                  <label htmlFor="manifest-type">File format</label>
                  <select
                    id="manifest-type"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                  >
                    <option>package-lock.json</option>
                    <option>package.json</option>
                    <option>requirements.txt</option>
                  </select>
                  <label htmlFor="manifest">Manifest content</label>
                  <textarea
                    id="manifest"
                    spellCheck={false}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={13}
                  />
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={research}
                      onChange={(e) => setResearch(e.target.checked)}
                    />
                    Include Tavily research and Nemotron notes
                  </label>
                  <p className="fineprint">
                    Package names and versions go to OSV. Optional research uses
                    server-side provider keys; missing keys appear as incomplete
                    coverage. Do not paste credentials.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => scan("live")}
                  >
                    <ScanLine size={17} />
                    Scan manifest
                  </button>
                </section>
                <section className="panel demo-panel">
                  <div className="illustration">
                    <FlaskConical size={29} />
                  </div>
                  <h2>Try the demo first</h2>
                  <p>
                    Real rules, synthetic input. Inspect a vulnerable
                    dependency, a fake credential and a configuration review.
                  </p>
                  <button className="button" onClick={() => scan("demo")}>
                    Run offline demo <ArrowUpRight size={16} />
                  </button>
                  <small>
                    Uses a single OSV advisory snapshot from 23 Oct 2026. No
                    external requests.
                  </small>
                  <hr />
                  <h2>Staging URL checks</h2>
                  <p>
                    Planned next: prove ownership of your staging host, then run
                    bounded passive checks.
                  </p>
                  <span className="neutral-badge">Not available yet</span>
                </section>
              </div>
            </>
          ) : !report ? (
            <>
              <div className="page-heading">
                <div>
                  <h1>Ready for your next release?</h1>
                  <p className="intro">
                    Find the risks. Understand the evidence. Decide what ships.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => navigate("scan")}
                >
                  <ScanLine size={17} />
                  New scan
                </button>
              </div>
              <section className="welcome">
                <div className="welcome-copy">
                  <span className="eyebrow">YOUR FIRST CHECK</span>
                  <h2>
                    Less guessing.
                    <br />
                    More evidence.
                  </h2>
                  <p>
                    Check your dependencies before deployment. Every finding
                    comes with a source and a practical next step.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => scan("demo")}
                  >
                    Explore the demo <ArrowUpRight size={17} />
                  </button>
                  <small>Offline fixture · no account or API keys needed</small>
                </div>
                <div className="welcome-art" aria-hidden="true">
                  <div className="art-node">
                    <Package size={24} />
                    <span>Dependency</span>
                  </div>
                  <div className="art-line" />
                  <div className="art-node center-node">
                    <CheckCheck size={30} />
                    <span>Agent Shielda</span>
                  </div>
                  <div className="art-line" />
                  <div className="art-node">
                    <FileSearch size={24} />
                    <span>Evidence</span>
                  </div>
                </div>
              </section>
              <div className="intro-features">
                <div>
                  <Package />
                  <h3>Know what you ship</h3>
                  <p>
                    Inspect resolved versions, with unsupported inputs clearly
                    called out.
                  </p>
                </div>
                <div>
                  <FileSearch />
                  <h3>See the source</h3>
                  <p>Follow each finding to code evidence or an advisory.</p>
                </div>
                <div>
                  <ListChecks />
                  <h3>Choose your next step</h3>
                  <p>Review practical actions. Nothing changes without you.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <h1>
                    {view === "actions"
                      ? "Recommended actions"
                      : view === "findings"
                        ? "Your findings"
                        : report.mode === "demo"
                          ? "salad-storefront"
                          : "Manifest assessment"}
                  </h1>
                  <p className="intro">
                    {report.mode === "demo"
                      ? "Offline demonstration · real rules over synthetic inputs"
                      : "Live dependency assessment · supplied manifest only"}
                  </p>
                </div>
                <button className="button" onClick={() => navigate("scan")}>
                  <ScanLine size={17} />
                  New scan
                </button>
              </div>
              <div className="report-meta">
                <span>
                  {new Date(report.createdAt).toLocaleString("en-GB")}
                </span>
                <span>
                  {report.durationMs < 1000
                    ? "Under 1 second"
                    : `${(report.durationMs / 1000).toFixed(1)} seconds`}
                </span>
                <span>{report.id.slice(0, 8)}</span>
              </div>
              <section className={"verdict " + (blocked ? "blocked" : "")}>
                <div className="verdict-icon">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <span className="eyebrow">{report.status}</span>
                  <h2>
                    {blocked
                      ? `${blocked} blocker${blocked === 1 ? "" : "s"} need attention`
                      : report.status === "Incomplete"
                        ? "Some checks could not be completed"
                        : report.status === "Review required"
                          ? "Review the evidence before shipping"
                          : "No findings in completed checks"}
                  </h2>
                  <p>
                    {incomplete > 0
                      ? `${incomplete} checks use limited evidence or are incomplete. `
                      : ""}
                    This assessment is not a guarantee that the application is
                    secure.
                  </p>
                </div>
              </section>
              {view === "actions" ? (
                <section className="section">
                  <h2>Work through the findings</h2>
                  {report.findings.map((f, i) => (
                    <article className="panel action-panel" key={f.id}>
                      <span className="step-number">{i + 1}</span>
                      <div>
                        <h3>{f.title}</h3>
                        <p>{f.action}</p>
                        <button
                          className="text-button"
                          onClick={() => setSelected(f)}
                        >
                          Review evidence <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                  {!report.findings.length && (
                    <p>
                      No actions generated. Review incomplete coverage before
                      relying on this result.
                    </p>
                  )}
                </section>
              ) : (
                <section className="section">
                  <div className="section-heading">
                    <h2>Needs your attention</h2>
                    <span>{report.findings.length} findings</span>
                  </div>
                  <div className="finding-list">
                    {report.findings.map((f) => (
                      <button
                        className="finding-row"
                        key={f.id}
                        onClick={() => setSelected(f)}
                      >
                        <span className={"severity " + f.severity}>
                          {f.severity === "review" ? "Review" : f.severity}
                        </span>
                        <span className="finding-copy">
                          <strong>{f.title}</strong>
                          <small>{f.evidence[0]?.location}</small>
                        </span>
                        <ArrowUpRight size={17} />
                      </button>
                    ))}
                    {!report.findings.length && (
                      <p className="empty">
                        No findings returned. Check the coverage below.
                      </p>
                    )}
                  </div>
                </section>
              )}
              <section className="section">
                <div className="section-heading">
                  <h2>Coverage & confidence</h2>
                  <span>
                    {report.dependencies.length} resolved{" "}
                    {report.dependencies.length === 1
                      ? "dependency"
                      : "dependencies"}
                  </span>
                </div>
                <div className="coverage">
                  {report.checks.map((c) => (
                    <div className="coverage-row" key={c.name}>
                      {c.state === "complete" ? (
                        <CircleCheck size={17} />
                      ) : (
                        <CircleDashed size={17} />
                      )}
                      <div>
                        <strong>{c.name}</strong>
                        <p>{c.detail}</p>
                      </div>
                      <span className="coverage-state">
                        {c.state.replaceAll("-", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              {report.sources.length > 0 && (
                <section className="section">
                  <h2>Live research · unconfirmed</h2>
                  <p className="muted">
                    Search results do not establish that a version is affected
                    and never change the verdict.
                  </p>
                  {report.sources.map((s) => (
                    <article key={s.id} className="panel">
                      <h3>{s.title}</h3>
                      <p>{s.excerpt}</p>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        Read source <ExternalLink size={13} />
                      </a>
                      <small>
                        {s.package}@{s.version} ·{" "}
                        {s.publishedAt ?? "Publication date unknown"}
                      </small>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}
          <footer>
            <span>
              <CheckCheck size={14} />
              Agent Shielda · Evidence before deployment
            </span>
            <span>Local session only · Results are not saved</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
