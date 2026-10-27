'use client';
import ThemeSwitch from './theme-switch';
import Link from 'next/link';
import Wordmark from './components/wordmark';
import MemberControls from './member-controls';
import {LayoutDashboard,Globe,ScanLine,ListChecks} from 'lucide-react';
type View='overview'|'project'|'scan'|'findings'|'actions';
export default function WorkspaceSidebar({view,demoOnly=false}:{demoOnly?:boolean;view:View|'repairs';onNavigate?:(v:View)=>void}){
 const items=[{id:'overview',label:'Reports',href:'/reports',icon:LayoutDashboard},{id:'scan',label:'New scan',href:'/scan',icon:ScanLine},{id:'repairs',label:'Repairs',href:'/repairs',icon:ListChecks},{id:'project',label:'Staging hosts',href:'/hosts',icon:Globe}];
 return <aside><div className="sidebar-brand"><Wordmark/></div><nav aria-label="Main navigation">{items.map(({id,label,href,icon:Icon})=><Link key={id} className="nav-link" href={href} aria-current={view===id?'page':undefined}><Icon size={17}/><span>{label}{demoOnly&&id!=='overview'&&<small>Sign in to use</small>}</span></Link>)}{!demoOnly&&<Link className="nav-link" href="/team">Workspace and team</Link>}{!demoOnly&&<Link className="nav-link" href="/usage">Usage and billing</Link>}</nav><div className="sidebar-account"><ThemeSwitch label/>{demoOnly?<p>Recorded demo · no live requests</p>:<MemberControls accountOnly refresh="" onReport={()=>{}}/>}</div></aside>;
}
