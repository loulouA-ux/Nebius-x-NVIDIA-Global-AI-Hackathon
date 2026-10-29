'use client';
import WorkspaceSwitcher from './workspace-switcher';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LayoutDashboard,ScanLine,ListChecks,Globe,Menu,Users,CreditCard,ShieldCheck,Layers} from 'lucide-react';
type View='overview'|'scan'|'findings'|'project'|'actions'|'repairs'|'batches'|'security'|'team'|'usage';
export default function MobileNavigation({view,demoOnly=false}:{demoOnly?:boolean;view:View;onNavigate?:(view:'overview'|'scan'|'findings'|'project'|'actions')=>void}){
 const pathname=usePathname();
 const items=[{id:'overview',label:'Reports',href:'/reports',icon:LayoutDashboard},{id:'scan',label:'Scan',href:'/scan',icon:ScanLine},{id:'repairs',label:'Repairs',href:'/repairs',icon:ListChecks}];
 const more=[{label:'Staging hosts',href:'/hosts',icon:Globe},{label:'Workspace and team',href:'/team',icon:Users},{label:'Usage and billing',href:'/usage',icon:CreditCard},{label:'Security overview',href:'/security-overview',icon:ShieldCheck},{label:'Batch progress',href:'/batches',icon:Layers}];
 return <>{!demoOnly&&<div className="mobile-workspace-switcher"><WorkspaceSwitcher/></div>}<nav className="mobile-navigation" aria-label="Main navigation"><div className="mobile-tabs">{items.map(({id,label,href,icon:Icon})=><Link key={id} href={href} aria-current={view===id?'page':undefined} title={demoOnly&&id!=='overview'?'Sign in to use':undefined}><Icon size={20} aria-hidden="true"/><span>{label}</span></Link>)}<details className="workspace-more" key={pathname}><summary><Menu size={20} aria-hidden="true"/><span>More</span></summary><div className="workspace-more-menu">{more.map(({label,href,icon:Icon})=><Link key={href} href={href} aria-current={pathname===href?'page':undefined}><Icon size={18} aria-hidden="true"/>{label}</Link>)}</div></details></div></nav></>;
}
