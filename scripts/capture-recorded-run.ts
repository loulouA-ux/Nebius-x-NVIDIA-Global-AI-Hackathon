// Explicit local invocation only; the pipeline reads keys from the environment.
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runScan,demoFiles} from '../src/lib/pipeline';
if(!process.env.NEBIUS_API_KEY || !process.env.TAVILY_API_KEY){console.log('Recorded live run not captured: both provider keys are required.');process.exit(1);}
try {
 const report=await runScan({mode:'live',filename:'package-lock.json',content:demoFiles['package-lock.json'],research:true});
 if(!report.sources.length||!report.explanations.some(e=>e.basis==='validated-selection'))throw Error('Incomplete provider evidence');
 const fixture={recordedAt:new Date().toISOString(),model:process.env.SHIPCHECK_MODEL||'nvidia/nemotron-3-super-120b-a12b',region:'us-central1',commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),report};
 const text=JSON.stringify(fixture,null,2);
 for(const [name,value] of Object.entries(process.env)){if(/KEY|TOKEN|SECRET|PASSWORD|DATABASE_URL/.test(name)&&value&&value.length>8&&text.includes(value))throw Error('Credential detected');}
 await writeFile('fixtures/recorded-live-run.json',text+'\n',{flag:'wx'});
 console.log(JSON.stringify({captured:true,model:fixture.model,recordedAt:fixture.recordedAt,commit:fixture.commit,findings:report.findings.length,sources:report.sources.length}));
}catch{console.log('Recorded live run not captured: provider evidence incomplete, output failed sanitization, or fixture already exists. No provider payload logged.');process.exitCode=1;}
