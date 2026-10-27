import {request as httpRequest} from 'node:http';
import {execFileSync} from 'node:child_process';
const base=process.argv[2];
if(!base){console.error('Usage: node scripts/smoke.mjs <base-url>');process.exit(2);}
const origin=new URL(base);let failed=0;
const preview=process.argv.includes('--vercel-preview');
if(preview&&!origin.hostname.endsWith('.vercel.app'))throw Error('Preview transport requires a vercel.app hostname.');
async function check(label,fn){try{if(!await fn())throw Error();console.log(`PASS ${label}`);}catch{failed++;console.error(`FAIL ${label}`);}}
const get=async(path,init={})=>{
 if(!preview)return fetch(new URL(path,origin),{signal:AbortSignal.timeout(15000),...init});
 const args=['curl',path,'--deployment',origin.href,'--scope','hey-salad-inc','--','--silent','--show-error','--max-time','20','--include'];
 if(init.method)args.push('--request',init.method);
 for(const [k,v] of Object.entries(init.headers||{}))args.push('--header',`${k}: ${v}`);
 if(init.body)args.push('--data',init.body);
 const raw=execFileSync('vercel',args,{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','ignore']});
 const parts=raw.split(/\r?\n\r?\n/);let head=parts.shift();
 while(/^HTTP\/[^ ]+ (?:100|200 Connection)/.test(head)){head=parts.shift();}
 const lines=head.split(/\r?\n/);const status=Number(lines.shift().split(' ')[1]);const headers=new Headers();
 for(const line of lines){const i=line.indexOf(':');if(i>0)headers.append(line.slice(0,i),line.slice(i+1).trim());}
 return new Response(parts.join('\n\n'),{status,headers});
};
await check('landing and title',async()=>{const r=await get('/');return r.status===200&&(await r.text()).includes('ShipTested — Check before you ship');});
await check('server-rendered replay',async()=>{const r=await get('/reports/demo-recorded');const body=await r.text();return r.status===200&&body.includes('Replay')&&body.includes('captured')&&body.includes('lodash');});
await check('security headers',async()=>{const r=await get('/');return ['Content-Security-Policy','Strict-Transport-Security','X-Content-Type-Options','Referrer-Policy','Permissions-Policy'].every(h=>r.headers.has(h))&&r.headers.get('Content-Security-Policy').includes("frame-ancestors 'none'");});
await check('live scan denied',async()=>(await get('/api/scans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'live'})})).status===403);
await check('robots',async()=>{const r=await get('/robots.txt');return r.ok&&(await r.text()).includes('Disallow: /api');});
await check('security contact',async()=>{const r=await get('/.well-known/security.txt');return r.ok&&(await r.text()).includes('mailto:security@shiptested.com');});
if(preview)console.log('NOT APPLICABLE www redirect: deployment hostname has no www alias; production smoke must verify it.');
else await check('www redirects to root',async()=>{
 const www=new URL(origin);www.hostname=`www.${origin.hostname}`;
 if(['127.0.0.1','localhost'].includes(origin.hostname))return new Promise((resolve,reject)=>{
  const req=httpRequest(origin,{headers:{host:`www.${origin.host}`}},r=>{r.resume();const location=r.headers.location;resolve([301,308].includes(r.statusCode)&&!!location&&(location==='/'||new URL(location,www).origin===origin.origin));});req.on('error',reject);req.setTimeout(15000,()=>req.destroy(Error('timeout')));req.end();
 });
 const r=await fetch(www,{redirect:'manual',signal:AbortSignal.timeout(15000)});return [301,308].includes(r.status)&&new URL(r.headers.get('location'),www).origin===origin.origin;
});
process.exitCode=failed?1:0;
