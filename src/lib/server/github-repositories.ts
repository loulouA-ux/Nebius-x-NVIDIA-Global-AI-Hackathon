import { createSign,createHash } from "node:crypto";
import { z } from "zod";
import { boundedJson } from "../providers";
import { ApiError } from "./http";
import type { Actor } from "./store";
import { validateSnapshot } from "../repair/sandbox";
const repoSchema=z.object({id:z.number().int().positive(),name:z.string(),full_name:z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),default_branch:z.string().min(1),private:z.boolean()});
export type GitHubRepository=z.infer<typeof repoSchema>;
// Server-admin grants bind installation IDs to app actors. Never accept a client-supplied installation ID.
export function installationFor(actor:Actor){
 const grants=z.record(z.string(),z.number().int().positive()).parse(JSON.parse(process.env.SHIPCHECK_GITHUB_INSTALLATIONS||"{}"));
 if(!Object.hasOwn(grants,actor.id))throw new ApiError(403,"No repository installation is connected to this account.");
 return grants[actor.id];
}
function appJwt(){
 const id=process.env.GITHUB_APP_ID,key=process.env.GITHUB_APP_PRIVATE_KEY;
 if(!id||!key)throw new ApiError(503,"GitHub repository integration is not configured.");
 const now=Math.floor(Date.now()/1000);
 const value=[{alg:"RS256",typ:"JWT"},{iat:now-60,exp:now+540,iss:id}].map(v=>Buffer.from(JSON.stringify(v)).toString("base64url")).join(".");
 return value+"."+createSign("RSA-SHA256").update(value).sign(key,"base64url");
}
export async function githubRequest(path:string,token:string,init:RequestInit={},fetcher:typeof fetch=fetch){
 if(!path.startsWith("/")||path.startsWith("//")||path.includes("\\"))throw Error("Invalid GitHub API path.");
 return boundedJson("https://api.github.com"+path,{...init,headers:{Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"ShipCheck","Content-Type":"application/json",Authorization:`Bearer ${token}`}},fetcher);
}
export async function installationToken(actor:Actor,repositoryId?:number,write=false,fetcher:typeof fetch=fetch,readPullRequests=false){
 if(write&&!repositoryId)throw Error("Write access must be scoped to one repository.");
 const result=z.object({token:z.string().min(1)}).parse(await githubRequest(`/app/installations/${installationFor(actor)}/access_tokens`,appJwt(),{method:"POST",body:JSON.stringify({...(repositoryId?{repository_ids:[repositoryId]}:{}),permissions:write?{contents:"write",pull_requests:"write"}:{contents:"read",...(readPullRequests?{pull_requests:"read"}:{})}})},fetcher));
 return result.token;
}
export async function listRepositories(actor:Actor,fetcher:typeof fetch=fetch){
 const token=await installationToken(actor,undefined,false,fetcher);
 const result=z.object({total_count:z.number().int(),repositories:z.array(repoSchema)}).parse(await githubRequest("/installation/repositories?per_page=100",token,{},fetcher));
 if(result.total_count>result.repositories.length)throw new ApiError(422,"Select a smaller GitHub App repository installation (at most 100 repositories).");
 return result.repositories;
}
export type RepositorySnapshot={repository:GitHubRepository;commit:string;tree:string;files:Record<string,string>};
export async function repositorySnapshot(actor:Actor,repositoryId:number,fetcher:typeof fetch=fetch):Promise<RepositorySnapshot>{
 const repositories=await listRepositories(actor,fetcher);
 const repo=repositories.find(r=>r.id===repositoryId);if(!repo)throw new ApiError(404,"Repository is not authorised.");
 const token=await installationToken(actor,repo.id,false,fetcher);
 const path=`/repos/${repo.full_name}`;
 const commit=z.object({sha:z.string().regex(/^[a-f0-9]{40}$/),commit:z.object({tree:z.object({sha:z.string().regex(/^[a-f0-9]{40}$/)})})}).parse(await githubRequest(`${path}/commits/${encodeURIComponent(repo.default_branch)}`,token,{},fetcher));
 const tree=z.object({truncated:z.boolean(),tree:z.array(z.object({path:z.string(),mode:z.string(),type:z.string(),sha:z.string().regex(/^[a-f0-9]{40}$/),size:z.number().optional()}))}).parse(await githubRequest(`${path}/git/trees/${commit.commit.tree.sha}?recursive=1`,token,{},fetcher));
 if(tree.truncated||tree.tree.length>600)throw new ApiError(422,"Repository exceeds bounded snapshot limits.");
 const blobs=tree.tree.filter(e=>e.type!=="tree");
 if(blobs.length>300||blobs.some(e=>e.type!=="blob"||!["100644","100755"].includes(e.mode)))throw new ApiError(422,"Snapshot requires at most 300 regular files; symlinks and submodules are unsupported.");
 if(blobs.reduce((n,e)=>n+(e.size??2_000_001),0)>2_000_000)throw new ApiError(422,"Repository exceeds 2 MB snapshot limit.");
 const files:Record<string,string>={};
 // Validate names before fetching contents; do not forward configuration/secrets to compute.
 validateSnapshot(Object.fromEntries(blobs.map(e=>[e.path,""])));
 for(const entry of blobs){
  const blob=z.object({encoding:z.literal("base64"),content:z.string()}).parse(await githubRequest(`${path}/git/blobs/${entry.sha}`,token,{},fetcher));
  const bytes=Buffer.from(blob.content,"base64");
  if(createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex")!==entry.sha)throw Error("Repository blob integrity mismatch.");
  const value=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  if(value.includes("\0"))throw new ApiError(422,"Binary files are unsupported in the initial repair snapshot.");
  files[entry.path]=value;
 }
 validateSnapshot(files);
 return {repository:repo,commit:commit.sha,tree:commit.commit.tree.sha,files};
}
