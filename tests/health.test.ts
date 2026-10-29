import {afterEach,expect,test,vi} from 'vitest';
import {GET} from '../src/app/api/health/route';
afterEach(()=>vi.unstubAllEnvs());
test('health includes OAuth member access and still suppresses it in demo mode',async()=>{
 vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('SHIPTESTED_PUBLIC_DEMO','0');
 vi.stubEnv('GITHUB_CLIENT_ID','test');vi.stubEnv('GITHUB_CLIENT_SECRET','test');vi.stubEnv('SHIPTESTED_APP_ORIGIN','https://example.test');
 expect((await (await GET()).json()).memberAccess).toBe(true);
 vi.stubEnv('SHIPTESTED_PUBLIC_DEMO','1');expect((await (await GET()).json()).memberAccess).toBe(false);
});
