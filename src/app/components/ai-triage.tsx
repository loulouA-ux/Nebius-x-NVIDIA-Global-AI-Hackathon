'use client';
import {useEffect,useState} from 'react';
import {Cpu,Cloud,Search} from 'lucide-react';
export default function AiTriage({enabled,onChange}:{enabled:boolean;onChange:(v:boolean)=>void}){
 const [configured,setConfigured]=useState<boolean|null>(null);
 useEffect(()=>{let active=true;fetch('/api/health').then(r=>r.json()).then(d=>{if(active){const yes=Boolean(d.providers?.nebius&&d.providers?.tavily);setConfigured(yes);onChange(yes);}}).catch(()=>{if(active)setConfigured(false);});return()=>{active=false;};},[]);
 return <section className="ai-triage"><label className="checkbox"><input type="checkbox" role="switch" checked={enabled} onChange={e=>onChange(e.target.checked)}/>AI triage</label><p className="provider-icons"><span><Cpu size={16} aria-hidden="true"/>Nemotron</span><span><Cloud size={16} aria-hidden="true"/>Nebius</span><span><Search size={16} aria-hidden="true"/>Tavily</span></p><small>{configured===null?'Checking configuration…':configured?'Configured':'Not configured'} · configuration presence, not a provider health check.</small>{configured===false&&<p>Missing provider keys produce incomplete coverage.</p>}</section>;
}
