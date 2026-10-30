# Synthetic scan input

This is a copy of `fixtures/platform-package-lock.json`, kept under the canonical `package-lock.json` filename accepted by the CLI's format detector. It contains only a synthetic lodash 4.17.20 dependency entry, not an application.

From the repository root, after building the workspaces:

```sh
node packages/cli/dist/index.js scan docs/demo-input/package-lock.json --json
```

This makes a live OSV lookup. Findings may change with upstream advisory data. A nonzero scan exit code can represent findings or incomplete coverage. Do not install or execute the vulnerable dependency locally. Use this file as scan input only; it is not the full repository used for the recorded repair.
