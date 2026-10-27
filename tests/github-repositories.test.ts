import {describe,it,expect,afterEach,vi,beforeAll} from "vitest";
import {generateKeyPairSync,createHash} from "node:crypto";
import {installationFor,repositorySnapshot} from "../src/lib/server/github-repositories";
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
