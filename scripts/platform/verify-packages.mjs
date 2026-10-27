import {mkdtemp,readFile,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=await mkdtemp(join(tmpdir(),'shiptested-pack-gate-'));
const run=(command,args,cwd=root)=>{const r=spawnSync(command,args,{cwd,encoding:'utf8',timeout:120000});if(r.status!==0)throw Error(`${command} failed (${r.status}): ${r.stderr.slice(0,600)}`);return r.stdout;};
const packages=[];
for(const name of ['core','cli','mcp']){
 const info=JSON.parse(run('npm',['pack','--json','--ignore-scripts','--pack-destination',dir],resolve(root,'packages',name)))[0];
 for(const file of info.files)if(!/^(dist\/[^/]+\.(js|d\.ts)|README\.md|LICENSE|package\.json)$/.test(file.path))throw Error('Unexpected package file: '+file.path);
 const dry=JSON.parse(run('npm',['publish','--dry-run','--access','public','--ignore-scripts','--json'],resolve(root,'packages',name)));
 packages.push({name:info.name,version:info.version,filename:info.filename,size:info.size,unpackedSize:info.unpackedSize,integrity:info.integrity,files:info.files.map(f=>f.path),publishDryRun:true});
}
run('npm',['install','--ignore-scripts','--no-audit','--no-fund',...packages.map(p=>join(dir,p.filename))],dir);
await mkdir(join(dir,'fixture'));await writeFile(join(dir,'fixture','package-lock.json'),await readFile(resolve(root,'fixtures/platform-package-lock.json')));
const cli=join(dir,'node_modules','@heysalad','shiptested-cli','dist','index.js');
const scan=spawnSync(process.execPath,[cli,'scan',join(dir,'fixture','package-lock.json'),'--json','--sarif',join(dir,'scan.sarif')],{encoding:'utf8',timeout:30000,env:{PATH:process.env.PATH||''}});
if(![0,1,2,3].includes(scan.status))throw Error('Installed CLI failed.');const report=JSON.parse(scan.stdout);if(!report.checks||!report.status)throw Error('No structured CLI report.');
const transport=new StdioClientTransport({command:process.execPath,args:[join(dir,'node_modules','@heysalad','shiptested-mcp','dist','stdio.js')],env:{PATH:process.env.PATH||''},stderr:'pipe'});const client=new Client({name:'packed-package-verifier',version:'0.1.0'});
let names=[];try{await client.connect(transport);names=(await client.listTools()).tools.map(t=>t.name);if(names.length!==3)throw Error('Unexpected packed MCP tools.');}finally{await client.close();}
const output={checkedAt:new Date().toISOString(),packages,installedCli:{exitCode:scan.status,status:report.status,findings:report.findings.length,coverage:report.checks},installedMcpTools:names,publication:'dry run only; no package published',artifacts:dir};
await writeFile(resolve(root,'docs/platform/verification/packages.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({packages:packages.map(p=>({name:p.name,size:p.size})),cli:output.installedCli,mcp:names,publication:output.publication}));
