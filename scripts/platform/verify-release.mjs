import {mkdtemp,readFile,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const names=['@heysalad/shiptested','@heysalad/shiptested-cli','@heysalad/shiptested-mcp'];
const expected=JSON.parse(await readFile('docs/platform/verification/packages.json','utf8')).packages;
const registry=[];
for(const name of names){const r=await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/0.1.0`);if(!r.ok)throw Error(`${name}: registry ${r.status}`);const p=await r.json();if(p.dist.integrity!==expected.find(x=>x.name===name).integrity)throw Error('Registry integrity mismatch');registry.push({name,version:p.version,integrity:p.dist.integrity});}
const dir=await mkdtemp(join(tmpdir(),'shiptested-public-install-'));
const install=spawnSync('npm',['install','--prefer-online','--cache',join(dir,'npm-cache'),'--ignore-scripts','--no-audit','--no-fund',...names.map(n=>n+'@0.1.0')],{cwd:dir,encoding:'utf8',timeout:120000});if(install.status!==0)throw Error(install.stderr);
const content=await readFile('fixtures/platform-package-lock.json','utf8');await mkdir(join(dir,'fixture'));await writeFile(join(dir,'fixture/package-lock.json'),content);
const run=spawnSync(process.execPath,[join(dir,'node_modules/@heysalad/shiptested-cli/dist/index.js'),'scan',join(dir,'fixture/package-lock.json'),'--json'],{encoding:'utf8',timeout:30000});if(!run.stdout)throw Error('Installed CLI returned no report: '+run.stderr);const report=JSON.parse(run.stdout);if(run.status!==1||report.status!=='Blocked'||report.findings.length!==5)throw Error('Registry CLI scan failed');
const library=await import(join(dir,'node_modules/@heysalad/shiptested/dist/index.js'));if(typeof library.scan!=='function')throw Error('Library import failed');
const local=new Client({name:'release-local-check',version:'1.0.0'});let tools;try{await local.connect(new StdioClientTransport({command:process.execPath,args:[join(dir,'node_modules/@heysalad/shiptested-mcp/dist/stdio.js')],env:{PATH:process.env.PATH||''},stderr:'pipe'}));tools=(await local.listTools()).tools.map(t=>t.name);if(tools.length!==3)throw Error('Local tools mismatch');}finally{await local.close();}
const remote=new Client({name:'release-domain-check',version:'1.0.0'});const stages=[];let remoteReport;try{await remote.connect(new StreamableHTTPClientTransport(new URL('https://mcp.shiptested.com/mcp')));const r=await remote.callTool({name:'scan_lockfile',arguments:{content}},undefined,{onprogress:p=>stages.push(p.message)});remoteReport=r.structuredContent?.report;if(r.isError||remoteReport?.status!=='Blocked'||remoteReport.findings.length!==5||stages.length!==6)throw Error('Custom-domain MCP scan failed');}finally{await remote.close();}
const websites=[];for(const host of ['mcp','docs','dev']){const r=await fetch(`https://${host}.shiptested.com/`);if(r.status!==200)throw Error('Domain failed');websites.push({host,status:r.status});await r.body.cancel();}
const result={checkedAt:new Date().toISOString(),registry,cli:{exit:run.status,status:report.status,findings:report.findings.length},libraryImport:true,localMcpTools:tools,remote:{status:remoteReport.status,findings:remoteReport.findings.length,stages},websites};await writeFile('docs/platform/verification/public-release.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
