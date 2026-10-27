import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type { Dependency, Finding, Check, ScanReport } from "./types.js";

const patterns = [
  /\bsk_live_[A-Za-z0-9]{16,}\b/g,
  /\bghp_[A-Za-z0-9]{20,}\b/g,
  /\btvly-[A-Za-z0-9_-]{20,}\b/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
];
export function maskSecrets(text: string) {
  return patterns.reduce(
    (s, p) => s.replace(p, (v) => `${v.slice(0, 4)}••••••${v.slice(-2)}`),
    text,
  );
}
export function scanFiles(files: Record<string, string>): Finding[] {
  const findings: Finding[] = [];
  for (const [path, text] of Object.entries(files)) {
    for (const pattern of patterns) {
      for (const match of text.matchAll(new RegExp(pattern))) {
        const line = text.slice(0, match.index).split("\n").length;
        findings.push({
          id: `secret-${bytesToHex(sha256(new TextEncoder().encode(`${path}:${line}:${match[0]}`))).slice(0, 12)}`,
          title: "Potential credential in supplied content",
          severity: "high",
          description:
            "A supported credential pattern is present. Its validity has not been tested. Treat an exposed real credential as requiring rotation.",
          action:
            "Remove the value from source, move it to a server-side secret store and rotate it if it is real. Removing text does not revoke a credential.",
          evidence: [
            {
              kind: "code",
              location: `${path}:${line}`,
              excerpt: maskSecrets(match[0]),
            },
          ],
        });
      }
    }
    if (/productionBrowserSourceMaps\s*:\s*true/.test(text))
      findings.push({
        id: "browser-sourcemaps",
        title: "Production browser source maps are enabled",
        severity: "review",
        description:
          "Source maps can make browser source easier to inspect. This setting alone does not prove sensitive information is exposed.",
        action:
          "Review the published bundles and source maps. Disable public production source maps if they contain information you do not intend to expose.",
        evidence: [
          {
            kind: "code",
            location: path,
            excerpt: "productionBrowserSourceMaps: true",
          },
        ],
      });
  }
  return findings;
}
export function verdict(
  findings: Finding[],
  checks: Check[],
): ScanReport["status"] {
  if (findings.some((f) => f.severity === "high")) return "Blocked";
  if (checks.some((c) => c.state === "incomplete" || c.state === "snapshot"))
    return "Incomplete";
  if (findings.length) return "Review required";
  return "Checks passed";
}
