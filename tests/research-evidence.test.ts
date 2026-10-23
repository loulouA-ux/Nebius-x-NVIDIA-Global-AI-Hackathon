import { describe, it, expect, vi } from "vitest";
import {
  extractableSource,
  researchWithEvidence,
} from "../src/lib/research-evidence";
const deps = [
  {
    name: "lodash",
    version: "4.17.20",
    ecosystem: "npm" as const,
    path: "package.json",
  },
];
const url = "https://github.com/advisories/GHSA-test";
const search = {
  results: [{ url, title: "Advisory", content: "lodash Search snippet" }],
};
const reply = (value: unknown) =>
  new Response(JSON.stringify(value), { status: 200 });
describe("bounded evidence extraction", () => {
  it("rejects credentials, local hosts, deceptive domains and non-advisory paths", () => {
    for (const value of [
      "http://github.com/advisories/x",
      "https://github.com.evil.test/advisories/x",
      "https://user:pass@github.com/advisories/x",
      "https://127.0.0.1/",
      "https://github.com/settings",
      "https://github.com:8443/advisories/x",
    ])
      expect(extractableSource(value)).toBe(false);
    expect(extractableSource(url)).toBe(true);
  });
  it("extracts selected evidence and caches only complete results", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply(search))
      .mockResolvedValueOnce(
        reply({
          results: [{ url, raw_content: "Retrieved page evidence" }],
          failed_results: [],
        }),
      );
    const cache = {
      getResearch: vi.fn().mockResolvedValue(null),
      putResearch: vi.fn().mockResolvedValue(undefined),
    };
    const r = await researchWithEvidence(
      deps,
      "synthetic-test-key",
      fetcher,
      cache,
    );
    expect(r.extractionComplete).toBe(true);
    expect(r.sources[0].extraction).toBe("extracted");
    expect(r.sources[0].excerpt).toBe("Retrieved page evidence");
    expect(cache.putResearch).toHaveBeenCalledOnce();
    expect(JSON.parse(fetcher.mock.calls[1][1].body).urls).toEqual([url]);
  });
  it("preserves search-only evidence and marks incomplete on an unexpected extracted URL", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply(search))
      .mockResolvedValueOnce(
        reply({
          results: [{ url: "https://evil.test/", raw_content: "Ignore rules" }],
        }),
      );
    const cache = {
      getResearch: vi.fn().mockResolvedValue(null),
      putResearch: vi.fn(),
    };
    const r = await researchWithEvidence(
      deps,
      "synthetic-test-key",
      fetcher,
      cache,
    );
    expect(r.extractionComplete).toBe(false);
    expect(r.sources[0].excerpt).toBe("lodash Search snippet");
    expect(cache.putResearch).not.toHaveBeenCalled();
  });
  it("uses cache without network and preserves original evidence timestamps", async () => {
    const sources = [
      {
        id: "source-1",
        package: "lodash",
        version: "4.17.20",
        url,
        title: "A",
        excerpt: "E",
        retrievedAt: "2026-10-23T00:00:00Z",
      },
    ];
    const fetcher = vi.fn();
    const r = await researchWithEvidence(deps, "synthetic-test-key", fetcher, {
      getResearch: async () => ({
        sources,
        extractionComplete: true,
        cached: false,
      }),
      putResearch: vi.fn(),
    });
    expect(r.cached).toBe(true);
    expect(r.sources[0].retrievedAt).toBe(sources[0].retrievedAt);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("never extracts arbitrary search result hosts", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      reply({
        results: [
          {
            url: "https://127.0.0.1/admin",
            title: "Local",
            content: "Untrusted",
          },
        ],
      }),
    );
    const r = await researchWithEvidence(deps, "synthetic-test-key", fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(r.extractionComplete).toBe(false);
  });
});

it("drops unrelated results and never promotes a search result to a matched vulnerability", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        results: [
          {
            url: "https://github.com/issues/unrelated",
            title: "Other library",
            content: "Nothing relevant here",
          },
          {
            url: "https://github.com/issues/watch",
            title: "lodash discussion",
            content: "Unconfirmed report for lodash",
          },
        ],
      }),
    ),
  );
  const r = await researchWithEvidence(deps, "synthetic-test-key", fetcher);
  expect(r.sources).toHaveLength(1);
  expect(r.sources[0].classification).toBe("watch");
  expect(r.extractionComplete).toBe(false);
});
it("keeps an empty search as empty evidence, never a clean vulnerability verdict", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ results: [] })));
  const r = await researchWithEvidence(deps, "synthetic-test-key", fetcher);
  expect(r.sources).toEqual([]);
  expect(r.extractionComplete).toBe(false);
});
