export type Dependency = {
  name: string;
  version: string;
  ecosystem: "npm" | "PyPI";
  path: string;
};
export type Evidence = {
  kind: "code" | "advisory" | "http";
  dependency?: Dependency;
  location: string;
  excerpt: string;
  url?: string;
  retrievedAt?: string;
};
export type Finding = {
  id: string;
  title: string;
  severity: "high" | "medium" | "low" | "review";
  severitySource?: string;
  cvss?: number;
  cvssVector?: string;
  fixedVersion?: string;
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
  package?: string;
  version?: string;
  matchedDependencies?: Dependency[];
  url: string;
  title: string;
  excerpt: string;
  retrievedAt: string;
  publishedAt?: string;
  extraction?: "extracted" | "search-only";
  classification?: "matched-advisory" | "watch";
};
export type Explanation = { findingId: string; explanation: string; basis?: "validated-selection" | "scanner-fallback" };
export type ScanReport = {
  recording?: {recordedAt:string;model:string;region:string;commit:string;advisoryMetadataRetrievedAt?:string};
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
  projectId?: string;
};
