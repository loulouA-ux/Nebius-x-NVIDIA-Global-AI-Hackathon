import { it, expect } from "vitest";
import { validateExplanations } from "../src/lib/providers";
import type { Finding } from "../src/lib/types";
const findings = [{ id: "one", description: "Review source evidence.", action: "Review the advisory." }, { id: "two", description: "Check configuration.", action: "Review the captured response." }] as Finding[];
it("rejects missing, duplicate and invented explanations", () => {
  for (const explanations of [
    [],
    [{ findingId: "one", explanation: "Review" }],
    [
      { findingId: "one", explanation: "Review" },
      { findingId: "one", explanation: "Review" },
    ],
    [
      { findingId: "one", explanation: "Review" },
      { findingId: "invented", explanation: "Review" },
    ],
  ])
    expect(() => validateExplanations({ explanations }, findings)).toThrow();
});
it("accepts complete explanations without changing finding identities", () => {
  const result = validateExplanations(
    {
      explanations: [
        { findingId: "one", explanation: "Review source evidence." },
        { findingId: "two", explanation: "Check configuration." },
      ],
    },
    findings,
  );
  expect(result.map((x) => x.findingId)).toEqual(["one", "two"]);
});

it("accepts only exact per-finding approved notes and labels fallback", () => {
  const r = validateExplanations({ explanations: [
    { findingId: "one", explanation: "Review source evidence." },
    { findingId: "two", explanation: "Review source evidence." },
  ] }, findings);
  expect(r[0].basis).toBe("validated-selection");
  expect(r[1]).toEqual({ findingId: "two", explanation: "Check configuration.", basis: "scanner-fallback" });
});

const auditedOverstatements = [
  {
    "id": "finding-1",
    "description": "OSV reports lodash@4.17.20 as affected. Severity and application-level exploitability require review; no severity is inferred by the model.",
    "action": "Read the advisory, identify a supported fixed version, update the lockfile and test the application. No changes have been applied.",
    "unsupported": "The lodash trim, toNumber, and trimEnd functions can be forced into exponential backtracking, causing a denial-of-service when processing specially crafted strings."
  },
  {
    "id": "finding-2",
    "description": "OSV reports lodash@4.17.20 as affected. Severity and application-level exploitability require review; no severity is inferred by the model.",
    "action": "Read the advisory, identify a supported fixed version, update the lockfile and test the application. No changes have been applied.",
    "unsupported": "The lodash template function can execute arbitrary shell commands when unsanitized input is passed, leading to command injection."
  },
  {
    "id": "finding-6",
    "description": "The root response did not include the expected header setting. This is a configuration review, not proof of an exploitable vulnerability.",
    "action": "Review this configuration in the context of the application, make any required change, and rescan. No exploitability or fix is verified.",
    "unsupported": "The response lacks a Strict-Transport-Security header, leaving the site without HSTS enforcement."
  },
  {
    "id": "finding-7",
    "description": "The root response did not include the expected header setting. This is a configuration review, not proof of an exploitable vulnerability.",
    "action": "Review this configuration in the context of the application, make any required change, and rescan. No exploitability or fix is verified.",
    "unsupported": "No Content-Security-Policy header is present, so the page has no CSP-based mitigations against injection attacks."
  },
  {
    "id": "finding-8",
    "description": "The root response did not include the expected header setting. This is a configuration review, not proof of an exploitable vulnerability.",
    "action": "Review this configuration in the context of the application, make any required change, and rescan. No exploitability or fix is verified.",
    "unsupported": "The X-Content-Type-Options header is missing, allowing browsers to MIME-sniff resources contrary to the declared type."
  },
  {
    "id": "finding-9",
    "description": "Some cookies lack Secure or HttpOnly. JavaScript-readable cookies may be intentional; cookie purpose and authentication use were not inspected.",
    "action": "Review this configuration in the context of the application, make any required change, and rescan. No exploitability or fix is verified.",
    "unsupported": "One or more cookies are set without the Secure and/or HttpOnly flags, exposing them to potential theft."
  },
  {
    "id": "finding-10",
    "description": "The root OPTIONS response permits any origin. Public resource access may be intentional; credentials and authenticated data access were not tested.",
    "action": "Review this configuration in the context of the application, make any required change, and rescan. No exploitability or fix is verified.",
    "unsupported": "The server responds with Access-Control-Allow-Origin: *, permitting any origin to make cross-origin requests."
  }
];
it.each(auditedOverstatements)("rejects audited overstatement $id without retaining its wording", (example) => {
  const result = validateExplanations({ explanations: [{ findingId: example.id, explanation: example.unsupported }] }, [example as unknown as Finding]);
  expect(result).toEqual([{ findingId: example.id, explanation: example.description, basis: "scanner-fallback" }]);
  expect(JSON.stringify(result)).not.toContain(example.unsupported);
});
