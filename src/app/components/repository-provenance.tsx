import type { ScanReport } from '@/lib/types';
import type { RepositoryReport } from '@/lib/server/repository-scan';
export default function RepositoryProvenance({report}:{report:ScanReport}) {
  const source=(report as Partial<RepositoryReport>).repositoryScan;
  if(!source||!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository)||!/^[a-f0-9]{40}$/.test(source.commit))return null;
  return <section className="panel scope" aria-label="Repository provenance"><h2>Repository evidence</h2><p><a href={`https://github.com/${source.repository}/commit/${source.commit}`} target="_blank" rel="noopener noreferrer">{source.repository} · commit {source.commit.slice(0,7)} ↗</a></p><p>Scanner {source.scannerVersion} · {source.manifests.length} manifests scanned · {source.omitted.length} omitted</p><details><summary>Files and coverage</summary><ul>{source.manifests.map(path=><li key={path}>{path}</li>)}{source.omitted.map(path=><li key={`omitted:${path}`}>{path} — not scanned</li>)}</ul><p>Scope: supported dependency files at this commit. Source code and Git history were not audited.</p></details></section>;
}
