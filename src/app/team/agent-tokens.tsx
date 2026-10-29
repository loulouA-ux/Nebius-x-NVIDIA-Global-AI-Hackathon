'use client';
import {KeyRound as UiKeyRound,Copy as UiCopy,X as UiX,Unplug as UiUnplug} from 'lucide-react';

import {useEffect,useState} from 'react';
import styles from './team.module.css';
type Token={id:string;name:string;can_scan:boolean;expires_at:string;revoked_at:string|null};
export default function AgentTokens(){
  const [tokens,setTokens]=useState<Token[]>([]),[secret,setSecret]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function load(){const r=await fetch('/api/tokens',{cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error||'Could not load agent tokens.');setTokens(data.tokens);}
  useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
  async function act(method:string,payload:unknown){setBusy(true);setSecret('');setError('');try{const r=await fetch('/api/tokens',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw Error(data.error||'Token action failed.');if(data.token)setSecret(data.token);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <section aria-labelledby="agent-token-heading"><h2 id="agent-token-heading">CLI and agent access</h2><p>Tokens use your workspace allowance and expire in 30 days. They cannot manage billing or teammates.</p>
    {error&&<p role="alert">{error}</p>}
    <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void act('POST',{name:String(data.get('name')),canScan:data.get('canScan')==='on'});}}>
      <label>Token name<input name="name" required maxLength={80} placeholder="My development agent"/></label>
      <label className={styles.permission}><input name="canScan" type="checkbox"/> Allow starting and cancelling repository scans</label>
      <button className="button" disabled={busy}><UiKeyRound size={16} aria-hidden="true" className="action-icon"/>Create token</button>
    </form>
    {secret&&<div className="panel scope"><p>Shown once. Save as SHIPTESTED_API_TOKEN in your secret manager; set SHIPTESTED_API_ORIGIN to this site’s origin. Never share, commit or screenshot the token.</p><label>New token<input type="password" readOnly value={secret} autoComplete="off"/></label><button className="button" onClick={()=>{void navigator.clipboard.writeText(secret).catch(()=>setError('Could not copy. Select the token field and copy privately.'));}}><UiCopy size={16} aria-hidden="true" className="action-icon"/>Copy token</button><button className="button" onClick={()=>setSecret('')}><UiX size={16} aria-hidden="true" className="action-icon"/>Dismiss</button></div>}
    <ul>{tokens.map(t=><li key={t.id}><strong>{t.name}</strong> · {t.can_scan?'Scan and read':'Read only'} · {t.revoked_at?'Revoked':`Expires ${new Date(t.expires_at).toLocaleDateString()}`}{!t.revoked_at&&<button className="button" disabled={busy} onClick={()=>act('DELETE',{id:t.id})}><UiUnplug size={16} aria-hidden="true" className="action-icon"/>Revoke {t.name}</button>}</li>)}</ul>
    {!tokens.length&&<p>No agent tokens yet.</p>}
  </section>;
}
