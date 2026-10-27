# ShipTested email setup — 27 October 2026

## Verified account state

Resend's ShipTested account shows `updates.shiptested.com` as **Verified**. Its DNS-only sending CNAMEs and DKIM TXT record exist in Cloudflare. The existing API key is user-managed; no key is stored in this repository or used by this verification build.

Intended sender: `ShipTested <notifications@updates.shiptested.com>`.
Security contact: `security@shiptested.com`, with Peter's approved forwarding destination `shiptested2026@gmail.com`.

## Private member notifications

`src/lib/server/notifications.ts` prepares a server-side Resend integration. It is disabled by default and always disabled in public demo/production-demo mode. It sends only an authenticated report link, not source code, finding descriptions or repository metadata. It requires a verified, opted-in recipient and UUID report ID; it uses a stable idempotency key, a timeout, no redirects, and sanitized error messages. Provider acceptance is explicitly distinct from delivery.

The integration has mocked success, opt-in, disabled/public/production, provider-failure and invalid-origin tests. **It is not yet wired to scan events or a delivery queue, and no real email has been sent.** Before enabling automatic notifications, persist verified recipient preferences, check report ownership server-side, and dispatch via a durable outbox with delivered/bounced status. Do not infer recipient authorization from a public request body. Resend idempotency lasts 24 hours; the outbox must provide longer-lived duplicate prevention.

Configure these privately only in a separate member environment after its release gate:

- `RESEND_API_KEY` — a domain-scoped sending key, entered privately by Peter.
- `SHIPTESTED_EMAIL_FROM=notifications@updates.shiptested.com`
- `SHIPTESTED_MEMBER_SITE_URL` — the HTTPS origin of the authenticated member app.
- `SHIPTESTED_EMAIL_ENABLED=1` — only after verified recipient/outbox integration and a delivery test.

Do not add these to the credential-free public demo. No Vercel settings were changed.

## Security inbox routing — configured

On 27 October 2026, the approved five Namecheap MX records and root SPF were removed. Cloudflare Email Routing activation completed, preserving all five existing website and Resend DNS records. The destination `shiptested2026@gmail.com` is **Verified** and the exact rule `security@shiptested.com` → that destination is **Active**. Catch-all remains disabled.

Authoritative DNS at `adam.ns.cloudflare.com` confirms:
- MX priority 40: `route1.mx.cloudflare.net.`
- MX priority 41: `route3.mx.cloudflare.net.`
- MX priority 84: `route2.mx.cloudflare.net.`
- Root TXT: `v=spf1 include:_spf.mx.cloudflare.net ~all`

No delivery test has been sent. Send a separately authorized labelled test and confirm actual inbox receipt before claiming end-to-end delivery. Routing configuration and a verified destination are not proof of message arrival.

References: https://resend.com/docs/api-reference/emails/send-email and https://resend.com/docs/dashboard/emails/idempotency-keys . Resend supports inbound webhooks, but a receiving webhook is not itself a monitored mailbox. Cloudflare forwarding keeps the security inbox independent of the public demo application.
