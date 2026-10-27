export type MatchRecord={repository:string;commit:string;path:string;findings:{id:string;dependencies:{ecosystem:string;name:string;version:string;path:string}[];urls:string[]}[]};
export function triageMatches(records:MatchRecord[]){
 const groups=new Map<string,{advisory:string;ecosystem:string;name:string;version:string;occurrences:{repository:string;commit:string;manifest:string;dependencyPath:string}[];sources:string[]}>();
 let rawMatches=0,unmappedMatches=0;
 for(const record of records)for(const finding of record.findings){
  rawMatches++;
  const advisory=finding.id.split(":")[0];
  if(!/^(GHSA-[a-z0-9-]+|CVE-\d{4}-\d+|PYSEC-[A-Za-z0-9-]+|OSV-[A-Za-z0-9-]+)$/.test(advisory)||!finding.dependencies.length){unmappedMatches++;continue;}
  for(const dependency of finding.dependencies){
   const key=JSON.stringify([advisory,dependency.ecosystem,dependency.name,dependency.version]);
   const group=groups.get(key)??{advisory,ecosystem:dependency.ecosystem,name:dependency.name,version:dependency.version,occurrences:[],sources:[]};
   const occurrence={repository:record.repository,commit:record.commit,manifest:record.path,dependencyPath:dependency.path};
   if(!group.occurrences.some(o=>JSON.stringify(o)===JSON.stringify(occurrence)))group.occurrences.push(occurrence);
   for(const url of finding.urls)if(/^https:\/\/osv\.dev\/vulnerability\/[A-Za-z0-9.-]+$/.test(url)&&!group.sources.includes(url))group.sources.push(url);
   groups.set(key,group);
  }
 }
 const queue=[...groups.values()].map(g=>({...g,repositories:new Set(g.occurrences.map(o=>o.repository)).size,reviewStatus:"needs-human-review",severity:"not-assessed",exploitability:"not-assessed"})).sort((a,b)=>b.repositories-a.repositories||a.advisory.localeCompare(b.advisory)||a.name.localeCompare(b.name)||a.version.localeCompare(b.version));
 return {rawMatches,unmappedMatches,uniqueAdvisories:new Set(queue.map(q=>q.advisory)).size,uniqueAdvisoryDependencyVersions:queue.length,ranking:"Repository reach only, not severity or exploitability. Advisory aliases are not merged.",queue};
}
