import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { beginGitHubOAuth, validateGitHubTransaction, exchangeGitHubIdentity, OAUTH_TTL_MS } from "../src/lib/server/github-oauth";
const config = { clientId: "test-client", clientSecret: "test-only", origin: "https://shipcheck.example" };
describe("GitHub sign-in boundary", () => {
  it("requests identity only and binds a fixed callback and S256 verifier", () => {
    const flow = beginGitHubOAuth(config, 100);
    const p = new URL(flow.authorizationUrl).searchParams;
    expect(p.get("scope")).toBe("read:user");
    expect(p.get("redirect_uri")).toBe(config.origin + "/api/auth/github/callback");
    expect(p.get("code_challenge")).toBe(createHash("sha256").update(flow.transaction.verifier).digest("base64url"));
    expect(validateGitHubTransaction(flow.transaction, flow.transaction.state, flow.browserToken, 101)).toBe(flow.transaction.verifier);
  });
  it("rejects expired, missing, wrong-state and different-browser flows", () => {
    const f = beginGitHubOAuth(config, 100);
    expect(() => validateGitHubTransaction(null, f.transaction.state, f.browserToken, 101)).toThrow();
    expect(() => validateGitHubTransaction(f.transaction, "a".repeat(64), f.browserToken, 101)).toThrow();
    expect(() => validateGitHubTransaction(f.transaction, f.transaction.state, "b".repeat(64), 101)).toThrow();
    expect(() => validateGitHubTransaction(f.transaction, f.transaction.state, f.browserToken, 100 + OAUTH_TTL_MS)).toThrow();
  });
  it("returns numeric identity without exposing the access token", async () => {
    let calls = 0;
    const fake = (async () => new Response(JSON.stringify(++calls === 1 ? {access_token:"private-test",token_type:"bearer"} : {id:123,login:"developer"}), {status:200})) as typeof fetch;
    expect(await exchangeGitHubIdentity(config,"code","verifier",fake)).toEqual({githubId:"123",login:"developer"});
  });
  it("fails closed on token errors", async () => {
    const fake = (async () => new Response(JSON.stringify({error:"bad_verification_code"}), {status:200})) as typeof fetch;
    await expect(exchangeGitHubIdentity(config,"code","verifier",fake)).rejects.toThrow("did not authorize");
  });
});

describe("bounded identity-provider responses",()=>{
 it.each(["token","identity"])("rejects oversized %s responses without exposing tokens",async phase=>{
  let calls=0;
  const fake=(async()=>{calls++;return calls===1&&phase==="identity"?new Response(JSON.stringify({access_token:"private-test",token_type:"bearer"})):new Response("x".repeat(1000001));}) as typeof fetch;
  await expect(exchangeGitHubIdentity(config,"code","verifier",fake)).rejects.toThrow("response too large");
  expect(calls).toBe(phase==="token"?1:2);
 });
 it("does not forward provider redirects with the OAuth secret",async()=>{
  let redirect:RequestRedirect|undefined;
  const fake=(async(_url,init)=>{redirect=init?.redirect;return new Response("",{status:302,headers:{location:"https://other.example"}});}) as typeof fetch;
  await expect(exchangeGitHubIdentity(config,"code","verifier",fake)).rejects.toThrow("Provider request failed");
  expect(redirect).toBe("error");
 });
});
