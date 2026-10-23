import { fetchVerifiedPath, type SafeResponse } from "./safe-host-fetch";
import type { Check, Finding } from "./types";
export type HostCheckResult = { findings: Finding[]; checks: Check[] };
export async function scanVerifiedHost(
  hostname: string,
  fetcher: typeof fetchVerifiedPath = fetchVerifiedPath,
): Promise<HostCheckResult> {
  const findings: Finding[] = [],
    checks: Check[] = [];
  const requests = [
    ["/", "GET"],
    ["/robots.txt", "GET"],
    ["/.well-known/security.txt", "GET"],
    ["/", "OPTIONS"],
  ] as const;
  function finding(
    id: string,
    title: string,
    description: string,
    path: string,
    excerpt: string,
  ) {
    findings.push({
      id: `host-${id}`,
      title,
      severity: "review",
      description,
      action:
        "Review this configuration in the context of the application, make any required change, and rescan. No exploitability or fix is verified.",
      evidence: [
        {
          kind: "http",
          location: `https://${hostname}${path}`,
          excerpt,
          retrievedAt: new Date().toISOString(),
        },
      ],
    });
  }
  for (const [path, method] of requests) {
    let response: SafeResponse;
    try {
      response = await fetcher(hostname, path, method);
    } catch {
      checks.push({
        name: `Host ${method} ${path}`,
        state: "incomplete",
        detail:
          "Request failed, redirected, exceeded the size/time budget, or failed public-network validation. No response was substituted.",
      });
      continue;
    }
    const success = response.status >= 200 && response.status < 300;
    const optionalMissing = path !== "/" && response.status === 404;
    const optionsRejected =
      method === "OPTIONS" && [404, 405, 501].includes(response.status);
    checks.push({
      name: `Host ${method} ${path}`,
      state:
        success || optionalMissing || optionsRejected
          ? "complete"
          : "incomplete",
      detail: `HTTP ${response.status}; one bounded passive request. ${optionalMissing ? "Optional file absent." : optionsRejected ? "OPTIONS unsupported; no CORS behavior inferred." : "No active exploitation attempted."}`,
    });
    if (!success) continue;
    const h = response.headers;
    const text = (name: string) =>
      Array.isArray(h[name])
        ? (h[name] as string[]).join(",")
        : String(h[name] || "");
    if (path === "/" && method === "GET") {
      for (const [name, title] of [
        ["strict-transport-security", "HSTS header needs review"],
        ["content-security-policy", "Content Security Policy needs review"],
        ["x-content-type-options", "MIME sniffing protection needs review"],
      ] as const) {
        const value = text(name).toLowerCase();
        const valid =
          name === "strict-transport-security"
            ? /max-age\s*=\s*[1-9]\d*/.test(value)
            : name === "x-content-type-options"
              ? value.trim() === "nosniff"
              : Boolean(value.trim());
        if (!valid)
          finding(
            name,
            title,
            "The root response did not include the expected header setting. This is a configuration review, not proof of an exploitable vulnerability.",
            path,
            `${name}: expected setting not observed`,
          );
      }
      const cookies = h["set-cookie"];
      const values = Array.isArray(cookies)
        ? cookies
        : cookies
          ? [cookies]
          : [];
      const insecure = values.filter(
        (c) => !/(?:^|;)\s*secure\s*(?:;|$)/i.test(c),
      ).length;
      const readable = values.filter(
        (c) => !/(?:^|;)\s*httponly\s*(?:;|$)/i.test(c),
      ).length;
      if (insecure || readable)
        finding(
          "cookie-flags",
          "Cookie flags need review",
          "Some cookies lack Secure or HttpOnly. JavaScript-readable cookies may be intentional; cookie purpose and authentication use were not inspected.",
          path,
          `${values.length} cookie(s); ${insecure} without Secure, ${readable} without HttpOnly. Names and values omitted.`,
        );
    }
    if (
      path === "/" &&
      method === "OPTIONS" &&
      text("access-control-allow-origin") === "*"
    )
      finding(
        "cors",
        "Wildcard CORS policy needs review",
        "The root OPTIONS response permits any origin. Public resource access may be intentional; credentials and authenticated data access were not tested.",
        path,
        "access-control-allow-origin: *",
      );
    if (
      path === "/.well-known/security.txt" &&
      !/^Contact:\s*\S+/im.test(response.body)
    )
      finding(
        "security-contact",
        "Security contact file needs review",
        "The security.txt response lacks a Contact field. This is reporting-readiness guidance, not a vulnerability.",
        path,
        "Contact field not observed; response body not retained.",
      );
  }
  return { findings, checks };
}
