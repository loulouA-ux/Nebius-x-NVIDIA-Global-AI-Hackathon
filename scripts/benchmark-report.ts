import { readFile, writeFile } from "node:fs/promises";
import { compareRuns } from "../src/lib/benchmark";

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw Error("Usage: node --import tsx scripts/benchmark-report.ts input.json output.json");
  const raw = await readFile(input);
  if (raw.length > 10_000_000) throw Error("Input too large.");
  const result = compareRuns(JSON.parse(raw.toString("utf8")));
  await writeFile(output, JSON.stringify(result,null,2)+"\n", { flag:"wx", mode:0o600 });
  console.log("Benchmark summary written. Accuracy remains unscored pending independent adjudication.");
}
main().catch(() => { console.error("Benchmark report failed: check input schema, matching commits and unused output path. No input contents logged."); process.exitCode=1; });
