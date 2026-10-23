import { neon } from "@neondatabase/serverless";
export type Row = Record<string, unknown>;
export type Query = (text: string, params?: unknown[]) => Promise<Row[]>;
export function database(): Query {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database is not configured.");
  const sql = neon(url);
  return async (text, params = []) => (await sql.query(text, params)) as Row[];
}
