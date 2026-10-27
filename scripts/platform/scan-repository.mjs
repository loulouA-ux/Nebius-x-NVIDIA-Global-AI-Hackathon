import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const result=spawnSync(process.execPath,['packages/cli/dist/index.js','scan','package-lock.json','--json'],{encoding:'utf8',timeout:30000});
if(![0,1,2,3].includes(result.status))throw Error('Repository scan could not produce a report.');
const report=JSON.parse(result.stdout);await mkdir('test-results/platform',{recursive:true});await writeFile('test-results/platform/repository-scan.json',JSON.stringify({exitCode:result.status,report},null,2));
console.log(`Repository scan: ${report.status}; ${report.dependencies.length} resolved packages; ${report.findings.length} findings; CLI exit ${result.status}. This evidence job does not treat incomplete coverage as clear.`);
// The monorepo contains local workspace links unsupported by v0; retain the explicit
// incomplete result as a review artifact. This is an observational check, not a pass gate.
