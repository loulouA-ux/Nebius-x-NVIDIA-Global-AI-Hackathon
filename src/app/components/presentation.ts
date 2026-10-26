import type {ScanReport,Finding,Check} from '@/lib/types';
export const plural=(n:number,word:string,many=word+'s')=>`${n} ${n===1?word:many}`;
export const verdictLabel=(status:ScanReport['status'])=>({'Blocked':'Blocked','Review required':'Needs review','Incomplete':'Incomplete','Checks passed':'Clear'}[status]);
// Scanner 'review' represents uncertainty, not a documented low severity.
export const severityLabel=(level:Finding['severity'])=>level==='review'?'Unrated':level==='high'?'High':'Medium';
export const stateLabel=(state:Check['state'])=>state==='snapshot'?'Limited':state==='not-in-scope'?'Not in scope':state==='complete'?'Complete':'Incomplete';

export const actionParts=(action:string)=>action.split(/(?<=[.!?])\s+(?=[A-Z])/);
