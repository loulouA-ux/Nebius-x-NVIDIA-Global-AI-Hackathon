import type { HostCheckResult } from "./passive-host-checks";
import { researchWithEvidence, type ResearchCache } from "./research-evidence";
import { randomUUID } from "node:crypto";
import { parseManifest } from "./parser";
import { maskSecrets, scanFiles, snapshotFindings, verdict } from "./scanner";
import { queryOsv, explain } from "./providers";
import type { Check, ScanInput, ScanReport } from "./types";

export const demoFiles = {
  "package-lock.json": JSON.stringify(
    {
      name: "salad-storefront",
      lockfileVersion: 3,
      packages: {
        "": { name: "salad-storefront" },
        "node_modules/lodash": { version: "4.17.20" },
      },
    },
    null,
    2,
  ),
  "next.config.ts": "export default { productionBrowserSourceMaps: true };",
  "demo.env.fixture": "PAYMENT_KEY=sk_live_SHIPCHECK_SYNTHETIC_000000000000"
    .replaceAll("_SYNTHETIC_", "SYNTHETIC")
    .replace("SHIPCHECK_", "SHIPCHECK"),
};
export async function runScan(
  input: ScanInput,
  cache?: ResearchCache,
  hostResult?: HostCheckResult,
): Promise<ScanReport> {
  const start = Date.now();
  const demo = input.mode === "demo";
  const files = demo ? demoFiles : { [input.filename!]: input.content! };
  const filename = demo ? "package-lock.json" : input.filename!;
  const parsed = parseManifest(filename, files[filename as keyof typeof files]);
  const checks: Check[] = [
    {
      name: "Dependency coverage",
      state: parsed.warnings.length ? "incomplete" : "complete",
      detail:
        parsed.warnings.join(" ") ||
        `${parsed.dependencies.length} exact dependency versions resolved.`,
    },
    {
      name: "Credential patterns",
      state: "complete",
      detail:
        "Four supported patterns in supplied text only. No git history or credential validity checks.",
    },
  ];
  const findings = scanFiles(files);
  if (demo) {
    findings.push(...snapshotFindings(parsed.dependencies));
    checks.push({
      name: "OSV advisories",
      state: "snapshot",
      detail:
        "Single-advisory snapshot retrieved 23 Oct 2026. Demo only; not a current full vulnerability database.",
    });
  } else {
    try {
      findings.push(...(await queryOsv(parsed.dependencies)));
      checks.push({
        name: "OSV advisories",
        state: "complete",
        detail:
          "Live exact-version queries. Matched advisories require severity and applicability review.",
      });
    } catch {
      checks.push({
        name: "OSV advisories",
        state: "incomplete",
        detail:
          "Live lookup failed, exceeded its budget, or returned incomplete results. No cached clean result was substituted.",
      });
    }
  }
  if (hostResult) {
    findings.push(...hostResult.findings);
    checks.push(...hostResult.checks);
  }
  let sources: ScanReport["sources"] = [];
  let explanations: ScanReport["explanations"] = [];
  if (!demo && input.research && process.env.TAVILY_API_KEY) {
    try {
      const evidence = await researchWithEvidence(
        parsed.dependencies,
        process.env.TAVILY_API_KEY,
        fetch,
        cache,
        findings.flatMap((f) =>
          f.evidence.flatMap((e) =>
            e.kind === "advisory" && e.url ? [e.url] : [],
          ),
        ),
      );
      sources = evidence.sources;
      checks.push({
        name: "Source extraction",
        state: evidence.extractionComplete ? "complete" : "incomplete",
        detail: evidence.extractionComplete
          ? `Up to two advisory-authority pages extracted; evidence remains unconfirmed context.${evidence.cached ? " Reused bounded 24-hour cache with original retrieval dates." : ""}`
          : "No complete extraction of selected advisory-authority pages; search excerpts remain unconfirmed.",
      });
      checks.push({
        name: "Live threat research",
        state: parsed.dependencies.length > 3 ? "incomplete" : "complete",
        detail:
          "Search at most 3 packages. Retrieved reports are unconfirmed and never change the verdict.",
      });
    } catch {
      checks.push({
        name: "Live threat research",
        state: "incomplete",
        detail: "Tavily unavailable or response rejected.",
      });
    }
  } else
    checks.push({
      name: "Live threat research",
      state: "incomplete",
      detail: demo
        ? "Not run in offline demo."
        : input.research
          ? "Tavily key is not configured."
          : "Not requested. New threats outside OSV were not checked.",
    });
  if (!demo && input.research && process.env.NEBIUS_API_KEY) {
    try {
      explanations = await explain(
        findings,
        sources,
        process.env.NEBIUS_API_KEY,
      );
      checks.push({
        name: "Nemotron explanations",
        state: findings.length > 12 ? "incomplete" : "complete",
        detail: findings.length
          ? "At most 12 findings explained. Model notes are advisory; original findings and policy are preserved."
          : "No findings to explain; no inference call made.",
      });
    } catch {
      checks.push({
        name: "Nemotron explanations",
        state: "incomplete",
        detail:
          "Nebius unavailable or model output failed validation. Deterministic findings are preserved.",
      });
    }
  } else
    checks.push({
      name: "Nemotron explanations",
      state: "incomplete",
      detail: demo
        ? "Not run in offline demo."
        : "Not requested or Nebius key is not configured.",
    });
  if (!hostResult)
    checks.push({
      name: "Staging URL / runtime",
      state: "not-in-scope",
      detail:
        "No verified staging project was selected. No target site was contacted.",
    });
  const severityOrder = { high: 0, medium: 1, review: 2 };
  findings.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
  const result: ScanReport = {
    id: randomUUID(),
    mode: input.mode,
    createdAt: new Date().toISOString(),
    status: verdict(findings, checks),
    dependencies: parsed.dependencies,
    findings,
    checks,
    sources,
    explanations,
    durationMs: Date.now() - start,
    policy:
      "shipcheck-v0.1: high findings block; incomplete coverage cannot pass; other findings require review.",
  };
  return JSON.parse(maskSecrets(JSON.stringify(result))) as ScanReport;
}
