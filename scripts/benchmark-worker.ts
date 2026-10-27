import {readFile,writeFile} from "node:fs/promises";
import {parseBenchmarkManifest,queryBenchmarkDependencies} from "../src/lib/benchmark-dependencies";
async function main(){
 const parsed=parseBenchmarkManifest("package-lock.json",await readFile("input/package-lock.json","utf8"));
 const start=Date.now(),result=await queryBenchmarkDependencies(parsed.dependencies);
 await writeFile("result.json",JSON.stringify({durationMs:Date.now()-start,warnings:parsed.warnings,...result}));
}
main().catch(()=>{console.error("Benchmark worker failed");process.exitCode=1;});
