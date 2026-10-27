import type {Report} from '@heysalad/shiptested';
export type Threshold='high'|'medium'|'low'|'any';
export function exitCode(report:Report,threshold:Threshold='high'){
 if(report.status==='Incomplete')return 3;
 const ranks={high:3,medium:2,low:1,review:0},thresholds={high:3,medium:2,low:1,any:0};
 if(report.status==='Blocked'||report.findings.some(f=>ranks[f.severity]>=thresholds[threshold]))return 1;
 return report.status==='Review required'?2:0;
}
export function sarif(report:Report){return {$schema:'https://json.schemastore.org/sarif-2.1.0.json',version:'2.1.0',runs:[{
 tool:{driver:{name:'ShipTested',version:'0.1.0',informationUri:'https://shiptested.com',rules:report.findings.map(f=>({id:f.id,shortDescription:{text:f.title},fullDescription:{text:f.description},help:{text:f.action}}))}},
 invocations:[{executionSuccessful:report.status!=='Incomplete'}],
 results:report.findings.map(f=>({ruleId:f.id,level:f.severity==='high'?'error':f.severity==='medium'?'warning':'note',message:{text:`${f.description}\n${f.action}`},properties:{evidence:f.evidence,fixedVersion:f.fixedVersion,severitySource:f.severitySource}})),
 properties:{verdict:report.status,checks:report.checks,createdAt:report.createdAt}
}]};}
