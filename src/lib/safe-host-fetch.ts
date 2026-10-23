import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";
import { normalizeStagingOrigin } from "./host-verification";

const blocked4 = new BlockList();
const blocked6 = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24],
  ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked4.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["::", 128], ["::1", 128], ["::ffff:0:0", 96], ["64:ff9b::", 96],
  ["100::", 64], ["2001::", 32], ["2001:db8::", 32], ["2002::", 16],
  ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) blocked6.addSubnet(network, prefix, "ipv6");

const PATHS = new Set(["/", "/robots.txt", "/.well-known/security.txt", "/.well-known/agent-shielda.txt"]);
const MAX_BYTES = 64 * 1024;
const TIMEOUT_MS = 8_000;
export type SafeResponse = { status: number; headers: Record<string, string | string[] | undefined>; body: string };
export type Address = { address: string; family: 4 | 6 };

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked4.check(address, "ipv4");
  // Only ordinary globally routed IPv6 is considered. Transition and local ranges above remain blocked.
  if (family === 6) return !blocked6.check(address, "ipv6") && /^[23]/i.test(address);
  return false;
}

export async function resolvePublicHost(
  hostname: string,
  resolver: (name: string) => Promise<Address[]> = async (name) => {
    const addresses = await dnsLookup(name, { all: true, verbatim: true });
    return addresses.map(({ address, family }) => ({ address, family: family as 4 | 6 }));
  },
): Promise<Address> {
  const exactHost = normalizeStagingOrigin(`https://${hostname}/`);
  const answers = await resolver(exactHost);
  if (!answers.length || answers.some(({ address, family }) => isIP(address) !== family || !isPublicAddress(address))) {
    throw new Error("The staging host did not resolve exclusively to public addresses.");
  }
  return answers[0];
}

export function assertFixedRequest(path: string, method: string): void {
  if (!PATHS.has(path) || !["GET", "HEAD", "OPTIONS"].includes(method)) {
    throw new Error("Only fixed passive host checks are allowed.");
  }
  if (method === "OPTIONS" && path !== "/") throw new Error("OPTIONS is limited to the site root.");
}

export async function fetchVerifiedPath(
  hostname: string,
  path: string,
  method: "GET" | "HEAD" | "OPTIONS" = "GET",
  resolver?: (name: string) => Promise<Address[]>,
): Promise<SafeResponse> {
  assertFixedRequest(path, method);
  const host = normalizeStagingOrigin(`https://${hostname}/`);
  const pinned = await resolvePublicHost(host, resolver);
  return new Promise((resolve, reject) => {
    const req = httpsRequest({
      hostname: host, port: 443, path, method, servername: host,
      signal: AbortSignal.timeout(TIMEOUT_MS), rejectUnauthorized: true,
      lookup: (_name, _options, callback) => callback(null, pinned.address, pinned.family),
      headers: method === "OPTIONS" ? { Origin: `https://${host}`, "Access-Control-Request-Method": "GET" } : {},
    }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        res.destroy();
        reject(new Error("Redirects are not followed during host checks."));
        return;
      }
      let size = 0;
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_BYTES) {
          res.destroy(new Error("Host response exceeded the 64 KB limit."));
        } else chunks.push(chunk);
      });
      res.on("error", reject);
      res.on("end", () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    req.end();
  });
}
