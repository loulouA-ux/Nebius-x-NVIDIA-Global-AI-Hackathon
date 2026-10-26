"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "./findings.module.css";
import ReportInsights, {SourcePreview, Preview} from "./report-insights";
import WorkspaceSidebar from "./workspace-sidebar";
import {rememberReport,recalledReport,clearReportMemory,latestReport,setDashboardLocation,recalledFilters,rememberFilters, type FindingFilters} from "./report-memory";
import {sessionExpiredEvent} from "./session-expired";
import BrandHeader from "./brand-header";
import MobileNavigation from "./mobile-navigation";
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
import MemberControls from "./member-controls";
import DecisionLog from "./decision-log";
import ProjectScanChoice from "./project-scan-choice";
import ProjectSetup from "./project-setup";
import { notifySessionExpired } from "./session-expired";

type View = "overview" | "project" | "scan" | "findings" | "actions";
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
  const [projectId, setProjectId] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const focusPending = useRef(false);
  const [filters,setFilters] = useState<FindingFilters>({search:'',severity:'all',source:'all',package:'all',decision:'all'});
  const [decisionRevision,setDecisionRevision]=useState(0);
  const [decisions,setDecisions]=useState<Record<string,string>>({});
  const [decisionState,setDecisionState]=useState<'loading'|'ready'|'unavailable'|'demo'>('demo');
  useEffect(()=>{
    function refresh(event:Event){if((event as CustomEvent).detail?.reportId===report?.id)setDecisionRevision(n=>n+1);}
    window.addEventListener('shipcheck:decision-recorded',refresh);return()=>window.removeEventListener('shipcheck:decision-recorded',refresh);
  },[report?.id]);
  useEffect(()=>{
    let active=true;setDecisions({});
    if(!report || report.mode==='demo'){setDecisionState('demo');return;}
    setDecisionState('loading');
    fetch(`/api/scans/${encodeURIComponent(report.id)}`,{cache:'no-store'}).then(async r=>{
      if(!r.ok)throw Error('Decision history unavailable');
      const data=await r.json();if(!Array.isArray(data.decisions))throw Error('Decision history unavailable');
      const latest:Record<string,string>={};
      [...data.decisions].sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at)).forEach(d=>{if(d.action==='acknowledge'||d.action==='dismiss')latest[d.finding_id]=d.action;});
      if(active){setDecisions(latest);setDecisionState('ready');}
    }).catch(()=>{if(active)setDecisionState('unavailable');});
    return()=>{active=false;};
  },[report?.id,report?.mode,decisionRevision]);
  useEffect(() => {
    if(focusPending.current && !busy){
      const heading=mainRef.current?.querySelector('h1');
      if(heading){heading.tabIndex=-1;heading.focus();focusPending.current=false;}
    }
  },[view,selected,report,busy]);
  useEffect(() => {
    let active=true;
    let generation=0;
    async function restore(event?:Event) {
      const ticket=++generation;
      if(event)focusPending.current=true;
      const query=new URLSearchParams(window.location.search);
      const requested=query.get("view") || "overview";
      setView((["overview","project","scan","findings","actions"].includes(requested)?requested:"overview") as View);
      setError("");
      const id=query.get("report") || latestReport()?.id, finding=query.get("finding");
      if(!id){setReport(null);setSelected(null);return;}
      let loaded=recalledReport(id);
      if(!loaded){try{const r=await fetch(`/api/scans/${encodeURIComponent(id)}`);if(r.ok)loaded=(await r.json()).report;}catch{/* Offer recovery below. */}}
      if(!active || ticket!==generation)return;
      if(loaded){rememberReport(loaded);setReport(loaded);setFilters(recalledFilters(loaded.id));setSelected(loaded.findings.find(f=>f.id===finding)||null);
        query.set('report',loaded.id);window.history.replaceState(window.history.state,'',`/?${query}`);
        const listQuery=new URLSearchParams(query);listQuery.delete('finding');setDashboardLocation(requested,`/?${listQuery}`);
      }
      else {setReport(null);setSelected(null);setError("This report is unavailable. Sign in and reopen a saved report, or run the offline demo again.");}
    }
    function expire(){clearReportMemory();}
    void restore();window.addEventListener("popstate",restore);window.addEventListener(sessionExpiredEvent,expire);
    return ()=>{active=false;window.removeEventListener("popstate",restore);window.removeEventListener(sessionExpiredEvent,expire);};
  }, []);
  function navigate(v: View, current=report, finding:Finding|null=null) {
    focusPending.current=true;
    if(current){rememberReport(current);setFilters(recalledFilters(current.id));}
    const query=new URLSearchParams({view:v});
    if(current)query.set("report",current.id);
    setDashboardLocation(v,`/?${query}`);
    if(finding)query.set("finding",finding.id);
    window.history.pushState({...window.history.state,shipcheckView:true},"",`/?${query}`);
    setView(v);setReport(current);setSelected(finding);setError("");
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
          mode === "demo"
            ? { mode }
            : {
                mode,
                filename,
                content,
                research,
                ...(projectId ? { projectId } : {}),
              },
        ),
      });
      if (response.status === 401 && mode === "live") notifySessionExpired();
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "The scan could not finish.");
      navigate("overview",data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to run scan.");
    } finally {
      setBusy(false);
    }
  }
  function updateFilters(update:Partial<FindingFilters>){
    const next={...filters,...update};setFilters(next);if(report)rememberFilters(report.id,next);
  }
  const packageOptions=Array.from(new Set(report?.findings.flatMap(f=>f.evidence.flatMap(e=>e.dependency?[e.dependency.name]:[]))||[])).sort();
  const filteredFindings=report?.findings.filter(f=>{
    const search=[f.title,f.description,...f.evidence.flatMap(e=>[e.location,e.dependency?.name||''])].join(' ').toLowerCase();
    return (!filters.search.trim()||search.includes(filters.search.trim().toLowerCase())) && (filters.severity==='all'||f.severity===filters.severity) && (filters.source==='all'||f.evidence.some(e=>e.kind===filters.source)) && (filters.package==='all'||f.evidence.some(e=>e.dependency?.name===filters.package)) && (filters.decision==='all'||decisionState!=='ready'||(decisions[f.id]||'unreviewed')===filters.decision);
  })||[];
  const repairDependency=selected?.evidence.find(e=>e.dependency?.ecosystem==='npm')?.dependency;
  const blocked =
    report?.findings.filter((f) => f.severity === "high").length ?? 0;
  const incomplete =
    report?.checks.filter(
      (c) => c.state === "incomplete" || c.state === "snapshot",
    ).length ?? 0;
  return (
    <div className="app with-mobile-navigation">
      <BrandHeader />
      <MobileNavigation view={view} onNavigate={navigate} />
      <div className="shell">
        <WorkspaceSidebar view={view} onNavigate={navigate}/>
        <main ref={mainRef} id="main-content" tabIndex={-1}>
          <MemberControls
            refresh={report?.id || ""}
            onReport={(saved) => {
              navigate("overview",saved);
            }}
          />
          <div className="breadcrumb">
            WORKSPACE <ChevronRight size={12} />{" "}
            {selected
              ? "FINDING DETAILS"
              : view === "project"
                ? "PROJECT SETUP"
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
              <p>Reading inputs and collecting evidence.</p><div className="loading-cards" aria-hidden="true"><div/><div/><div/></div>
              <p className="muted">
                Live requests are bounded. Findings appear when the scan
                finishes.
              </p>
            </section>
          ) : selected ? (
            <>
              <button className="back" onClick={() => window.history.state?.shipcheckView ? window.history.back() : navigate(view,report)}>
                <ArrowLeft size={15} />
                Back to report
              </button>
              <div className="finding-workspace">
                <section className="finding-summary" aria-label="Finding and recommended action">
              <span className={"severity " + selected.severity}>
                {selected.severity === "review" ? "Review" : selected.severity}
              </span>
              <h1 className="detail-title">{selected.title}</h1>
              <p className="intro">{selected.description}</p>
              <section className="panel">
                <h2>Recommended action</h2>
                <p>{selected.action}</p>
                {repairDependency && <div className={styles.handoff}><Link className="button" href={`/repairs?package=${encodeURIComponent(repairDependency.name)}`}>Prepare dependency repair <ArrowUpRight size={15}/></Link><p>Choose the repository, then review the proposed target version before verification. This manifest scan does not establish repository ownership or confirm that the same dependency is present there.</p></div>}
                <div className="quiet-note">
                  <Info size={16} />
                  No code has been changed. Resolution requires independent
                  verification.
                </div>
              </section>
                </section>
              <section className="panel evidence-pane" aria-label="Source evidence">
                <div className="evidence-heading"><h2>Evidence</h2><span>{selected.evidence.length} source{selected.evidence.length === 1 ? "" : "s"}</span></div><p className="muted">Evidence recorded for this finding. Open the original source to check its context.</p>
                {selected.evidence.map((e, i) => (
                  <div className="evidence" key={i}>
                    <span className="evidence-kind">{e.kind === "advisory" ? "Advisory" : e.kind === "http" ? "HTTP observation" : "Code evidence"}</span>
                    <div className="code-label">{e.location}</div>
                    {e.dependency && <p className="evidence-dependency">{e.dependency.name}@{e.dependency.version}<br/><code>{e.dependency.path}</code></p>}
                    <pre>{e.excerpt}</pre>
                    {e.url && (
                      <SourcePreview title={e.location} excerpt={e.excerpt} url={e.url} retrievedAt={e.retrievedAt}/>
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
              </div>
              {report && (
                <DecisionLog
                  key={selected.id}
                  report={report}
                  findingId={selected.id}
                />
              )}
              {report?.explanations
                .filter((e) => e.findingId === selected.id)
                .map((e, i) => (
                  <section className="panel" key={i}>
                    <h2>{e.basis === "validated-selection" ? "Nemotron-selected scanner note" : "Scanner evidence note"}</h2>
                    <p>{e.basis ? e.explanation : selected.description}</p>
                    <small>
                      {e.basis === "validated-selection" ? "Selected verbatim from scanner-authored notes; no generated claims." : "Scanner fallback. Unvalidated model wording is not displayed."}
                    </small>
                  </section>
                ))}
            </>
          ) : view === "project" ? (
            <ProjectSetup />
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
                  <ProjectScanChoice
                    value={projectId}
                    onChange={setProjectId}
                  />
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
                    Prove ownership of your staging host, then select it for
                    bounded passive checks.
                  </p>
                  <button
                    className="button"
                    onClick={() => navigate("project")}
                  >
                    View project setup <ChevronRight size={16} />
                  </button>
                  <span className="neutral-badge">Verified members only</span>
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

                  <h2>
                    Scan. Check. Ship.
                  </h2>
                  <p>
                    Investigate findings, inspect supported fixes and review
                    the evidence before your next release.
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
                    <span>ShipCheck</span>
                  </div>
                  <div className="art-line" />
                  <div className="art-node">
                    <FileSearch size={24} />
                    <span>Evidence</span>
                  </div>
                </div>
              </section>
              <section className="workflow-cards" aria-label="Security workflow">
                <button className="workflow-card" onClick={() => navigate("scan")}><span className="workflow-icon"><ScanLine size={25}/></span><small>01 / SCAN</small><h2>Start with the evidence.</h2><p>Inspect dependencies and verified staging hosts. See exactly what was checked.</p><strong>Configure a scan →</strong></button>
                <Link className="workflow-card" href="/repairs"><span className="workflow-icon"><FlaskConical size={25}/></span><small>02 / CHECK</small><h2>A fix you can inspect.</h2><p>Review a supported dependency patch and test it in isolated compute.</p><strong>Open repair workspace →</strong></Link>
                <Link className="workflow-card" href="/repairs#repair-audit"><span className="workflow-icon"><ListChecks size={25}/></span><small>03 / REVIEW</small><h2>Keep the decision yours.</h2><p>Open a saved repair to review its audit trail, tests and draft PR evidence.</p><strong>Review saved repairs →</strong></Link>
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
                      : "Live assessment · see coverage for included checks"}
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
              {view === "findings" ? <p className={styles.compactVerdict}><strong>{report.status}</strong> · {blocked} high-severity findings · {incomplete} limited or incomplete checks. This assessment does not enforce a deployment gate. <button className="text-button" onClick={()=>navigate("overview")}>Review coverage</button></p> : <section data-status={report.status} className={"verdict " + (blocked ? "blocked" : "")}>
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
                    secure and does not enforce a deployment gate.
                  </p>
                </div>
              </section>}
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
                          onClick={() => navigate(view,report,f)}
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
                    <h2>{view === "findings" ? "Triage findings" : "Highest priority findings"}</h2>
                    <span>{report.findings.length} findings</span>
                  </div>
                  {view === 'findings' && <div className={styles.filters} aria-label="Filter findings">
                    <label className={styles.search}>Search findings<input type="search" value={filters.search} placeholder="Title, package or evidence location" onChange={e=>updateFilters({search:e.target.value})}/></label>
                    <label>Severity<select aria-label="Severity" value={filters.severity} onChange={e=>updateFilters({severity:e.target.value})}><option value="all">All severities</option><option value="high">High</option><option value="medium">Medium</option><option value="review">Review</option></select></label>
                    <label>Evidence type<select aria-label="Evidence type" value={filters.source} onChange={e=>updateFilters({source:e.target.value})}><option value="all">All evidence</option><option value="advisory">Advisory</option><option value="code">Code</option><option value="http">HTTP observation</option></select></label>
                    <label>Package<select aria-label="Package" value={filters.package} onChange={e=>updateFilters({package:e.target.value})}><option value="all">All packages</option>{packageOptions.map(p=><option key={p}>{p}</option>)}</select></label>
                    <label>Review decision<select aria-label="Review decision" disabled={decisionState!=='ready'} value={decisionState==='ready'?filters.decision:'all'} onChange={e=>updateFilters({decision:e.target.value})}><option value="all">All decisions</option><option value="unreviewed">No decision</option><option value="acknowledge">Acknowledged</option><option value="dismiss">Dismissed</option></select></label>
                    <p className={styles.decisionNote}>{decisionState==='demo'?'Demo decisions are not saved.':decisionState==='loading'?'Loading review decisions…':decisionState==='unavailable'?'Decision history unavailable. Findings are still shown.':'Review decisions do not resolve findings or change the scan verdict.'}{decisionState==='unavailable'&&<button className="text-button" onClick={()=>setDecisionRevision(n=>n+1)}>Retry decision history</button>}</p>
                    <div className={styles.filterSummary}><span role="status">{filteredFindings.length} of {report.findings.length} findings</span><button className="text-button" onClick={()=>updateFilters({search:'',severity:'all',source:'all',package:'all',decision:'all'})}>Clear filters</button></div>
                  </div>}
                  <div className="finding-list bounded-findings" tabIndex={0} aria-label="Findings list">
                    {(view === 'findings' ? filteredFindings : [...report.findings].sort((a,b)=>({high:0,medium:1,review:2}[a.severity]-{high:0,medium:1,review:2}[b.severity])).slice(0,3)).map((f) => (
                      <div className="finding-with-preview" key={f.id}><button
                        className="finding-row"
                        onClick={() => navigate(view,report,f)}
                      >
                        <span className={"severity " + f.severity}>
                          {f.severity === "review" ? "Review" : f.severity}
                        </span>
                        <span className="finding-copy">
                          <strong>{f.title}</strong>
                          <small>{f.evidence[0]?.location}{view==='findings' && decisionState==='ready' ? ` · ${decisions[f.id]==='acknowledge'?'Acknowledged':decisions[f.id]==='dismiss'?'Dismissed':'No decision recorded'}` : ''}</small>
                        </span>
                        <ArrowUpRight size={17} />
                      </button><Preview label="Quick view" title={f.title}><p>{f.description}</p><h3>Recommended action</h3><p>{f.action}</p><h3>Recorded evidence</h3>{f.evidence.map((e,i)=><section className="evidence" key={i}><strong>{e.location}</strong><pre>{e.excerpt}</pre></section>)}</Preview></div>
                    ))}
                    {view === 'findings' && report.findings.length>0 && !filteredFindings.length && <p className="empty">No findings match these filters. Clear filters or try a different search.</p>}
                    {!report.findings.length && (
                      <p className="empty">
                        No findings returned. Check the coverage below.
                      </p>
                    )}
                  </div>
                  {view === 'overview' && <button className="button" onClick={()=>navigate('findings')}>Review all {report.findings.length} findings <ArrowUpRight size={16}/></button>}
                </section>
              )}
              {view === 'overview' && <>
              <ReportInsights report={report}/>
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
                    <div className="coverage-row" data-state={c.state} key={c.name}>
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
                      <small>
                        {s.classification === "matched-advisory"
                          ? "Scanner-matched advisory · review applicability"
                          : "Watch · unconfirmed"}
                      </small>
                      <p>{s.excerpt}</p>
                      <SourcePreview title={s.title} excerpt={s.excerpt} url={s.url} retrievedAt={s.retrievedAt}/>
                      <small>
                        {s.matchedDependencies?.length
                          ? `OSV-matched: ${s.matchedDependencies.map((d) => `${d.ecosystem}: ${d.name}@${d.version}`).join("; ")}`
                          : s.classification === "matched-advisory"
                            ? "Package association unavailable"
                            : s.package && s.version ? `Search context: ${s.package}@${s.version} (not an affected-package assertion)` : "Package association unavailable"} ·{" "}
                        {s.publishedAt ?? "Publication date unknown"} ·
                        Retrieved{" "}
                        {new Date(s.retrievedAt).toLocaleString("en-GB")} ·{" "}
                        {s.extraction || "search-only"}
                      </small>
                    </article>
                  ))}
                </section>
              )}
              </>}
            </>
          )}
          <footer>
            <span>
              <CheckCheck size={14} />
              ShipCheck · Evidence before deployment
            </span>
            <span>Offline demo is temporary · Member scans are saved</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
