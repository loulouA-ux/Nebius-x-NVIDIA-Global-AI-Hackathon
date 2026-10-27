# Package release

Version 0.1.0 of all three packages was published on 27 October 2026 with Peter’s authorisation and private npm security-key verification. Public registry hashes match the tested tarballs; clean registry installation, CLI live scan, library import and local MCP connection passed. See [public release evidence](verification/public-release.json).

For future releases, increment versions and dependent versions together, build, run package tests, then publish core → CLI → MCP with an authenticated authorised maintainer. Do not attempt to overwrite 0.1.0. `scripts/platform/verify-release.mjs` is pinned to this release for reproducible checks.

From the repository root:

```sh
npm ci
npm run build:packages
node scripts/platform/verify-packages.mjs
npm login
npm publish --workspace @heysalad/shiptested --access public
npm publish --workspace @heysalad/shiptested-cli --access public
npm publish --workspace @heysalad/shiptested-mcp --access public
```

Login and 2FA remain private maintainer actions. The verification script only runs `npm pack` and `npm publish --dry-run`, checks the package file lists, installs the actual tarballs in a fresh temporary directory, runs the CLI against live OSV, and starts the packed MCP via the official client.

This release’s publication flag was enabled only after all three versions passed registry and installed-package verification. CLI and MCP depend on core 0.1.0, so core must be published first. Source builds remain supported.

No registry credentials belong in the repository, docs, MCP configuration or screenshots.
