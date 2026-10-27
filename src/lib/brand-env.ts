/** Legacy SHIPCHECK_* variables remain accepted for existing installations. */
const warned = new Set<string>();
export function brandEnv(name: string, env: Record<string, string | undefined> = process.env) {
  const current = env[`SHIPTESTED_${name}`];
  if (current !== undefined) return current;
  const legacy = `SHIPCHECK_${name}`;
  if (env[legacy] !== undefined && !warned.has(legacy)) {
    warned.add(legacy);
    console.warn(`${legacy} is deprecated; use SHIPTESTED_${name}.`);
  }
  return env[legacy];
}
