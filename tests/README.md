# Tests

This directory contains E2E tests for OISP. Most functionality is implemented in the `Makefile`. Run `make help` for details.

## Configuration
The tests can be configured by modifiying the `test-config-{platform}.json` files for the coresponding platform. The generated `test-config.json` is temporary.

### Skipping subtests
Substests can be skipped by editing the "skip" field in the mentioned file. A test (or category) that is set to `"true"` (as string) will be skipped, unless it is overriden by a `"false"` in a more specific subtests/category. Those values can also be set using the `OISP_TESTS_SKIP_{CASE_NAME}` environment variables when starting the test via the makefile.
