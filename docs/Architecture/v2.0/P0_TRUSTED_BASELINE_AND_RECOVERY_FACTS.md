# P0 trusted baseline and recovery facts

**Evidence captured:** 2026-09-25,  Europe/Warsaw.  This record distinguishes
Git facts from deployment assertions.  It is not a production rollback runbook
and must not be used as authorization to deploy or restore.

## Confirmed Git facts

| Fact | Evidence | Meaning |
| --- | --- | --- |
| Release tag `v1.1` dereferences to `b456c960d01116cf472b02d3f5d33c5229c9dc06` | `git ls-remote origin refs/tags/v1.1^{}` | trusted, named **application-code baseline** at the time it was created |
| Commit `b456c960` is `feat(hero): apply infographic styling to horizontal mode`, committed 2026-09-17 07:32:10 +02:00 | annotated commit metadata | identifies the code snapshot behind the v1.1 pointer; it says nothing about public data freshness |
| Remote `main` was `8a4462dac33bec5d4a05ccaacfa790b7757076b3` when inspected | `git ls-remote origin refs/heads/main` | current repository head was later than `v1.1` |
| Commits after v1.1 include weather-map, GRIB manifest, sky objects/ranking/planets/sun-moon, helio, calendar and news outputs | `git log v1.1..origin/main` | `main` is a moving mixture of app/config and cron-produced data |

`v1.1` is therefore the only named rollback candidate evidenced by this
inventory.  It is **not** proven to be the code currently served by
`staging.nebulacast.app`, nor does it pin the mutable data that a running
workflow may have published after the tag.

## App, data and configuration relationship

| Part | Repository location | Current relation / limitation |
| --- | --- | --- |
| Application | `sites/staging/**` | manually published by `.github/workflows/deploy-staging.yml` through `wrangler pages deploy ... --branch=main` |
| Tracked generated data | `sites/staging/{data,weather,sky,calendar,alerts,news}/**`; service `generated`/`outputs` copies | independently updated and committed by scheduled writers; no ReleaseSet pins an app revision to a data revision |
| Sky configuration | `services/sky/pipelines/yml/{rules,sources}.yml` | read by generators; strict config validation is a separate P0 gate still required |
| Runner-local tile data | gitignored WebP tiles under `sites/staging/data/**` | not reconstructible from a clean Git checkout; GRIB workflow deploys them with `--commit-dirty=true` |
| Deployment credentials | GitHub Secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variable `CF_PAGES_PROJECT` | names are present in workflow files, but account, scopes, bindings and rotation owner are not evidenced in Git |

## Confirmed chronology vs. unverified assumptions

### Confirmed

1. `v1.1` was tagged at `b456c960` on 2026-09-17.
2. Data workflows have `contents: write` and commit/push datasets; their
   schedules are defined in `.github/workflows/cron-*.yml`.
3. The GRIB workflow writes tile manifests to `main` and runs a direct Pages
   deployment that includes runner-local, ignored WebP files.
4. The ordinary staging workflow manually deploys only the tracked
   `sites/staging` directory.

### Not established by repository evidence

1. Which exact Git revision and Pages deployment ID currently serve
   `staging.nebulacast.app`.
2. Which data generation timestamps/checksums were live with any deployed app
   revision, including `v1.1`.
3. Whether the tag can restore ignored GRIB tiles, external cache state,
   runtime caches, or Pages Functions artefacts.
4. Who owns approval, Cloudflare credentials, release artifacts, and rollback
   execution in the live account.

## Recovery limitations and required evidence

Before a rollback rehearsal can be accepted, the release/platform owner must
capture and approve all of the following:

- the serving Pages deployment ID, branch, commit SHA and deployment timestamp;
- a manifest with checksums/contract versions for every public dataset needed by
  the candidate release, including tiles or a reproducible tile artifact;
- the exact Cloudflare project/account binding and an audited operator identity
  with minimal deploy/rollback authority;
- a documented method to prevent scheduled writers from overwriting the restored
  state during and after the rehearsal;
- a clean-environment restore proof, smoke results for public routes/widgets,
  and the measured RTO/RPO versus an agreed threshold;
- the approved rollback tuple: app artifact, config revision, data snapshot,
  deployment target, and a post-restore verification timestamp.

Until those facts exist, rollback is limited to a **best-effort Git/Pages code
re-deploy**, not a recoverable versioned system.  P2 must supply immutable
artifacts, publication pointers, identity boundaries and a restore exercise.

## Sources

- `git ls-remote origin refs/heads/main refs/tags/v1.1 refs/tags/v1.1^{}`
- `git show --no-patch --format=fuller v1.1^{}`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/cron-grib-tiles.yml`
- P0 writer evidence: `P0_EVIDENCE_INVENTORY.md`
