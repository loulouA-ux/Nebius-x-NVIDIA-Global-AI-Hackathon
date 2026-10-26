import type {ScanReport} from '@/lib/types';
// In-memory only. Never write report contents to URLs or browser storage.
const reports=new Map<string,ScanReport>();
export function rememberReport(report:ScanReport){reports.set(report.id,report);if(reports.size>10)reports.delete(reports.keys().next().value!);}
export function recalledReport(id:string){return reports.get(id);}
export function clearReportMemory(){reports.clear();}
