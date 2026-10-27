import {request as httpRequest} from 'node:http';
const base=process.argv[2];
if(!base){console.error('Usage: node scripts/smoke.mjs <base-url>');process.exit(2);}
const origin=new URL(base);let failed=0;
async function check(label,fn){try{if(!await fn())throw Error();console.log(`PASS ${label}`);}catch{failed++;console.error(`FAIL ${label}`);}}
const get=(path,init={})=>fetch(new URL(path,origin),{signal:AbortSignal.timeout(15000),...init});
await check('landing and title',async()=>{const r=await get('/');return r.status===200&&(await r.text()).includes('ShipTested — Check before you ship');});
await check('server-rendered replay',async()=>{const r=await get('/reports/demo-recorded');const body=await r.text();return r.status===200&&body.includes('Replay')&&body.includes('captured')&&body.includes('lodash');});
await check('security headers',async()=>{const r=await get('/');return ['Content-Security-Policy','Strict-Transport-Security','X-Content-Type-Options','Referrer-Policy','Permissions-Policy'].every(h=>r.headers.has(h))&&r.headers.get('Content-Security-Policy').includes("frame-ancestors 'none'");});
await check('live scan denied',async()=>(await get('/api/scans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'live'})})).status===403);
await check('robots',async()=>{const r=await get('/robots.txt');return r.ok&&(await r.text()).includes('Disallow: /api');});
await check('security contact',async()=>{const r=await get('/.well-known/security.txt');return r.ok&&(await r.text()).includes('mailto:security@shiptested.com');});
await check('www redirects to root',async()=>{
 const www=new URL(origin);www.hostname=`www.${origin.hostname}`;
 if(['127.0.0.1','localhost'].includes(origin.hostname))return new Promise((resolve,reject)=>{
  const req=httpRequest(origin,{headers:{host:`www.${origin.host}`}},r=>{r.resume();const location=r.headers.location;resolve([301,308].includes(r.statusCode)&&!!location&&(location==='/'||new URL(location,www).origin===origin.origin));});req.on('error',reject);req.setTimeout(15000,()=>req.destroy(Error('timeout')));req.end();
 });
 const r=await fetch(www,{redirect:'manual',signal:AbortSignal.timeout(15000)});return [301,308].includes(r.status)&&new URL(r.headers.get('location'),www).origin===origin.origin;
});
process.exitCode=failed?1:0;
