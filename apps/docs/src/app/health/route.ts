export const dynamic='force-dynamic';
export const GET=()=>Response.json({status:'ok',version:'0.1.0',service:'docs'},{headers:{'Cache-Control':'no-store'}});
