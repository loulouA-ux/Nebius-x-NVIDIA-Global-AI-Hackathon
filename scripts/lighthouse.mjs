// Usage: CHROME_SHELL_PATH=/path/to/chrome-headless-shell LIGHTHOUSE_BIN=/path/to/lighthouse
// CHROME_NEW_PATH=/path/to/Chrome node scripts/lighthouse.mjs http://127.0.0.1:3168
// Install Lighthouse separately; this script never provisions browsers or changes the site.
import {spawnSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const base=new URL(process.argv[2]||'http://127.0.0.1:3168');
const dir=resolve(process.env.LIGHTHOUSE_OUTPUT_DIR||'docs/design-handoff-review/production');
const shell=process.env.CHROME_SHELL_PATH;
if(!shell)throw new Error('Set CHROME_SHELL_PATH to the installed chrome-headless-shell executable.');
await mkdir(dir,{recursive:true});
const entries=[];
async function run(name,path,form,chrome,flags,required){
 const filename=`lighthouse-${name}-${form}${required?'':'-new-headless'}.json`;
 const result=spawnSync(process.env.LIGHTHOUSE_BIN||'lighthouse',[new URL(path,base).href,`--chrome-flags=${flags}`,'--only-categories=performance,accessibility,best-practices','--output=json',`--output-path=${resolve(dir,filename)}`,'--quiet',...(form==='desktop'?['--preset=desktop']:[])],{env:{...process.env,CHROME_PATH:chrome},stdio:'inherit',timeout:120000});
 let report;try{report=JSON.parse(await readFile(resolve(dir,filename),'utf8'));}catch{/* Record command failure, never pass an absent report. */}
 const scores=Object.fromEntries(Object.entries(report?.categories||{}).map(([k,v])=>[k,v.score==null?null:Math.round(v.score*100)]));
 const error=report?.runtimeError?.code||report?.audits?.['largest-contentful-paint']?.errorMessage||null;
 const passed=result.status===0&&!error&&scores.performance>=90&&scores.accessibility>=95&&scores['best-practices']>=95;
 entries.push({name,path,form,engine:required?'chrome-headless-shell':'Chrome new headless',required,filename,scores,fcpMs:report?.audits?.['first-contentful-paint']?.numericValue??null,lcpMs:report?.audits?.['largest-contentful-paint']?.numericValue??null,error: error||(result.error?.message??null),exitCode:result.status,passed});
 console.log(`${name} ${form} ${required?'shell':'new headless'}: ${JSON.stringify(scores)} ${error||''}`);
}
for(const [name,path] of [['landing','/'],['report','/reports/demo-recorded'],['404','/page-not-found-ui-v2']])for(const form of ['desktop','mobile'])await run(name,path,form,shell,'--no-sandbox',true);
if(process.env.CHROME_NEW_PATH)await run('report','/reports/demo-recorded','mobile',process.env.CHROME_NEW_PATH,'--headless=new --no-sandbox',false);
await writeFile(resolve(dir,'lighthouse-summary.json'),JSON.stringify({measuredAt:new Date().toISOString(),base:base.origin,thresholds:{performance:90,accessibility:95,'best-practices':95},entries,followUp:'Peter must run PageSpeed Insights against the preview URL after Gate A. New-headless failures are recorded separately, not counted as passing.'},null,2)+'\n');
if(entries.some(e=>e.required&&!e.passed))process.exitCode=1;
