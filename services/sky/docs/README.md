# Sky service — documentation index

Specs and contracts for sky pipelines (stars, DSOs, alerts, sun/moon, planets).

## Core contract

| Doc | Description |
|-----|-------------|
| [Contract.md](Contract.md) | Sky data contract: additive-only schema, UTC policy, JSON envelope, group taxonomy |

## Frontend specs

| Doc | Description |
|-----|-------------|
| [SKY_CARD_SPEC_STAR.md](SKY_CARD_SPEC_STAR.md) | Star card UI spec |
| [SKY_CARD_SPEC_DSO.md](SKY_CARD_SPEC_DSO.md) | DSO card UI spec |
| [NEO_orbit_view_specs.md](NEO_orbit_view_specs.md) | NEO orbit view spec |
| [stats_dialog_spec.md](stats_dialog_spec.md) | Stats dialog spec |

## Enrichment specs

| Doc | Description |
|-----|-------------|
| [SPEC_STAR_LABELS_ENRICHMENT_v1.md](SPEC_STAR_LABELS_ENRICHMENT_v1.md) | Star labels enrichment pipeline |
| [SPEC_DSO_LABELS_ENRICHMENT_v1.md](SPEC_DSO_LABELS_ENRICHMENT_v1.md) | DSO labels enrichment pipeline |

## Scoring & feeds

| Doc | Description |
|-----|-------------|
| [scoring_spec.md](scoring_spec.md) | Alert scoring rules |
| [gnc_spec.md](gnc_spec.md) | GCN (Gamma-ray Coordinate Network) feed spec |

## Other

| Doc | Description |
|-----|-------------|
| [Ideas.md](Ideas.md) | Future ideas and notes |

Pipeline layout and run commands: see [../pipelines/Readme.md](../pipelines/Readme.md).
