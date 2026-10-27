import { afterEach, expect, it, vi } from "vitest";
import { runScan } from "../src/lib/pipeline";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("marks provider outages incomplete without leaking exception text or presenting a clean verdict", async () => {
  vi.stubEnv("TAVILY_API_KEY", "synthetic-test-only");
  vi.stubEnv("NEBIUS_API_KEY", "synthetic-test-only");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("PRIVATE_PROVIDER_ERROR_SENTINEL")));
  const report = await runScan({ mode: "live", filename: "package.json", content: '{"dependencies":{"lodash":"4.17.20"}}', research: true });
  for (const name of ["OSV advisories", "Live threat research"]) expect(report.checks.find(c => c.name === name)?.state).toBe("incomplete");
  expect(report.status).toBe("Incomplete");
  expect(JSON.stringify(report)).not.toContain("PRIVATE_PROVIDER_ERROR_SENTINEL");
});
it("missing optional provider keys remain explicit incomplete coverage", async () => {
  vi.stubEnv("TAVILY_API_KEY", ""); vi.stubEnv("NEBIUS_API_KEY", "");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  const report = await runScan({ mode: "live", filename: "package.json", content: '{"dependencies":{"lodash":"4.17.20"}}', research: true });
  for (const name of ["Live threat research", "Nemotron explanations"]) expect(report.checks.find(c => c.name === name)?.state).toBe("incomplete");
  expect(report.status).toBe("Incomplete");
});
