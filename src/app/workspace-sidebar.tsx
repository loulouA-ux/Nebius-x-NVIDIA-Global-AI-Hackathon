"use client";
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import Wordmark from './components/wordmark';
import {useEffect,useState} from 'react';
import {dashboardHref} from './report-memory';
import {LayoutDashboard,FileSearch,ScanLine,ShieldAlert,ListChecks} from 'lucide-react';
type View='overview'|'project'|'scan'|'findings'|'actions';
export default function WorkspaceSidebar({view,onNavigate}:{view:View|'repairs';onNavigate?:(v:View)=>void}) {
 const legacy=usePathname()==='/';
 const [identity,setIdentity]=useState('Demo workspace');
 useEffect(()=>{fetch('/api/session').then(async r=>{if(r.ok){const d=await r.json();setIdentity(d.login || d.actor.id);}}).catch(()=>{});},[]);
 const items=[{id:'overview',label:legacy?'Overview':'Reports',icon:LayoutDashboard},{id:'project',label:legacy?'Project setup':'Staging hosts',icon:FileSearch},{id:'scan',label:'New scan',icon:ScanLine}] as const;
 return <aside><div className="sidebar-brand"><Wordmark/></div><div className="workspace"><div>{identity}</div></div><nav aria-label="Main navigation">{items.map(n=>onNavigate&&legacy?<button key={n.id} aria-current={view===n.id?'page':undefined} onClick={()=>onNavigate(n.id)}><n.icon size={17}/>{n.label}</button>:<Link key={n.id} className="nav-link" href={n.id==='overview'?'/reports':dashboardHref(n.id)} aria-current={view===n.id?'page':undefined}><n.icon size={17}/>{n.label}</Link>)}<Link className="nav-link" href="/repairs" aria-current={view==='repairs'?'page':undefined}><ListChecks size={17}/>Repairs &amp; audit trail</Link></nav></aside>;
}
