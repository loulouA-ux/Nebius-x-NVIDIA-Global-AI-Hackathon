'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import styles from './team.module.css';
import BrandHeader from '../brand-header';
type Data={actor:{id:string;workspaceId:string};workspaces:{id:string;name:string;plan:string;seat_limit:number;seats_used:number;role:string}[];members:{actor_id:string;role:string}[];events:{sequence:number;actor_id:string;event_type:string;subject_id:string;created_at:string}[]};
export default function Team(){
  const [data,setData]=useState<Data|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[invite,setInvite]=useState<{id:string;token:string}|null>(null);
  async function load(){const r=await fetch('/api/workspaces',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error||'Workspace unavailable.');setData(d);}
  useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
  async function action(payload:unknown){setBusy(true);setError('');try{const r=await fetch('/api/workspaces',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw Error(d.error||'Workspace action failed.');if(d.token)setInvite(d);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  const current=data?.workspaces.find(w=>w.id===data.actor.workspaceId);
  return <><BrandHeader/><main id="main-content" className={styles.page}><section className={styles.content}><Link href="/reports">← Reports</Link><h1>Workspace and team</h1>{error&&<p role="alert">{error} <Link href="/sign-in">Sign in</Link></p>}{!data?<p>Loading workspace…</p>:<>
    <label>Current workspace<select value={data.actor.workspaceId} disabled={busy} onChange={e=>{setInvite(null);void action({action:'switch',workspaceId:e.target.value});}}>{data.workspaces.map(w=><option key={w.id} value={w.id}>{w.name} · {w.id}</option>)}</select></label>
    <p>{current?.plan==='team'?'Team':'Free'} plan · {current?.seats_used} of {current?.seat_limit} seats occupied.</p>
    <h2>Members</h2><ul>{data.members.map(m=><li key={m.actor_id}>{m.actor_id} · {m.role}{current?.role==='owner'&&m.role!=='owner'&&<button className="button" disabled={busy} onClick={()=>action({action:'remove',actorId:m.actor_id})}>Remove member</button>}</li>)}</ul>
    {current?.role==='owner'&&<form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void action({action:'invite',githubId:String(f.get('githubId')),role:'member'});}}><h2>Invite a teammate</h2><p>Use their numeric GitHub account ID. Only that signed-in account can accept. An available Team seat is required.</p><label>GitHub account ID<input name="githubId" inputMode="numeric" pattern="[1-9][0-9]*" required/></label><button className="button" disabled={busy||current.plan!=='team'||current.seats_used>=current.seat_limit}>Create invitation</button></form>}
    {invite&&<section className="panel scope"><p>Send this one-time code privately to your teammate. It expires in seven days.</p><label>Invitation code<input readOnly value={invite.token}/></label><button className="button" disabled={busy} onClick={()=>{void action({action:'revokeInvite',id:invite.id});setInvite(null);}}>Revoke invitation</button></section>}
    <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void action({action:'accept',token:String(f.get('token')).trim()});}}><h2>Join a workspace</h2><label>Invitation code<input name="token" autoComplete="off" required pattern="[a-f0-9]{64}"/></label><button className="button" disabled={busy}>Accept invitation</button></form>
    <details className="panel scope"><summary>Workspace audit history</summary><ol>{data.events.map(e=><li key={e.sequence}>{new Date(e.created_at).toLocaleString()} · {e.actor_id} · {e.event_type.replaceAll('_',' ')} · {e.subject_id}</li>)}</ol></details>
    </>}</section></main></>;
}
