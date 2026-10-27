import recorded from '../../../fixtures/recorded-live-run.json';
import type {ScanReport} from '../types';
// Bundled synthetic capture: no provider, filesystem or database request at render time.
export function recordedDemo():ScanReport{return {...recorded.report,id:'demo-recorded',mode:'demo',recording:{recordedAt:recorded.recordedAt,model:recorded.model,region:recorded.region,commit:recorded.commit}} as ScanReport;}
