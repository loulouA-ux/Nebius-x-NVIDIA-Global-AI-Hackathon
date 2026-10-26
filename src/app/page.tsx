"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import FindingDetail from "./views/finding-detail";
import FindingSurface from "./components/finding-surface";
import ReportView from "./views/report";
import HomeEmpty from "./views/home-empty";
import AiTriage from "./components/ai-triage";
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
  const [desktop,setDesktop]=useState(false);
  useEffect(()=>{const m=matchMedia("(min-width:1024px)");const update=()=>setDesktop(m.matches);update();m.addEventListener("change",update);return()=>m.removeEventListener("change",update);},[]);
  const [recorded,setRecorded]=useState<boolean|null>(null);
  useEffect(()=>{fetch("/api/demos?mode=availability").then(r=>r.json()).then(d=>setRecorded(d.recorded)).catch(()=>setRecorded(false));},[]);
  const [error, setError] = useState("");
  const [unavailable,setUnavailable]=useState(false);
  const [filename, setFilename] = useState("package-lock.json");
  const [content, setContent] = useState(defaultManifest);
  const [research, setResearch] = useState(false);
  const [projectId, setProjectId] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const focusPending = useRef(false);
  const [navigationRevision,setNavigationRevision]=useState(0);
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
      const heading=mainRef.current?.querySelector<HTMLElement>(selected&&desktop?'dialog h1':'h1');
      if(heading){heading.tabIndex=-1;heading.focus();focusPending.current=false;}
    }
  },[view,selected,report,busy,navigationRevision]);
  useEffect(() => {
    let active=true;
    let generation=0;
    async function restore(event?:Event) {
      const ticket=++generation;
      if(event)focusPending.current=true;
      const query=new URLSearchParams(window.location.search);
      let requested=query.get("view") || "overview";
      if(requested==='actions'||requested==='findings'){requested='overview';query.set('view',requested);window.history.replaceState(window.history.state,'',`/?${query}`);}
      setView((["overview","project","scan","findings","actions"].includes(requested)?requested:"overview") as View);
      setError("");setUnavailable(false);
      const id=query.get("report") || latestReport()?.id, finding=query.get("finding");
      if(!id){setReport(null);setSelected(null);return;}
      let loaded=recalledReport(id);
      if(!loaded){try{const r=await fetch(id==='demo-offline'||id==='demo-recorded'?`/api/demos?mode=${id==='demo-offline'?'offline':'recorded'}`:`/api/scans/${encodeURIComponent(id)}`);if(r.ok){const data=await r.json();loaded=data.report||data;}}catch{/* Offer recovery below. */}}
      if(!active || ticket!==generation)return;
      if(loaded){rememberReport(loaded);setReport(loaded);setFilters(recalledFilters(loaded.id));setSelected(loaded.findings.find(f=>f.id===finding)||null);
        query.set('report',loaded.id);window.history.replaceState(window.history.state,'',`/?${query}`);
        const listQuery=new URLSearchParams(query);listQuery.delete('finding');setDashboardLocation(requested,`/?${listQuery}`);
      }
      else {setReport(null);setSelected(null);setUnavailable(true);}
    }
    function expire(){clearReportMemory();}
    void restore();window.addEventListener("popstate",restore);window.addEventListener(sessionExpiredEvent,expire);
    return ()=>{active=false;window.removeEventListener("popstate",restore);window.removeEventListener(sessionExpiredEvent,expire);};
  }, []);
  function navigate(v: View, current=report, finding:Finding|null=null) {
    if(v==='actions'||v==='findings')v='overview';
    focusPending.current=true;setNavigationRevision(n=>n+1);
    if(current){rememberReport(current);setFilters(recalledFilters(current.id));}
    const query=new URLSearchParams({view:v});
    if(current)query.set("report",current.id);
    setDashboardLocation(v,`/?${query}`);
    if(finding)query.set("finding",finding.id);
    window.history.pushState({...window.history.state,shipcheckView:true},"",`/?${query}`);
    setView(v);setReport(current);setSelected(finding);setError("");setUnavailable(false);
  }
  async function scan(mode: "demo" | "live", replay=false) {
    setBusy(true);
    setError("");
    setSelected(null);
    try {
      const response = replay ? await fetch("/api/demos?mode=recorded") : await fetch("/api/scans", {
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
              {desktop&&report&&<ReportView report={report} filtered={filteredFindings} filters={filters} update={updateFilters} open={f=>navigate('overview',report,f)} scan={()=>navigate('scan')} decisions={decisions} decisionState={decisionState}/>}
              <FindingSurface desktop={desktop} close={()=>window.history.state?.shipcheckView ? window.history.back() : navigate('overview',report)}>
              {report&&<FindingDetail finding={selected} report={report} close={()=>window.history.state?.shipcheckView ? window.history.back() : navigate('overview',report)}/>}
              </FindingSurface>
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
                  <AiTriage enabled={research} onChange={setResearch}/>
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
                <section className="panel demo-panel"><button className="button" onClick={()=>scan("demo",true)}>Recorded live run</button>
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
          ) : unavailable ? (
            <section className="home-empty"><h1>Report unavailable</h1><p>This scan wasn’t saved here, or your account cannot access it. Sign in to reopen saved reports and keep future scans.</p><Link className="button primary" href="/sign-in">Sign in</Link> <button className="button" onClick={()=>scan('demo')}>Run offline demo</button></section>
          ) : !report ? (
            <HomeEmpty demo={offline=>scan("demo",!offline&&recorded===true)} scan={()=>navigate("scan")} recorded={recorded}/>
          ) : (
            <ReportView report={report} filtered={filteredFindings} filters={filters} update={updateFilters} open={f=>navigate('overview',report,f)} scan={()=>navigate('scan')} decisions={decisions} decisionState={decisionState}/>
          )}

          <footer>
            <span>
              <CheckCheck size={14} />
              ShipCheck · Evidence before deployment
            </span>
            <span>Built by HeySalad</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
