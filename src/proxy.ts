import {NextResponse,type NextRequest} from 'next/server';
import {publicDemo,demoMessage} from './lib/server/public-demo';
export function proxy(request:NextRequest){
 if(!publicDemo())return NextResponse.next();
 const p=request.nextUrl.pathname;
 const read=request.method==='GET'||request.method==='HEAD';
 const allowed=read&&(p==='/'||p==='/reports'||/^\/reports\/demo-(recorded|offline)(\/findings\/[^/]+)?$/.test(p)||p==='/api/demos'||p==='/api/health'||p.startsWith('/_next/')||p.startsWith('/brand/')||p.startsWith('/partners/')||p==='/favicon.ico');
 if(allowed)return NextResponse.next();
 if(p.startsWith('/api/'))return NextResponse.json({error:demoMessage,publicDemo:true},{status:403,headers:{'Cache-Control':'no-store'}});
 return new NextResponse(`<!doctype html><html lang="en"><title>ShipCheck demo</title><body><main><h1>${demoMessage}</h1><p>Sign-in, live scans, hosts and repairs are disabled on this deployment.</p><a href="/reports">View demo reports</a></main></body></html>`,{status:403,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
export const config={matcher:['/((?!_next/static|_next/image).*)']};
