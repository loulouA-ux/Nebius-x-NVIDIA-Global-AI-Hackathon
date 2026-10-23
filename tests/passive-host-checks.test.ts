import { describe, it, expect, vi } from "vitest";
import { scanVerifiedHost } from "../src/lib/passive-host-checks";
describe("passive host checks", () => {
  it("uses exactly four fixed requests and does not retain cookie values or response bodies", async () => {
    const f = vi
      .fn()
      .mockResolvedValue({
        status: 200,
        headers: {
          "set-cookie": ["session=SHOULD_NOT_LEAK; Path=/"],
          "access-control-allow-origin": "*",
        },
        body: "SHOULD_NOT_LEAK",
      });
    const r = await scanVerifiedHost("staging.example.com", f);
    expect(f.mock.calls.map((c) => c.slice(1))).toEqual([
      ["/", "GET"],
      ["/robots.txt", "GET"],
      ["/.well-known/security.txt", "GET"],
      ["/", "OPTIONS"],
    ]);
    expect(r.findings.length).toBeGreaterThan(0);
    expect(JSON.stringify(r)).not.toContain("SHOULD_NOT_LEAK");
    expect(r.findings.every((x) => x.severity === "review")).toBe(true);
  });
  it("keeps failed network/redirect checks incomplete", async () => {
    const r = await scanVerifiedHost(
      "staging.example.com",
      vi.fn().mockRejectedValue(Error("redirect")),
    );
    expect(r.checks).toHaveLength(4);
    expect(r.checks.every((c) => c.state === "incomplete")).toBe(true);
    expect(r.findings).toEqual([]);
  });
  it("does not treat optional 404s and unsupported OPTIONS as proof of vulnerability", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        headers: {
          "strict-transport-security": "max-age=31536000",
          "content-security-policy": "default-src 'self'",
          "x-content-type-options": "nosniff",
        },
        body: "",
      })
      .mockResolvedValueOnce({ status: 404, headers: {}, body: "" })
      .mockResolvedValueOnce({ status: 404, headers: {}, body: "" })
      .mockResolvedValueOnce({ status: 405, headers: {}, body: "" });
    const r = await scanVerifiedHost("staging.example.com", f);
    expect(r.findings).toEqual([]);
    expect(r.checks.every((c) => c.state === "complete")).toBe(true);
  });
});
