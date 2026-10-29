export const commands = [
 {name:'repo <GitHub URL>',description:'Queue a managed repository scan using SHIPTESTED_API_ORIGIN and SHIPTESTED_API_TOKEN. Returns a job ID; exit 0 means accepted, not security checks passed.',options:['--private','--request-key UUID (reuse when retrying the same submission)']},
 {name:'job <id>',description:'Read a managed scan job and its private report URL.',options:[]},
 {name:'report <id>',description:'Read an owned saved report from the configured service.',options:[]},
 {name:'usage',description:'Read your managed workspace scan allowance.',options:[]},
 {name:'scan [path]',description:'Scan a lockfile (default package-lock.json). Only supplied text and exact dependency advisories are checked.',options:['--json','--sarif <file>','--fail-on <high|medium|low|any>','--ai','--quiet','--no-color']},
 {name:'explain <advisory-id>',description:'Read the original untrusted OSV advisory, retrieval date and published fixes.',options:[]},
 {name:'mcp',description:'Start the separately installed ShipTested stdio MCP server.',options:[]},
];
export const exitCodes={0:'Checks passed',1:'Blocked or fail-on threshold reached',2:'Review required',3:'Incomplete',64:'Usage error',70:'Internal error'};
export const version='0.1.0';
export function help(){return `ShipTested ${version}\n\n${commands.map(c=>`${c.name}\n  ${c.description}\n  ${c.options.join(' ')}`).join('\n\n')}\n\n--help  --version\nExit codes: ${JSON.stringify(exitCodes)}\nAI requires your own NEBIUS_API_KEY and/or TAVILY_API_KEY. No telemetry.\n`;}
