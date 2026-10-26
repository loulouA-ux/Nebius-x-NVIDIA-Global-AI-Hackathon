"use client";
import Link from 'next/link';
import {dashboardHref} from './report-memory';
import {LayoutDashboard,FileSearch,ScanLine,ShieldAlert,ListChecks} from 'lucide-react';
type View='overview'|'project'|'scan'|'findings'|'actions';
export default function WorkspaceSidebar({view,onNavigate}:{view:View|'repairs';onNavigate?:(v:View)=>void}) {
 const items=[{id:'overview',label:'Overview',icon:LayoutDashboard},{id:'project',label:'Project setup',icon:FileSearch},{id:'scan',label:'New scan',icon:ScanLine},{id:'findings',label:'Findings',icon:ShieldAlert},{id:'actions',label:'Recommended actions',icon:ListChecks}] as const;
 return <aside><div className="workspace"><span className="avatar">H</span><div>HeySalad<span>Development workspace</span></div></div><nav aria-label="Main navigation">{items.map(n=>onNavigate?<button key={n.id} aria-current={view===n.id?'page':undefined} onClick={()=>onNavigate(n.id)}><n.icon size={17}/>{n.label}</button>:<Link key={n.id} className="nav-link" href={dashboardHref(n.id)}><n.icon size={17}/>{n.label}</Link>)}<Link className="nav-link" href="/repairs" aria-current={view==='repairs'?'page':undefined}><ListChecks size={17}/>Repairs &amp; audit trail</Link></nav><div className="sidebar-footer"><p>Code security,<br/>backed by evidence.</p><small>Built by HeySalad</small></div></aside>;
}
