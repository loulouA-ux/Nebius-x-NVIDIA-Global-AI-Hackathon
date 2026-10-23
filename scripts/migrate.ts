import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL privately before migrating.");
const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(
  new URL("../migrations/001_core.sql", import.meta.url),
  "utf8",
)
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
try {
  await sql.transaction(statements.map((s) => sql.query(s, [])));
  console.log("ShipCheck schema migration completed.");
} catch {
  console.error("Migration failed. No credentials or database details logged.");
  process.exitCode = 1;
}
