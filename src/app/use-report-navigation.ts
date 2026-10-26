"use client";
import {usePathname} from 'next/navigation';
import {useState,useEffect,useRef} from 'react';
import type {Finding,ScanReport} from '@/lib/types';
import {rememberReport,recalledReport,clearReportMemory,latestReport,setDashboardLocation,recalledFilters,type FindingFilters} from './report-memory';
import {sessionExpiredEvent} from './session-expired';
export type View='overview'|'project'|'scan'|'findings'|'actions';
function navigationUrl(query:URLSearchParams){

 const view=query.get('view');if(view==='scan')return '/scan';if(view==='project')return '/hosts';
 const id=query.get('report'),finding=query.get('finding');
 return id?`/reports/${encodeURIComponent(id)}${finding?`/findings/${encodeURIComponent(finding)}`:''}`:'/reports';
}
export default function useReportNavigation(busy:boolean,setError:(s:string)=>void){
  const pathname=usePathname();
  const [view, setView] = useState<View>("overview");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [selected, setSelected] = useState<Finding | null>(null);
  const desktop=false;

  const [unavailable,setUnavailable]=useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const focusPending = useRef(false);
  const [navigationRevision,setNavigationRevision]=useState(0);
  const [filters,setFilters] = useState<FindingFilters>({search:'',severity:'all',source:'all',package:'all',decision:'all'});
  const lastFinding=useRef<string|null>(null),returnRow=useRef<string|null>(null);
  useEffect(() => {
    if(focusPending.current && !busy){
      const row=!selected&&returnRow.current?mainRef.current?.querySelector<HTMLElement>(`[data-finding="${CSS.escape(returnRow.current)}"]`):null;
      const heading=row||mainRef.current?.querySelector<HTMLElement>(selected&&desktop?'dialog h1':'h1');returnRow.current=null;
      if(heading){if(!row)heading.tabIndex=-1;heading.focus();focusPending.current=false;}
    }
  },[view,selected,report,busy,navigationRevision]);
  useEffect(() => {
    let active=true;
    let generation=0;
    async function restore(event?:Event) {
      const ticket=++generation;
      if(event)focusPending.current=true;
      const query=new URLSearchParams(window.location.search);
      const parts=window.location.pathname.split('/').filter(Boolean);
      if(parts[0]==='scan')query.set('view','scan');
      if(parts[0]==='hosts')query.set('view','project');
      if(parts[0]==='reports'&&parts[1]){query.set('view','overview');query.set('report',decodeURIComponent(parts[1]));if(parts[2]==='findings'&&parts[3])query.set('finding',decodeURIComponent(parts[3]));}
      if(event&&!query.get("finding"))returnRow.current=lastFinding.current;
      if(query.get("finding"))lastFinding.current=query.get("finding");
      let requested=query.get("view") || "overview";
      if(requested==='actions'||requested==='findings'){requested='overview';query.set('view',requested);window.history.replaceState(window.history.state,'',navigationUrl(query));}
      setView((["overview","project","scan","findings","actions"].includes(requested)?requested:"overview") as View);
      setError("");setUnavailable(false);
      const id=query.get("report") || latestReport()?.id, finding=query.get("finding");
      if(!id){setReport(null);setSelected(null);return;}
      let loaded=recalledReport(id);
      if(!loaded){try{const r=await fetch(id==='demo-offline'||id==='demo-recorded'?`/api/demos?mode=${id==='demo-offline'?'offline':'recorded'}`:`/api/scans/${encodeURIComponent(id)}`);if(r.ok){const data=await r.json();loaded=data.report||data;}}catch{/* Offer recovery below. */}}
      if(!active || ticket!==generation)return;
      if(loaded){rememberReport(loaded);setReport(loaded);setFilters(recalledFilters(loaded.id));setSelected(loaded.findings.find(f=>f.id===finding)||null);
        query.set('report',loaded.id);window.history.replaceState(window.history.state,'',navigationUrl(query));
        const listQuery=new URLSearchParams(query);listQuery.delete('finding');setDashboardLocation(requested,navigationUrl(listQuery));
      }
      else {setReport(null);setSelected(null);setUnavailable(true);}
    }
    function expire(){clearReportMemory();}
    void restore();window.addEventListener("popstate",restore);window.addEventListener(sessionExpiredEvent,expire);
    return ()=>{active=false;window.removeEventListener("popstate",restore);window.removeEventListener(sessionExpiredEvent,expire);};
  }, [pathname]);
  function navigate(v: View, current=report, finding:Finding|null=null) {
    if(v==='actions'||v==='findings')v='overview';
    lastFinding.current=finding?.id||null;returnRow.current=null;
    focusPending.current=true;setNavigationRevision(n=>n+1);
    if(current){rememberReport(current);setFilters(recalledFilters(current.id));}
    const query=new URLSearchParams({view:v});
    if(current)query.set("report",current.id);
    setDashboardLocation(v,navigationUrl(query));
    if(finding)query.set("finding",finding.id);
    window.history.pushState({...window.history.state,shipcheckView:true},"",navigationUrl(query));
    setView(v);setReport(current);setSelected(finding);setError("");setUnavailable(false);
  }
return {view,report,selected,setSelected,desktop,unavailable,mainRef,focusPending,filters,setFilters,navigate};}
