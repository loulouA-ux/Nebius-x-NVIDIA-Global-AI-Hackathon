import {createHash} from 'node:crypto';
import {z} from 'zod';
import {publicDemo} from './public-demo';

// Prepared for the private member worker. No public route or automatic scan hook.
// The caller must resolve an opted-in, verified recipient and report ownership from storage.
const notificationSchema=z.object({
 recipient:z.email(),recipientVerified:z.literal(true),optedIn:z.literal(true),
 reportId:z.uuid(),
});
export type ScanNotification=z.infer<typeof notificationSchema>;
export type NotificationResult={state:'disabled'}|{state:'accepted';providerId:string};
export async function sendScanNotification(input:ScanNotification,send:typeof fetch=fetch):Promise<NotificationResult>{
 if(publicDemo()||process.env.SHIPTESTED_EMAIL_ENABLED!=='1')return {state:'disabled'};
 const item=notificationSchema.parse(input);
 const key=process.env.RESEND_API_KEY;
 const from=process.env.SHIPTESTED_EMAIL_FROM;
 const site=process.env.SHIPTESTED_MEMBER_SITE_URL;
 if(!key||!from||!site)throw new Error('Member email is not configured.');
 // Sender and authenticated destination origin are server configuration, never request data.
 if(!z.email().safeParse(from).success||!from.endsWith('@updates.shiptested.com'))throw new Error('Invalid notification sender.');
 const origin=new URL(site);
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('Invalid member site origin.');
 const link=new URL(`/reports/${item.reportId}`,origin).href;
 const idempotency=createHash('sha256').update(`scan-ready:${item.reportId}:${item.recipient.toLowerCase()}`).digest('hex');
 // Avoid sending source, findings, package names or model explanations through email.
 let response:Response;
 try{response=await send('https://api.resend.com/emails',{
  method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),
  headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':idempotency},
  body:JSON.stringify({from:`ShipTested <${from}>`,to:[item.recipient],subject:'Your ShipTested report is ready',text:`Your scan report is ready. Sign in to review the evidence and next steps:\n\n${link}\n\nThis is a notification, not a claim that your project is secure.`,reply_to:'security@shiptested.com'}),
 });}catch{throw new Error('Notification request failed; delivery is unconfirmed.');}
 if(!response.ok)throw new Error(`Notification provider rejected the request (${response.status}).`);
 let payload:unknown;try{payload=await response.json();}catch{throw new Error('Notification provider returned an invalid response.');}
 const result=z.object({id:z.string().min(1).max(200)}).safeParse(payload);
 if(!result.success)throw new Error('Notification provider returned an invalid response.');
 return {state:'accepted',providerId:result.data.id}; // Acceptance is not inbox delivery.
}
