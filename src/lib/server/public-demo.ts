import { brandEnv } from '../brand-env';
export const demoMessage='Demo deployment — run locally for live scans';
let warned=false;
export function publicDemo(){
 const configured=brandEnv('PUBLIC_DEMO')==='1';
 if(process.env.VERCEL_ENV==='production'){
  if(!configured&&!warned){warned=true;console.error('SHIPTESTED PRODUCTION SAFETY: public demo flag missing; forcing demo-only mode. Live operations are disabled.');}
  return true;
 }
 return configured;
}
export function refusePublicDemo(){return publicDemo()?Response.json({error:demoMessage,publicDemo:true},{status:403,headers:{'Cache-Control':'no-store'}}):null;}
