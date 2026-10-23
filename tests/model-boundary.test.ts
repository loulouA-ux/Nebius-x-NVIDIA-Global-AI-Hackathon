import { it, expect } from "vitest";
import { validateExplanations } from "../src/lib/providers";
import type { Finding } from "../src/lib/types";
const findings = [{ id: "one" }, { id: "two" }] as Finding[];
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
