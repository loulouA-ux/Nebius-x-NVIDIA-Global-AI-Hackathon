/** Runs before client hydration. A tab pins its workspace rather than inheriting another tab's switch. */
export const workspaceBrowserScript = `(()=>{
 const key='shiptested-workspace';const original=window.fetch.bind(window);let active;
 try{active=sessionStorage.getItem(key)||undefined}catch{}
 function remember(id){active=id;try{if(id)sessionStorage.setItem(key,id);else sessionStorage.removeItem(key)}catch{}}
 window.fetch=async(input,init)=>{
  const url=new URL(input instanceof Request?input.url:String(input),location.href);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return original(input,init);
  const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
  const headers=new Headers(init?.headers||(input instanceof Request?input.headers:undefined));
  if(active)headers.set('x-shiptested-workspace',active);
  const response=await original(input,{...init,headers});
  if(url.pathname==='/api/session'&&method==='DELETE'&&response.ok)remember(undefined);
  if(url.pathname==='/api/session'&&response.status===401)remember(undefined);
  if(response.ok&&((url.pathname==='/api/session'&&method==='GET')||url.pathname==='/api/workspaces')){
   try{const d=await response.clone().json();if(d.actor?.workspaceId&&(!active||(url.pathname==='/api/workspaces'&&method==='POST')))remember(d.actor.workspaceId)}catch{}
  }
  return response;
 };
})();`;
