import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { database } from "../src/lib/server/db";
import { Store } from "../src/lib/server/store";
const host = "shipcheck-demo-target.heysalad-o.workers.dev";
const store = new Store(database());
const actor = {
  id: "peter",
  workspaceId: "shipcheck-team",
  role: "member" as const,
};
const project = await store.createProject(
  actor,
  "Synthetic host acceptance",
  `https://${host}`,
);
mkdirSync(".private", { recursive: true, mode: 0o700 });
writeFileSync(
  ".private/fixture-project.json",
  JSON.stringify({ projectId: project.id, hostname: host }),
  { mode: 0o600 },
);
writeFileSync(
  ".private/fixture-wrangler.json",
  JSON.stringify({
    name: "shipcheck-demo-target",
    main: resolve("fixtures/staging-worker/index.ts"),
    account_id: "67a17ada4efeee4480283035cc0c5f90",
    compatibility_date: "2026-10-23",
    workers_dev: true,
    vars: { PUBLIC_PROOF: `agent-shielda=${project.challenge.token}` },
    observability: { enabled: false },
  }),
  { mode: 0o600 },
);
console.log(
  "Synthetic project and public proof deployment config prepared; proof valid 15 minutes.",
);
