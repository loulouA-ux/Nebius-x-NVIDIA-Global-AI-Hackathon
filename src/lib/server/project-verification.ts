import { verifyDnsProof } from "@/lib/host-verification";
import { verifyFileProof } from "@/lib/file-proof";
import { ApiError } from "./http";
import type { Actor, Project, Store } from "./store";

export type ProofMethod = "dns" | "file";
export type ProofResult = "verified" | "missing" | "mismatch" | "expired";
export type VerifiedTarget = {
  projectId: string;
  hostname: string;
  proofMethod: ProofMethod;
};

export function validateProjectId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw new ApiError(400, "Invalid project ID.");
  return id;
}

export function projectResponse(project: Project) {
  const { challenge } = project;
  return {
    projectId: project.id,
    name: project.name,
    hostname: project.hostname,
    verification: {
      status: Date.now() >= Date.parse(challenge.expiresAt)
        ? "expired" as const
        : project.verifiedAt ? "verified" as const : "pending" as const,
      method: project.proofMethod,
      verifiedAt: project.verifiedAt,
      challenge: {
        txtName: challenge.txtName,
        fileUrl: challenge.fileUrl,
        value: `agent-shielda=${challenge.token}`,
        expiresAt: challenge.expiresAt,
      },
      methods: ["dns", "file"] as const,
    },
  };
}

export async function checkProjectProof(project: Project, method: ProofMethod): Promise<ProofResult> {
  return method === "dns"
    ? verifyDnsProof(project.challenge)
    : verifyFileProof(project.challenge);
}

export function proofFailure(result: Exclude<ProofResult, "verified">): ApiError {
  if (result === "expired") return new ApiError(409, "Challenge expired. Refresh it and publish the new value.");
  if (result === "missing") return new ApiError(409, "Proof was not found at the exact hostname.");
  return new ApiError(409, "Proof value does not match the current challenge.");
}

// Called by the host-scan boundary after a member session and project ID are validated.
// A stored verifiedAt is never enough to authorize a new outbound request.
export async function verifyProjectForScan(
  actor: Actor,
  projectId: string,
  store: Store,
): Promise<VerifiedTarget> {
  const project = await store.getProject(actor, validateProjectId(projectId));
  if (!project.verifiedAt || !project.proofMethod)
    throw new ApiError(409, "Verify control of the staging host before scanning it.");
  const result = await checkProjectProof(project, project.proofMethod);
  if (result !== "verified") throw proofFailure(result);
  await store.markVerified(actor, project.id, project.challenge.token, project.proofMethod);
  return {
    projectId: project.id,
    hostname: project.hostname,
    proofMethod: project.proofMethod,
  };
}
