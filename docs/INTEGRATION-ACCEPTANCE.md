# Peter integration acceptance

- Auth: individual member key hashes, opaque hashed sessions, expiry/revocation/key rotation, origin enforcement; no identity from client input.
- Public demo executes fixed synthetic input without DB/provider/target access. Live scans require member session and durable quota.
- Parameterized Postgres storage scopes every project/scan/decision to actor workspace and owner; cross-user access tests use real Postgres engine (PGlite locally).
- Mask report evidence before persistence; never persist manifest or credentials. Decision history is append-only and cannot change verdicts.
- Database migration is additive, repeatable; production setup is separate from tests.
- Verify existing Louise primitives with full tests/typecheck/build. No claim of live provider success without real calls.
- Hosted database, credentials, deployment, external provider acceptance and user-flow checks are separate gates.
