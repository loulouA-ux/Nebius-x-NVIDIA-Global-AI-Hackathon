'use client';
import {groupByPackage} from "@/lib/advisory-metadata";
import ThemeSwitch from '../theme-switch';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowRight,ScanLine,FileSearch,GitPullRequest} from 'lucide-react';
import type {ScanReport} from '@/lib/types';
import Logo from '../components/logo';
import Wordmark from '../components/wordmark';
import PartnerStrip from '../components/partner-strip';
import {verdictLabel,severityLabel,plural} from '../components/presentation';
import styles from './landing.module.css';
import Voyage from '../components/voyage/voyage';
import {reportEvents} from '../components/voyage/events';
const github='https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon';
export default function Landing({initialReport,demoOnly=false}:{initialReport?:ScanReport;demoOnly?:boolean}){
 const [report,setReport]=useState<ScanReport|null>(initialReport||null),[failed,setFailed]=useState(false);
 useEffect(()=>{if(initialReport)return;let active=true;fetch('/api/demos?mode=default').then(async r=>{if(!r.ok)throw Error();const data=await r.json();if(active)setReport(data);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[]);
 const demo=report?`/reports/${report.id}`:'/reports';
 return <div className={styles.landing}><header className={styles.header}><Wordmark/><nav aria-label="Main"><a href="#how">How it works</a><a href="#ai">AI triage</a><a href="#agents">For agents</a><a href={github}>GitHub</a>{!demoOnly&&<Link href="/sign-in">Sign in</Link>}</nav><ThemeSwitch/><Link className="button" href={demo}>Run the demo <ArrowRight size={16}/></Link></header>
 <main id="main-content" tabIndex={-1}><section className={styles.hero}><div className={styles.heroCopy}><h1>Check before you ship.</h1><div><p>ShipTested scans your lockfile, secrets and staging host, shows the source behind every finding, and tests fixes in a sandbox before you approve them.</p><div className={styles.actions}><Link className="button primary" href={demo}>Run the demo <ArrowRight size={17}/></Link><a className="button" href={github}>View source</a></div><small>Recorded demo · no account · MIT</small></div></div>
 {report?<Voyage mode="hero" events={reportEvents(report)} verdict={report.status} detail={`${report.findings.filter(f=>f.severity==='high').length} high · ${groupByPackage(report.findings).length===1&&groupByPackage(report.findings)[0].fixedVersion?`candidate → ${groupByPackage(report.findings)[0].fixedVersion}`:'review report'}`}/>:<p>{failed?'Demo evidence unavailable. Open Reports to retry.':'Loading recorded evidence…'}</p>}<PartnerStrip/></section>
 <section id="how" className={styles.section}><h2>From lockfile to a tested pull request.</h2><div className={styles.flow}>{[{icon:ScanLine,title:'Scan exact versions.',body:'Resolved packages are matched against OSV, secrets are masked, and verified staging hosts get passive checks.'},{icon:FileSearch,title:'See the evidence.',body:'Every finding links to its advisory, the exact lockfile path and the date it was retrieved.'},{icon:GitPullRequest,title:'Approve a tested fix.',body:'Your tests run before and after the patch in a sandbox. You decide whether the draft pull request is opened.'}].map(({icon:Icon,title,body},i)=><article key={title}><Icon size={25}/><span>{i+1} / {['Scan','Evidence','Repair'][i]}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
 <section id="ai" className={`${styles.section} ${styles.ai}`}><div><h2>AI explains.<br/>Rules decide.</h2><p>Nemotron and Tavily make triage faster. They never get the final word on what ships.</p></div><div><article><h3>Nemotron on Nebius</h3><p>Picks the most relevant scanner note for each finding, quoted word for word.</p></article><article><h3>Tavily research</h3><p>Live research with publication and retrieval dates, labelled unconfirmed until an advisory matches.</p></article><article><h3>Rules</h3><p>Set the verdict. No model can remove a finding or lower a severity.</p></article></div></section>
 <section id="agents" className={`${styles.section} ${styles.agents}`}><h2>Built for your AI agents too.</h2><p className={styles.development}>IN DEVELOPMENT</p><p>Planned: let Claude Code, Codex or Cursor check a release before they open a pull request. Same rules, same evidence, same verdict. Agents can propose repairs; only a person can approve the pull request. These integrations are not available in this preview.</p><div><span>MCP · planned</span><span>CLI · planned</span><span>Library · planned</span></div><p>People approve draft pull requests. ShipTested does not merge or deploy them.</p><Link className="button" href="/reports">Explore the reports <ArrowRight size={16}/></Link></section><section className={styles.section}><h2>Open a real report in ten seconds.</h2><p>A recorded live run on a synthetic storefront. No sign-up.</p><Link className="button" href={demo}>Run the demo <ArrowRight size={16}/></Link></section></main>
 <footer className={styles.footer}><span>ShipTested · by HeySalad · MIT</span><span><Link href="/privacy">Privacy</Link> · <Link href="/security">Security</Link></span><span>Nebius × NVIDIA Global AI Hackathon</span></footer></div>;
}
