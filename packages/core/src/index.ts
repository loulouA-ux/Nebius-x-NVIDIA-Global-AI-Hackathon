import {parseManifest} from './parser.js';
import {maskSecrets,scanFiles,verdict} from './scanner.js';
import {queryOsv,type Cache} from './osv.js';
import {severityOrder} from './advisory-metadata.js';
import type {Check,Finding,ScanReport} from './types.js';
export * from './types.js';
export {parseManifest} from './parser.js';
export {maskSecrets,scanFiles,verdict} from './scanner.js';
export {queryOsv,getAdvisory,MemoryCache,type Cache} from './osv.js';
export {advisoryMetadata,groupByPackage} from './advisory-metadata.js';
export type StageEvent={stage:'Lockfile'|'Secrets'|'OSV';status:'running'|'done'|'failed';detail:string;durationMs:number};
export type Report=ScanReport;
export type ScanOptions={onStage?:(event:StageEvent)=>void;signal?:AbortSignal;osv?:{baseUrl?:string;cache?:Cache};/** Dependency injection for tests; URL allowlist remains enforced. */ fetcher?:typeof fetch};
export async function scan(input:{lockfile:string;filename?:string},opts:ScanOptions={}):Promise<Report>{
 const started=Date.now(),checks:Check[]=[],findings:Finding[]=[];
 const signal=opts.signal?AbortSignal.any([opts.signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000);
 const emit=(stage:StageEvent['stage'],status:StageEvent['status'],detail:string,start:number)=>opts.onStage?.({stage,status,detail,durationMs:Date.now()-start});
 const filename=input.filename||'package-lock.json';let t=Date.now();signal.throwIfAborted();emit('Lockfile','running','Resolving supplied exact versions',t);
 let parsed:ReturnType<typeof parseManifest>;
 try{parsed=parseManifest(filename,input.lockfile,{maxBytes:2_000_000,maxDependencies:5000});}catch{emit('Lockfile','failed','Invalid or unsupported lockfile',t);throw Error('Invalid or unsupported lockfile; supported input is limited to 2 MB and 5,000 exact packages.');}
 checks.push({name:'Dependency coverage',state:parsed.warnings.length?'incomplete':'complete',detail:parsed.warnings.join(' ')||`${parsed.dependencies.length} exact dependency versions resolved.`});
 emit('Lockfile','done',`${parsed.dependencies.length} exact packages resolved`,t);
 t=Date.now();signal.throwIfAborted();emit('Secrets','running','Checking supported patterns',t);findings.push(...scanFiles({[filename]:input.lockfile}));
 checks.push({name:'Credential patterns',state:'complete',detail:'Four supported patterns in supplied text only. No git history or credential validity checks.'});emit('Secrets','done','Supported patterns checked; values masked',t);
 t=Date.now();emit('OSV','running','Querying exact package versions',t);
 try{findings.push(...await queryOsv(parsed.dependencies,opts.fetcher||fetch,{...opts.osv,signal}));checks.push({name:'OSV advisories',state:'complete',detail:'Live exact-version queries. Applicability requires human review.'});emit('OSV','done',`${findings.filter(f=>f.evidence.some(e=>e.kind==='advisory')).length} matched advisory findings`,t);}
 catch{if(opts.signal?.aborted)throw opts.signal.reason;checks.push({name:'OSV advisories',state:'incomplete',detail:'Lookup failed, timed out, exceeded its advisory budget or returned partial results.'});emit('OSV','failed','OSV coverage incomplete; no clean result substituted',t);}
 findings.sort((a,b)=>severityOrder[a.severity]-severityOrder[b.severity]);
 const report:Report={id:crypto.randomUUID(),mode:'live',createdAt:new Date().toISOString(),durationMs:Date.now()-started,dependencies:parsed.dependencies,findings,checks,status:verdict(findings,checks),sources:[],explanations:[],policy:'shiptested-v0.1: high findings block; incomplete coverage cannot pass; other findings require review.'};
 return JSON.parse(maskSecrets(JSON.stringify(report))) as Report;
}
