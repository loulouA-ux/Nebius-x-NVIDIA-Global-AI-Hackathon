export {maskSecrets,scanFiles,verdict} from "@heysalad/shiptested/scanner";
import {lt} from "semver";
import advisory from "../../fixtures/lodash-advisory.json";
import type {Dependency,Finding} from "./types";
export function snapshotFindings(dependencies: Dependency[]): Finding[] {
  return dependencies
    .filter(
      (d) =>
        d.ecosystem === "npm" &&
        d.name === "lodash" &&
        lt(d.version, "4.17.21"),
    )
    .map((d) => ({
      id: `${advisory.id}:${d.name}@${d.version}`,
      title: advisory.summary,
      severity: "high",
      description: `${d.name}@${d.version} matches the affected range in this single-advisory OSV snapshot. Application-level exploitability has not been established.`,
      action:
        "Review an upgrade to lodash 4.17.21 or later, update the lockfile and run application tests. This scan does not install packages or apply changes.",
      evidence: [
        {
          kind: "advisory",
          dependency: d,
          location: `${d.path} · ${d.name}@${d.version}`,
          excerpt: advisory.details,
          url: `https://osv.dev/vulnerability/${advisory.id}`,
          retrievedAt: "2026-10-23T00:00:00Z",
        },
      ],
    }));
}
