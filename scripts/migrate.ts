import { readFileSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL privately before migrating.");
const sql = neon(process.env.DATABASE_URL);
const directory = new URL("../migrations/", import.meta.url);
// Migrations are idempotent plain statements; procedural SQL requires a real SQL parser.
const files = readdirSync(directory).filter(name => /^\d+_[a-z_]+\.sql$/.test(name)).sort();
const statements = files.flatMap(name => readFileSync(new URL(name, directory), "utf8")
  .split(";").map(s => s.trim()).filter(Boolean));
try {
  await sql.transaction(statements.map((s) => sql.query(s, [])));
  console.log("ShipCheck schema migration completed.");
} catch {
  console.error("Migration failed. No credentials or database details logged.");
  process.exitCode = 1;
}
