import {refusePublicDemo} from '@/lib/server/public-demo';
import { database } from "@/lib/server/db";
import { githubOAuthConfig, GITHUB_OAUTH_COOKIE, exchangeGitHubIdentity, assertGitHubOrigin } from "@/lib/server/github-oauth";
import { consumeOAuthTransaction, createGitHubSession } from "@/lib/server/github-session";
import { sessionCookie } from "@/lib/server/session";
import { failure, ApiError } from "@/lib/server/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const denied=refusePublicDemo();if(denied)return denied;

  try {
    const config = githubOAuthConfig(), url = new URL(request.url);
    assertGitHubOrigin(request,config.origin);
    const values = (request.headers.get("cookie")||"").split(";").map(v=>v.trim()).filter(v=>v.startsWith(GITHUB_OAUTH_COOKIE+"="));
    if (values.length !== 1) throw new ApiError(400,"GitHub sign-in browser session missing.");
    const query = database();
    const verifier = await consumeOAuthTransaction(query,url.searchParams.get("state")||"",values[0].slice(GITHUB_OAUTH_COOKIE.length+1));
    if (url.searchParams.has("error")) throw new ApiError(400,"GitHub sign-in was cancelled.");
    const identity = await exchangeGitHubIdentity(config,url.searchParams.get("code")||"",verifier);
    const session = await createGitHubSession(query,identity);
    const headers = new Headers({Location:config.origin+"/reports","Cache-Control":"no-store","Referrer-Policy":"no-referrer"});
    headers.append("Set-Cookie",sessionCookie(session.token,request));
    headers.append("Set-Cookie",`${GITHUB_OAUTH_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/auth/github; Max-Age=0${config.origin.startsWith("https:")?"; Secure":""}`);
    return new Response(null,{status:303,headers});
  } catch(e) { return failure(e); }
}
