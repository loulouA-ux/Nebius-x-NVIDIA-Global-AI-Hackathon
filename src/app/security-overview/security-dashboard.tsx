'use client';
import {Github as LinkGithub} from 'lucide-react';

import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {RefreshCw} from 'lucide-react';
import BrandHeader from '../brand-header';
import WorkspaceSidebar from '../workspace-sidebar';
import MobileNavigation from '../mobile-navigation';
import type {securityDashboard} from '@/lib/server/security-dashboard';
import {OverviewView,FindingsView,RepositoriesView,CoverageView,ProcessView,AdvisoryDrawer} from './views';
import styles from './security.module.css';

export type Data=Awaited<ReturnType<typeof securityDashboard>>;
export type Loaded=Extract<Data,{overview:unknown}>;
export type Nav=(changes:Record<string,string|null>,options?:{keepPage?:boolean})=>void;
const tabs=[['overview','Overview'],['findings','Remediation queue'],['repositories','Repositories'],['coverage','Coverage recovery'],['process','Batch process']] as const;
const ACTIVE_POLL_MS=10000;

export default function SecurityDashboard(){
 const params=useSearchParams(),router=useRouter(),pathname=usePathname();
 const [data,setData]=useState<Loaded|null>(null),[empty,setEmpty]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[signedOut,setSignedOut]=useState(false),[lastOk,setLastOk]=useState<string|null>(null);
 const advisoryKey=params.get('advisory'),listQuery=new URLSearchParams(params);listQuery.delete('advisory');
 const queryString=listQuery.toString(),refresh=useRef<()=>void>(()=>{});

 const nav:Nav=useCallback((changes,options)=>{
  const next=new URLSearchParams(params);
  for(const [k,v] of Object.entries(changes)){if(v===null||v==='')next.delete(k);else next.set(k,v);}
  if(!options?.keepPage&&!('page' in changes))next.delete('page');
  const qs=next.toString();router.replace(qs?`${pathname}?${qs}`:pathname,{scroll:false});
 },[params,pathname,router]);

 useEffect(()=>{
  let disposed=false,timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined,inFlight=false,unauthorized=false,active=false;
  async function load(){
   if(disposed||inFlight||document.hidden)return;
   clearTimeout(timer);inFlight=true;controller=new AbortController();setBusy(true);
   try{
    const response=await fetch(`/api/security${queryString?`?${queryString}`:''}`,{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});
    unauthorized=response.status===401||response.status===403;
    if(!response.ok){const body=await response.json().catch(()=>({}));throw Error(unauthorized?'Sign in to view your private batch.':response.status===404||response.status===400?String(body.error||'Not found.'):'Live updates are unavailable. Showing the last successful update.');}
    const body=await response.json() as Data;
    if(disposed)return;
    if(!body.batch){setEmpty(true);setData(null);}else{setEmpty(false);setData(body as Loaded);active=(body as Loaded).overview.active;}
    setError('');setSignedOut(false);setLastOk(new Date().toISOString());
   }catch(e){
    if(disposed||(e instanceof DOMException&&e.name==='AbortError'&&controller?.signal.aborted))return;
    setError(e instanceof Error&&!(e instanceof DOMException)?e.message:'Connection interrupted. Showing the last successful update.');
    setSignedOut(unauthorized);if(unauthorized)setData(null);
   }finally{inFlight=false;if(!disposed){setLoading(false);setBusy(false);if(!unauthorized&&active)timer=setTimeout(load,ACTIVE_POLL_MS);}}
  }
  refresh.current=()=>{unauthorized=false;void load();};
  const visible=()=>{if(document.hidden)clearTimeout(timer);else if(active)void load();};
  document.addEventListener('visibilitychange',visible);void load();
  return()=>{disposed=true;clearTimeout(timer);controller?.abort();document.removeEventListener('visibilitychange',visible);};
 },[queryString]);

 const view=data?.filters.view||(params.get('view')||'overview');
 const time=(v:string)=>new Date(v).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 return <div className="with-mobile-navigation"><BrandHeader/><MobileNavigation view="security"/><div className="shell"><WorkspaceSidebar view="security"/>
  <main id="main-content" tabIndex={-1} className={styles.page}>
   <header className={styles.heading}>
    <div><h1>Security overview</h1><p className={styles.lede}>Dependency advisory matches and coverage for one repository batch. Scan completion and security verdicts are reported separately.</p></div>
    <div className={styles.headingActions}>
     {data&&data.batches.length>1&&<label className={styles.select}><span>Batch</span><select value={data.batch.id} onChange={e=>nav({batch:e.target.value,advisory:null})}>{data.batches.map(b=><option key={b.id} value={b.id}>{b.title} · {b.total}</option>)}</select></label>}
     <button className="button" onClick={()=>refresh.current()} disabled={busy}><RefreshCw size={16} aria-hidden="true"/>{busy?'Refreshing…':'Refresh'}</button>
    </div>
   </header>
   {data&&<p className={styles.freshness} role="status">
    <span><strong>{data.batch.title}</strong> · {data.batch.total} selected · registered {time(data.batch.createdAt)}</span>
    <span>{data.overview.active?'Batch in progress · updates every 10 s while visible':'Batch finished · no automatic updates'}</span>
    <span>Last successful update {lastOk?time(lastOk):'—'}{data.overview.freshness.latestReportAt&&<> · newest report {time(data.overview.freshness.latestReportAt)}</>}</span>
   </p>}
   {error&&<div className={styles.alert} role="alert"><p>{error}{data&&!signedOut&&lastOk&&` Last successful update ${time(lastOk)}.`}</p>{signedOut&&<Link className="button" href="/sign-in"><LinkGithub size={16} aria-hidden="true" className="action-icon"/>Sign in with GitHub</Link>}</div>}
   {loading&&!data&&<div className={styles.skeleton} role="status" aria-live="polite">Loading security overview…</div>}
   {!loading&&empty&&!error&&<section className={styles.emptyState}><h2>No batch registered</h2><p>A batch appears here once its private repository selection is registered. Single scans remain in <Link href="/reports">Reports</Link>.</p></section>}
   {data&&<>
    <nav className={styles.tabs} aria-label="Security overview sections">{tabs.map(([id,label])=><Link key={id} href={`${pathname}?${tabHref(params,id)}`} scroll={false} aria-current={view===id?'page':undefined}>{label}</Link>)}</nav>
    {'fixFirst' in data&&<OverviewView data={data} nav={nav}/>}
    {'findings' in data&&<FindingsView data={data} nav={nav}/>}
    {'repositories' in data&&data.filters.view==='repositories'&&<RepositoriesView data={data} nav={nav}/>}
    {'repositories' in data&&data.filters.view==='coverage'&&<CoverageView data={data} nav={nav}/>}
    {'process' in data&&<ProcessView data={data} nav={nav}/>}
   </>}
   {data&&advisoryKey&&<AdvisoryDrawer batch={data.batch.id} advisoryKey={advisoryKey} onClose={()=>nav({advisory:null},{keepPage:true})}/>}
   <p className={styles.scope}>Scope: exact dependency versions in supported manifests, matched against OSV advisories. <strong>Blocked</strong> means a high-severity advisory matched an installed version; it is not confirmed exploitation. <strong>Checks passed</strong> means only the supported checks passed. Source code, Git history and application-level exploitability were not analysed. Deployment exposure is not recorded.</p>
  </main></div></div>;
}
function tabHref(params:URLSearchParams,view:string){const next=new URLSearchParams();const batch=params.get('batch');if(batch)next.set('batch',batch);if(view!=='overview')next.set('view',view);return next.toString();}
