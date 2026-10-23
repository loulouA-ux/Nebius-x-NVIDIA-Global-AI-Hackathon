import { queryOsv } from "../src/lib/providers";
import { researchWithEvidence } from "../src/lib/research-evidence";
import { database } from "../src/lib/server/db";
import { Store } from "../src/lib/server/store";
try {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("Missing key");
  const store = new Store(database());
  const deps = [
    {
      name: "lodash",
      version: "4.17.20",
      ecosystem: "npm" as const,
      path: "synthetic/package.json",
    },
  ];
  const findings = await queryOsv(deps);
  const urls = findings.flatMap((f) =>
    f.evidence.flatMap((e) => (e.url ? [e.url] : [])),
  );
  const r = await researchWithEvidence(deps, key, fetch, store, urls);
  console.log(
    JSON.stringify({
      sources: r.sources.length,
      extracted: r.sources.filter((s) => s.extraction === "extracted").length,
      complete: r.extractionComplete,
      cached: r.cached,
    }),
  );
  if (!r.extractionComplete) process.exitCode = 1;
  else {
    const second = await researchWithEvidence(
      deps,
      key,
      async () => {
        throw new Error("Cache miss");
      },
      store,
      urls,
    );
    if (!second.cached) throw new Error("Cache not reused");
    console.log("PASS: persisted research cache reused without provider call.");
  }
} catch {
  console.log("Research acceptance failed; response details suppressed.");
  process.exitCode = 1;
}
