import { describe, expect, it, vi } from "vitest";
import { issueHostChallenge } from "@/lib/host-verification";
import { verifyFileProof } from "@/lib/file-proof";

describe("well-known host proof", () => {
  const challenge = issueHostChallenge("staging.example.com", 0);
  const response = (status: number, body = "") => ({ status, body, headers: {} });
  it("fetches only the proof file on the challenge host", async () => {
    const fetcher = vi.fn(async () => response(200, `agent-shielda=${challenge.token}\n`));
    expect(await verifyFileProof(challenge, 1, fetcher)).toBe("verified");
    expect(fetcher).toHaveBeenCalledWith("staging.example.com", "/.well-known/agent-shielda.txt");
  });
  it("distinguishes absent and mismatched proof", async () => {
    expect(await verifyFileProof(challenge, 1, async () => response(404))).toBe("missing");
    expect(await verifyFileProof(challenge, 1, async () => response(200, "agent-shielda=wrong"))).toBe("mismatch");
  });
  it("never fetches after expiry and does not accept server errors", async () => {
    const fetcher = vi.fn(async () => response(200, `agent-shielda=${challenge.token}`));
    expect(await verifyFileProof(challenge, Date.parse(challenge.expiresAt), fetcher)).toBe("expired");
    expect(fetcher).not.toHaveBeenCalled();
    await expect(verifyFileProof(challenge, 1, async () => response(500))).rejects.toThrow("500");
  });
});
