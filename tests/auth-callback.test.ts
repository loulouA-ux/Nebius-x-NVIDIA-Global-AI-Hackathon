import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({consume:vi.fn(),create:vi.fn(),exchange:vi.fn()}));
vi.mock('../src/lib/server/db',()=>({database:()=>vi.fn()}));
vi.mock('../src/lib/server/github-session',()=>({consumeOAuthTransaction:mocks.consume,createGitHubSession:mocks.create}));
vi.mock('../src/lib/server/github-oauth',async original=>({...await original<typeof import('../src/lib/server/github-oauth')>(),exchangeGitHubIdentity:mocks.exchange}));
import {GET} from '../src/app/api/auth/github/callback/route';
import {ApiError} from '../src/lib/server/http';
beforeEach(()=>{vi.stubEnv('SHIPTESTED_APP_ORIGIN','https://app.example');vi.stubEnv('GITHUB_CLIENT_ID','fixture-client');vi.stubEnv('GITHUB_CLIENT_SECRET','fixture-secret');vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('SHIPTESTED_PUBLIC_DEMO','0');mocks.consume.mockReset().mockResolvedValue('fixture-verifier');mocks.exchange.mockReset().mockResolvedValue({githubId:'123',login:'fixture'});mocks.create.mockReset().mockResolvedValue({token:'fixture-session'});});
afterEach(()=>vi.unstubAllEnvs());
const req=(query='code=fixture-code&state=fixture-state',cookie='shipcheck_github_flow=fixture-browser; shiptested_auth_return=%2Frepairs')=>new Request('https://app.example/api/auth/github/callback?'+query,{headers:{cookie}});
describe('OAuth callback recovery',()=>{
 it('returns to a safe workspace and clears transient cookies',async()=>{const r=await GET(req());expect(r.status).toBe(303);expect(r.headers.get('location')).toBe('https://app.example/repairs');expect(r.headers.get('set-cookie')).toContain('shiptested_auth_return=;');expect(mocks.create).toHaveBeenCalledOnce();});
 it('never follows an external return cookie',async()=>{const r=await GET(req(undefined,'shipcheck_github_flow=fixture-browser; shiptested_auth_return=https%3A%2F%2Fevil.example'));expect(r.headers.get('location')).toBe('https://app.example/reports');});
 it('handles cancellation without exchanging a code',async()=>{const r=await GET(req('error=access_denied&state=fixture-state'));expect(r.headers.get('location')).toBe('https://app.example/sign-in?auth=cancelled&next=%2Frepairs');expect(mocks.exchange).not.toHaveBeenCalled();expect(mocks.create).not.toHaveBeenCalled();});
 it('handles expired state without creating a session',async()=>{mocks.consume.mockRejectedValue(new ApiError(400,'Expired'));const r=await GET(req());expect(r.headers.get('location')).toContain('auth=expired');expect(mocks.exchange).not.toHaveBeenCalled();});
 it('does not reflect provider errors or authorization codes',async()=>{mocks.exchange.mockRejectedValue(Error('sensitive-provider-message'));const r=await GET(req());expect(r.headers.get('location')).toContain('auth=unavailable');expect(JSON.stringify([...r.headers])).not.toMatch(/sensitive-provider-message|fixture-code/);expect(mocks.create).not.toHaveBeenCalled();});
 it('rejects a wrong origin instead of redirecting',async()=>{const r=await GET(new Request('https://evil.example/api/auth/github/callback'));expect(r.status).toBe(400);expect(r.headers.has('location')).toBe(false);expect(mocks.consume).not.toHaveBeenCalled();});
});
