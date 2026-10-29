import { createHash } from 'node:crypto';
import { z } from 'zod';
import { boundedJson } from '../providers';
import { ApiError } from './http';
import { installationToken, listRepositories } from './github-repositories';
import type { Actor } from './store';

const sha = z.string().regex(/^[a-f0-9]{40}$/);
export type RepositorySource = { repository:string; commit:string; tree:string; private:boolean };
export type ManifestSnapshot = RepositorySource & { files:Record<string,string>; omitted:string[] };

export function repositoryName(value:string) {
  let name=value.trim();
  if(name.startsWith('https://')) {
    let url:URL; try {url=new URL(name);} catch {throw new ApiError(400,'Invalid GitHub URL.');}
    if(url.hostname!=='github.com'||url.port||url.username||url.password||url.search||url.hash)
      throw new ApiError(400,'Use a GitHub repository URL without credentials, query or fragment.');
    name=url.pathname.replace(/^\//,'').replace(/\/$/,'');
  }
  name=name.replace(/\.git$/,'');
  if(!/^[A-Za-z0-9_-][A-Za-z0-9_.-]*\/[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(name))
    throw new ApiError(400,'Use owner/repository or its GitHub URL.');
  return name;
}

async function api(path:string,token:string|undefined,fetcher:typeof fetch) {
  return boundedJson('https://api.github.com'+path,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'ShipTested',...(token?{Authorization:`Bearer ${token}`}:{})}},fetcher);
}

/** Public access is explicitly anonymous. Private access must match a server-bound installation. */
export async function resolveRepository(actor:Actor,value:string,privateAccess=false,fetcher:typeof fetch=fetch):Promise<RepositorySource> {
  const name=repositoryName(value);
  let token:string|undefined;
  if(privateAccess) {
    const repos=await listRepositories(actor,fetcher);
    const repo=repos.find(r=>r.full_name.toLowerCase()===name.toLowerCase());
    if(!repo)throw new ApiError(404,'Repository is not authorised.');
    token=await installationToken(actor,repo.id,false,fetcher);
  }
  const repo=z.object({full_name:z.string(),default_branch:z.string().min(1),private:z.boolean()}).parse(await api(`/repos/${name}`,token,fetcher));
  if(repositoryName(repo.full_name).toLowerCase()!==name.toLowerCase()||(!privateAccess&&repo.private))throw new ApiError(403,'Repository access mismatch.');
  const commit=z.object({sha,commit:z.object({tree:z.object({sha})})}).parse(await api(`/repos/${name}/commits/${encodeURIComponent(repo.default_branch)}`,token,fetcher));
  return {repository:name,commit:commit.sha,tree:commit.commit.tree.sha,private:repo.private};
}

export async function fetchManifests(actor:Actor,source:RepositorySource,fetcher:typeof fetch=fetch):Promise<ManifestSnapshot> {
  const transport=fetcher,deadline=AbortSignal.timeout(60000);
  fetcher=((url,init)=>transport(url,{...init,signal:AbortSignal.any([deadline,...(init?.signal?[init.signal]:[])])})) as typeof fetch;
  const name=repositoryName(source.repository);sha.parse(source.commit);sha.parse(source.tree);
  let token:string|undefined;
  if(source.private) {
    const repo=(await listRepositories(actor,fetcher)).find(r=>r.full_name.toLowerCase()===name.toLowerCase());
    if(!repo)throw new ApiError(404,'Repository access was revoked.');
    token=await installationToken(actor,repo.id,false,fetcher);
  }
  // Verify the tree belongs to the pinned commit, including on resumed worker runs.
  const commit=z.object({sha,commit:z.object({tree:z.object({sha})})}).parse(await api(`/repos/${name}/commits/${source.commit}`,token,fetcher));
  if(commit.sha!==source.commit||commit.commit.tree.sha!==source.tree)throw new ApiError(409,'Pinned repository identity changed.');
  const tree=z.object({truncated:z.boolean(),tree:z.array(z.object({path:z.string(),type:z.string(),mode:z.string(),sha,size:z.number().int().nonnegative().optional()}))}).parse(await api(`/repos/${name}/git/trees/${source.tree}?recursive=1`,token,fetcher));
  if(tree.truncated||tree.tree.length>10000)throw new ApiError(422,'Repository tree exceeds discovery limits; no complete scan is implied.');
  const files:Record<string,string>={},omitted:string[]=[];
  const supported=tree.tree.filter(e=>/(^|\/)(package-lock\.json|package\.json|requirements\.txt)$/.test(e.path));
  // Prefer the resolved npm lockfile over package.json from the same directory.
  const selected=supported.filter(e=>!e.path.endsWith('package.json')||!supported.some(other=>other.path===e.path.replace(/package\.json$/,'package-lock.json')));
  let bytesRead=0;
  for(const entry of selected) {
    if(entry.path.split('/').some(p=>p==='..'||p==='.'||p==='node_modules'||p==='.git')||entry.path.startsWith('/')||entry.path.includes('\\')||entry.type!=='blob'||!['100644','100755'].includes(entry.mode)||entry.size===undefined||entry.size>500000||Object.keys(files).length>=20||bytesRead+entry.size>2000000) {omitted.push(entry.path);continue;}
    const blob=z.object({encoding:z.literal('base64'),content:z.string()}).parse(await api(`/repos/${name}/git/blobs/${entry.sha}`,token,fetcher));
    const bytes=Buffer.from(blob.content,'base64');
    if(bytes.length!==entry.size||createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')!==entry.sha)throw new ApiError(502,'GitHub manifest integrity check failed.');
    bytesRead+=bytes.length;
    try {files[entry.path]=new TextDecoder('utf-8',{fatal:true}).decode(bytes);} catch {omitted.push(entry.path);}
  }
  for(const entry of tree.tree)if(/(^|\/)(yarn\.lock|pnpm-lock\.yaml|uv\.lock|poetry\.lock|Cargo\.lock|go\.sum|Gemfile\.lock)$/.test(entry.path))omitted.push(entry.path);
  return {...source,files,omitted};
}
