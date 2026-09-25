# P1 delivery, reliability and public compatibility approval register

This register deliberately contains no invented targets. Every listed value is
mandatory before its related P2/P5/P6 gate may pass. `pending-owner-approval`
means no production promotion, legacy removal or public-contract reduction is
authorized.

## Decision rules

- IAM separates candidate writer, validator, publisher/promoter, app deployer
  and retention operator. Candidate/dev identity must demonstrate forbidden
  stable writes, not merely document intent.
- A compatible rollback tuple is immutable app artifact + configuration
  revision + ReleaseSet/data inputs + deployment target + verification record.
- Numeric reliability policy needs per-dataset freshness, p95 latency,
  availability, upstream budget, alert ownership, RTO/RPO and retention;
  values require measured evidence and named approval.
- Public support is route/widget/version-specific. CORS must cover every
  transitive ESM/CSS import; CSP/frame-ancestors and postMessage validate exact
  origin, source, channel/instance, schema and revision.
- Legacy URLs/embeds remain until their adapter, known-consumer evidence,
  support/deprecation duration and rollback protection are approved.

The structured register is at
`tests/fixtures/v2-policy/delivery-reliability-approval-register.v1.json`.
It is the single checklist input for the future P2 delivery design and P6
release gate; filling a value requires owner/evidence, not a code change.
