import { createHash } from "node:crypto";
import { z } from "zod";
import { boundedJson, research } from "./providers";
import { maskSecrets } from "./scanner";
import type { Dependency, Source } from "./types";
export type ResearchEvidence = {
  sources: Source[];
  extractionComplete: boolean;
  cached: boolean;
};
export type ResearchCache = {
  getResearch(key: string): Promise<ResearchEvidence | null>;
  putResearch(key: string, value: ResearchEvidence): Promise<void>;
};
// Extract only public advisory authorities. Never fetch arbitrary links from model output.
export function extractableSource(raw: string) {
  try {
    const u = new URL(raw);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      ((u.hostname === "github.com" && u.pathname.startsWith("/advisories/")) ||
        (u.hostname === "osv.dev" &&
          u.pathname.startsWith("/vulnerability/")) ||
        (u.hostname === "nvd.nist.gov" &&
          u.pathname.startsWith("/vuln/detail/")) ||
        (u.hostname === "www.cisa.gov" &&
          u.pathname.startsWith("/news-events/")))
    );
  } catch {
    return false;
  }
}
const extraction = z.object({
  results: z
    .array(
      z.object({ url: z.string().url(), raw_content: z.string().max(300000) }),
    )
    .max(2),
  failed_results: z.array(z.unknown()).optional(),
});
export async function researchWithEvidence(
  deps: Dependency[],
  key: string,
  fetcher: typeof fetch = fetch,
  cache?: ResearchCache,
  advisories: { url: string; dependency?: Dependency }[] = [],
): Promise<ResearchEvidence> {
  const identity = createHash("sha256")
    .update(
      JSON.stringify([
        "exact-advisory-attribution-v2",
        deps.slice(0, 3).map((d) => [d.ecosystem, d.name, d.version]),
        advisories.filter((a) => extractableSource(a.url)),
      ]),
    )
    .digest("hex");
  if (cache) {
    try {
      const hit = await cache.getResearch(identity);
      if (hit) return { ...hit, cached: true };
    } catch {
      /* Cache failure never substitutes a clean result. */
    }
  }
  const sources = await research(deps, key, fetcher);
  for (const url of [...new Set(advisories.map((a) => a.url).filter(extractableSource))].slice(0, 2)) {
    const matchedDependencies = [...new Map(advisories
      .filter((a) => a.url === url && a.dependency)
      .map((a) => [JSON.stringify(a.dependency), a.dependency!])).values()];
    const linked = sources.filter((s) => s.url === url);
    for (const source of linked) {
      // A search query is not an advisory association. Replace, never inherit it.
      delete source.package;
      delete source.version;
      source.matchedDependencies = matchedDependencies;
      source.classification = "matched-advisory";
    }
    if (!linked.length) sources.unshift({
      id: "", url, title: "Scanner-linked advisory",
      matchedDependencies, classification: "matched-advisory",
      excerpt: "See original advisory evidence; extraction pending.",
      retrievedAt: new Date().toISOString(),
    });
  }
  sources.forEach((source, index) => (source.id = `source-${index + 1}`));
  const urls = [
    ...new Set(sources.map((s) => s.url).filter(extractableSource)),
  ].slice(0, 2);
  let complete = false;
  if (urls.length) {
    try {
      const data = extraction.parse(
        await boundedJson(
          "https://api.tavily.com/extract",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              urls,
              extract_depth: "basic",
              format: "text",
              query: "security advisory affected versions mitigation",
              chunks_per_source: 3,
              include_usage: true,
              timeout: 10,
            }),
          },
          fetcher,
        ),
      );
      if (data.results.some((r) => !urls.includes(r.url)))
        throw new Error("Unexpected extraction identity");
      const unique = new Set(
        data.results.filter((r) => r.raw_content.trim()).map((r) => r.url),
      );
      complete = unique.size === urls.length && !data.failed_results?.length;
      for (const result of data.results) {
        if (!result.raw_content.trim()) continue;
        for (const source of sources.filter((s) => s.url === result.url)) {
          source.excerpt = maskSecrets(result.raw_content.slice(0, 1500));
          source.extraction = "extracted";
        }
      }
    } catch {
      complete = false;
    }
  }
  for (const source of sources) source.extraction ??= "search-only";
  const result = { sources, extractionComplete: complete, cached: false };
  // Do not cache outages or missing extraction as successful research.
  if (cache && complete) {
    try {
      await cache.putResearch(identity, result);
    } catch {
      /* Evidence remains valid without cache. */
    }
  }
  return result;
}
