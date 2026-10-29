import { database } from "../src/lib/server/db";
import { Store, type Actor } from "../src/lib/server/store";
import { randomUUID } from "node:crypto";
import { runScan } from "../src/lib/pipeline";
import assert from "node:assert/strict";
const q = database(),
  s = new Store(q),
  id = "verification-" + randomUUID(),
  actor: Actor = { id, workspaceId: "verification", role: "member" };
try {
  const p = await s.createProject(
    actor,
    "Synthetic database acceptance",
    "https://example.com",
  );
  assert.equal((await s.getProject(actor, p.id)).id, p.id);
  await assert.rejects(() => s.getProject({ ...actor, id: "other" }, p.id));
  const report = { ...await runScan({ mode: "demo" }), id: randomUUID() };
  await s.saveScan(actor, report, p.id);
  assert.equal((await s.getScan(actor, report.id)).status, report.status);
  await s.decide(
    actor,
    report.id,
    report.findings[0].id,
    "acknowledge",
    "Synthetic acceptance check",
  );
  assert.equal((await s.decisions(actor, report.id)).length, 1);
  console.log(
    "PASS: live Neon project/scan persistence, ownership isolation and decision readback.",
  );
} catch {
  console.error("Live database acceptance failed; no credentials logged.");
  process.exitCode = 1;
} finally {
  for (const table of ["sc_decisions", "sc_scans", "sc_projects"])
    await q(`DELETE FROM ${table} WHERE owner_id=$1 AND workspace_id=$2`, [
      id,
      "verification",
    ]);
}
