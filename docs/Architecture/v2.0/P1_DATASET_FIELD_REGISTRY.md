# P1 dataset and consumer registry

The machine-readable baseline is
`tests/fixtures/v2-registry/dataset-field-registry.v1.json`. It records only
evidence found in this repository. `unknown` is intentional: it prevents a
missing retention, cloud binding, licence or external consumer from becoming a
silent assumption.

## Rules for portfolio decisions

1. A field is not removable merely because no current UI renders it. Inputs,
   derived fields, provenance and public compatibility fields are separate
   roles in the registry.
2. Any `retain/merge/deprecate` decision needs an owner, replacement/adapter,
   known consumer evidence, external-consumer protection and an approved
   observation/deprecation window.
3. RSS and public static URLs remain compatibility contracts while external
   consumers are unknown.
4. Weather map frames, point weather and GRIB tiles are not duplicates merely
   because they mention weather; scope, source, units and temporal resolution
   differ.
5. The registry is an evidence baseline. P1 still requires named retention,
   licensing/cost policy, complete field schemas and production telemetry.
