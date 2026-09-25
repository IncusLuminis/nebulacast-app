# Nebulacast v2 envelope registry

These are additive v2 wire contracts.  They do not replace a public v1 JSON
payload or URL.  A v2 producer publishes a separately versioned read model;
an approved adapter preserves legacy shape and timestamp semantics during its
compatibility window.

| Schema | Intended use |
| --- | --- |
| `base-dataset-envelope.v1` | immutable catalogue/static dataset with release, checksum and provenance |
| `dataset-envelope.v1` | a dataset resolved against a ReleaseSet, including freshness/status and input refs |
| `contextual-read-model-envelope.v1` | an observer/time calculation with Snapshot, client revisions, requested/effective time and served time |

The three version strings are deliberately distinct.  `generated_at_utc` is
when a release was produced; `served_at_utc` is the HTTP response time;
`requested_at_utc` is the selected instant.  They must not be substituted for
one another.  `effective_at_utc: null` is meaningful for unavailable or
interval-based answers and is never silently replaced with a latest value.

Fixture states live in `tests/fixtures/v2-envelope/`.  Run
`node --test tests/v2-envelope-contract.test.mjs`.
