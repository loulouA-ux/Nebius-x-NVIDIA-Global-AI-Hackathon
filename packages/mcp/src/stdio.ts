#!/usr/bin/env node
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {createServer} from './server.js';
const server=createServer({keys:{nebius:process.env.NEBIUS_API_KEY,tavily:process.env.TAVILY_API_KEY}});
server.connect(new StdioServerTransport()).catch(()=>{process.stderr.write('ShipTested MCP could not start.\n');process.exitCode=70;});
