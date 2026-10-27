# Package release handoff

Source and packed-package checks are separate from npm publication. **No package was published by Codex.** Node 20.19+ is the actual package minimum (the hashing dependency requires it); Node 22 is recommended for the full workspace.

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

Peter performs the login, 2FA and real publication. The verification script only runs `npm pack` and `npm publish --dry-run`, checks the package file lists, installs the actual tarballs in a fresh temporary directory, runs the CLI against live OSV, and starts the packed MCP via the official client.

After publishing, verify all three versions in the public registry before changing the landing-page publication flag. CLI and MCP depend on core 0.1.0, so core must be published first. Until then, use the documented source commands or the locally installed tarballs.

No registry credentials belong in the repository, docs, MCP configuration or screenshots.
