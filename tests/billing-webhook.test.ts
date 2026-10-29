import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import StripeClient from 'stripe';
const query=vi.hoisted(()=>vi.fn(async(_sql:string,_params?:unknown[])=>[]));
vi.mock('../src/lib/server/db',()=>({database:()=>query}));
import {POST} from '../src/app/api/billing/webhook/route';
const client=new StripeClient('sk_test_fixture'),secret='whsec_fixture_only';
beforeEach(()=>{query.mockClear();vi.stubEnv('SHIPTESTED_PUBLIC_DEMO','0');vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('STRIPE_SECRET_KEY','rk_test_fixture');vi.stubEnv('STRIPE_TEAM_PRICE_ID','price_fixture');vi.stubEnv('STRIPE_WEBHOOK_SECRET',secret);vi.stubEnv('SHIPTESTED_APP_ORIGIN','https://example.com');});
afterEach(()=>vi.unstubAllEnvs());
function request(body:string,signature:string){return new Request('https://example.com/api/billing/webhook',{method:'POST',headers:{'stripe-signature':signature},body});}
function signature(payload:string){return client.webhooks.generateTestHeaderString({payload,secret});}
it('rejects unsigned or modified payloads before database access',async()=>{
  const payload=JSON.stringify({id:'evt_1',livemode:false,type:'invoice.paid',data:{object:{customer:'cus_1'}}});
  expect((await POST(request(payload,'invalid'))).status).toBe(400);
  expect((await POST(request(payload+' ',signature(payload)))).status).toBe(400);
  expect(query).not.toHaveBeenCalled();
});
it('records a signed event without trusting client workspace metadata or granting seats',async()=>{
  const payload=JSON.stringify({id:'evt_1',livemode:false,type:'checkout.session.completed',data:{object:{customer:'cus_1',metadata:{workspace:'attacker'}}}});
  expect((await POST(request(payload,signature(payload)))).status).toBe(200);
  expect(query).toHaveBeenCalledTimes(1);
  expect(query.mock.calls[0][1]).toEqual(['evt_1','cus_1','checkout.session.completed']);
});
it('rejects wrong environment and oversized payloads before database access',async()=>{
  const payload=JSON.stringify({id:'evt_2',livemode:true,type:'invoice.paid',data:{object:{customer:'cus_1'}}});
  expect((await POST(request(payload,signature(payload)))).status).toBe(400);
  expect((await POST(request('x'.repeat(1000001),'invalid'))).status).toBe(413);
  expect(query).not.toHaveBeenCalled();
});
