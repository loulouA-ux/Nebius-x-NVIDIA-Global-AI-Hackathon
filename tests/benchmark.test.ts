import { describe, expect, it } from "vitest";
import { compareRuns, sarifFingerprints, type BenchmarkRun } from "../src/lib/benchmark";
const run = (id:string, overrides:Partial<BenchmarkRun>={}):BenchmarkRun => ({id, repository:"fixture/example",commit:"a".repeat(40),snapshotSha256:"b".repeat(64),scanner:"fixture",version:"1",configSha256:"c".repeat(64),environmentSha256:"d".repeat(64),databaseRevision:"fixture-v1",cache:"cold",status:"complete",durationMs:10,costGbp:null,findings:["one"],...overrides});
describe("benchmark evidence boundaries",()=>{
  it("rejects different commits and snapshots",()=>{
    expect(()=>compareRuns([run("1"),run("2",{commit:"e".repeat(40)})])).toThrow(/identical/);
    expect(()=>compareRuns([run("1"),run("2",{snapshotSha256:"e".repeat(64)})])).toThrow(/identical/);
  });
  it("does not count duplicate evidence or infer accuracy",()=>{
    const r=compareRuns([run("1"),run("2",{findings:["one","one"]}),run("3")]);
    expect(r.groups[0].uniqueFindingCounts).toEqual([1,1,1]);expect(r.groups[0].repeatable).toBe(true);expect(r.accuracy).toBeNull();expect(r.groups[0].unknownCostRuns).toBe(3);
  });
  it("does not convert failures into clean scans",()=>{
    const g=compareRuns([run("1"),run("2",{status:"failed",findings:[]}),run("3")]).groups[0];
    expect(g.complete).toBe(2);expect(g.repeatable).toBeNull();expect(g.failedOrIncomplete).toBe(1);
  });
  it("detects inconsistent findings",()=>{expect(compareRuns([run("1"),run("2"),run("3",{findings:[]})]).groups[0].repeatable).toBe(false);});
  it("separates cache and rule versions",()=>{expect(compareRuns([run("1"),run("2",{cache:"warm"}),run("3",{configSha256:"e".repeat(64)})]).groups).toHaveLength(3);});
  it("rejects duplicate run identities",()=>{expect(()=>compareRuns([run("1"),run("1")])).toThrow(/Duplicate/);});
  it("hashes locations without exporting raw snippets",()=>{
    const raw={version:"2.1.0",runs:[{results:[{ruleId:"fixture",message:{text:"do not export me"},locations:[{physicalLocation:{artifactLocation:{uri:"src/a.ts"},region:{startLine:2}}}]}]}]};
    expect(sarifFingerprints(raw)[0]).toMatch(/^[a-f0-9]{64}$/);expect(JSON.stringify(sarifFingerprints(raw))).not.toContain("export");
    raw.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri="/private/a.ts";expect(()=>sarifFingerprints(raw)).toThrow(/relative/);
  });
});
