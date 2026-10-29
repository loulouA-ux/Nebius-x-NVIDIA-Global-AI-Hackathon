import { expect,it } from 'vitest';
import { createHash } from 'node:crypto';
import { repositoryName,resolveRepository,fetchManifests } from '../src/lib/server/repository-manifests';
import { scanRepository } from '../src/lib/server/repository-scan';
const actor={id:'peter',workspaceId:'team',role:'member' as const};
const source={repository:'heysalad-ai/nicedeck',commit:'a'.repeat(40),tree:'b'.repeat(40),private:false};
function fixture(options:{corrupt?:boolean;truncated?:boolean;unsupported?:boolean}={}) {
  const content='pyserial==3.5\n';
  const hash=createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest('hex');
  const fetcher=(async(url,init)=>{
    expect(String(url).startsWith('https://api.github.com/repos/heysalad-ai/nicedeck')).toBe(true);
    expect(new Headers(init?.headers).has('authorization')).toBe(false);
    expect(init?.redirect).toBe('error');
    const p=new URL(String(url)).pathname;
    let data:unknown={full_name:source.repository,default_branch:'main',private:false};
    if(p.includes('/commits/'))data={sha:source.commit,commit:{tree:{sha:source.tree}}};
    if(p.includes('/trees/'))data={truncated:!!options.truncated,tree:[{path:'requirements.txt',sha:hash,type:'blob',mode:'100644',size:content.length},...(options.unsupported?[{path:'uv.lock',sha:hash,type:'blob',mode:'100644',size:content.length}]:[])]};
    if(p.includes('/blobs/'))data={encoding:'base64',content:Buffer.from(options.corrupt?'changed':content).toString('base64')};
    return Response.json(data);
  }) as typeof fetch;
  return fetcher;
}
it('normalises repository URLs and rejects alternate hosts or path tricks',()=>{
  expect(repositoryName('https://github.com/heysalad-ai/nicedeck.git')).toBe(source.repository);
  for(const bad of ['https://evil.example/owner/repo','https://github.com@evil.example/a/b','https://github.com/a/b?token=x','../repo','owner/repo/extra','https://github.com:8443/a/b'])expect(()=>repositoryName(bad)).toThrow();
});
it('pins public repositories without forwarding any token and verifies bytes',async()=>{
  const resolved=await resolveRepository(actor,'https://github.com/'+source.repository,false,fixture());
  expect(resolved).toEqual(source);
  expect((await fetchManifests(actor,resolved,fixture())).files).toEqual({'requirements.txt':'pyserial==3.5\n'});
});
it('rejects corrupted manifests and incomplete trees',async()=>{
  await expect(fetchManifests(actor,source,fixture({corrupt:true}))).rejects.toMatchObject({status:502});
  await expect(fetchManifests(actor,source,fixture({truncated:true}))).rejects.toMatchObject({status:422});
});
it('reports unsupported formats as omitted instead of claiming a clean repository',async()=>{
  const snapshot=await fetchManifests(actor,source,fixture({unsupported:true}));
  expect(snapshot.omitted).toEqual(['uv.lock']);
  const report=await scanRepository({...snapshot,files:{}});
  expect(report.status).toBe('Incomplete');
  expect(report.repositoryScan.commit).toBe(source.commit);
});
it('invalid manifest input does not become a clean scan',async()=>{
  const report=await scanRepository({...source,files:{'package-lock.json':'not json'},omitted:[]});
  expect(report.status).toBe('Incomplete');
  expect(report.repositoryScan.omitted).toEqual(['package-lock.json']);
});
