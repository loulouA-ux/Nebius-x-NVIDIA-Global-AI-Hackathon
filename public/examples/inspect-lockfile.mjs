// Offline: reads data only. Does not install packages or query providers.
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { parseManifest } from '@heysalad/shiptested';
const path = process.argv[2] ?? 'fixtures/platform-package-lock.json';
const result = parseManifest(basename(path).includes('package-lock') ? 'package-lock.json' : basename(path), await readFile(path, 'utf8'), { maxBytes: 2_000_000, maxDependencies: 5000 });
console.log(JSON.stringify({ mode: 'offline-inspection', ...result }, null, 2));
