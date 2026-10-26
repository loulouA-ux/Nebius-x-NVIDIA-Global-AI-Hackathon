import type {ScanReport} from '@/lib/types';
// Bounded session memory only. Never persist report contents, searches or credentials.
const reports=new Map<string,ScanReport>();
const locations=new Map<string,string>();
export type FindingFilters={search:string;severity:string;source:string;package:string;decision:string};
const filters=new Map<string,FindingFilters>();
export function rememberReport(report:ScanReport){reports.delete(report.id);reports.set(report.id,report);if(reports.size>10){const oldest=reports.keys().next().value!;reports.delete(oldest);filters.delete(oldest);}}
export function recalledReport(id:string){return reports.get(id);}
export function latestReport(){return Array.from(reports.values()).at(-1);}
export function setDashboardLocation(view:string,url:string){if(["overview","project","scan","findings","actions"].includes(view))locations.set(view,url);}
export function dashboardHref(view:string){const report=latestReport();return view==='scan'?'/scan':view==='project'?'/hosts':report?`/reports/${encodeURIComponent(report.id)}`:'/reports';}
export function recalledFilters(id:string):FindingFilters{return filters.get(id)||{search:'',severity:'all',source:'all',package:'all',decision:'all'};}
export function rememberFilters(id:string,value:FindingFilters){filters.set(id,value);}
export function clearReportMemory(){reports.clear();locations.clear();filters.clear();}
