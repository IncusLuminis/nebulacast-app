# P0 stable-data containment

## Control introduced

Every currently live data writer and the manual staging deployment workflow
rejects `workflow_dispatch` unless `github.ref` is `refs/heads/main`.  The
guard is the first job step, before checkout, dependency installation,
upstream acquisition, repository write, or Pages deployment.

Scheduled workflows remain the default-branch workflow execution model.
Manual operation from `main` remains available for an approved stable-data
operation.  Candidate branches must use fixtures, preview-only workflows, or
future P2 isolated identities; they cannot use these live writers.

## Negative evidence

`tests/test_stable_pipeline_containment.py` is a static negative gate.  It
asserts that every enumerated live workflow has the rejecting condition,
terminates with `exit 1`, and places the guard before checkout.  A candidate
ref therefore cannot execute any later writer/deployer step.

## Limits / remaining work

- This does not create separate Cloudflare accounts, credentials, artifacts or
  publication pointers; those are P2 responsibilities.
- GitHub workflow permissions and Cloudflare token scopes must still be
  confirmed against the actual account configuration.
- A maintainer with permission to alter a workflow on `main` remains a trusted
  stable-data operator.  The guard prevents accidental candidate execution,
  not a malicious or approved `main` change.
