import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {sendScanNotification} from '../src/lib/server/notifications';
const input={recipient:'member@example.com',recipientVerified:true,optedIn:true,reportId:'7120589a-9946-4f8a-aeea-62954fae69b7'} as const;
beforeEach(()=>{
 vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('SHIPTESTED_PUBLIC_DEMO','0');vi.stubEnv('SHIPTESTED_EMAIL_ENABLED','1');vi.stubEnv('RESEND_API_KEY','test-placeholder');vi.stubEnv('SHIPTESTED_EMAIL_FROM','notifications@updates.shiptested.com');vi.stubEnv('SHIPTESTED_MEMBER_SITE_URL','https://members.example.com');
});
afterEach(()=>vi.unstubAllEnvs());
describe('private member email boundary',()=>{
 it.each(['demo','production','disabled'])('does not call a provider in %s',async mode=>{
  vi.stubEnv(mode==='demo'?'SHIPTESTED_PUBLIC_DEMO':mode==='production'?'VERCEL_ENV':'SHIPTESTED_EMAIL_ENABLED',mode==='production'?'production':mode==='demo'?'1':'0');const send=vi.fn();expect(await sendScanNotification(input,send)).toEqual({state:'disabled'});expect(send).not.toHaveBeenCalled();
 });
 it('requires verified opt-in before sending',async()=>{
  const send=vi.fn();await expect(sendScanNotification({...input,optedIn:false} as never,send)).rejects.toThrow();expect(send).not.toHaveBeenCalled();
 });
 it('sends only a sign-in link with stable retry identity and reports acceptance',async()=>{
  const send=vi.fn().mockImplementation(async()=>Response.json({id:'provider-message'}));expect(await sendScanNotification(input,send)).toEqual({state:'accepted',providerId:'provider-message'});await sendScanNotification(input,send);
  const [url,request]=send.mock.calls[0];expect(url).toBe('https://api.resend.com/emails');expect(request.headers['Idempotency-Key']).toBe(send.mock.calls[1][1].headers['Idempotency-Key']);expect(request.redirect).toBe('error');expect(JSON.parse(request.body)).toMatchObject({to:[input.recipient],reply_to:'security@shiptested.com'});expect(JSON.parse(request.body).text).toContain('https://members.example.com/reports/'+input.reportId);
 });
 it('does not leak provider error payloads',async()=>{
  await expect(sendScanNotification(input,vi.fn().mockResolvedValue(new Response('sensitive-provider-error',{status:429})))).rejects.toThrow('Notification provider rejected the request (429).');
 });
 it('rejects an untrusted sender or member origin before sending',async()=>{
  vi.stubEnv('SHIPTESTED_MEMBER_SITE_URL','http://members.example.com');const send=vi.fn();await expect(sendScanNotification(input,send)).rejects.toThrow('Invalid member site origin.');expect(send).not.toHaveBeenCalled();
 });
});
