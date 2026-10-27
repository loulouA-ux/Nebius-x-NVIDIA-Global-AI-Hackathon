import {NextResponse,type NextRequest} from 'next/server';
import {publicDemo,demoMessage} from './lib/server/public-demo';
import {securityHeaders} from './lib/security-headers';
export function proxy(request:NextRequest){
 const nonce=Buffer.from(crypto.randomUUID()).toString('base64');
 const headers=securityHeaders(nonce),incoming=new Headers(request.headers);
 incoming.set('x-nonce',nonce);incoming.set('Content-Security-Policy',headers['Content-Security-Policy']);
 const next=()=>NextResponse.next({request:{headers:incoming}});
 let response:NextResponse;
 const p=request.nextUrl.pathname;
 const site=process.env.NEXT_PUBLIC_SITE_URL;
 let canonical:URL|undefined;try{canonical=site?new URL(site):undefined;}catch{}
 if(canonical&&request.headers.get("host")===`www.${canonical.host}`){const url=request.nextUrl.clone();url.hostname=canonical.hostname;url.protocol=canonical.protocol;url.port=canonical.port;response=NextResponse.redirect(url,308);}
 else if(!publicDemo())response=next();
 else {
  const read=request.method==='GET'||request.method==='HEAD';
  const allowed=read&&(p==='/'||p==='/reports'||/^\/reports\/demo-(recorded|offline)(\/findings\/[^/]+)?$/.test(p)||['/privacy','/security','/robots.txt','/sitemap.xml','/.well-known/security.txt','/opengraph-image','/twitter-image','/api/demos','/api/health','/favicon.ico','/manifest.webmanifest'].includes(p)||p.startsWith('/_next/')||p.startsWith('/brand/')||p.startsWith('/partners/'));
  if(allowed)response=next();
  else if(!read||p.startsWith('/api/'))response=NextResponse.json({error:demoMessage,publicDemo:true},{status:403,headers:{'Cache-Control':'no-store'}});
  else if(['/scan','/hosts','/repairs','/sign-in'].some(path=>p===path||p.startsWith(path+'/'))||p.startsWith('/reports/'))response=new NextResponse(`<!doctype html><html lang="en"><title>ShipTested demo</title><body><main><h1>${demoMessage}</h1><p>Sign-in, live scans, hosts and repairs are disabled on this deployment.</p><a href="/reports">View demo reports</a></main></body></html>`,{status:403,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
  else response=next(); // Unknown pages use the branded 404, never a live capability.
 }
 for(const [key,value] of Object.entries(headers))response.headers.set(key,value);
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image).*)']};
