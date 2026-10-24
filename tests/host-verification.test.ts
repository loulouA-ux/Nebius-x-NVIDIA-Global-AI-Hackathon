import { describe, expect, it } from "vitest";
import {
  issueHostChallenge, matchesProof, normalizeStagingOrigin, verifyDnsProof,
} from "@/lib/host-verification";

describe("staging host proof", () => {
  it("normalizes an exact public HTTPS origin", () => {
    expect(normalizeStagingOrigin(" https://Staging.Example.com/ ")).toBe("staging.example.com");
  });
  it.each([
    "http://staging.example.com/", "https://staging.example.com/path",
    "https://staging.example.com:8443/", "https://user:pass@staging.example.com/",
    "https://127.0.0.1/", "https://[::1]/", "https://service.local/",
  ])("rejects an invalid or unsafe origin: %s", (input) => {
    expect(() => normalizeStagingOrigin(input)).toThrow();
  });
  it("issues a host-bound, expiring proof", () => {
    const proof = issueHostChallenge("staging.example.com", 0);
    expect(proof.txtName).toBe("_agent-shielda.staging.example.com");
    expect(proof.fileUrl).toBe("https://staging.example.com/.well-known/agent-shielda.txt");
    expect(proof.token.length).toBeGreaterThan(32);
    expect(Date.parse(proof.expiresAt)).toBe(15 * 60 * 1000);
  });
  it("accepts only the exact token and exact TXT record name", async () => {
    const proof = issueHostChallenge("staging.example.com", 0);
    const lookup = async (name: string) => {
      expect(name).toBe(proof.txtName);
      return [["agent-shielda=", proof.token]];
    };
    expect(await verifyDnsProof(proof, 1, lookup)).toBe("verified");
    expect(matchesProof(`agent-shielda=${proof.token}extra`, proof.token)).toBe(false);
    expect(await verifyDnsProof(proof, 1, async () => [["agent-shielda=wrong"]])).toBe("mismatch");
    expect(await verifyDnsProof(proof, 1, async () => [])).toBe("missing");
    expect(await verifyDnsProof(proof, 15 * 60 * 1000, lookup)).toBe("expired");
  });
});
