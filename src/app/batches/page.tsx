'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,RefreshCw,Search} from 'lucide-react';
import BrandHeader from '../brand-header';
import WorkspaceSidebar from '../workspace-sidebar';
import MobileNavigation from '../mobile-navigation';
import {batchStates,batchLabels,type BatchProgress,type BatchState} from '@/lib/batch-progress';
import styles from './batches.module.css';

export default function Batches(){
 const [batch,setBatch]=useState<BatchProgress|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[signedOut,setSignedOut]=useState(false);
 const [search,setSearch]=useState(''),[filter,setFilter]=useState<BatchState|'all'>('all');
 const refresh=useRef<()=>void>(()=>{});
 useEffect(()=>{
  let disposed=false,timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined,inFlight=false,unauthorized=false;
  async function load(){
   if(disposed||inFlight||document.hidden)return;
   clearTimeout(timer);inFlight=true;controller=new AbortController();setBusy(true);
   try{
    const response=await fetch('/api/batches',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
    unauthorized=response.status===401||response.status===403;
    if(!response.ok)throw Error(unauthorized?'Sign in to view your private batch.':'Live updates are unavailable. Showing the last successful update; retrying automatically.');
    const data=await response.json();if(!disposed){setBatch(data.batch);setError('');setSignedOut(false);}
   }catch(e){if(!disposed){setError(unauthorized?'Sign in to view your private batch.':e instanceof Error&&e.message.startsWith('Live updates')?e.message:'Connection interrupted. Showing the last successful update; retrying automatically.');setSignedOut(unauthorized);if(unauthorized)setBatch(null);}}
   finally{inFlight=false;if(!disposed){setLoading(false);setBusy(false);if(!unauthorized)timer=setTimeout(load,5000);}}
  }
  refresh.current=()=>{unauthorized=false;void load();};
  const visible=()=>{if(document.hidden)clearTimeout(timer);else void load();};
  document.addEventListener('visibilitychange',visible);void load();
  return()=>{disposed=true;clearTimeout(timer);controller?.abort();document.removeEventListener('visibilitychange',visible);};
 },[]);
 const rows=batch?.entries.filter(e=>(filter==='all'||e.state===filter)&&e.repository.toLowerCase().includes(search.toLowerCase().trim()))||[];
 const formatTime=(value:string)=>new Date(value).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
 return <div className="with-mobile-navigation"><BrandHeader/><MobileNavigation view="batches"/><div className="shell"><WorkspaceSidebar view="batches"/><main id="main-content" tabIndex={-1} className={styles.page}>
  <div className={styles.heading}><div><h1>Batch progress</h1><p className={styles.muted}>{batch?.title||'Your latest repository batch'}</p></div><div className={styles.actions}><Link href="/security-overview">Security overview</Link><Link href="/usage">Workspace usage</Link><button className="button" onClick={()=>refresh.current()} disabled={busy}><RefreshCw size={16} aria-hidden="true"/>{busy?'Refreshing…':'Refresh'}</button></div></div>
  <p className={styles.sync} role="status">{error?'Live updates paused':batch?`${batch.finished===batch.total?'Batch finished · ':''}Updates every 5 seconds · Last checked ${formatTime(batch.checkedAt)}`:loading?'Loading batch…':'No batch loaded'}</p>
  {error&&<div className={styles.error} role="alert"><p>{error}</p>{signedOut&&<Link className="button" href="/sign-in">Sign in with GitHub</Link>}</div>}
  {!loading&&!error&&!batch&&<section className={styles.empty}><h2>No batch registered</h2><p>Your private batch selection will appear here once it has been registered.</p><Link href="/reports">View saved reports</Link></section>}
  {batch&&<>
   <section className={styles.progress} aria-label="Batch completion"><div><h2>{batch.finished} of {batch.total} repositories finished</h2><span>{Math.round(batch.finished/batch.total*100)}%</span></div><progress max={batch.total} value={batch.finished} aria-label="Repositories in a terminal state, including skips"/><p>{batch.counts.completed} scans completed · {batch.counts.skipped} skipped · {batch.counts.failed+batch.counts.cancelled} failed or cancelled</p><p className={styles.muted}>Finished includes skips. Completed scans can still have findings or incomplete coverage. Waiting entries have not been accepted by the API.</p></section>
   <div className={styles.filters} role="group" aria-label="Filter by scan state"><button aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All <strong>{batch.total}</strong></button>{batchStates.map(state=><button key={state} aria-pressed={filter===state} data-state={state} onClick={()=>setFilter(state)}>{batchLabels[state]} <strong>{batch.counts[state]}</strong></button>)}</div>
   <div className={styles.searchRow}><label className={styles.search}><Search size={17} aria-hidden="true"/><span className={styles.srOnly}>Search repositories</span><input type="search" placeholder="Search repositories" value={search} onChange={e=>setSearch(e.target.value)}/></label><p className={styles.muted}>{rows.length} of {batch.total} repositories shown</p></div>
   <div className={styles.tableWrap}><table className={styles.table}><caption className={styles.srOnly}>Repository scan progress and report verdicts</caption><thead><tr><th scope="col">Repository</th><th scope="col">Progress</th><th scope="col">Verdict / detail</th><th scope="col">Report</th></tr></thead><tbody>{rows.map(entry=><tr key={entry.repository}><th scope="row"><a href={`https://github.com/${entry.repository}`} target="_blank" rel="noreferrer">{entry.repository}<ArrowUpRight size={13} aria-label="opens GitHub in a new tab"/></a></th><td><span className={styles.state} data-state={entry.state}>{batchLabels[entry.state]}</span></td><td className={styles.detail}>{entry.detail||entry.verdict||(entry.state==='completed'?'Report unavailable':entry.state==='waiting'?'Not submitted yet':entry.state==='queued'?'Waiting for the worker':entry.state==='running'?'Checking dependency files':'—')}</td><td>{entry.reportUrl?<Link href={entry.reportUrl}>Open report<span className={styles.srOnly}> for {entry.repository}</span></Link>:<span className={styles.muted}>—</span>}</td></tr>)}</tbody></table></div>
   {!rows.length&&<p className={styles.empty}>No repositories match this search and filter. <button className="button" onClick={()=>{setSearch('');setFilter('all');}}>Clear filters</button></p>}
  </>}
 </main></div></div>;
}
