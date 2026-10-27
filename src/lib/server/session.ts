import { brandEnv } from "../brand-env";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Query } from "./db";
import { ApiError } from "./http";
import type { Actor } from "./store";
import {activeMembership} from './team-access';
export const SESSION_COOKIE = "shipcheck_session";
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function memberHashes() {
  return {
    peter: brandEnv("PETER_KEY_HASH"),
    louise: brandEnv("LOUISE_KEY_HASH"),
  };
}
export function actorForKey(key: string): Actor | null {
  if (!/^sc_[a-f0-9]{64}$/.test(key)) return null;
  const actual = Buffer.from(hash(key), "hex");
  for (const [id, value] of Object.entries(memberHashes()))
    if (
      value &&
      /^[a-f0-9]{64}$/.test(value) &&
      timingSafeEqual(actual, Buffer.from(value, "hex"))
    )
      return { id, workspaceId: "shipcheck-team", role: "member" };
  return null;
}
function cookieToken(request: Request) {
  const values = (request.headers.get("cookie") || "")
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p.startsWith(SESSION_COOKIE + "="));
  if (values.length !== 1) return null;
  const value = values[0].slice(SESSION_COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export async function createSession(query: Query, key: string) {
  const actor = actorForKey(key);
  if (!actor) throw new ApiError(401, "Invalid access key.");
  const token = randomBytes(32).toString("hex");
  await query(
    "INSERT INTO sc_sessions(token_hash,actor_id,workspace_id,credential_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '8 hours')",
    [hash(token), actor.id, actor.workspaceId, hash(key)],
  );
  return { actor, token };
}
export async function requireActor(
  request: Request,
  query: Query,
): Promise<Actor> {
  const token = cookieToken(request);
  if (!token) throw new ApiError(401, "Sign in to run live scans.");
  const [r] = await query(
    "SELECT actor_id,workspace_id,credential_hash FROM sc_sessions WHERE token_hash=$1 AND expires_at>now()",
    [hash(token)],
  );
  if (r && /^github:[1-9][0-9]*$/.test(String(r.actor_id)) && r.credential_hash === "github-oauth") {
    const id = String(r.actor_id).slice(7);
    const allowed = brandEnv('OPEN_REGISTRATION')==='1' || (brandEnv("GITHUB_MEMBER_IDS") || "").split(",").map(v => v.trim()).includes(id);
    const [account] = await query("SELECT disabled FROM sc_github_accounts WHERE github_id=$1", [id]);
    const membership=await activeMembership(query,String(r.workspace_id),String(r.actor_id));
    if (!allowed || !account || account.disabled || !membership)
      throw new ApiError(401, "Session expired or revoked.");
    return { id: String(r.actor_id), workspaceId: String(r.workspace_id), role: "member" };
  }
  const expected =
    r && memberHashes()[String(r.actor_id) as "peter" | "louise"];
  if (!r || !expected || r.credential_hash !== expected)
    throw new ApiError(401, "Session expired or revoked.");
  return {
    id: String(r.actor_id),
    workspaceId: String(r.workspace_id),
    role: "member",
  };
}
export async function switchWorkspace(request:Request,query:Query,workspaceId:string) {
  const actor=await requireActor(request,query);
  const membership=await activeMembership(query,workspaceId,actor.id);
  if(!membership)throw new ApiError(403,'Workspace membership is required.');
  await query('UPDATE sc_sessions SET workspace_id=$1 WHERE token_hash=$2 AND actor_id=$3',[workspaceId,hash(cookieToken(request)!),actor.id]);
  return {...actor,workspaceId};
}
export async function revokeSession(request: Request, query: Query) {
  const token = cookieToken(request);
  if (token)
    await query("DELETE FROM sc_sessions WHERE token_hash=$1", [hash(token)]);
}
export function sessionCookie(token: string, request: Request, clear = false) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : 28800}${new URL(request.url).protocol === "https:" || process.env.VERCEL ? "; Secure" : ""}`;
}
