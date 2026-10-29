'use client';
import ThemeSwitch from './theme-switch';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import Wordmark from './components/wordmark';
import MemberControls from './member-controls';
import {LayoutDashboard,Globe,ScanLine,ListChecks,Users,ShieldCheck,Layers,ChartNoAxesCombined} from 'lucide-react';
type View='overview'|'project'|'scan'|'findings'|'actions';
export default function WorkspaceSidebar({view,demoOnly=false}:{demoOnly?:boolean;view:View|'repairs'|'batches'|'security';onNavigate?:(v:View)=>void}){
 const pathname=usePathname();
 const items=[{id:'overview',label:'Reports',href:'/reports',icon:LayoutDashboard},{id:'scan',label:'New scan',href:'/scan',icon:ScanLine},{id:'repairs',label:'Repairs',href:'/repairs',icon:ListChecks},{id:'project',label:'Staging hosts',href:'/hosts',icon:Globe}];
 return <aside aria-label="Workspace navigation"><div className="sidebar-brand"><Wordmark/></div><nav aria-label="Main navigation">{items.map(({id,label,href,icon:Icon})=><Link key={id} className="nav-link" href={href} aria-current={view===id?'page':undefined}><Icon size={17} aria-hidden="true"/><span>{label}{demoOnly&&id!=='overview'&&<small>Sign in to use</small>}</span></Link>)}{!demoOnly&&<Link className="nav-link" href="/team" aria-current={pathname==='/team'?'page':undefined}><Users size={17} aria-hidden="true"/><span>Workspace and team</span></Link>}{!demoOnly&&<Link className="nav-link" href="/security-overview" aria-current={view==='security'?'page':undefined}><ShieldCheck size={17} aria-hidden="true"/><span>Security overview</span></Link>}{!demoOnly&&<Link className="nav-link" href="/batches" aria-current={view==='batches'?'page':undefined}><Layers size={17} aria-hidden="true"/><span>Batch progress</span></Link>}{!demoOnly&&<Link className="nav-link" href="/usage" aria-current={pathname==='/usage'?'page':undefined}><ChartNoAxesCombined size={17} aria-hidden="true"/><span>Usage and billing</span></Link>}</nav><div className="sidebar-account"><div className="sidebar-preferences"><ThemeSwitch label/></div>{demoOnly?<p>Recorded demo · no live requests</p>:<MemberControls accountOnly refresh="" onReport={()=>{}}/>}</div></aside>;
}
