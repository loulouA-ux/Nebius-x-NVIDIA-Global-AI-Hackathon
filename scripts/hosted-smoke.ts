import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const deployment = process.argv[2];
if (!deployment || !/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(deployment))
  throw new Error("Pass the exact preview deployment URL.");
const dir = ".private/acceptance-" + randomUUID();
mkdirSync(dir, { mode: 0o700, recursive: true });
let sequence = 0;
const loggedIn = new Set<string>();
function request(
  path: string,
  method = "GET",
  data?: unknown,
  member?: string,
) {
  const id = ++sequence,
    output = `${dir}/${id}.json`,
    headers = `${dir}/${id}.headers`,
    cookie = `${dir}/${member || "anonymous"}.cookies`;
  const args = [
    "curl",
    path,
    "--deployment",
    deployment,
    "--scope",
    "hey-salad-inc",
    "--",
    "--silent",
    "--show-error",
    "--max-time",
    "100",
    "--request",
    method,
    "--output",
    output,
    "--dump-header",
    headers,
    "--cookie-jar",
    cookie,
  ];
  if (member && method !== "LOGIN") args.push("--cookie", cookie);
  if (data !== undefined)
    args.push(
      "--header",
      "Content-Type: application/json",
      "--header",
      `Origin: ${deployment}`,
      "--data-binary",
      "@-",
    );
  const r = spawnSync("vercel", args, {
    input: data === undefined ? undefined : JSON.stringify(data),
    encoding: "utf8",
    timeout: 110000,
  });
  if (r.status !== 0)
    throw new Error("Preview request command failed (details suppressed).");
  const hs = readFileSync(headers, "utf8");
  const status = Number([...hs.matchAll(/^HTTP\/\S+ (\d+)/gm)].at(-1)?.[1]);
  let body: any;
  try {
    body = JSON.parse(readFileSync(output, "utf8"));
  } catch {
    throw new Error("Preview response was not JSON.");
  }
  return { status, body, headers: hs };
}
try {
  assert.equal(request("/api/health").status, 200);
  const unauthorized = request("/api/scans", "POST", {
    mode: "live",
    filename: "package.json",
    content: '{"dependencies":{"lodash":"4.17.20"}}',
  });
  assert.equal(unauthorized.status, 401);
  const demo = request("/api/scans", "POST", { mode: "demo" });
  assert.equal(demo.status, 200);
  assert.equal(demo.body.mode, "demo");
  console.log("PASS: hosted health, anonymous live denial and offline demo.");
  for (const member of ["peter", "louise"]) {
    const key = readFileSync(`.private/${member}-access-key`, "utf8").trim();
    const login = request("/api/session", "POST", { key }, member);
    assert.equal(login.status, 200);
    assert.equal(login.body.actor.id, member);
    loggedIn.add(member);
    assert.match(login.headers, /HttpOnly/i);
    assert.match(login.headers, /SameSite=Strict/i);
    assert.match(login.headers, /Secure/i);
    assert.equal(
      request("/api/session", "GET", undefined, member).body.actor.id,
      member,
    );
  }
  console.log("PASS: two distinct hosted member sessions and secure cookies.");
  const project = request(
    "/api/projects",
    "POST",
    {
      name: "Acceptance " + new Date().toISOString(),
      stagingUrl: "https://example.com",
    },
    "peter",
  );
  assert.equal(project.status, 201);
  const pid = project.body.projectId;
  assert.equal(
    request(`/api/projects/${pid}`, "GET", undefined, "louise").status,
    404,
  );
  assert.equal(
    request("/api/projects", "GET", undefined, "peter").body.projects.some(
      (p: any) => p.projectId === pid,
    ),
    true,
  );
  const refresh = request(
    `/api/projects/${pid}/challenge`,
    "POST",
    undefined,
    "peter",
  );
  assert.equal(refresh.status, 200);
  assert.notEqual(
    refresh.body.verification.challenge.value,
    project.body.verification.challenge.value,
  );
  console.log(
    "PASS: project create/list, challenge rotation and cross-member denial.",
  );
  let targetProject: string | undefined;
  if (process.argv.includes("--host")) {
    targetProject = JSON.parse(
      readFileSync(".private/fixture-project.json", "utf8"),
    ).projectId;
    const denied = request(
      "/api/scans",
      "POST",
      {
        mode: "live",
        filename: "package.json",
        content: '{"dependencies":{"lodash":"4.17.20"}}',
        projectId: pid,
      },
      "peter",
    );
    assert.equal(denied.status, 409);
    const proof = request(
      `/api/projects/${targetProject}/verify`,
      "POST",
      { method: "file" },
      "peter",
    );
    assert.equal(proof.status, 200);
    console.log(
      "PASS: unverified host scan denied and real public file proof verified.",
    );
  }
  const live = request(
    "/api/scans",
    "POST",
    {
      mode: "live",
      filename: "package.json",
      content: '{"dependencies":{"lodash":"4.17.20"}}',
      research: true,
      ...(targetProject ? { projectId: targetProject } : {}),
    },
    "peter",
  );
  assert.equal(live.status, 200);
  if (targetProject) {
    const checks = live.body.checks.filter((c: any) =>
      c.name.startsWith("Host "),
    );
    assert.equal(checks.length, 4);
    assert.ok(checks.every((c: any) => c.state === "complete"));
    assert.ok(live.body.findings.some((f: any) => f.id.startsWith("host-")));
    assert.ok(!JSON.stringify(live.body).includes("demo_preference=example"));
    console.log("PASS: four real passive host checks; cookie values omitted.");
  }
  const rid = live.body.id;
  assert.ok(live.body.findings.length);
  const persisted = request(`/api/scans/${rid}`, "GET", undefined, "peter");
  assert.equal(persisted.status, 200);
  assert.equal(persisted.body.report.id, rid);
  assert.equal(
    request(`/api/scans/${rid}`, "GET", undefined, "louise").status,
    404,
  );
  const decision = request(
    `/api/scans/${rid}/decisions`,
    "POST",
    {
      findingId: live.body.findings[0].id,
      action: "acknowledge",
      reason: "Synthetic acceptance check; no remediation claim.",
    },
    "peter",
  );
  assert.equal(decision.status, 201);
  const saved = request(`/api/scans/${rid}`, "GET", undefined, "peter");
  assert.equal(saved.body.decisions.length, 1);
  assert.equal(saved.body.report.status, live.body.status);
  assert.equal(
    request("/api/scans", "GET", undefined, "peter").body.scans.some(
      (s: any) => s.id === rid,
    ),
    true,
  );
  console.log(
    JSON.stringify({
      status:
        "PASS: live scan, persisted report, immutable decision and cross-member denial",
      checks: live.body.checks.map((c: any) => ({
        name: c.name,
        state: c.state,
      })),
    }),
  );
  for (const member of ["peter", "louise"]) {
    assert.equal(
      request("/api/session", "DELETE", undefined, member).status,
      200,
    );
    assert.equal(request("/api/session", "GET", undefined, member).status, 401);
  }
  console.log(
    "PASS: logout invalidates both sessions. Synthetic acceptance project/report retained for review.",
  );
} catch {
  console.log(
    JSON.stringify({
      status: "FAIL",
      requestNumber: sequence,
      detail: "Acceptance assertion failed; credentials/responses suppressed.",
    }),
  );
  process.exitCode = 1;
} finally {
  for (const member of loggedIn) {
    try {
      request("/api/session", "DELETE", undefined, member);
    } catch {
      /* Sessions still expire server-side after eight hours. */
    }
  }
  rmSync(dir, { recursive: true, force: true });
}
