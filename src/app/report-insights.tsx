"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {ScanReport} from '@/lib/types';
import styles from './report-insights.module.css';

export function Preview({label,title,children}:{label:string;title:string;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false);
 useEffect(()=>{if(open){ref.current?.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};}},[open]);
 function close(){ref.current?.close();setOpen(false);trigger.current?.focus();}
 return <><button ref={trigger} type="button" className="button" onClick={()=>setOpen(true)}>{label}</button>{open&&<dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={e=>{e.preventDefault();close();}}><header><h2>{title}</h2><button className="button" onClick={close} autoFocus>Close</button></header><div className={styles.body}>{children}</div></dialog>}</>;
}
export function SourcePreview({title,excerpt,url,retrievedAt}:{title:string;excerpt:string;url?:string;retrievedAt?:string}){
 const safeUrl=url&&/^https?:\/\//i.test(url)?url:undefined;
 return <Preview label="Preview source" title={title}><p className={styles.note}>Recorded excerpt · this preview does not fetch or embed the external page.</p><pre className={styles.excerpt}>{excerpt}</pre>{retrievedAt&&<p>Retrieved {new Date(retrievedAt).toLocaleString('en-GB')}</p>}{safeUrl&&<a href={safeUrl} target="_blank" rel="noreferrer">Open original source in a new tab</a>}</Preview>;
}
export default function ReportInsights({report}:{report:ScanReport}){
 const counts=(['high','medium','review'] as const).map(level=>({level,count:report.findings.filter(f=>f.severity===level).length}));
 const total=report.findings.length;
 function download(){
  const cell=(v:string)=>'"'+(/^[=+@\-\t\r]/.test(v)?"'":"")+v.replaceAll('"','""')+'"';
  const rows=[['Title','Severity','Evidence location','Recommended action'],...report.findings.map(f=>[f.title,f.severity,f.evidence.map(e=>e.location).join('; '),f.action])];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`shipcheck-${report.id}-findings.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section className={styles.insights} aria-label="Scan data visualization"><div><h2>Findings by severity</h2><p className={styles.note}>{total} findings · {report.dependencies.length} resolved dependencies · {report.mode==='demo'?'Offline demonstration':'Live scan'}</p><div className={styles.bars}>{counts.map(({level,count})=><div className={styles.barRow} key={level}><span>{level==='review'?'Review':level==='high'?'High':'Medium'}</span><div className={styles.track}><span style={{width:`${total?count/total*100:0}%`}} data-severity={level}/></div><strong>{count}</strong></div>)}</div></div><div><h2>Check coverage</h2><p>{report.checks.filter(c=>c.state==='complete').length} of {report.checks.length} checks complete</p><p className={styles.note}>Incomplete, snapshot and out-of-scope checks are not counted as complete. These counts are not a security score.</p><Preview label="Preview findings CSV" title="Findings CSV"><p>{total} findings in this report. Export includes recorded evidence locations and recommended actions.</p><button className="button" onClick={download}>Download CSV</button><div className={styles.table}><table><thead><tr><th>Finding</th><th>Severity</th><th>Evidence</th><th>Action</th></tr></thead><tbody>{report.findings.map(f=><tr key={f.id}><td>{f.title}</td><td>{f.severity}</td><td>{f.evidence.map(e=>e.location).join('; ')}</td><td>{f.action}</td></tr>)}</tbody></table>{!total&&<p>No findings returned. Review coverage before making a decision.</p>}</div></Preview></div></section>;
}
