export const dynamic='force-dynamic';
export const GET=()=>Response.json({status:'ok',version:'0.1.0',transport:'streamable-http',auth:'none',tools:['scan_lockfile','check_package','get_advisory']},{headers:{'Cache-Control':'no-store'}});
