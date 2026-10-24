import { randomBytes, timingSafeEqual } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { isIP } from "node:net";
import { domainToASCII } from "node:url";

export const CHALLENGE_TTL_MS = 15 * 60 * 1000;
export const PROOF_PREFIX = "agent-shielda=";

export type HostChallenge = {
  hostname: string;
  token: string;
  txtName: string;
  fileUrl: string;
  expiresAt: string;
};

export function normalizeStagingOrigin(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Enter a valid HTTPS staging origin.");
  }
  if (
    url.protocol !== "https:" ||
    url.username || url.password || url.port || url.pathname !== "/" ||
    url.search || url.hash
  ) throw new Error("Enter an HTTPS origin without a path, port, query or credentials.");
  const hostname = domainToASCII(url.hostname).toLowerCase().replace(/\.$/, "");
  if (
    !hostname || hostname.length > 253 || !hostname.includes(".") ||
    isIP(hostname) || hostname === "localhost" ||
    hostname.endsWith(".localhost") || hostname.endsWith(".local") ||
    hostname.split(".").some((part) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part))
  ) throw new Error("Enter a public DNS hostname, not an IP or local name.");
  return hostname;
}

export function issueHostChallenge(hostname: string, now = Date.now()): HostChallenge {
  const exactHost = normalizeStagingOrigin(`https://${hostname}/`);
  return {
    hostname: exactHost,
    token: randomBytes(32).toString("base64url"),
    txtName: `_agent-shielda.${exactHost}`,
    fileUrl: `https://${exactHost}/.well-known/agent-shielda.txt`,
    expiresAt: new Date(now + CHALLENGE_TTL_MS).toISOString(),
  };
}

export function matchesProof(candidate: string, token: string): boolean {
  const expected = Buffer.from(PROOF_PREFIX + token, "utf8");
  const actual = Buffer.from(candidate.trim(), "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function verifyDnsProof(
  challenge: HostChallenge,
  now = Date.now(),
  lookup: typeof resolveTxt = resolveTxt,
): Promise<"verified" | "missing" | "mismatch" | "expired"> {
  if (now >= Date.parse(challenge.expiresAt)) return "expired";
  // Resolve only the server-derived TXT name. TXT character strings in one record are concatenated by DNS.
  let records: string[][];
  try {
    records = await lookup(challenge.txtName);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENODATA" || code === "ENOTFOUND") return "missing";
    throw error;
  }
  if (records.length === 0) return "missing";
  return records.some((parts) => matchesProof(parts.join(""), challenge.token))
    ? "verified" : "mismatch";
}
