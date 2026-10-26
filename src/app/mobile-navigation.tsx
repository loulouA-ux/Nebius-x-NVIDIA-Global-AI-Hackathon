"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {dashboardHref} from "./report-memory";
import {useEffect,useRef,useState} from 'react';
import {LayoutDashboard,ScanLine,ShieldAlert,ListChecks,Menu,FileSearch,X} from 'lucide-react';
type View='overview'|'scan'|'findings'|'project'|'actions';
export default function MobileNavigation({view,onNavigate}:{view:View|'repairs';onNavigate?:(view:View)=>void}) {
 const legacy=usePathname()==='/';
 const [expanded,setExpanded]=useState(false);
 const moreButton=useRef<HTMLButtonElement>(null);
 const morePanel=useRef<HTMLDivElement>(null);
 function close(){setExpanded(false);moreButton.current?.focus();}
 useEffect(()=>{if(expanded)morePanel.current?.querySelector<HTMLElement>("a,button")?.focus();},[expanded]);
 const primary=[{id:'overview' as const,label:legacy?'Overview':'Reports',icon:LayoutDashboard},{id:'scan' as const,label:'New scan',icon:ScanLine}];
 function item(id:View,label:string,Icon:typeof Menu){return onNavigate&&legacy?<button aria-current={view===id?'page':undefined} onClick={()=>{onNavigate(id);setExpanded(false);}}><Icon size={20}/><span>{label}</span></button>:<Link href={id==='overview'?'/reports':dashboardHref(id)} aria-current={view===id?'page':undefined}><Icon size={20}/><span>{label}</span></Link>;}
 return <nav className="mobile-navigation" aria-label="Main navigation" onKeyDown={event=>{if(expanded&&event.key==="Escape"){event.preventDefault();close();}}}>
  {expanded&&<div ref={morePanel} id="mobile-more" className="mobile-more"><div className="mobile-more-heading"><strong>Workspace</strong><button aria-label="Close more navigation" onClick={close}><X size={20}/></button></div>{item('project',legacy?'Project setup':'Staging hosts',FileSearch)}</div>}
  <div className="mobile-tabs">{primary.map(n=><div key={n.id}>{item(n.id,n.label,n.icon)}</div>)}<Link href="/repairs" aria-current={view==='repairs'?'page':undefined}><ListChecks size={20}/><span>Repairs</span></Link><button ref={moreButton} aria-expanded={expanded} aria-controls="mobile-more" onClick={()=>setExpanded(v=>!v)}><Menu size={20}/><span>More</span></button></div>
 </nav>;
}
