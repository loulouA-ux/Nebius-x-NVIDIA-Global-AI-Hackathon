import StripeClient from 'stripe';
import {randomUUID} from 'node:crypto';
import {brandEnv} from '../brand-env';
import {ApiError} from './http';
import {BillingStore} from './billing-store';
import type {Actor} from './store';
import type {Query} from './db';

export function billingConfig(){
  const key=process.env.STRIPE_SECRET_KEY,price=process.env.STRIPE_TEAM_PRICE_ID,origin=brandEnv('APP_ORIGIN');
  if(!key||!price||!origin)throw new ApiError(503,'Billing is not configured. No payment was started.');
  const live=/^(sk|rk)_live_/.test(key);
  if(live&&brandEnv('BILLING_LIVE')!=='1')throw new ApiError(503,'Live billing has not been activated.');
  if(!/^(sk|rk)_(test|live)_/.test(key))throw new ApiError(503,'Billing credentials are invalid.');
  const url=new URL(origin);
  if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||!(url.protocol==='https:'||(url.protocol==='http:'&&url.hostname==='127.0.0.1')))throw new ApiError(503,'Billing origin is invalid.');
  const scansPerSeat=Number(brandEnv('SCANS_PER_SEAT')||5);
  if(!Number.isInteger(scansPerSeat)||scansPerSeat<1||scansPerSeat>100)throw new ApiError(503,'Invalid scan allowance configuration.');
  return {client:new StripeClient(key,{maxNetworkRetries:2,timeout:20000}),price,origin:url.origin,live,scansPerSeat};
}

async function checkedPrice(client:StripeClient,id:string,live:boolean){
  const price=await client.prices.retrieve(id);
  if(!price.active||price.livemode!==live||price.currency!=='gbp'||price.unit_amount!==300||price.recurring?.interval!=='month'||price.recurring.interval_count!==1||price.recurring.usage_type!=='licensed')throw new ApiError(503,'Configured price must be GBP 3 per licensed seat per month.');
  return price;
}

export async function createCheckout(query:Query,actor:Actor,seats:number,requestKey:string){
  if(!Number.isInteger(seats)||seats<1||seats>200||!/^[a-f0-9-]{36}$/.test(requestKey))throw new ApiError(400,'Choose between 1 and 200 seats.');
  const store=new BillingStore(query),account=await store.account(actor),config=billingConfig();
  const lease=randomUUID();
  const [claimed]=await query("UPDATE sc_billing_accounts SET checkout_lease=$2,checkout_lease_expires_at=now()+interval '10 minutes' WHERE workspace_id=$1 AND (checkout_lease_expires_at IS NULL OR checkout_lease_expires_at<now()) RETURNING checkout_session_id",[actor.workspaceId,lease]);
  if(!claimed)throw new ApiError(409,'A checkout is already being prepared. Retry shortly.');
  try {
  await checkedPrice(config.client,config.price,config.live);
  if(account.subscription_status==='active')throw new ApiError(409,'Manage the existing subscription instead of purchasing another.');
  const [workspace]=await query('SELECT seats_used FROM sc_workspaces WHERE id=$1',[actor.workspaceId]);
  if(seats<Number(workspace.seats_used))throw new ApiError(409,'Remove extra members before reducing seats.');
  let customer=String(account.customer_id||'');
  if(!customer){
    const created=await config.client.customers.create({metadata:{shiptested_workspace:actor.workspaceId}},{idempotencyKey:`shiptested-customer-${actor.workspaceId}`});
    await query('UPDATE sc_billing_accounts SET customer_id=$2 WHERE workspace_id=$1 AND customer_id IS NULL',[actor.workspaceId,created.id]);
    customer=String((await query('SELECT customer_id FROM sc_billing_accounts WHERE workspace_id=$1',[actor.workspaceId]))[0].customer_id);
  }
  const subscriptions=await config.client.subscriptions.list({customer,status:'all',limit:100});
  if(subscriptions.has_more||subscriptions.data.some(s=>!['canceled','incomplete_expired'].includes(s.status)))throw new ApiError(409,'An existing subscription needs review in billing before starting another.');
  if(claimed.checkout_session_id){
    const previous=await config.client.checkout.sessions.retrieve(String(claimed.checkout_session_id));
    if(previous.status==='open') {
      if(previous.metadata?.seats===String(seats))return {url:previous.url,testMode:!config.live};
      await config.client.checkout.sessions.expire(previous.id);
    }
  }
  const session=await config.client.checkout.sessions.create({mode:'subscription',customer,
    line_items:[{price:config.price,quantity:seats}],client_reference_id:actor.workspaceId,
    metadata:{seats:String(seats)},
    integration_identifier:'shiptested_hosted_abcdefgh',
    success_url:`${config.origin}/team?billing=processing`,cancel_url:`${config.origin}/team?billing=cancelled`,
    subscription_data:{metadata:{shiptested_workspace:actor.workspaceId}},
  },{idempotencyKey:`shiptested-checkout-${actor.workspaceId}-${requestKey}`});
  await query('UPDATE sc_billing_accounts SET checkout_session_id=$3 WHERE workspace_id=$1 AND checkout_lease=$2',[actor.workspaceId,lease,session.id]);
  return {url:session.url,testMode:!config.live};
  } finally {
    await query('UPDATE sc_billing_accounts SET checkout_lease=NULL,checkout_lease_expires_at=NULL WHERE workspace_id=$1 AND checkout_lease=$2',[actor.workspaceId,lease]);
  }
}

export async function createPortal(query:Query,actor:Actor){
  const store=new BillingStore(query),account=await store.account(actor),config=billingConfig();
  if(!account.customer_id)throw new ApiError(409,'No billing account exists yet.');
  const portal=await config.client.billingPortal.sessions.create({customer:String(account.customer_id),return_url:`${config.origin}/team`});
  return {url:portal.url};
}

export async function reconcileBilling(query:Query){
  const config=billingConfig(),store=new BillingStore(query),job=await store.claim();
  if(!job)return {processed:false};
  // Re-read current provider state instead of applying possibly stale event payloads.
  await checkedPrice(config.client,config.price,config.live);
  const subscriptions=await config.client.subscriptions.list({customer:String(job.customer_id),status:'all',limit:100,expand:['data.latest_invoice']});
  if(subscriptions.has_more)throw new ApiError(503,'Subscription history exceeds reconciliation bounds.');
  const matching=subscriptions.data.filter(s=>s.items.data.some(i=>i.price.id===config.price));
  const active=matching.filter(s=>s.status==='active');
  if(active.length>1)throw new ApiError(409,'Multiple active subscriptions require billing review.');
  const current=active[0]||matching.sort((a,b)=>b.created-a.created)[0];
  const quantity=current?.items.data.filter(i=>i.price.id===config.price).reduce((n,i)=>n+(i.quantity||0),0)||0;
  const invoice=current?.latest_invoice;
  const status=current?.status==='active'&&(!invoice||typeof invoice==='string'||invoice.status!=='paid')?'payment_pending':current?.status||'none';
  await store.reconcile(String(job.workspace_id),String(job.lease_token),Number(job.revision),{subscriptionId:current?.id||null,status,seats:quantity,scansPerSeat:config.scansPerSeat});
  return {processed:true};
}
