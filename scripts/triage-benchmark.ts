import {readFile,readdir,mkdir,writeFile} from "node:fs/promises";
import {triageMatches,type MatchRecord} from "../src/lib/benchmark-triage";
async function main(){
 const directories=process.argv.slice(2);if(!directories.length)throw Error("Input directories required");
 const records:MatchRecord[]=[];
 for(const directory of directories)for(const filename of await readdir(directory)){
  if(!filename.endsWith(".json")||["summary.json","inventory.json"].includes(filename))continue;
  const row=JSON.parse(await readFile(`${directory}/${filename}`,"utf8"));
  if(!row.repository||!row.commit)continue;
  if(row.results)for(const result of row.results)records.push({repository:row.repository,commit:row.commit,path:result.path,findings:result.findings??[]});
  else if(row.path)records.push({...row,findings:row.findings??[]});
 }
 const result=triageMatches(records),directory=`test-results/triage-${new Date().toISOString().replace(/[:.]/g,"-")}`;
 await mkdir(directory,{recursive:true,mode:0o700});
 await writeFile(`${directory}/queue.json`,JSON.stringify({createdAt:new Date().toISOString(),inputDirectories:directories,...result},null,2),{mode:0o600});
 const text=["# Dependency advisory review queue","","Ranking is repository reach, not severity. No exploitability or remediation is verified. Repeated runs are deduplicated; advisory aliases remain distinct.","",`Raw matches: ${result.rawMatches}; unique advisory/dependency/version combinations: ${result.uniqueAdvisoryDependencyVersions}; unique advisory IDs: ${result.uniqueAdvisories}; unmapped: ${result.unmappedMatches}.`,"",...result.queue.map((q,i)=>`${i+1}. ${q.advisory} — ${q.ecosystem} ${q.name}@${q.version} — ${q.repositories} repositories; ${q.occurrences.length} locations. Review: ${q.sources.join(", ")}`)];
 await writeFile(`${directory}/REVIEW.md`,text.join("\n")+"\n",{mode:0o600});
 console.log(JSON.stringify({directory,rawMatches:result.rawMatches,uniqueAdvisories:result.uniqueAdvisories,uniqueCombinations:result.uniqueAdvisoryDependencyVersions,unmapped:result.unmappedMatches}));
}
main().catch(()=>{console.error("Triage failed; no raw input logged.");process.exitCode=1;});
