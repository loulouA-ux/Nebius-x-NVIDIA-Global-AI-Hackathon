import { randomBytes } from "node:crypto";
import type { Query } from "./db";
import { hash } from "./session";
import { ApiError } from "./http";
import { validateGitHubTransaction, type OAuthTransaction } from "./github-oauth";

export function githubMemberAllowed(id: string) {
  return (process.env.SHIPCHECK_GITHUB_MEMBER_IDS || "").split(",").map(v => v.trim()).includes(id);
}
export async function saveOAuthTransaction(query: Query, tx: OAuthTransaction) {
  await query("DELETE FROM sc_oauth_transactions WHERE expires_at<=now()");
  await query("INSERT INTO sc_oauth_transactions(state_hash,verifier,browser_hash,expires_at) VALUES($1,$2,$3,$4)",
    [hash(tx.state),tx.verifier,tx.browserHash,new Date(tx.expiresAt).toISOString()]);
}
export async function consumeOAuthTransaction(query: Query, state: string, browserToken: string) {
  if (!/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(browserToken))
    throw new ApiError(400,"Invalid GitHub sign-in transaction.");
  const [row] = await query("DELETE FROM sc_oauth_transactions WHERE state_hash=$1 AND browser_hash=$2 AND expires_at>now() RETURNING verifier,browser_hash,expires_at",[hash(state),hash(browserToken)]);
  return validateGitHubTransaction(row ? {state,verifier:String(row.verifier),browserHash:String(row.browser_hash),expiresAt:new Date(String(row.expires_at)).getTime()} : null,state,browserToken);
}
export async function createGitHubSession(query: Query, identity: {githubId:string;login:string}) {
  // Admission is deliberately separate from GitHub identity: public OAuth does not grant paid scans.
  if (!githubMemberAllowed(identity.githubId)) throw new ApiError(403,"GitHub sign-in verified. This preview is limited to invited members.");
  const [account] = await query("INSERT INTO sc_github_accounts(github_id,login) VALUES($1,$2) ON CONFLICT(github_id) DO UPDATE SET login=excluded.login RETURNING disabled",[identity.githubId,identity.login]);
  if (!account || account.disabled) throw new ApiError(403,"This account is disabled.");
  const actor = {id:`github:${identity.githubId}`,workspaceId:`github:${identity.githubId}`,role:"member" as const};
  const token = randomBytes(32).toString("hex");
  await query("INSERT INTO sc_sessions(token_hash,actor_id,workspace_id,credential_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '8 hours')",[hash(token),actor.id,actor.workspaceId,"github-oauth"]);
  return {actor,token};
}
