import {valid,gt,compare,gte,lt} from 'semver';
import type {Dependency,Finding} from './types.js';
export type AdvisoryMetadata={database_specific?:{severity?:string};severity?:{type:string;score:string}[];affected?:{package?:{name:string;ecosystem:string};ranges?:{type:string;events:{introduced?:string;fixed?:string;last_affected?:string;limit?:string}[]}[]}[]};
/** FIRST CVSS v3.0/v3.1 Base equations; malformed or incomplete vectors stay unknown. */
export function cvssBase(vector:string):number|undefined{
 if(!/^CVSS:3\.[01]\//.test(vector))return;
 const pairs=vector.split('/').slice(1).map(p=>p.split(':'));if(pairs.some(p=>p.length!==2)||new Set(pairs.map(p=>p[0])).size!==pairs.length)return;
 const m=Object.fromEntries(pairs);const weight=(k:string,values:Record<string,number>)=>values[m[k]];
 if(!['U','C'].includes(m.S))return;
 const av=weight('AV',{N:.85,A:.62,L:.55,P:.2}),ac=weight('AC',{L:.77,H:.44}),pr=weight('PR',m.S==='C'?{N:.85,L:.68,H:.5}:{N:.85,L:.62,H:.27}),ui=weight('UI',{N:.85,R:.62});
 const c=weight('C',{H:.56,L:.22,N:0}),i=weight('I',{H:.56,L:.22,N:0}),a=weight('A',{H:.56,L:.22,N:0});
 if([av,ac,pr,ui,c,i,a].some(v=>v===undefined))return;
 const iss=1-(1-c)*(1-i)*(1-a),impact=m.S==='U'?6.42*iss:7.52*(iss-.029)-3.25*Math.pow(iss-.02,15);
 if(impact<=0)return 0;
 const exploit=8.22*av*ac*pr*ui,base=Math.min(m.S==='C'?1.08*(impact+exploit):impact+exploit,10);
 return Math.ceil(Math.round(base*100000)/10000)/10;
}
export function advisoryMetadata(advisory:AdvisoryMetadata,dependency:Dependency):Pick<Finding,'severity'|'severitySource'|'cvss'|'cvssVector'|'fixedVersion'>{
 const scores=(advisory.severity||[]).filter(s=>s.type==='CVSS_V3').map(s=>({score:cvssBase(s.score),vector:s.score})).filter(s=>s.score!==undefined).sort((a,b)=>b.score!-a.score!);
 const score=scores[0]?.score,db=advisory.database_specific?.severity?.toUpperCase();
 const mapped:Record<string,Finding['severity']>={CRITICAL:'high',HIGH:'high',MODERATE:'medium',LOW:'low'};
 const severity=mapped[db||'']||(score===undefined?'review':score>=7?'high':score>=4?'medium':'low');
 // A fixed endpoint is a candidate only for the matching package and the interval containing this npm version.
 const fixes:string[]=[];
 if(dependency.ecosystem==='npm'&&valid(dependency.version))for(const affected of advisory.affected||[]){
  if(affected.package?.name!==dependency.name||affected.package.ecosystem!==dependency.ecosystem)continue;
  for(const range of affected.ranges||[]){if(!['SEMVER','ECOSYSTEM'].includes(range.type))continue;let introduced:string|undefined;
   for(const event of range.events){if(event.introduced!==undefined)introduced=event.introduced;
    if(event.fixed&&introduced!==undefined&&valid(event.fixed)&&(introduced==='0'||valid(introduced)&&gte(dependency.version,introduced))&&lt(dependency.version,event.fixed)&&gt(event.fixed,dependency.version))fixes.push(event.fixed);
    if(event.fixed||event.last_affected||event.limit)introduced=undefined;
   }
  }
 }
 return {severity,severitySource:mapped[db||'']?'GitHub advisory severity':score===undefined?'Severity not provided':`CVSS ${score.toFixed(1)}`,cvss:score,cvssVector:scores[0]?.vector,fixedVersion:fixes.sort(compare)[0]};
}
export const severityOrder={high:0,medium:1,low:2,review:3};
export function groupByPackage(findings:Finding[]){
 const groups=new Map<string,{key:string;label:string;findings:Finding[];severity:Finding['severity'];fixedVersion?:string}>();
 for(const f of findings){const d=f.evidence.find(e=>e.dependency)?.dependency;const key=d?`${d.ecosystem}:${d.name}@${d.version}`:f.id;let g=groups.get(key);if(!g){g={key,label:d?`${d.name}@${d.version}`:f.title,findings:[],severity:f.severity};groups.set(key,g);}g.findings.push(f);if(severityOrder[f.severity]<severityOrder[g.severity])g.severity=f.severity;}
 for(const g of groups.values()){const versions=g.findings.map(f=>f.fixedVersion);if(versions.every(v=>v&&valid(v)))g.fixedVersion=(versions as string[]).sort(compare).at(-1);}
 return [...groups.values()].sort((a,b)=>severityOrder[a.severity]-severityOrder[b.severity]);
}
