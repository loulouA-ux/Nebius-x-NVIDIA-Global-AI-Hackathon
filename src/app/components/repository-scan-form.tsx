'use client';
import {RefreshCw as UiRefreshCw} from 'lucide-react';

import { useEffect,useState,useRef } from 'react';
import Link from 'next/link';
import { Github,ArrowRight,Square } from 'lucide-react';
import styles from './repository-scan-form.module.css';
import {notifySessionExpired} from '../session-expired';
type Job={id:string;state:string;repository?:string;commit?:string;reportUrl?:string|null;failureCode?:string};
type Usage={configured:boolean;remaining:number;limit:number;reserved:number};
export default function RepositoryScanForm() {
  const [repository,setRepository]=useState(''),[privateAccess,setPrivateAccess]=useState(false);
  const [job,setJob]=useState<Job|null>(null),[usage,setUsage]=useState<Usage|null>(null);
  const [error,setError]=useState(''),[signedOut,setSignedOut]=useState(false),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
  const pending=useRef<{input:string;key:string}|null>(null);
  useEffect(()=>{const id=new URLSearchParams(location.search).get('job');if(id&&/^[a-f0-9-]{36}$/.test(id))setJob({id,state:'loading'});},[]);
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/usage',{cache:'no-store',signal:controller.signal}).then(async r=>{if(r.status===401){setSignedOut(true);notifySessionExpired();return;}if(!r.ok)throw Error('Usage is unavailable. Retry before starting a scan.');setSignedOut(false);setUsage(await r.json());}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});
    return()=>controller.abort();
  },[job?.id,retry]);
  useEffect(()=>{
    if(!job||['completed','failed','cancelled'].includes(job.state))return;
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    async function poll(){
      try {const r=await fetch(`/api/repository-scans/${job!.id}`,{cache:'no-store',signal:controller.signal});const data=await r.json();if(!r.ok){if(r.status===401){setSignedOut(true);notifySessionExpired();}throw Error(data.error||'Scan status is unavailable.');}setJob(data);setError('');if(!['completed','failed','cancelled'].includes(data.state))timer=setTimeout(poll,2500);}
      catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Unable to check scan.');}
    }
    void poll();return()=>{controller.abort();clearTimeout(timer);};
    // State changes are handled inside the polling loop without restarting requests.
  },[job?.id,retry]);
  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError('');
    try {
      const input=JSON.stringify({repository,privateAccess});
      if(pending.current?.input!==input)pending.current={input,key:crypto.randomUUID()};
      const r=await fetch('/api/repository-scans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({repository,privateAccess,requestKey:pending.current!.key})});
      const data=await r.json();if(!r.ok){if(r.status===401){setSignedOut(true);notifySessionExpired();}throw Error(data.error||'Could not queue this scan.');}
      pending.current=null;setJob(data);const url=new URL(location.href);url.searchParams.set('job',data.id);history.replaceState(history.state,'',url);
    }catch(e){setError(e instanceof Error?e.message:'Could not start scan.');}finally{setBusy(false);}
  }
  async function cancel(){if(!job)return;setBusy(true);try{const r=await fetch(`/api/repository-scans/${job.id}`,{method:'DELETE'});const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to cancel.');setJob(data);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  const active=!!job&&!['completed','failed','cancelled'].includes(job.state);
  return <form className={styles.form} onSubmit={submit} aria-labelledby="repository-scan-heading">
    <h2 id="repository-scan-heading">Scan a GitHub repository</h2>
    <p className={styles.muted}>Scans supported dependency files at one commit. Reports are private; code is not executed.</p>
    {signedOut?<p><Link href="/sign-in">Sign in with GitHub</Link> to save a repository scan.</p>:<>
    <label htmlFor="repository-url">GitHub repository URL<input id="repository-url" type="text" autoComplete="off" placeholder="https://github.com/your-team/your-repo" value={repository} onChange={e=>setRepository(e.target.value)} required maxLength={250} disabled={busy||active}/></label>
    <label className={styles.check}><input type="checkbox" checked={privateAccess} onChange={e=>setPrivateAccess(e.target.checked)} disabled={busy||active}/>Use my connected GitHub App for a private repository</label>
    <p className={styles.muted}>{usage?usage.configured?`${usage.remaining} of ${usage.limit} repository scans remaining this month.`:'Repository scanning has not been provisioned for this workspace yet.':'Checking your scan allowance…'} Accepted attempts count toward the allowance, including cancelled scans.</p>
    <div className={styles.actions}><button className="button primary" disabled={busy||active||!usage?.remaining}><Github size={18} aria-hidden="true"/>{busy?'Please wait…':'Scan repository'}</button></div>
    </>}
    {error&&<div role="alert"><p>{error}</p><button type="button" className="button" onClick={()=>setRetry(n=>n+1)}><UiRefreshCw size={16} aria-hidden="true" className="action-icon"/>Retry status check</button></div>}
    {job&&<section className={styles.status} aria-label="Repository scan status"><p role="status">{job.state==='queued'?'Queued — waiting for a scan worker.':job.state==='running'?'Scanning dependency files…':job.state==='completed'?'Scan finished. Open the report to review findings and coverage.':job.state==='failed'?'Scan failed. No clean result is implied.':job.state==='cancelled'?'Scan cancelled.':'Loading scan status…'}</p>{job.repository&&<p>{job.repository}</p>}{job.commit&&<p className={styles.muted}>Commit <code>{job.commit}</code></p>}<div className={styles.actions}>{job.state==='completed'&&job.reportUrl&&/^\/reports\/[a-f0-9-]{36}$/.test(job.reportUrl)&&<Link className="button primary" href={job.reportUrl}>Open private report<ArrowRight size={18} aria-hidden="true"/></Link>}{job.state==='queued'&&<button type="button" className="button" onClick={cancel} disabled={busy}><Square size={16} aria-hidden="true"/>Cancel queued scan</button>}</div></section>}
  </form>;
}
