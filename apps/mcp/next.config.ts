import type {NextConfig} from 'next';
import {resolve} from 'node:path';
const config:NextConfig={turbopack:{root:resolve(import.meta.dirname,'../..')},transpilePackages:['@heysalad/shiptested','@heysalad/shiptested-mcp'],poweredByHeader:false,async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Frame-Options',value:'DENY'},{key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]}];}};
export default config;
