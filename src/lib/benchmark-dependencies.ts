import { parseManifest } from "./parser";
import { queryOsv } from "./providers";
import type { Dependency, Finding } from "./types";

export const benchmarkLimits = { maxBytes: 5_000_000, maxDependencies: 5000 };
export function parseBenchmarkManifest(filename:string, content:string){
  return parseManifest(filename,content,benchmarkLimits);
}
// Independent administrator-run collector. Public HTTP scan limits stay unchanged.
export async function queryBenchmarkDependencies(dependencies:Dependency[], query:(deps:Dependency[])=>Promise<Finding[]>=queryOsv){
  const findings:Finding[]=[];
  const failures:{offset:number;count:number;reason:string}[]=[];
  let queried=0;
  for(let offset=0;offset<dependencies.length;offset+=10){
    const batch=dependencies.slice(offset,offset+10);
    try { findings.push(...await query(batch)); queried+=batch.length; }
    catch(error){
      // Only the known advisory-card cap warrants subdivision; avoid retry storms on outages.
      if(error instanceof Error && error.message==="OSV advisory budget exceeded; narrow the manifest."){
        for(let i=0;i<batch.length;i++){
          try{findings.push(...await query([batch[i]]));queried++;}
          catch{failures.push({offset:offset+i,count:1,reason:"OSV lookup incomplete or per-dependency advisory limit exceeded"});}
        }
      }else failures.push({offset,count:batch.length,reason:"OSV request failed or returned incomplete results"});
    }
  }
  return {findings,queried,failures};
}
