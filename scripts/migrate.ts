import { readMigrationStatements } from "./migration-statements";
import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL privately before migrating.");
const sql = neon(process.env.DATABASE_URL);
const directory = new URL("../migrations/", import.meta.url);
const statements = readMigrationStatements(directory);
try {
  await sql.transaction(statements.map((s) => sql.query(s, [])));
  console.log("ShipCheck schema migration completed.");
} catch {
  console.error("Migration failed. No credentials or database details logged.");
  process.exitCode = 1;
}
