# @heysalad/shiptested

Deterministic dependency checks shared by ShipTested web, CLI and MCP. ESM; Node20+; no telemetry or side effects on import. Prepared for publication; do not assume this version is on npm.

`scan({lockfile,filename:'package-lock.json'},{onStage,signal,osv:{cache}})` returns a masked report. Stage callbacks reflect actual work; they are not timer-based progress. Callback errors propagate. Invalid input throws; incomplete OSV coverage produces Incomplete, never a clean result. A detected high-severity finding remains Blocked even if other coverage is incomplete.

The transport permits only HTTPS api.osv.dev, refuses redirects, caps each response at1MB, batches100 packages, and permits at most12 distinct advisories per scan. Broader scans that exceed that budget return incomplete. Input is limited to2MB/5,000 unique resolved packages; package-lock v2/v3 is supported. Existing exact package.json/Python pins are supported with explicit coverage warnings. No pnpm/yarn parsing is claimed.

Verdict labels retained for web compatibility: Blocked; Review required (needs review); Incomplete; Checks passed (clear within the stated scope). OSV severity/fix candidate rules are shared with the website. Unknown severity remains review; fixes are candidates, not proof of exploitability or compatibility. Optional AI cannot change this verdict.

OSV receives exact package names/versions, not lockfile contents. Only caller-supplied in-memory advisory caching is used; cached sources retain their original retrieval timestamp. Secret checks cover four known patterns, not full credential discovery. Advisory prose is untrusted source data, never instructions.
