Spec: Rationalize Heavy Cron Workflows to Fit GitHub Free Minutes

Context

The current CI/CD setup is exhausting the monthly GitHub Actions free minutes too quickly.

The main problem is not all workflows equally, but a small number of heavy scheduled jobs, especially the GRIB tile pipeline, which currently:
	•	downloads GRIB data
	•	renders cloud tiles
	•	validates output
	•	runs weather map generation
	•	commits manifests
	•	deploys the entire staging site to Cloudflare

This workflow runs 3 times per day and takes a long time per run.
As a result, the monthly free Actions budget is effectively consumed in the first week of the month.

We need a more sustainable workflow strategy for staging.

Important product principle:

Staging does not need production-grade refresh cadence.
It only needs to stay reasonably fresh and demonstrable.

⸻

Goal

Reduce GitHub Actions consumption substantially while preserving a usable staging environment for maps/weather.

Main targets:
	1.	Reduce heavy CI minutes
	2.	Avoid unnecessary rebuilds
	3.	Separate build from deploy
	4.	Keep staging usable
	5.	Make expensive jobs mostly manual or low-frequency

⸻

Non-goals
	•	No full infrastructure migration
	•	No rewrite of GRIB/weather pipelines
	•	No change to scientific outputs
	•	No change to Cloudflare Pages hosting model
	•	No optimization of all workflows at once

This task focuses on workflow architecture and execution strategy.

⸻

Current problem

The current heavy GRIB workflow does too much in one run:
	1.	Build GRIB tiles
	2.	Validate tiles
	3.	Run weather map pipeline
	4.	Commit manifests
	5.	Deploy staging to Cloudflare

This mixes:
	•	heavy data generation
	•	lightweight manifest updates
	•	deployment

It also runs too frequently for staging.

⸻

Target strategy

Split responsibilities and reduce frequency.

We want to move toward three workflow roles:

A. Heavy data build

Purpose:
	•	download GRIB
	•	build cloud tiles
	•	generate tile manifests

This is the expensive workflow.

B. Light weather/map manifest refresh

Purpose:
	•	refresh lighter map-related manifests / overlays
	•	run weather-map logic if still needed independently

This should stay separate from GRIB tile generation.

C. Deploy-only

Purpose:
	•	deploy sites/staging to Cloudflare Pages

This should not be tied automatically to every heavy build.

⸻

Required changes

⸻

1. Reduce frequency of heavy cron workflows

Current state

The GRIB tile workflow runs:

3× per day

Required change

Reduce heavy GRIB/tile generation to:
	•	1× per day maximum for scheduled execution
	•	keep workflow_dispatch for manual runs

This is the minimum first step.

Staging should prioritize affordability over maximum freshness.

⸻

2. Keep heavy workflows runnable manually

Heavy workflows must retain:

workflow_dispatch:

This allows manual rebuilds when needed for demos/testing without paying for high cron frequency every day.

⸻

3. Add early-exit logic if upstream data is unchanged

Heavy build workflows should detect whether upstream forecast input is actually new.

If the upstream GRIB cycle / dataset is not newer than the last processed run, the workflow should:
	•	exit successfully
	•	skip tile generation
	•	skip downstream work

This is critical to avoid wasting minutes on runs that produce no meaningful update.

Acceptable implementation options include comparing:
	•	forecast cycle id
	•	upstream timestamp
	•	previously recorded run id
	•	manifest metadata

Implementation details are flexible, but the workflow must be able to no-op early when there is no new source data.

⸻

4. Separate deploy from heavy build

Deploying to Cloudflare Pages should not happen automatically after every heavy GRIB build.

Required change

Create a deploy-only workflow responsible only for:
	•	checking out repo
	•	deploying sites/staging to Cloudflare Pages

This workflow should:
	•	support workflow_dispatch
	•	optionally support low-frequency schedule
	•	not run tile generation or weather generation

This allows:
	•	local/manual data generation → commit → deploy only
	•	staging updates without recomputing expensive pipelines

⸻

5. Remove weather-map generation from the heavy GRIB workflow unless strictly necessary

The current GRIB workflow also runs:

gen_weather_map.py

This should be reviewed and, if possible, moved to a separate lighter workflow.

