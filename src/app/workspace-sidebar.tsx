"use client";
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {dashboardHref} from './report-memory';
import {LayoutDashboard,FileSearch,ScanLine,ShieldAlert,ListChecks} from 'lucide-react';
type View='overview'|'project'|'scan'|'findings'|'actions';
export default function WorkspaceSidebar({view,onNavigate}:{view:View|'repairs';onNavigate?:(v:View)=>void}) {
 const [identity,setIdentity]=useState('Demo workspace');
 useEffect(()=>{fetch('/api/session').then(async r=>{if(r.ok){const d=await r.json();setIdentity(d.login || d.actor.id);}}).catch(()=>{});},[]);
 const items=[{id:'overview',label:'Overview',icon:LayoutDashboard},{id:'project',label:'Project setup',icon:FileSearch},{id:'scan',label:'New scan',icon:ScanLine},{id:'findings',label:'Findings',icon:ShieldAlert},{id:'actions',label:'Recommended actions',icon:ListChecks}] as const;
 return <aside><div className="workspace"><div>{identity}</div></div><nav aria-label="Main navigation">{items.map(n=>onNavigate?<button key={n.id} aria-current={view===n.id?'page':undefined} onClick={()=>onNavigate(n.id)}><n.icon size={17}/>{n.label}</button>:<Link key={n.id} className="nav-link" href={dashboardHref(n.id)}><n.icon size={17}/>{n.label}</Link>)}<Link className="nav-link" href="/repairs" aria-current={view==='repairs'?'page':undefined}><ListChecks size={17}/>Repairs &amp; audit trail</Link></nav></aside>;
}
