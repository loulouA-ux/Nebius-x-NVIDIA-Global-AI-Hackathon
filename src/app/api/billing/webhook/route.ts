import {database} from '@/lib/server/db';
import {billingConfig} from '@/lib/server/billing';
import {BillingStore} from '@/lib/server/billing-store';
import {json,failure,ApiError} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
export const runtime='nodejs';
export async function POST(request:Request){const denied=refusePublicDemo();if(denied)return denied;
  try{
    const config=billingConfig(),secret=process.env.STRIPE_WEBHOOK_SECRET;
    if(!secret)throw new ApiError(503,'Webhook verification is not configured.');
    const reader=request.body?.getReader();if(!reader)throw new ApiError(400,'Missing webhook payload.');
    const chunks:Uint8Array[]=[];let size=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1000000)throw new ApiError(413,'Webhook payload too large.');chunks.push(value);}}finally{await reader.cancel();}
    let event;try{event=config.client.webhooks.constructEvent(Buffer.concat(chunks),request.headers.get('stripe-signature')||'',secret);}catch{throw new ApiError(400,'Invalid webhook signature.');}
    if(event.livemode!==config.live)throw new ApiError(400,'Webhook environment mismatch.');
    const supported=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','invoice.paid','invoice.payment_failed'];
    if(supported.includes(event.type)){
      const object=event.data.object as {customer?:string|{id:string}|null};
      const customer=typeof object.customer==='string'?object.customer:object.customer?.id;
      if(customer)await new BillingStore(database()).recordEvent(event.id,customer,event.type);
    }
    return json({received:true});
  }catch(error){return failure(error);}
}
