import type {ScanReport,Finding,Check} from '@/lib/types';
export const plural=(n:number,word:string,many=word+'s')=>`${n} ${n===1?word:many}`;
export const verdictLabel=(status:ScanReport['status'])=>({'Blocked':'Blocked','Review required':'Needs review','Incomplete':'Incomplete','Checks passed':'Clear'}[status]);
// Scanner 'review' represents uncertainty, not a documented low severity.
export const severityLabel=(level:Finding['severity'])=>level==='review'?'Unrated':level==='high'?'High':'Medium';
export const stateLabel=(state:Check['state'])=>state==='snapshot'?'Limited':state==='not-in-scope'?'Not in scope':state==='complete'?'Complete':'Incomplete';

export const actionParts=(action:string)=>action.split(/(?<=[.!?])\s+(?=[A-Z])/);

export function verdictMessage(report:ScanReport){
 const high=report.findings.filter(f=>f.severity==='high').length;
 const incomplete=report.checks.filter(c=>c.state==='incomplete').length;
 const ran=report.checks.filter(c=>c.state==='complete'||c.state==='snapshot').length;
 switch(report.status){case 'Blocked':return `${plural(high,'high-severity finding')} ${high===1?'needs':'need'} a decision.`;case 'Review required':return `${plural(report.findings.length,'finding')} ${report.findings.length===1?'needs':'need'} a person to decide.`;case 'Incomplete':return incomplete?`${plural(incomplete,'check')} didn't finish. Nothing is reported as clean.`:`${plural(report.checks.filter(c=>c.state==='snapshot').length,'check')} used snapshot evidence. Nothing is reported as clean.`;case 'Checks passed':return `No findings in the ${plural(ran,'check')} that ran.`;}
}
