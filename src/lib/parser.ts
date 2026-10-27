import { valid } from "semver";
import type { Dependency } from "./types";

export function parseManifest(
  filename: string,
  content: string,
  limits: { maxBytes: number; maxDependencies: number } = { maxBytes: 200_000, maxDependencies: 50 },
): { dependencies: Dependency[]; warnings: string[] } {
  if (!Number.isSafeInteger(limits.maxBytes) || limits.maxBytes < 1 || limits.maxBytes > 5_000_000 || !Number.isSafeInteger(limits.maxDependencies) || limits.maxDependencies < 1 || limits.maxDependencies > 5000)
    throw new Error("Invalid parser limits.");
  if (new TextEncoder().encode(content).length > limits.maxBytes)
    throw new Error(`Manifest exceeds the ${limits.maxBytes / 1000} KB byte limit.`);
  const dependencies: Dependency[] = [];
  const warnings: string[] = [];
  const add = (
    name: unknown,
    version: unknown,
    ecosystem: "npm" | "PyPI",
    path = filename,
  ) => {
    if (
      typeof name !== "string" ||
      typeof version !== "string" ||
      !name ||
      name.length > 150 ||
      version.length > 100
    ) {
      warnings.push("Invalid dependency entry skipped.");
      return;
    }
    const nameOK =
      ecosystem === "npm"
        ? /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(name)
        : /^[a-z0-9][a-z0-9._-]*$/i.test(name);
    const exact =
      ecosystem === "npm"
        ? Boolean(valid(version))
        : /^\d+(?:\.\d+)*(?:(?:a|b|rc)\d+)?(?:\.post\d+)?(?:\.dev\d+)?$/i.test(
            version,
          );
    if (!nameOK || !exact) {
      warnings.push(
        "A dependency has an unsupported name or unresolved version; use exact pins or a supported lockfile.",
      );
      return;
    }
    dependencies.push({
      name:
        ecosystem === "PyPI"
          ? name.toLowerCase().replace(/[-_.]+/g, "-")
          : name,
      version,
      ecosystem,
      path,
    });
  };
  if (filename === "requirements.txt") {
    for (const [i, raw] of content.split(/\r?\n/).entries()) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const m = line.match(/^([a-z0-9][a-z0-9._-]*)==([^\s;]+)\s*(?:#.*)?$/i);
      if (m) add(m[1], m[2], "PyPI", `${filename}:${i + 1}`);
      else
        warnings.push(
          `Line ${i + 1}: only exact Python pins are supported; markers, includes, URLs and options were not resolved.`,
        );
    }
  } else if (filename === "package.json" || filename === "package-lock.json") {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(content);
    } catch {
      throw new Error("Invalid JSON. Paste a valid manifest.");
    }
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("The manifest must be a JSON object.");
    if (filename === "package.json") {
      for (const key of [
        "dependencies",
        "devDependencies",
        "optionalDependencies",
      ]) {
        const section = data[key];
        if (
          section !== undefined &&
          (!section || typeof section !== "object" || Array.isArray(section))
        )
          throw new Error(`Invalid ${key} section.`);
        for (const [name, version] of Object.entries(section ?? {}))
          add(name, version, "npm");
      }
      warnings.push(
        "package.json does not resolve transitive dependencies. Supply package-lock.json v2/v3 for broader coverage.",
      );
    } else {
      if (
        ![2, 3].includes(Number(data.lockfileVersion)) ||
        !data.packages ||
        typeof data.packages !== "object"
      )
        throw new Error("Only package-lock.json v2 and v3 are supported.");
      for (const [path, pkg] of Object.entries(data.packages)) {
        if (path === "") continue;
        if (
          !pkg ||
          typeof pkg !== "object" ||
          !path.includes("node_modules/")
        ) {
          warnings.push(
            "A workspace or malformed package entry was not resolved.",
          );
          continue;
        }
        const item = pkg as Record<string, unknown>;
        if (item.link) {
          warnings.push("A linked workspace dependency was not resolved.");
          continue;
        }
        add(
          item.name ?? path.split("node_modules/").at(-1),
          item.version,
          "npm",
          path,
        );
      }
    }
  } else throw new Error("Unsupported manifest format.");
  const unique = [
    ...new Map(
      dependencies.map((d) => [`${d.ecosystem}:${d.name}@${d.version}`, d]),
    ).values(),
  ];
  if (unique.length > limits.maxDependencies)
    throw new Error(
      `This milestone supports at most ${limits.maxDependencies} unique resolved dependencies per scan.`,
    );
  if (!unique.length)
    warnings.push("No supported exact dependency versions were found.");
  return { dependencies: unique, warnings: [...new Set(warnings)] };
}
