# Open-source and commercial hosting approach

Status: documented engineering policy for review, not a transfer of ownership or a new licence. The root LICENSE and package licences remain MIT, including the existing `Copyright (c) 2026 loulouA-ux` notice. No contributor attribution has been removed or reassigned.

ShipTested can remain open source while charging for managed hosting: accounts, persistent reports, team access, scheduled workers, usage controls and support are service capabilities. Possession of the source code does not grant access to the hosted service's customer data, accounts, infrastructure or credentials.

The MIT licence permits use, modification, distribution and sale, subject to retaining its copyright and permission notice. It does not prevent a competitor from hosting their own version. We should not promise that MIT creates that restriction. Source: [Open Source Initiative — MIT](https://opensource.org/license/mit), checked 27 October 2026.

For the present release:

- Preserve the full root/package licence notices and existing authorship.
- Keep customer reports, secrets and operational databases out of the public repository and package archives.
- Describe forks and third-party deployments accurately; do not imply that they are the official hosted service or endorsed by NVIDIA, Nebius or Tavily.
- Document the origin and licence of new third-party assets/dependencies. Do not assume that a dependency's code licence also licenses every brand asset.
- Require contributions through reviewed PRs with provenance and a compatible licence. This document does not require or imply copyright assignment.

If Peter and Louise want future server changes to impose source-sharing obligations on hosted modifications, first inventory the copyright holders and affected files, agree the intended scope and obtain a reviewed licence decision. A future network-copyleft option can be evaluated at that point. Do not retroactively claim the existing MIT releases are proprietary or add a noncommercial clause while still describing it as open source.

Outstanding decisions: ownership/permission for any future relicensing; branding/trademark policy; hosted customer terms, retention commitments and privacy disclosures consistent with actual implementation. No trademark registration, legal approval, or exclusive ownership is claimed here. These decisions do not block development, but must not be represented as settled in a paid public launch.
