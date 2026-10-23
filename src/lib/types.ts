export type Dependency = {
  name: string;
  version: string;
  ecosystem: "npm" | "PyPI";
  path: string;
};
export type Evidence = {
  kind: "code" | "advisory";
  location: string;
  excerpt: string;
  url?: string;
  retrievedAt?: string;
};
export type Finding = {
  id: string;
  title: string;
  severity: "high" | "medium" | "review";
  description: string;
  action: string;
  evidence: Evidence[];
};
export type Check = {
  name: string;
  state: "complete" | "incomplete" | "snapshot" | "not-in-scope";
  detail: string;
};
export type Source = {
  id: string;
  package: string;
  version: string;
  url: string;
  title: string;
  excerpt: string;
  retrievedAt: string;
  publishedAt?: string;
};
export type Explanation = { findingId: string; explanation: string };
export type ScanReport = {
  id: string;
  mode: "demo" | "live";
  createdAt: string;
  status: "Blocked" | "Review required" | "Checks passed" | "Incomplete";
  dependencies: Dependency[];
  findings: Finding[];
  checks: Check[];
  sources: Source[];
  explanations: Explanation[];
  durationMs: number;
  policy: string;
};
export type ScanInput = {
  mode: "demo" | "live";
  filename?: "package.json" | "package-lock.json" | "requirements.txt";
  content?: string;
  research?: boolean;
};
