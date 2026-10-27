import { database } from '../src/lib/server/db';
import { runRepositoryJob } from '../src/lib/server/repository-worker';
// Trusted one-shot worker. Run under a scheduler; never run untrusted repository code.
try {
  console.log(JSON.stringify(await runRepositoryJob(database())));
} catch {
  console.error('Repository worker unavailable. No credentials or source content logged.');
  process.exitCode=1;
}
