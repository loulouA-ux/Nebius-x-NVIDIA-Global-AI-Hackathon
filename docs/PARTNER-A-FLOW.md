# Partner A product flow — 23 October 2026

## Phase and demo story

Phase 0 remains open until live Nebius and Tavily calls and the hosting/storage/session boundary are confirmed. Peter's committed foundation already covers part of Phase 1: the dependency parser, OSV lookup, synthetic demo, masking and a first report. The planned project setup and verified staging host flow do not exist yet.

Demo story: a small team checks a release candidate. They create a named project, prove control of its exact staging hostname, scan an exact dependency manifest and that verified host, then review evidence and choose whether to acknowledge or dismiss findings. A seeded offline example makes the flow visible to judges when external services are unavailable. The current build demonstrates the dependency portion only.

## Screen sequence

1. Start with the seeded demo or create a project with a name and HTTPS staging URL.
2. Display the normalized hostname and a short-lived challenge issued by the server. Offer DNS TXT and `/.well-known/` proof instructions.
3. Confirm proof only after server verification. Recheck proof before each URL scan; show expiry and specific failure states.
4. Accept a supported manifest and start a scan. Show dependency, host, Tavily and Nemotron check states separately.
5. Show evidence, source/date, confidence, unknowns and manual next steps. Acknowledge/dismiss records a user decision without changing the finding or scan verdict.

## Interface boundary for implementation

The UI must never generate or validate its own ownership token. The server owns challenge creation, expiry, exact-host binding, verification and per-scan recheck. A proof result alone never authorizes arbitrary requests: the URL checker still pins public DNS answers, blocks unsafe addresses and cross-host redirects, and enforces a small fixed request budget. Do not offer a staging scan button until these server controls are available.

Suggested contract for joint review: `POST /api/projects` accepts a display name and HTTPS URL; response returns project ID, normalized hostname, challenge token and expiry. `POST /api/projects/{id}/verify` checks the selected DNS or well-known method and returns state plus verified time. Scan requests refer to the project ID, never a user-supplied URL. Persist only masked evidence and decision events.

## Decisions still needed

- Hosting account and public demo access owner (Louise and Peter).
- Live Nebius/Nemotron and Tavily smoke calls (Peter); these gate the hackathon submission.
- Final track by 29 October; Best Apps and Agents is the current default.
- Deadline source of truth: [official Devpost rules](https://nebiusglobalaihackathon.devpost.com/rules) say 30 October 2026 at 10:00 a.m. PDT. London is on GMT that day, so the deadline is 17:00 London. The team target remains noon London. The manually updated project plan PDF still says 18:00 London and needs a correction in its next revision.
