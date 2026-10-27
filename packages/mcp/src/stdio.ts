#!/usr/bin/env node
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {createServer} from './server.js';
import {readLocalLockfile} from './local.js';
import {HostedClient} from '@heysalad/shiptested/hosted';
let hosted:HostedClient|undefined;
if(process.env.SHIPTESTED_API_ORIGIN||process.env.SHIPTESTED_API_TOKEN){
 try{hosted=new HostedClient(process.env.SHIPTESTED_API_ORIGIN||'',process.env.SHIPTESTED_API_TOKEN||'');}
 catch{process.stderr.write('Configure a valid SHIPTESTED_API_ORIGIN and SHIPTESTED_API_TOKEN privately.\n');process.exit(64);}
}
const server=createServer({hosted,readLocal:readLocalLockfile,keys:{nebius:process.env.NEBIUS_API_KEY,tavily:process.env.TAVILY_API_KEY}});
server.connect(new StdioServerTransport()).catch(()=>{process.stderr.write('ShipTested MCP could not start.\n');process.exitCode=70;});
