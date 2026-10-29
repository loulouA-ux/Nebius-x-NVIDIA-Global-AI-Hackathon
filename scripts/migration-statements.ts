import {readFileSync,readdirSync} from 'node:fs';
// Repository migrations contain plain statements, not procedural SQL.
// Remove full-line comments first: their punctuation is not a SQL delimiter.
export function readMigrationStatements(directory: URL) {
  return readdirSync(directory).filter(name => /^\d+_[a-z_]+\.sql$/.test(name)).sort()
    .flatMap(name => readFileSync(new URL(name,directory),'utf8')
      .replace(/^\s*--[^\r\n]*/gm,'').split(';').map(s=>s.trim()).filter(Boolean));
}
