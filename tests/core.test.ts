import { describe, it, expect, vi, afterEach } from "vitest";
import { parseManifest } from "../src/lib/parser";
import {
  maskSecrets,
  scanFiles,
  snapshotFindings,
  verdict,
} from "../src/lib/scanner";
import {
  boundedJson,
  queryOsv,
  validateExplanations,
} from "../src/lib/providers";
import { runScan } from "../src/lib/pipeline";
import { POST } from "../src/app/api/scans/route";
const lock = (version = "4.17.20") =>
  JSON.stringify({
    lockfileVersion: 3,
    packages: { "": {}, "node_modules/lodash": { version } },
  });
const dependency = {
  name: "lodash",
  version: "4.17.20",
  ecosystem: "npm" as const,
  path: "package-lock.json",
};
afterEach(() => vi.unstubAllGlobals());
describe("manifest coverage", () => {
  it("resolves npm scoped transitive packages and deduplicates versions", () => {
    const p = parseManifest(
      "package-lock.json",
      JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "": {},
          "node_modules/@test/utils": { version: "1.2.3" },
          "node_modules/a/node_modules/@test/utils": { version: "1.2.3" },
        },
      }),
    );
    expect(p.dependencies).toHaveLength(1);
    expect(p.dependencies[0].name).toBe("@test/utils");
    expect(p.warnings).toEqual([]);
  });
  it("does not treat a manifest range as an installed version", () => {
    const p = parseManifest(
      "package.json",
      '{"dependencies":{"next":"^14.1.0"}}',
    );
    expect(p.dependencies).toEqual([]);
    expect(p.warnings.length).toBeGreaterThan(0);
  });
  it("always declares missing transitive coverage for package.json", () =>
    expect(
      parseManifest(
        "package.json",
        '{"dependencies":{"lodash":"4.17.21"}}',
      ).warnings.join(" "),
    ).toContain("transitive"));
  it("parses Python prerelease and normalizes names", () =>
    expect(
      parseManifest("requirements.txt", "Some_Package==2.0rc1").dependencies[0],
    ).toMatchObject({ name: "some-package", version: "2.0rc1" }));
  it("does not silently accept Python includes, URLs, markers or ranges", () => {
    const p = parseManifest(
      "requirements.txt",
      '-r base.txt\nfoo>=1.0\nbar==2.0; python_version>"3"\nhttps://example.com/pkg.whl',
    );
    expect(p.dependencies).toHaveLength(0);
    expect(p.warnings).toHaveLength(5);
  });
  it("rejects invalid JSON", () =>
    expect(() => parseManifest("package.json", "{")).toThrow("Invalid JSON"));
  it("rejects unsupported lockfile versions", () =>
    expect(() =>
      parseManifest("package-lock.json", '{"lockfileVersion":1}'),
    ).toThrow("v2 and v3"));
  it("rejects too many resolved dependencies", () => {
    const packages = Object.fromEntries(
      Array.from({ length: 51 }, (_, i) => [
        `node_modules/pkg${i}`,
        { version: "1.0.0" },
      ]),
    );
    expect(() =>
      parseManifest(
        "package-lock.json",
        JSON.stringify({ lockfileVersion: 3, packages }),
      ),
    ).toThrow("50");
  });
  it("rejects oversized inputs", () =>
    expect(() => parseManifest("requirements.txt", "a".repeat(200001))).toThrow(
      "200 KB",
    ));
  it("records unsupported workspace links as incomplete coverage", () =>
    expect(
      parseManifest(
        "package-lock.json",
        '{"lockfileVersion":3,"packages":{"node_modules/a":{"link":true}}}',
      ).warnings.join(" "),
    ).toContain("workspace"));
});
describe("findings and policy", () => {
  it("detects and masks synthetic secrets without validating them", () => {
    const secret = "sk_live_" + "A".repeat(24);
    const result = scanFiles({ "app.ts": `const key = '${secret}'` });
    expect(result).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(JSON.stringify(result)).toContain("sk_l••••••AA");
  });
  it("masks private-key blocks", () =>
    expect(
      maskSecrets(
        "-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----",
      ),
    ).not.toContain("example"));
  it("does not flag a short unrelated identifier", () =>
    expect(scanFiles({ "app.ts": 'const key = "sk_live_short"' })).toEqual([]));
  it("does not claim source maps alone prove a vulnerability", () =>
    expect(
      scanFiles({ "next.config.ts": "productionBrowserSourceMaps: true" })[0]
        .severity,
    ).toBe("review"));
  it("matches the demo advisory on affected versions only", () => {
    expect(snapshotFindings([dependency])).toHaveLength(1);
    expect(snapshotFindings([dependency])[0].evidence[0].dependency).toEqual(dependency);
    expect(snapshotFindings([{ ...dependency, version: "4.17.21" }])).toEqual(
      [],
    );
    expect(snapshotFindings([{ ...dependency, name: "not-lodash" }])).toEqual(
      [],
    );
  });
  it("cannot produce a pass when a provider was unavailable", () =>
    expect(
      verdict([], [{ name: "OSV", state: "incomplete", detail: "Timeout" }]),
    ).toBe("Incomplete"));
  it("cannot produce a pass from a historical snapshot", () =>
    expect(
      verdict([], [{ name: "OSV", state: "snapshot", detail: "Demo" }]),
    ).toBe("Incomplete"));
  it("preserves blocking evidence even with incomplete coverage", () =>
    expect(
      verdict(snapshotFindings([dependency]), [
        { name: "Tavily", state: "incomplete", detail: "Missing key" },
      ]),
    ).toBe("Blocked"));
  it("rejects invented model finding IDs and links", () => {
    expect(() =>
      validateExplanations(
        {
          explanations: [
            { findingId: "made-up", explanation: "Everything is fine" },
          ],
        },
        [],
      ),
    ).toThrow();
    expect(() =>
      validateExplanations(
        {
          explanations: [
            { findingId: "a", explanation: "See https://evil.example" },
          ],
        },
        [{ id: "a" } as never],
      ),
    ).toThrow();
  });
  it("returns real demo findings with explicit provider limitations", async () => {
    const r = await runScan({ mode: "demo" });
    expect(r.status).toBe("Blocked");
    expect(r.findings).toHaveLength(3);
    expect(r.findings.some((f) => f.id.startsWith("secret-"))).toBe(true);
    expect(r.checks.filter((c) => c.state === "incomplete")).toHaveLength(2);
    expect(JSON.stringify(r)).not.toContain("SHIPCHECKSYNTHETIC");
  });
});
describe("live providers", () => {
  it("uses exact ecosystem-aware OSV queries and fetched advisory evidence", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          results: [{ vulns: [{ id: "GHSA-test-test-test" }] }],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "GHSA-test-test-test",
          summary: "Example finding",
          details: "Evidence",
        }),
      );
    const findings = await queryOsv([dependency], f);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({
      queries: [
        { package: { name: "lodash", ecosystem: "npm" }, version: "4.17.20" },
      ],
    });
    expect(findings[0].evidence[0].excerpt).toBe("Evidence");
  });
  it("rejects paginated partial OSV results", async () => {
    const f = vi
      .fn()
      .mockResolvedValue(
        Response.json({ results: [{ next_page_token: "more" }] }),
      );
    await expect(queryOsv([dependency], f)).rejects.toThrow("partial");
  });
  it("ignores withdrawn advisories", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ results: [{ vulns: [{ id: "TEST-1" }] }] }),
      )
      .mockResolvedValueOnce(
        Response.json({ id: "TEST-1", withdrawn: "2026-01-01" }),
      );
    expect(await queryOsv([dependency], f)).toEqual([]);
  });
  it("keeps scan incomplete on OSV failure rather than substituting fixtures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const r = await runScan({
      mode: "live",
      filename: "package-lock.json",
      content: lock(),
      research: false,
    });
    expect(r.status).toBe("Incomplete");
    expect(r.findings).toEqual([]);
    expect(r.checks.find((c) => c.name === "OSV advisories")?.state).toBe(
      "incomplete",
    );
  });
  it("rejects oversized provider responses", async () => {
    const f = vi.fn().mockResolvedValue(new Response("x".repeat(1_000_001)));
    await expect(boundedJson("https://api.osv.dev", {}, f)).rejects.toThrow(
      "too large",
    );
  });
});
describe("API boundary", () => {
  it("accepts the browser origin against Host when Next normalizes the internal URL", async () =>
    expect(
      (
        await POST(
          new Request("http://localhost:3148/api/scans", {
            method: "POST",
            headers: {
              host: "127.0.0.1:3148",
              origin: "http://127.0.0.1:3148",
            },
            body: '{"mode":"demo"}',
          }),
        )
      ).status,
    ).toBe(200));
  it("rejects cross-origin scan requests", async () =>
    expect(
      (
        await POST(
          new Request("http://localhost/api/scans", {
            method: "POST",
            headers: { origin: "https://external.example" },
            body: '{"mode":"demo"}',
          }),
        )
      ).status,
    ).toBe(403));
  it("rejects arbitrary URL targets", async () =>
    expect(
      (
        await POST(
          new Request("http://localhost/api/scans", {
            method: "POST",
            body: '{"mode":"live","url":"http://127.0.0.1"}',
          }),
        )
      ).status,
    ).toBe(400));
  it("rejects malformed input without echoing content", async () => {
    const r = await POST(
      new Request("http://localhost/api/scans", {
        method: "POST",
        body: "secret-value",
      }),
    );
    expect(r.status).toBe(400);
    expect(await r.text()).not.toContain("secret-value");
  });
});
