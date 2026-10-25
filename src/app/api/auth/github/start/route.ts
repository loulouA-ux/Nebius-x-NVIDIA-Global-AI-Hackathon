import { database } from "@/lib/server/db";
import { beginGitHubOAuth, githubOAuthConfig, GITHUB_OAUTH_COOKIE, assertGitHubOrigin } from "@/lib/server/github-oauth";
import { saveOAuthTransaction } from "@/lib/server/github-session";
import { failure } from "@/lib/server/http";
import { Store } from "@/lib/server/store";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const config = githubOAuthConfig();
    assertGitHubOrigin(request,config.origin);
    const query = database();
    await new Store(query).quota("github-login-global",60,60000);
    const flow = beginGitHubOAuth(config);
    await saveOAuthTransaction(query,flow.transaction);
    return new Response(null,{status:302,headers:{Location:flow.authorizationUrl,"Cache-Control":"no-store","Set-Cookie":`${GITHUB_OAUTH_COOKIE}=${flow.browserToken}; HttpOnly; SameSite=Lax; Path=/api/auth/github; Max-Age=600${config.origin.startsWith("https:")?"; Secure":""}`}});
  } catch(e) { return failure(e); }
}
