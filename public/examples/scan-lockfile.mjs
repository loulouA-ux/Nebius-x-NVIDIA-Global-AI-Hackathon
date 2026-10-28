// Live: sends package names and exact versions to OSV. No code execution.
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { scan } from '@heysalad/shiptested';
const path = process.argv[2];
if (!path) throw new Error('Usage: node examples/scan-lockfile.mjs <package-lock.json>');
const report = await scan({ filename: basename(path), lockfile: await readFile(path, 'utf8') });
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.checks.some(c => c.state === 'incomplete') ? 3 : report.status === 'Blocked' ? 1 : report.status === 'Review required' ? 2 : 0;
