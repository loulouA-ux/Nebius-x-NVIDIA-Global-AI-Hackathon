"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import useReportNavigation from "./use-report-navigation";
import NewScan from "./views/new-scan";
import ScanProgress from "./components/scan-progress";
import FindingDetail from "./views/finding-detail";
import FindingSurface from "./components/finding-surface";
import ReportView from "./views/report";
import HomeEmpty from "./views/home-empty";
import WorkspaceSidebar from "./workspace-sidebar";
import {rememberFilters, type FindingFilters} from "./report-memory";
import BrandHeader from "./brand-header";
import MobileNavigation from "./mobile-navigation";
import {CheckCheck,TriangleAlert} from "lucide-react";
import type { ScanReport } from "@/lib/types";
import MemberControls, {type Saved} from "./member-controls";
import ProjectSetup from "./project-setup";
import { notifySessionExpired } from "./session-expired";


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
export default function Home({initialReport,initialFinding,demoOnly=false}:{initialReport?:ScanReport;initialFinding?:string;demoOnly?:boolean}) {
  const [busy, setBusy] = useState(false);
  const [recent,setRecent]=useState<{signedIn:boolean;scans:Saved[];error:string}>({signedIn:false,scans:[],error:""});
  const [recorded,setRecorded]=useState<boolean|null>(null);
  useEffect(()=>{fetch("/api/demos?mode=availability").then(r=>r.json()).then(d=>setRecorded(d.recorded)).catch(()=>setRecorded(false));},[]);
  const [error, setError] = useState("");
  const {view,report,selected,setSelected,desktop,unavailable,mainRef,focusPending,filters,setFilters,navigate}=useReportNavigation(busy,setError,initialReport,initialFinding);
  const [filename, setFilename] = useState("package-lock.json");
  const [content, setContent] = useState(defaultManifest);
  const [research, setResearch] = useState(false);
  const [projectId, setProjectId] = useState("");
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
  const scanController=useRef<AbortController|null>(null);
  async function scan(mode: "demo" | "live", replay=false) {
    scanController.current=new AbortController();
    setBusy(true);
    setError("");
    setSelected(null);
    try {
      const response = replay ? await fetch("/api/demos?mode=recorded",{signal:scanController.current.signal}) : await fetch("/api/scans", {
        method: "POST",
        signal:scanController.current.signal,
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
      setError(e instanceof Error && e.name==="AbortError"?"Stopped waiting. Check saved reports before starting another scan.":e instanceof Error ? e.message : "Unable to run scan.");
    } finally {
      setBusy(false);
    }
  }
  function updateFilters(update:Partial<FindingFilters>){
    const next={...filters,...update};setFilters(next);if(report)rememberFilters(report.id,next);
  }
  const filteredFindings=report?.findings.filter(f=>{
    const search=[f.title,f.description,...f.evidence.flatMap(e=>[e.location,e.dependency?.name||''])].join(' ').toLowerCase();
    return (!filters.search.trim()||search.includes(filters.search.trim().toLowerCase())) && (filters.severity==='all'||f.severity===filters.severity) && (filters.source==='all'||f.evidence.some(e=>e.kind===filters.source)) && (filters.package==='all'||f.evidence.some(e=>e.dependency?.name===filters.package)) && (filters.decision==='all'||decisionState!=='ready'||(decisions[f.id]||'unreviewed')===filters.decision);
  })||[];
  const blocked =
    report?.findings.filter((f) => f.severity === "high").length ?? 0;
  const incomplete =
    report?.checks.filter(
      (c) => c.state === "incomplete" || c.state === "snapshot",
    ).length ?? 0;
  return (
    <div className="app with-mobile-navigation">
      <BrandHeader />
      <MobileNavigation demoOnly={demoOnly} view={view} onNavigate={navigate} />
      <div className="shell">
        <WorkspaceSidebar demoOnly={demoOnly} view={view} onNavigate={navigate}/>
        <main ref={mainRef} id="main-content" tabIndex={-1}>
          {!demoOnly&&<MemberControls onHistory={setRecent}
            refresh={report?.id || ""}
            onReport={(saved) => {
              navigate("overview",saved);
            }}
          />}
          {error && (
            <div role="alert" className="error">
              <TriangleAlert size={18} />
              {error}
            </div>
          )}
          {busy ? (
            <ScanProgress cancel={()=>scanController.current?.abort()}/>
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
            <NewScan filename={filename} setFilename={setFilename} content={content} setContent={setContent} research={research} setResearch={setResearch} projectId={projectId} setProjectId={setProjectId} scan={()=>scan('live')} demo={offline=>scan('demo',!offline&&recorded===true)} project={()=>navigate('project')}/>
          ) : unavailable ? (
            <section className="home-empty"><h1>Report unavailable</h1><p>This scan wasn’t saved here, or your account cannot access it. Sign in to reopen saved reports and keep future scans.</p><Link className="button primary" href="/sign-in">Sign in</Link> <button className="button" onClick={()=>scan('demo')}>Run offline demo</button></section>
          ) : !report ? (
            <HomeEmpty recent={recent} open={async id=>{try{const r=await fetch(`/api/scans/${encodeURIComponent(id)}`);if(!r.ok)throw Error("Saved report unavailable. Sign in again or retry.");navigate("overview",(await r.json()).report);}catch(e){setError((e as Error).message);}}} demo={offline=>scan("demo",!offline&&recorded===true)} scan={()=>navigate("scan")} recorded={recorded}/>
          ) : (
            <ReportView report={report} filtered={filteredFindings} filters={filters} update={updateFilters} open={f=>navigate('overview',report,f)} scan={()=>navigate('scan')} decisions={decisions} decisionState={decisionState}/>
          )}


        </main>
      </div>
    </div>
  );
}
