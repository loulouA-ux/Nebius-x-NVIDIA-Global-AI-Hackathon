import { brandEnv } from "../brand-env";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { boundedJson } from "../providers";
import { ApiError } from "./http";

export const GITHUB_OAUTH_COOKIE = "shipcheck_github_flow";
export const OAUTH_TTL_MS = 10 * 60 * 1000;
export type GitHubOAuthConfig = { clientId: string; clientSecret: string; origin: string };
export type OAuthTransaction = { state: string; verifier: string; browserHash: string; expiresAt: number };
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export function githubOAuthConfig(): GitHubOAuthConfig {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
  const appOrigin = brandEnv("APP_ORIGIN");
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !appOrigin)
    throw new ApiError(503, "GitHub sign-in is not configured.");
  const url = new URL(appOrigin);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "127.0.0.1")))
    throw new ApiError(503, "GitHub callback origin is invalid.");
  return { clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET, origin: url.origin };
}

export function beginGitHubOAuth(config: GitHubOAuthConfig, now = Date.now()) {
  const browserToken = randomBytes(32).toString("hex");
  const transaction: OAuthTransaction = {
    state: randomBytes(32).toString("hex"), verifier: randomBytes(32).toString("base64url"),
    browserHash: digest(browserToken), expiresAt: now + OAUTH_TTL_MS,
  };
  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = new URLSearchParams({ client_id: config.clientId,
    redirect_uri: `${config.origin}/api/auth/github/callback`, scope: "read:user",
    state: transaction.state, code_challenge_method: "S256",
    code_challenge: createHash("sha256").update(transaction.verifier).digest("base64url"),
  }).toString();
  return { transaction, browserToken, authorizationUrl: url.toString() };
}

// Caller must atomically DELETE ... RETURNING the transaction before exchange.
export function validateGitHubTransaction(tx: OAuthTransaction | null, state: string, browserToken: string, now = Date.now()) {
  if (!tx || !/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(browserToken) ||
      tx.expiresAt <= now || tx.state !== state || !/^[a-f0-9]{64}$/.test(tx.browserHash) ||
      !timingSafeEqual(Buffer.from(tx.browserHash, "hex"), Buffer.from(digest(browserToken), "hex")))
    throw new ApiError(400, "GitHub sign-in expired or did not match this browser. Start again.");
  return tx.verifier;
}

export async function exchangeGitHubIdentity(config: GitHubOAuthConfig, code: string, verifier: string, request = fetch) {
  if (!code || code.length > 512) throw new ApiError(400, "Invalid GitHub authorization code.");
  const tokenResponse = await boundedJson("https://github.com/login/oauth/access_token", {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret,
      code, code_verifier: verifier, redirect_uri: `${config.origin}/api/auth/github/callback` }),
  }, request);
  const parsedToken=z.object({access_token:z.string().min(1).max(2048),token_type:z.string().refine(v=>v.toLowerCase()==="bearer")}).safeParse(tokenResponse);
  if (!parsedToken.success)
    throw new ApiError(502, "GitHub did not authorize this sign-in.");
  const token=parsedToken.data;
  const userResponse = await boundedJson("https://api.github.com/user", {
    redirect: "error", signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token.access_token}`, "User-Agent": "ShipTested" },
  }, request);
  const parsedUser=z.object({id:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),login:z.string().regex(/^[a-zA-Z0-9-]{1,39}$/)}).safeParse(userResponse);
  if (!parsedUser.success)
    throw new ApiError(502, "GitHub returned an invalid identity.");
  const user=parsedUser.data;
  // Identity only: deliberately do not persist or return the OAuth bearer token.
  return { githubId: String(user.id), login: user.login };
}

// Next's production server reconstructs loopback requests with localhost in request.url.
// Accept that internal alias only when the actual Host is the registered loopback origin.
export function assertGitHubOrigin(request:Request,origin:string){
 const actual=new URL(request.url),expected=new URL(origin),host=request.headers.get("host");
 const loopbackAlias=expected.protocol==="http:"&&expected.hostname==="127.0.0.1"&&actual.protocol==="http:"&&actual.hostname==="localhost"&&actual.port===expected.port&&host===expected.host;
 if((actual.origin!==expected.origin&&!loopbackAlias)||(host!==null&&host!==expected.host))throw new ApiError(400,"Use the configured ShipTested sign-in address.");
}
