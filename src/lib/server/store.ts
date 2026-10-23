import type { ResearchEvidence } from "../research-evidence";
import { randomUUID } from "node:crypto";
import type { Query } from "./db";
import { ApiError } from "./http";
import { maskSecrets } from "../scanner";
import {
  issueHostChallenge,
  normalizeStagingOrigin,
  type HostChallenge,
} from "../host-verification";
import type { ScanReport } from "../types";
export type Actor = { id: string; workspaceId: string; role: "member" };
export type Project = {
  id: string;
  name: string;
  hostname: string;
  challenge: HostChallenge;
  proofMethod: "dns" | "file" | null;
  verifiedAt: string | null;
};
function project(r: Record<string, unknown>): Project {
  return {
    id: String(r.id),
    name: String(r.name),
    hostname: String(r.hostname),
    challenge: r.challenge as HostChallenge,
    proofMethod: r.proof_method as Project["proofMethod"],
    verifiedAt: r.verified_at
      ? new Date(String(r.verified_at)).toISOString()
      : null,
  };
}
export class Store {
  constructor(readonly query: Query) {}
  async getResearch(key: string): Promise<ResearchEvidence | null> {
    const [r] = await this.query(
      "SELECT value FROM sc_research_cache WHERE cache_key=$1 AND expires_at>now()",
      [key],
    );
    return r ? (r.value as ResearchEvidence) : null;
  }
  async putResearch(key: string, value: ResearchEvidence) {
    await this.query(
      "INSERT INTO sc_research_cache(cache_key,value,expires_at) VALUES($1,$2::jsonb,now()+interval '24 hours') ON CONFLICT(cache_key) DO UPDATE SET value=excluded.value,expires_at=excluded.expires_at",
      [key, maskSecrets(JSON.stringify(value))],
    );
  }
  async quota(
    bucket: string,
    limit: number,
    windowMs: number,
    now = Date.now(),
  ) {
    const window = Math.floor(now / windowMs) * windowMs;
    const rows = await this.query(
      "INSERT INTO sc_quotas(bucket,window_start,used) VALUES($1,$2,1) ON CONFLICT(bucket,window_start) DO UPDATE SET used=sc_quotas.used+1 WHERE sc_quotas.used < $3 RETURNING used",
      [bucket, window, limit],
    );
    if (!rows.length)
      throw new ApiError(429, "Usage limit reached. Try again later.");
  }
  async createProject(actor: Actor, name: string, origin: string) {
    if (!name.trim() || name.length > 80)
      throw new ApiError(400, "Invalid project name.");
    let hostname: string;
    try {
      hostname = normalizeStagingOrigin(origin);
    } catch {
      throw new ApiError(400, "Invalid public HTTPS staging origin.");
    }
    const id = randomUUID(),
      challenge = issueHostChallenge(hostname);
    const [r] = await this.query(
      "INSERT INTO sc_projects(id,workspace_id,owner_id,name,hostname,challenge) VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING *",
      [
        id,
        actor.workspaceId,
        actor.id,
        maskSecrets(name.trim()),
        hostname,
        JSON.stringify(challenge),
      ],
    );
    return project(r);
  }
  async getProject(actor: Actor, id: string) {
    const [r] = await this.query(
      "SELECT * FROM sc_projects WHERE id=$1 AND workspace_id=$2 AND owner_id=$3",
      [id, actor.workspaceId, actor.id],
    );
    if (!r) throw new ApiError(404, "Project not found.");
    return project(r);
  }
  async listProjects(actor: Actor) {
    return (
      await this.query(
        "SELECT * FROM sc_projects WHERE workspace_id=$1 AND owner_id=$2 ORDER BY created_at DESC LIMIT 50",
        [actor.workspaceId, actor.id],
      )
    ).map(project);
  }
  async refreshChallenge(actor: Actor, id: string) {
    const p = await this.getProject(actor, id);
    const challenge = issueHostChallenge(p.hostname);
    const [r] = await this.query(
      "UPDATE sc_projects SET challenge=$4::jsonb,proof_method=NULL,verified_at=NULL WHERE id=$1 AND workspace_id=$2 AND owner_id=$3 RETURNING *",
      [id, actor.workspaceId, actor.id, JSON.stringify(challenge)],
    );
    if (!r) throw new ApiError(404, "Project not found.");
    return project(r);
  }
  async markVerified(
    actor: Actor,
    id: string,
    token: string,
    method: "dns" | "file",
  ) {
    const [r] = await this.query(
      "UPDATE sc_projects SET proof_method=$5,verified_at=now() WHERE id=$1 AND workspace_id=$2 AND owner_id=$3 AND challenge->>'token'=$4 AND (challenge->>'expiresAt')::timestamptz>now() RETURNING *",
      [id, actor.workspaceId, actor.id, token, method],
    );
    if (!r)
      throw new ApiError(409, "Challenge changed or expired; verify again.");
    return project(r);
  }
  async saveScan(actor: Actor, report: ScanReport, projectId?: string) {
    if (projectId) await this.getProject(actor, projectId);
    await this.query(
      "INSERT INTO sc_scans(id,workspace_id,owner_id,project_id,report) VALUES($1,$2,$3,$4,$5::jsonb)",
      [
        report.id,
        actor.workspaceId,
        actor.id,
        projectId || null,
        maskSecrets(JSON.stringify(report)),
      ],
    );
  }
  async getScan(actor: Actor, id: string): Promise<ScanReport> {
    const [r] = await this.query(
      "SELECT report FROM sc_scans WHERE id=$1 AND workspace_id=$2 AND owner_id=$3",
      [id, actor.workspaceId, actor.id],
    );
    if (!r) throw new ApiError(404, "Scan not found.");
    return r.report as ScanReport;
  }
  async listScans(actor: Actor) {
    return this.query(
      "SELECT id,project_id,created_at,report->>'status' AS status FROM sc_scans WHERE workspace_id=$1 AND owner_id=$2 ORDER BY created_at DESC LIMIT 50",
      [actor.workspaceId, actor.id],
    );
  }
  async decide(
    actor: Actor,
    id: string,
    findingId: string,
    action: "acknowledge" | "dismiss",
    reason: string,
  ) {
    if (!["acknowledge", "dismiss"].includes(action) || reason.length > 1000)
      throw new ApiError(400, "Invalid decision.");
    const report = await this.getScan(actor, id);
    if (!report.findings.some((f) => f.id === findingId))
      throw new ApiError(404, "Finding not found.");
    const [r] = await this.query(
      "INSERT INTO sc_decisions(id,scan_id,workspace_id,owner_id,finding_id,action,reason) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,finding_id,action,reason,created_at",
      [
        randomUUID(),
        id,
        actor.workspaceId,
        actor.id,
        findingId,
        action,
        maskSecrets(reason),
      ],
    );
    return r;
  }
  async decisions(actor: Actor, id: string) {
    await this.getScan(actor, id);
    return this.query(
      "SELECT id,finding_id,action,reason,created_at FROM sc_decisions WHERE scan_id=$1 AND workspace_id=$2 AND owner_id=$3 ORDER BY created_at",
      [id, actor.workspaceId, actor.id],
    );
  }
}
