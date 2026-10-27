/** Operator-only acceptance on the disposable protected preview.
 * Uses synthetic identities, not a substitute for browser OAuth acceptance. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {database} from '../src/lib/server/db';
import {createApiToken,revokeApiToken} from '../src/lib/server/api-tokens';
const deployment=process.env.SHIPTESTED_ACCEPTANCE_DEPLOYMENT;
const expected=process.env.SHIPTESTED_ACCEPTANCE_DB_HOST;
if(!deployment||!/^shipcheck-[a-z0-9]+-hey-salad-inc\.vercel\.app$/.test(deployment)||!expected||new URL(process.env.DATABASE_URL||'').hostname!==expected)throw Error('Pin the disposable database and protected deployment first.');
const q=database(),cli=process.env.VERCEL_CLI||'vercel';
const actors=['900000001','900000002'].map(id=>({id:`github:${id}`,workspaceId:`github:${id}`,role:'member' as const}));
const issued:{id:string;actor:typeof actors[number]}[]=[];
let stage='initialization';
function call(path:string,token?:string,method='GET',data?:unknown){
 stage=`${method} ${path}`;
 const config=['silent','show-error','max-time = 280',`request = "${method}"`,'write-out = "\\nSTATUS:%{http_code}"'];
 if(token)config.push(`header = ${JSON.stringify('Authorization: Bearer '+token)}`);
 if(data!==undefined){config.push('header = "Content-Type: application/json"');config.push(`data = ${JSON.stringify(JSON.stringify(data))}`);}
 // Vercel CLI consumes stdin before spawning curl; a private temporary config
 // keeps credentials out of process arguments without hanging curl on stdin.
 const directory=mkdtempSync(join(tmpdir(),'shiptested-http-'));
 let raw:string;
 try{
  const file=join(directory,'request.conf');writeFileSync(file,config.join('\n')+'\n',{mode:0o600});
  raw=execFileSync(cli,['curl',path,'--deployment',`https://${deployment}`,'--scope','hey-salad-inc','--','--config',file],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:300000});
 }finally{rmSync(directory,{recursive:true,force:true});}
 const marker=raw.lastIndexOf('\nSTATUS:');assert.ok(marker>=0,'Missing HTTP status');
 return {status:Number(raw.slice(marker+8)),body:JSON.parse(raw.slice(0,marker)) as Record<string,unknown>};
}
async function main(){
 try{
  const tokens=[];for(const actor of actors){const token=await createApiToken(q,actor,'Disposable HTTP acceptance',true);tokens.push(token.token);issued.push({id:token.id,actor});}
  assert.equal(call('/api/usage').status,401);
  const before=call('/api/usage',tokens[0]);assert.equal(before.status,200);
  const input={repository:'https://github.com/heysalad-ai/nicedeck',privateAccess:false,requestKey:randomUUID()};
  const queued=call('/api/repository-scans',tokens[0],'POST',input);assert.equal(queued.status,202);assert.equal(typeof queued.body.id,'string');
  const id=String(queued.body.id);assert.equal(call('/api/repository-scans',tokens[0],'POST',input).body.id,id);
  assert.equal(call('/api/repository-scans/'+id,tokens[1]).status,404);
  assert.equal(call('/api/internal/worker').status,401);
  const worker=call('/api/internal/worker',process.env.CRON_SECRET);assert.equal(worker.status,200);
  const job=call('/api/repository-scans/'+id,tokens[0]);assert.equal(job.status,200);
  const data=(job.body.job||job.body) as Record<string,unknown>;
  assert.equal(data.state,'completed');assert.match(String(data.reportUrl),/^\/reports\/[a-f0-9-]{36}$/);
  const reportId=String(data.reportUrl).slice('/reports/'.length);
  assert.equal(call('/api/scans/'+reportId,tokens[0]).status,200);
  assert.equal(call('/api/scans/'+reportId,tokens[1]).status,404);
  const after=call('/api/usage',tokens[0]);assert.equal(after.status,200);
  assert.equal(Number(after.body.reserved)-Number(before.body.reserved),1);
  const evidence={verifiedAt:new Date().toISOString(),deployment,scope:'Protected hosted HTTP and actual Neon/GitHub/OSV; synthetic identities. Browser OAuth and Stripe remain unverified.',jobId:id,reportId,checks:['anonymous API denial','authenticated scan queue','idempotent submission','cross-account job/report denial','scheduler authentication','deployed worker completion','persisted report response','single allowance reservation']};
  writeFileSync('../outputs/hosted-acceptance/http-pipeline.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
 }finally{for(const t of issued)await revokeApiToken(q,t.actor,t.id);}
}
main().catch((error:unknown)=>{
 const code=error&&typeof error==='object'&&'code' in error?String(error.code):'';
 const category=code==='ETIMEDOUT'?'transport_timeout':code==='ERR_ASSERTION'?'assertion_failed':'request_failed';
 console.error(JSON.stringify({event:'hosted_acceptance_failed',stage,category}));process.exitCode=1;
});