If the weather-map manifest can be updated independently of heavy tile generation, it should live in the light workflow.

Goal:
	•	keep GRIB workflow focused on GRIB tiles and manifests
	•	keep weather-map refresh decoupled

If a hard dependency exists, document it clearly and minimize it.

⸻

6. Introduce a “staging cadence” policy

Define a slower refresh policy for staging.

Recommended model:

Heavy layers (cloud tiles / GRIB products)
	•	1× daily scheduled
	•	manual on demand

Lighter JSON/manifests
	•	1–2× daily if needed
	•	or manual if still too expensive

Deploy
	•	manual by default
	•	optionally 1× nightly if desired

This is a staging optimization policy, not a production SLA.

⸻

7. Review render volume controls

As part of the workflow rationalization, audit whether heavy tile generation can be reduced by configuration.

Examples of possible reduction levers:
	•	lower zoom_max
	•	fewer forecast frames
	•	coarser cadence for later forecast horizon
	•	lower image quality/compression settings

This task does not require full implementation of all such optimizations, but it should leave the workflow structure compatible with them.

If easy and safe to do now, small reductions are acceptable.

⸻

8. Avoid deploying when nothing meaningful changed

Deploy workflow or upstream workflow should avoid unnecessary deploys.

If no important staging artifacts changed, deployment should be skipped.

Acceptable signals:
	•	no new manifest
	•	same run_id
	•	no changes under relevant staging paths

This should reduce unnecessary Cloudflare deploy operations and associated workflow time.

⸻

Recommended workflow model

Workflow 1 — Heavy GRIB tiles

Purpose:
	•	build cloud tiles
	•	generate/update tile manifests
	•	validate output

Triggers:
	•	workflow_dispatch
	•	max 1×/day scheduled

Should include:
	•	early exit if upstream data unchanged

Should not include:
	•	full staging deploy
	•	unrelated lightweight generation if avoidable

⸻

Workflow 2 — Light weather/map refresh

Purpose:
	•	refresh weather map manifest / overlays / isobars if needed

Triggers:
	•	workflow_dispatch
	•	low-frequency schedule if truly lightweight

Should remain independent where possible.

⸻

Workflow 3 — Deploy staging

Purpose:
	•	deploy current sites/staging contents to Cloudflare

Triggers:
	•	workflow_dispatch
	•	optional low-frequency schedule

Should not include:
	•	tile generation
	•	weather generation
	•	heavy validation

⸻

Acceptance Criteria

The implementation is successful when:
	1.	Heavy GRIB/tile scheduled execution is reduced to at most once per day
	2.	Heavy workflows remain manually runnable via workflow_dispatch
	3.	Early-exit logic exists for unchanged upstream data
	4.	Cloudflare Pages deploy is separated into a deploy-only workflow
	5.	Heavy workflows no longer automatically force full staging deploy every run
	6.	Staging can still be refreshed manually when needed
	7.	GitHub Actions monthly usage should become materially lower than before
	8.	Workflow structure clearly distinguishes:
	•	heavy build
	•	light refresh
	•	deploy

⸻

Suggested delivery phases

Phase 1
	•	reduce heavy schedule frequency
	•	keep manual trigger
	•	split deploy into separate workflow

Phase 2
	•	add early-exit logic
	•	separate gen_weather_map.py if possible

Phase 3
	•	optional render-volume reductions
	•	optional deploy-skipping when nothing changed

This phased approach is preferred over trying to optimize everything in one pass.

⸻

Constraints
	•	Keep current scientific outputs intact
	•	Prefer minimal invasive changes to workflows
	•	Avoid introducing fragile workflow complexity
	•	Optimize for staging affordability, not maximum freshness

⸻

Definition of Done

The workflow system is considered rationalized when:
	•	staging remains usable
	•	expensive workflows no longer dominate monthly Actions usage
	•	heavy rebuilds are intentional rather than automatic
	•	deploy can happen independently of expensive generation

⸻

Implementation freedom

Claude/Codex may decide:
	•	exact workflow split
	•	exact naming of new workflow files
	•	exact early-exit mechanism
	•	whether deploy is manual-only or optional nightly

But the implementation must preserve the key policy:

expensive generation should be rare, manual when possible, and never coupled unnecessarily to deployment.