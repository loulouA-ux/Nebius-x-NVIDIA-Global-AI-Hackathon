# Peter integration acceptance

- Auth: individual member key hashes, opaque hashed sessions, expiry/revocation/key rotation, origin enforcement; no identity from client input.
- Public demo executes fixed synthetic input without DB/provider/target access. Live scans require member session and durable quota.
- Parameterized Postgres storage scopes every project/scan/decision to actor workspace and owner; cross-user access tests use real Postgres engine (PGlite locally).
- Mask report evidence before persistence; never persist manifest or credentials. Decision history is append-only and cannot change verdicts.
- Database migration is additive, repeatable; production setup is separate from tests.
- Verify existing Louise primitives with full tests/typecheck/build. No claim of live provider success without real calls.
- Hosted database, credentials, deployment, external provider acceptance and user-flow checks are separate gates.

## Hosted integration acceptance — 23 October

- Live Tavily and Nebius calls return schema-valid nonempty responses on synthetic/public input; script records status/counts only.
- Distinct Peter/Louise member keys are privately provisioned; hosted login, owner isolation and logout are exercised without recording keys/cookies.
- Louise's project routes integrate without accepting client identity; expired challenge requires refresh and fresh proof.
- Fresh preview deploy contains provider/member settings; public demo, unauthorized live request, project create/list and report persistence are verified separately.
- Remaining Phase 2+ URL checks/research and submission gates stay explicitly incomplete until implemented and tested.
