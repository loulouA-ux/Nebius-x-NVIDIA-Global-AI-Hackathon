"use client";
import {useEffect,useState} from "react";
import type {RepairPlan} from "@/lib/repair/plan";
import type {RepairRun} from "@/lib/repair/runner";
type Repo={id:number;full_name:string};
type AuditEvent={id:string;event_type:string;actor_id:string;created_at:string;details:Record<string,string|number|boolean>};
const eventLabels:Record<string,string>={proposal_created:"Repair proposed",verification_started:"Sandbox verification started",verification_passed:"Sandbox verification passed",verification_failed:"Verification failed",patch_approved:"Exact patch approved",publication_commit_created:"Git commit created",draft_pr_created:"Draft PR created",draft_pr_reconciled:"Existing draft PR confirmed"};
type Repair={auditTrail?:AuditEvent[];id:string;state:string;plan:RepairPlan;result?:RepairRun;approvalHash?:string;url?:string;repository:Repo};
type SavedRepair={id:string;state:string;package_name:string;repository_name:string;created_at:string};
export default function Repairs(){
 const [saved,setSaved]=useState<SavedRepair[]>([]);
 const [repos,setRepos]=useState<Repo[]>([]),[repo,setRepo]=useState(""),[pkg,setPkg]=useState(""),[repair,setRepair]=useState<Repair|null>(null),[busy,setBusy]=useState(""),[error,setError]=useState(""),[approved,setApproved]=useState(false);
 async function api(path:string,data?:unknown){const r=await fetch(path,data?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}:{cache:"no-store"});const result=await r.json();if(!r.ok)throw Error(result.error||"Request failed.");return result;}
 async function refreshSaved(){const d=await api("/api/repairs");setSaved(d.repairs);}
 async function openSaved(id:string){setBusy("Loading saved repair…");setError("");setApproved(false);try{setRepair(await api(`/api/repairs/${id}`));}catch(e){setError(e instanceof Error?e.message:"Unable to load repair.");}finally{setBusy("");}}
 useEffect(()=>{api("/api/repositories").then(d=>setRepos(d.repositories)).catch(e=>setError(e.message));refreshSaved().catch(e=>setError(e.message));},[]);
 async function propose(event:React.FormEvent){event.preventDefault();setBusy("Preparing advisory evidence…");setError("");setApproved(false);try{const proposed=await api("/api/repairs",{repositoryId:Number(repo),packageName:pkg});setRepair(await api(`/api/repairs/${proposed.id}`));}catch(e){setError(e instanceof Error?e.message:"Proposal failed.");}finally{setBusy("");void refreshSaved().catch(()=>{});}}
 async function action(kind:"verify"|"approve"|"reconcile"){
  if(!repair)return;setBusy(kind==="verify"?"Running baseline and patched sandboxes…":kind==="reconcile"?"Checking GitHub for the existing PR…":"Creating the approved draft PR…");setError("");
  try{await api(`/api/repairs/${repair.id}`,{action:kind,...(kind==="approve"?{approvalHash:repair.approvalHash}:{})});setRepair(await api(`/api/repairs/${repair.id}`));setApproved(false);}
  catch(e){setError(e instanceof Error?e.message:"Action failed.");try{setRepair(await api(`/api/repairs/${repair.id}`));}catch{ /* Keep the last known evidence; do not repeat writes. */ }}finally{setBusy("");void refreshSaved().catch(()=>{});}
 }
 const box={padding:24,border:"1px solid #cbd5e1",borderRadius:16,marginTop:20,background:"white"};
 return <main className="repair-workspace" style={{maxWidth:1100,margin:"32px auto",padding:24}}>
  <div className="repair-brand"><a className="brand" href="/"><img src="/brand/symbol.svg" width={48} height={42} alt=""/>ShipCheck</a><span>Scan. Check. Ship.</span></div>
  <a href="/">← ShipCheck dashboard</a><h1>Verify a dependency repair</h1>
  <p>Choose an authorised repository, inspect the proposal, and test the change in isolated compute before approving a draft pull request.</p>
  <p><a href="/sign-in">Sign in with GitHub</a> · Repository access is separate from sign-in. This preview supports small npm projects with direct dependencies with supported semver ranges and a committed lockfile.</p>
  <section id="repair-audit" style={box}><h2>Saved repairs</h2><p>Your latest 25 repairs. Reopening a repair does not repeat a test or create a PR.</p><button className="button" disabled={!!busy} onClick={()=>refreshSaved().catch(e=>setError(e.message))}>Refresh saved repairs</button>{saved.length?<ul>{saved.map(r=><li key={r.id}><button disabled={!!busy} onClick={()=>openSaved(r.id)}>{r.repository_name} · {r.package_name} · {r.state}</button> <time>{new Date(r.created_at).toLocaleString()}</time></li>)}</ul>:<p>No saved repairs.</p>}</section>
  <form onSubmit={propose} style={box}><h2>1. Select a repository and dependency</h2>
   <label htmlFor="repository">GitHub repository</label><select id="repository" value={repo} required onChange={e=>setRepo(e.target.value)} style={{display:"block",padding:10,width:"100%"}}><option value="">Choose a connected repository</option>{repos.map(r=><option key={r.id} value={r.id}>{r.full_name}</option>)}</select>
   <label htmlFor="dependency">Dependency package name</label><input id="dependency" value={pkg} onChange={e=>setPkg(e.target.value)} placeholder="lodash" required maxLength={150} style={{display:"block",padding:10,width:"100%",marginBottom:16}}/>
   <button className="button primary" disabled={!!busy||!repo}>Propose repair</button>
  </form>
  <p role="status" aria-live="polite">{busy}</p><p role="alert">{error}</p>
  {repair&&<>
   <section style={box}><h2>2. Review the proposal</h2><p><strong>{repair.plan.packageName}</strong>: {repair.plan.fromVersion} → {repair.plan.toVersion}</p><p>Status: {repair.state}</p><p>Source commit: <code>{repair.plan.baseCommit}</code></p>
    <ul>{repair.plan.sourceUrls.map(url=><li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul>
    <details><summary>Compare package.json</summary><h3>Before</h3><pre style={{overflow:"auto"}}>{repair.plan.manifestBefore}</pre><h3>Proposed</h3><pre style={{overflow:"auto"}}>{repair.plan.manifestAfter}</pre></details>
    <ul>{repair.plan.limitations.map(v=><li key={v}>{v}</li>)}</ul>
    <button className="button primary" disabled={!!busy||repair.state!=="proposed"} onClick={()=>action("verify")}>Run isolated verification</button><p>Runs baseline and patched tests. Compute is enabled only within the configured preview budget.</p>
   </section>
   {repair.result&&<section style={box}><h2>3. Inspect execution evidence</h2><p>Result: {repair.result.status} · Cleanup: {repair.result.cleanupComplete?"complete":"failed"}</p>
    {(["baseline","patched"] as const).map(phase=><div key={phase}><h3>{phase}</h3>{repair.result![phase].map((c,i)=><details key={i}><summary>{c.command} — exit {c.exitCode}</summary><pre style={{overflow:"auto",whiteSpace:"pre-wrap"}}>{c.output}</pre></details>)}</div>)}
    <h3>Dependency scan comparison</h3>
    {repair.result.scans ? <>{(["before","after"] as const).map(phase=>{const scan=repair.result!.scans![phase];return <div key={phase}><h4>{phase === "before" ? "Before repair" : "After repair"}</h4>{scan?<><p>{scan.dependencyCount} resolved dependencies checked · {scan.findings.length} advisory findings · {scan.checkedAt}</p><p>Lockfile SHA-256: <code style={{overflowWrap:"anywhere"}}>{scan.lockfileHash}</code></p><ul>{scan.findings.map(f=><li key={f.id}>{f.description}<ul>{f.evidence.map((e,i)=><li key={i}>{e.dependency?.name}@{e.dependency?.version} · {e.dependency?.path} · <a href={e.url} target="_blank" rel="noreferrer">Advisory source</a></li>)}</ul></li>)}</ul></>:<p>Not completed. No after-scan success is implied.</p>}</div>;})}<p>Point-in-time OSV matches for resolved dependencies; this does not establish application exploitability or prove the application secure.</p></>:<p>Dependency scan evidence is unavailable. Run a fresh verification before approval.</p>}
    <ul>{repair.result.errors.map((e,i)=><li key={i}>{e}</li>)}</ul><details><summary>Review generated package-lock.json</summary><pre style={{overflow:"auto"}}>{repair.result.lockfileAfter}</pre></details>
   </section>}
   {repair.state==="verified"&&<section style={box}><h2>4. Approve the exact patch</h2><p>Creates a new branch and draft PR containing only package.json and package-lock.json. Nothing is merged or deployed.</p>
    {!repair.approvalHash&&<p>This saved result lacks current approval evidence. Create and verify a fresh proposal.</p>}
    <label><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/> I reviewed the files and evidence and approve creating this draft PR.</label><p><button className="button primary" disabled={!approved||!!busy||!repair.approvalHash} onClick={()=>action("approve")}>Approve and create draft PR</button></p>
   </section>}
   {repair.state==="publishing"&&<p>PR creation needs reconciliation. This check reads GitHub without repeating publication. <button className="button" disabled={!!busy} onClick={()=>action("reconcile")}>Check existing draft PR</button></p>}
   <section style={box} aria-label="Repair audit trail"><h2>Audit trail</h2><p>Recorded actors, actions and evidence fingerprints. Times are shown in UTC. Events have no edit or delete action in ShipCheck; this is not an independently tamper-proof archive.</p>
    {!repair.auditTrail?.length?<p>No recorded audit events. This repair may predate event logging; earlier actions have not been reconstructed.</p>:<><button className="button" onClick={()=>{const blob=new Blob([JSON.stringify({schemaVersion:1,repairId:repair.id,exportedAt:new Date().toISOString(),scope:"Recorded repair events only; earlier actions may be absent",events:repair.auditTrail},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`shipcheck-audit-${repair.id}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Export audit trail</button><ol>{repair.auditTrail.map(event=><li key={event.id} style={{marginTop:16}}><strong>{eventLabels[event.event_type]||event.event_type}</strong><p><time dateTime={event.created_at}>{new Date(event.created_at).toISOString()}</time> · Actor: <code>{event.actor_id}</code></p><details><summary>Evidence references</summary><pre style={{overflow:"auto",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(event.details,null,2)}</pre></details></li>)}</ol></>}
   </section>
   {repair.url&&<p><a href={repair.url} target="_blank" rel="noreferrer">Open draft pull request</a></p>}
  </>}
 </main>;
}
