'use client';
import {Github as LinkGithub} from 'lucide-react';

import {Github as UiGithub,Unplug as UiUnplug} from 'lucide-react';

import {useEffect,useState} from 'react';
type Status={connected:boolean;installUrl:string;expiresAt?:string;selected?:number;installations?:{id:number;account:string}[]};
export default function RepositoryConnection(){
 const [status,setStatus]=useState<Status|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const r=await fetch('/api/github/connect',{cache:'no-store'}),data=await r.json();if(!r.ok)throw Error(data.error||'Repository connection unavailable.');setStatus(data);}
 useEffect(()=>{void load().catch(e=>setMessage(e.message));},[]);
 async function act(action:'begin'|'select'|'disconnect',installationId?:number){setBusy(true);setMessage('');try{
  const r=await fetch('/api/github/connect',{method:action==='disconnect'?'DELETE':'POST',headers:{'Content-Type':'application/json'},body:action==='disconnect'?undefined:JSON.stringify({action,...(installationId?{installationId}:{})})});const data=await r.json();if(!r.ok)throw Error(data.error||'Connection action failed.');
  if(action==='begin'){const url=new URL(data.url);if(url.origin!=='https://github.com'||url.pathname!=='/login/oauth/authorize')throw Error('Invalid authorization destination.');window.location.assign(url.toString());return;}
  await load();
 }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <section aria-labelledby="repository-connection-heading"><h2 id="repository-connection-heading">GitHub repositories</h2><p>Sign-in proves your identity. Repository access is separate: install the app on selected repositories, then authorize the same GitHub account.</p>
 {message&&<p role="status">{message}</p>}
 {status&&<><a className="button" href={/^https:\/\/github\.com\/apps\/[a-z0-9-]+\/installations\/new$/.test(status.installUrl)?status.installUrl:undefined} target="_blank" rel="noopener noreferrer"><LinkGithub size={16} aria-hidden="true" className="action-icon"/>Choose repositories on GitHub</a><button className="button" disabled={busy} onClick={()=>act('begin')}><UiGithub size={16} aria-hidden="true" className="action-icon"/>{status.connected?'Renew GitHub authorization':'Authorize repository access'}</button>
 {status.connected&&<><p>Authorization expires {new Date(status.expiresAt!).toLocaleString()}. Access is rechecked before each scan. Disconnecting here removes the stored token; uninstall or revoke the app on GitHub to remove its provider permissions.</p>{!status.installations?.length?<p>No active installation is available to this account. Choose repositories on GitHub, then renew authorization.</p>:<ul>{status.installations.map(i=><li key={i.id}>{i.account}{status.selected===i.id?<strong>Selected</strong>:<button className="button" disabled={busy} onClick={()=>act('select',i.id)}><UiGithub size={16} aria-hidden="true" className="action-icon"/>Use {i.account}</button>}</li>)}</ul>}<button className="button" disabled={busy} onClick={()=>act('disconnect')}><UiUnplug size={16} aria-hidden="true" className="action-icon"/>Disconnect repository access</button></>}
 </>}
 </section>;
}
