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
  advisoryUrls: string[] = [],
): Promise<ResearchEvidence> {
  const identity = createHash("sha256")
    .update(
      JSON.stringify([
        deps.slice(0, 3).map((d) => [d.ecosystem, d.name, d.version]),
        advisoryUrls.filter(extractableSource).slice(0, 2),
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
  for (const url of [...new Set(advisoryUrls.filter(extractableSource))].slice(
    0,
    2,
  )) {
    if (!sources.some((s) => s.url === url))
      sources.unshift({
        id: "",
        package: deps
          .slice(0, 3)
          .map((d) => d.name)
          .join(", "),
        version: deps
          .slice(0, 3)
          .map((d) => d.version)
          .join(", "),
        url,
        title: "Scanner-linked advisory",
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
