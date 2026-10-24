import { HostChallenge, matchesProof } from "./host-verification";
import { fetchVerifiedPath, SafeResponse } from "./safe-host-fetch";

export async function verifyFileProof(
  challenge: HostChallenge,
  now = Date.now(),
  fetcher: (hostname: string, path: string) => Promise<SafeResponse> = (hostname, path) =>
    fetchVerifiedPath(hostname, path),
): Promise<"verified" | "missing" | "mismatch" | "expired"> {
  if (now >= Date.parse(challenge.expiresAt)) return "expired";
  const response = await fetcher(challenge.hostname, "/.well-known/agent-shielda.txt");
  if (response.status === 404 || response.status === 410) return "missing";
  if (response.status !== 200) throw new Error(`Verification file returned HTTP ${response.status}.`);
  return matchesProof(response.body, challenge.token) ? "verified" : "mismatch";
}
