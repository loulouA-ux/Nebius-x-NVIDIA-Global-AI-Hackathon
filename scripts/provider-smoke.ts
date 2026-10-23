import { research, explain } from "../src/lib/providers";
const findings = [
  {
    id: "synthetic-source-map",
    title: "Public browser source maps",
    severity: "medium" as const,
    description:
      "A synthetic build configuration enables public browser source maps.",
    action: "Review whether source maps should be public.",
    evidence: [
      {
        kind: "code" as const,
        location: "synthetic next.config.ts",
        excerpt: "productionBrowserSourceMaps: true",
      },
    ],
  },
];
let failed = false;
for (const provider of ["tavily", "nebius"]) {
  const key =
    process.env[provider === "tavily" ? "TAVILY_API_KEY" : "NEBIUS_API_KEY"];
  if (!key) {
    console.log(JSON.stringify({ provider, status: "missing key" }));
    failed = true;
    continue;
  }
  let httpStatus: number | undefined;
  const checkedFetch: typeof fetch = async (input, init) => {
    const r = await fetch(input, init);
    httpStatus = r.status;
    return r;
  };
  try {
    const data =
      provider === "tavily"
        ? await research(
            [
              {
                name: "lodash",
                version: "4.17.20",
                ecosystem: "npm",
                path: "synthetic/package.json",
              },
            ],
            key,
            checkedFetch,
          )
        : await explain(findings, [], key, checkedFetch);
    if (!data.length) throw new Error("No results");
    console.log(
      JSON.stringify({
        provider,
        status: "passed",
        httpStatus,
        validatedResults: data.length,
      }),
    );
  } catch {
    failed = true;
    console.log(
      JSON.stringify({
        provider,
        status: "failed",
        httpStatus: httpStatus ?? "no response",
        detail:
          "Request or response validation failed; sensitive response suppressed.",
      }),
    );
  }
}
process.exitCode = failed ? 1 : 0;
