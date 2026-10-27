'use client';
import {useEffect,useState} from 'react';
import BrandHeader from '../brand-header';
import type {ScanReport} from '@/lib/types';
import RepositoryProvenance from '../components/repository-provenance';
export default function SharedReport(){
  const [report,setReport]=useState<ScanReport|null>(null),[error,setError]=useState('');
  useEffect(()=>{const controller=new AbortController();const token=location.hash.slice(1);if(!/^[a-f0-9]{64}$/.test(token)){setError('This share link is incomplete.');return;}
    fetch('/api/shared-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token}),signal:controller.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Report unavailable.');setReport(d.report);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[]);
  return <><BrandHeader/><main id="main-content" className="auth-layout"><section style={{width:'min(100%, 900px)',minWidth:0,overflowWrap:'anywhere'}}><h1>Shared security report</h1><p>Read-only link. Access may expire or be revoked by the owner.</p>{error?<p role="alert">{error}</p>:!report?<p role="status">Loading shared report…</p>:<><h2>{report.status}</h2><p>{report.dependencies.length} resolved dependencies · {report.findings.length} findings · {new Date(report.createdAt).toLocaleString()}</p><RepositoryProvenance report={report}/>{report.findings.map(f=><details className="panel scope" key={f.id}><summary>{f.severity} · {f.title}</summary><p>{f.description}</p><p>{f.action}</p>{f.evidence.map((e,i)=><blockquote key={i}><strong>{e.location}</strong><p>{e.excerpt}</p>{e.url&&/^https:\/\/(osv\.dev|github\.com)\//.test(e.url)&&<a href={e.url} target="_blank" rel="noopener noreferrer">Open source evidence ↗</a>}</blockquote>)}</details>)}<h2>Coverage</h2>{report.checks.map(c=><p key={c.name}><strong>{c.name}: {c.state}</strong><br/>{c.detail}</p>)}<p>These checks do not establish exploitability or guarantee security.</p></>}</section></main></>;
}
