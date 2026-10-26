'use client';
import Link from 'next/link';
import {LayoutDashboard,ScanLine,ListChecks,Globe} from 'lucide-react';
type View='overview'|'scan'|'findings'|'project'|'actions';
export default function MobileNavigation({view}:{view:View|'repairs';onNavigate?:(view:View)=>void}){
 const items=[{id:'overview',label:'Reports',href:'/reports',icon:LayoutDashboard},{id:'scan',label:'Scan',href:'/scan',icon:ScanLine},{id:'repairs',label:'Repairs',href:'/repairs',icon:ListChecks},{id:'project',label:'Hosts',href:'/hosts',icon:Globe}];
 return <nav className="mobile-navigation" aria-label="Main navigation"><div className="mobile-tabs">{items.map(({id,label,href,icon:Icon})=><Link key={id} href={href} aria-current={view===id?'page':undefined}><Icon size={20}/><span>{label}</span></Link>)}</div></nav>;
}
