export const demoMessage='Demo deployment — run locally for live scans';
export function publicDemo(){return process.env.SHIPCHECK_PUBLIC_DEMO==='1';}
export function refusePublicDemo(){return publicDemo()?Response.json({error:demoMessage,publicDemo:true},{status:403,headers:{'Cache-Control':'no-store'}}):null;}
