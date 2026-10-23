# ShipCheck P3 contract — 23 October 2026

## Decisions

- App: Next.js Node 22, Vercel HeySalad Inc / shipcheck. GitHub connection verified. Current project has no public deployment.
- Storage: dedicated Neon Postgres `shipcheck-db` / `odd-math-86003251`, US East 1. Connected to Development and Preview only. Schema `migrations/001_core.sql` applied and real project/scan/decision readback tested. No existing database reused.
- Budget: Peter approved a maximum £15/month. Paid metered Launch plan; existing compute and project defaults set to fixed 0.25 CU with 5-minute autosuspend. Neon spending limits are alert-only, not an enforced billing ceiling. The £15 budget is not guaranteed by these settings.
- App Actor: `{id: 'peter' | 'louise', workspaceId: 'shipcheck-team', role: 'member'}` obtained only with `requireActor(request, query)`. Never accept identity/owner/workspace from body, query, or proxy headers.
- Member access: separate random 256-bit access keys. Only SHA-256 hashes configured in SHIPCHECK_PETER_KEY_HASH and SHIPCHECK_LOUISE_KEY_HASH. Eight-hour opaque session stored as hash in Postgres; HttpOnly, SameSite=Strict, Secure on hosted HTTPS. Key rotation invalidates existing sessions. No public registration. This is a bounded two-member MVP, not enterprise SSO.
- Public demo: fixed offline fixtures only; no database write, provider calls or arbitrary target scans. Live scans require member session, global and per-user durable quotas. Vercel protection remains an additional layer, not the Actor source.
- Project isolation: every project/scan/decision query filters workspace AND owner; no cross-member access implicitly granted. Shared fixture demo is independent of private projects.

## Louise integration interface

Import `database` from `src/lib/server/db`, `requireActor` from `src/lib/server/session`, and `Store` / `Actor` / `Project` from `src/lib/server/store`.

`new Store(query)` provides `createProject(actor,name,origin)`, `listProjects(actor)`, `getProject(actor,id)`, `refreshChallenge(actor,id)`, `markVerified(actor,id,challengeToken,method)`.

Project shape: `{id,name,hostname,challenge:HostChallenge,proofMethod:'dns'|'file'|null,verifiedAt:string|null}`. Keep the existing 15-minute challenge TTL. `markVerified` atomically rejects expired or rotated challenges. Recheck actual DNS/file proof before each host scan; a stored verifiedAt alone never authorizes a scan.

Create route may map `id` to public `projectId` as previously agreed. All mutating routes must call `assertOrigin`, parse a bounded strict schema, call `requireActor`, apply an appropriate `store.quota` before network/expensive work, and return `failure(error)` without leaking database exception details. Validate UUIDs before querying.

`saveScan(actor,report,projectId?)`, `getScan`, `listScans`, `decide`, `decisions` implement Peter's scan/decision persistence. Reports masked before storing; raw manifests never stored. Decisions are immutable append-only events and do not update original report/verdict.

Implemented routes: GET/POST/DELETE `/api/session`, GET `/api/scans/{id}`, POST `/api/scans/{id}/decisions`; `/sign-in` provides the access-key form. Live POST `/api/scans` now requires session; existing offline demo remains anonymous. UI integration with sign-in/project history remains Louise's work.

The chosen DB is provisioned; member hashes/provider keys and hosted acceptance remain separate gates. CLI scripts never print credentials. `node --env-file=.env.local --import tsx scripts/migrate.ts` applies additive schema; `scripts/db-smoke.ts` creates/removes only uniquely tagged synthetic acceptance rows.
