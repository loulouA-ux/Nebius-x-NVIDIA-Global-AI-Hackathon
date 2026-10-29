'use client';
import {useEffect,useId,useState} from 'react';
import Link from 'next/link';
import {Building2,Plus,RefreshCw} from 'lucide-react';
import {clearReportMemory} from './report-memory';
export default function WorkspaceSwitcher(){
 const id=useId();const [data,setData]=useState<{actor:{workspaceId:string};workspaces:{id:string;name:string;role:string}[]}|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(){try{const r=await fetch('/api/workspaces',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(r.status===401||r.status===403)return;if(!r.ok)throw Error('Workspaces could not load.');const d=await r.json();if(d.actor&&Array.isArray(d.workspaces))setData(d);setError('');}catch{setError('Workspaces could not load.');}}
 useEffect(()=>{void load();},[]);
 async function change(workspaceId:string){setBusy(true);setError('');try{const r=await fetch('/api/workspaces',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'switch',workspaceId}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Cannot switch workspace. Check your membership and retry.');clearReportMemory();location.assign('/reports');}catch(e){setError((e as Error).message);setBusy(false);}}
 if(!data&&!error)return null;
 return <section className="workspace-switcher" aria-label="Workspace selection">{data&&<><label htmlFor={id}><Building2 size={16} aria-hidden="true"/>Workspace</label><select id={id} value={data.actor.workspaceId} disabled={busy} onChange={e=>void change(e.target.value)}>{data.workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select><Link href="/team#new-workspace"><Plus size={14} aria-hidden="true"/>Create or manage</Link></>}{error&&<p role="alert">{error}<button className="button" onClick={()=>void load()}><RefreshCw size={14} aria-hidden="true"/>Retry</button></p>}{busy&&<p role="status">Switching workspace…</p>}</section>;
}
