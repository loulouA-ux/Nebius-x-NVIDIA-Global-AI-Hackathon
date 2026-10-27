# Captured CLI evidence

`cli-live-report.json` is the actual output of the installed tarball on 27 October 2026 using `fixtures/platform-package-lock.json`, copied to a temporary file named `package-lock.json`. OSV was queried live, not mocked. CLI exit code: 1. Source timestamps are retained in the report. This is one synthetic vulnerable dependency, not a repository-wide benchmark.

The SARIF schema in `tests/schemas/sarif-2.1.0.json` is from OASIS: https://github.com/oasis-tcs/sarif-spec/blob/main/sarif-2.1/schema/sarif-schema-2.1.0.json (retrieved 27 October 2026). Tests validate generated SARIF against that draft-04 schema.
