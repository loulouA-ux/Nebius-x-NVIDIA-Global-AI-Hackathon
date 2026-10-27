import { createHash } from "node:crypto";
import { z } from "zod";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const benchmarkRun = z.object({
  id: z.string().min(1), repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  commit: z.string().regex(/^[a-f0-9]{40}$/), snapshotSha256: digest,
  scanner: z.string().min(1), version: z.string().min(1), configSha256: digest,
  environmentSha256: digest, databaseRevision: z.string().min(1),
  cache: z.enum(["cold", "warm"]), status: z.enum(["complete", "incomplete", "failed"]),
  durationMs: z.number().finite().nonnegative(), costGbp: z.number().finite().nonnegative().nullable(),
  findings: z.array(z.string().min(1)).max(100000),
}).strict();
export type BenchmarkRun = z.infer<typeof benchmarkRun>;

// Do not retain snippets, secret values, source messages or absolute paths.
export function sarifFingerprints(input: unknown): string[] {
  const sarif = z.object({ version: z.literal("2.1.0"), runs: z.array(z.object({
    results: z.array(z.object({ ruleId: z.string().min(1),
      locations: z.array(z.object({ physicalLocation: z.object({
        artifactLocation: z.object({ uri: z.string().min(1) }),
        region: z.object({ startLine: z.number().int().positive() }).optional(),
      }) })).min(1),
    })),
  })).min(1) }).parse(input);
  return [...new Set(sarif.runs.flatMap(run => run.results.map(result => {
    const sites = result.locations.map(x => x.physicalLocation).map(x => {
      const uri = x.artifactLocation.uri;
      if (/^(?:[a-z]+:|\/|\\)/i.test(uri) || uri.split(/[\\/]/).includes("..")) throw Error("SARIF requires repository-relative paths.");
      return [uri, x.region?.startLine ?? null];
    });
    return createHash("sha256").update(JSON.stringify([result.ruleId, sites])).digest("hex");
  })))].sort();
}

export function compareRuns(input: unknown) {
  const runs = z.array(benchmarkRun).min(2).max(1200).parse(input);
  const first = runs[0];
  if (new Set(runs.map(r => r.id)).size !== runs.length) throw Error("Duplicate run IDs.");
  if (runs.some(r => r.repository !== first.repository || r.commit !== first.commit || r.snapshotSha256 !== first.snapshotSha256)) throw Error("Comparison requires identical repository, commit and snapshot.");
  const groups = new Map<string, BenchmarkRun[]>();
  for (const run of runs) {
    const key = JSON.stringify([run.scanner, run.version, run.configSha256, run.environmentSha256, run.databaseRevision, run.cache]);
    groups.set(key, [...(groups.get(key) ?? []), run]);
  }
  return {
    repository: first.repository, commit: first.commit, snapshotSha256: first.snapshotSha256,
    accuracy: null, accuracyReason: "No independently adjudicated ground truth; counts and agreement are not accuracy.",
    groups: [...groups.values()].map(group => {
      const complete = group.filter(r => r.status === "complete");
      const sets = complete.map(r => [...new Set(r.findings)].sort());
      return {
        scanner: group[0].scanner, version: group[0].version, configSha256: group[0].configSha256,
        environmentSha256: group[0].environmentSha256, databaseRevision: group[0].databaseRevision, cache: group[0].cache,
        attempts: group.length, complete: complete.length, failedOrIncomplete: group.length - complete.length,
        repeatable: sets.length < 3 || complete.length !== group.length ? null : sets.every(s => JSON.stringify(s) === JSON.stringify(sets[0])),
        uniqueFindingCounts: sets.map(s => s.length),
        meanCompleteDurationMs: complete.length ? complete.reduce((n,r) => n+r.durationMs,0)/complete.length : null,
        knownCostGbp: group.reduce((n,r) => n+(r.costGbp ?? 0),0), unknownCostRuns: group.filter(r => r.costGbp === null).length,
      };
    }),
  };
}
