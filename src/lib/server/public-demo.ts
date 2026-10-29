import { brandEnv } from '../brand-env';
export const demoMessage='Demo deployment — run locally for live scans';
let warned=false;
/** Production activation is explicit and fails closed if its identity/database configuration is missing. */
export function productionConfigured(){
 if(brandEnv('PRODUCTION_ENABLED')!=='1'||brandEnv('PUBLIC_DEMO')!=='0')return false;
 if(!process.env.GITHUB_CLIENT_ID?.trim()||!process.env.GITHUB_CLIENT_SECRET?.trim())return false;
 if(brandEnv('OPEN_REGISTRATION')!=='1'&&!/^[1-9][0-9]*(,[1-9][0-9]*)*$/.test(brandEnv('GITHUB_MEMBER_IDS')||''))return false;
 try {
  const origin=new URL(brandEnv('APP_ORIGIN')||'');
  const db=new URL(process.env.DATABASE_URL||'');
  return origin.origin==='https://shiptested.com'&&origin.pathname==='/'&&!origin.username&&!origin.password&&!origin.search&&!origin.hash
   &&['postgres:','postgresql:'].includes(db.protocol)&&Boolean(db.hostname&&db.username&&db.password&&db.pathname.length>1)
   &&['require','verify-full'].includes(db.searchParams.get('sslmode')||'');
 }catch{return false;}
}
export function publicDemo(){
 const configured=brandEnv('PUBLIC_DEMO')==='1';
 if(process.env.VERCEL_ENV==='production'){
  if(productionConfigured())return false;
  if(!configured&&!warned){warned=true;console.error('SHIPTESTED PRODUCTION SAFETY: production activation incomplete; forcing demo-only mode. Live operations are disabled.');}
  return true;
 }
 return configured;
}
export function refusePublicDemo(){return publicDemo()?Response.json({error:demoMessage,publicDemo:true},{status:403,headers:{'Cache-Control':'no-store'}}):null;}
