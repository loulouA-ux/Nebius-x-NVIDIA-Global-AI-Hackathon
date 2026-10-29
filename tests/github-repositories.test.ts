import {describe,it,expect,afterEach,vi,beforeAll} from "vitest";
import {generateKeyPairSync,createHash} from "node:crypto";
import {installationFor,repositorySnapshot,listRepositories} from "../src/lib/server/github-repositories";
let key:string;
beforeAll(()=>{key=generateKeyPairSync("rsa",{modulusLength:2048,privateKeyEncoding:{type:"pkcs8",format:"pem"},publicKeyEncoding:{type:"spki",format:"pem"}}).privateKey;});
afterEach(()=>vi.unstubAllEnvs());
const actor={id:"github:123",workspaceId:"github:123",role:"member" as const};
function setup(){vi.stubEnv("GITHUB_APP_ID","123");vi.stubEnv("GITHUB_APP_PRIVATE_KEY",key);vi.stubEnv("SHIPCHECK_GITHUB_INSTALLATIONS",JSON.stringify({[actor.id]:42}));}
function mock(options:{unauthorised?:boolean;truncated?:boolean;mode?:string;corrupt?:boolean}={}){
 const content='{"name":"fixture"}',sha=createHash("sha1").update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest("hex");
 return (async(url,init)=>{const p=new URL(String(url)).pathname;let data:unknown;
 if(p.endsWith("access_tokens")){expect(JSON.parse(String(init?.body)).permissions).toEqual({contents:"read"});data={token:"test-token"};}
 else if(p==="/installation/repositories")data={total_count:1,repositories:[{id:options.unauthorised?2:1,name:"demo",full_name:"owner/demo",default_branch:"main",private:true}]};
 else if(p.includes("/commits/"))data={sha:"a".repeat(40),commit:{tree:{sha:"b".repeat(40)}}};
 else if(p.includes("/trees/"))data={truncated:options.truncated||false,tree:[{path:"package.json",mode:options.mode||"100644",type:"blob",sha,size:content.length}]};
 else if(p.includes("/blobs/"))data={encoding:"base64",content:Buffer.from(options.corrupt?"changed":content).toString("base64")};
 else throw Error("unexpected request");return new Response(JSON.stringify(data));}) as typeof fetch;
}
describe("repository access and snapshot integrity",()=>{
 it("does not accept an unbound actor",()=>{expect(()=>installationFor(actor)).toThrow("No repository");});
 it("pins a selected authorised repository and checks blob integrity",async()=>{setup();const s=await repositorySnapshot(actor,1,mock());expect(s.commit).toBe("a".repeat(40));expect(s.files["package.json"]).toContain("fixture");});
 it("rejects repository IDs outside the installation",async()=>{setup();await expect(repositorySnapshot(actor,1,mock({unauthorised:true}))).rejects.toMatchObject({status:404});});
 it("rejects truncated trees and symbolic links",async()=>{setup();await expect(repositorySnapshot(actor,1,mock({truncated:true}))).rejects.toThrow("snapshot limits");await expect(repositorySnapshot(actor,1,mock({mode:"120000"}))).rejects.toThrow("symlinks");});
 it("rejects corrupted blob responses",async()=>{setup();await expect(repositorySnapshot(actor,1,mock({corrupt:true}))).rejects.toThrow("integrity");});
});

describe('bounded installation pagination',()=>{
 const repo=(n:number)=>({id:n,name:'repo'+n,full_name:'owner/repo'+n,default_branch:'main',private:true});
 it.each([200,215,500])('lists %i authorized repositories with bounded fixed-path requests and read-only permissions',async(total)=>{
  setup();const pages:number[]=[];
  const fetcher:typeof fetch=async(input,init)=>{
   const url=new URL(String(input));expect(url.hostname).toBe('api.github.com');
   if(url.pathname.endsWith('access_tokens')){expect(JSON.parse(String(init?.body)).permissions).toEqual({contents:'read'});return Response.json({token:'test-token'});}
   expect(url.pathname).toBe('/installation/repositories');expect(url.searchParams.get('per_page')).toBe('100');
   const page=Number(url.searchParams.get('page'));pages.push(page);
   return Response.json({total_count:total,repositories:Array.from({length:Math.min(100,total-(page-1)*100)},(_,i)=>repo((page-1)*100+i+1))});
  };
  const repos=await listRepositories(actor,fetcher);expect(repos).toHaveLength(total);expect(repos[total-1].id).toBe(total);expect(pages).toEqual(Array.from({length:Math.ceil(total/100)},(_,i)=>i+1));
 });
 it('refuses over-limit installations before requesting additional pages',async()=>{
  setup();let calls=0;
  const fetcher:typeof fetch=async(input)=>{calls++;return String(input).includes('access_tokens')?Response.json({token:'test-token'}):Response.json({total_count:501,repositories:Array.from({length:100},(_,i)=>repo(i+1))});};
  await expect(listRepositories(actor,fetcher)).rejects.toMatchObject({status:422});expect(calls).toBe(2);
 });
 it.each(['duplicate','changed-total','short-page'])('rejects inconsistent %s pagination without silently dropping repositories',async(kind)=>{
  setup();const fetcher:typeof fetch=async(input)=>{
   const url=new URL(String(input));if(url.pathname.endsWith('access_tokens'))return Response.json({token:'test-token'});
   const second=url.searchParams.get('page')==='2';
   return Response.json({total_count:second&&kind==='changed-total'?199:200,repositories:Array.from({length:kind==='short-page'?99:100},(_,i)=>repo(i+1+(second&&kind!=='duplicate'?100:0)))});
  };
  await expect(listRepositories(actor,fetcher)).rejects.toMatchObject({status:409});
 });
 it('accepts an empty authorized installation',async()=>{
  setup();const fetcher:typeof fetch=async input=>Response.json(String(input).includes('access_tokens')?{token:'test-token'}:{total_count:0,repositories:[]});
  expect(await listRepositories(actor,fetcher)).toEqual([]);
 });
});
