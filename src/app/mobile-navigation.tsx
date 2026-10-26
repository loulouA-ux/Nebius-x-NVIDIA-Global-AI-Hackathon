"use client";
import {useState} from 'react';
import {LayoutDashboard,ScanLine,ShieldAlert,ListChecks,Menu,FileSearch,X} from 'lucide-react';
type View='overview'|'scan'|'findings'|'project'|'actions';
export default function MobileNavigation({view,onNavigate}:{view:View|'repairs';onNavigate?:(view:View)=>void}) {
 const [expanded,setExpanded]=useState(false);
 const primary=[{id:'overview' as const,label:'Overview',icon:LayoutDashboard},{id:'scan' as const,label:'New scan',icon:ScanLine},{id:'findings' as const,label:'Findings',icon:ShieldAlert}];
 function item(id:View,label:string,Icon:typeof Menu){return onNavigate?<button aria-current={view===id?'page':undefined} onClick={()=>{onNavigate(id);setExpanded(false);}}><Icon size={20}/><span>{label}</span></button>:<a href={`/?view=${id}`}><Icon size={20}/><span>{label}</span></a>;}
 return <nav className="mobile-navigation" aria-label="Main navigation">
  {expanded&&<div id="mobile-more" className="mobile-more"><div className="mobile-more-heading"><strong>Workspace</strong><button aria-label="Close more navigation" onClick={()=>setExpanded(false)}><X size={20}/></button></div>{item('project','Project setup',FileSearch)}{item('actions','Recommended actions',ListChecks)}<a href="/sign-in">Member sign in</a></div>}
  <div className="mobile-tabs">{primary.map(n=><div key={n.id}>{item(n.id,n.label,n.icon)}</div>)}<a href="/repairs" aria-current={view==='repairs'?'page':undefined}><ListChecks size={20}/><span>Repairs</span></a><button aria-expanded={expanded} aria-controls="mobile-more" onClick={()=>setExpanded(v=>!v)}><Menu size={20}/><span>More</span></button></div>
 </nav>;
}
