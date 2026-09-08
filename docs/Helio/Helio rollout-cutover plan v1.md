Helio Rollout / Cutover Plan v1

1. Purpose

This plan defines how the new helio domain and the new Space Weather component move from implementation to production use.

Its role is operational, not architectural.

It answers:
	•	how to introduce the new path safely
	•	how long legacy and new paths coexist
	•	when cutover is allowed
	•	how rollback is handled
	•	when legacy can be removed

This plan assumes:
	•	the new Helio implementation is built in parallel
	•	the legacy component remains intact until explicit replacement
	•	cutover is a separate step from implementation

⸻

2. Rollout principles

The rollout must follow these principles:
	•	parallel first
	•	compare before replace
	•	cut over explicitly, not implicitly
	•	remove legacy only after validation
	•	keep rollback simple

This must not be a “silent rewiring” of the old widget.

⸻

3. Rollout phases

Recommended rollout phases:
	1.	development rollout
	2.	staging rollout
	3.	side-by-side validation
	4.	cutover decision
	5.	production/staging enablement of new path
	6.	legacy decommission
	7.	post-cutover observation window

⸻

4. Phase 1 — development rollout

4.1. Goal

Get the new helio pipeline and new widget working independently without touching the legacy path.

4.2. Required outputs

At the end of this phase, the following must exist:
	•	services/helio/pipelines/gen_helio.py
	•	sites/staging/data/helio_now.json
	•	new frontend widget under js/widgets/helio/
	•	local rendering path for the new component

4.3. Rules

During this phase:
	•	legacy component remains untouched
	•	new widget may be mounted separately or behind a dev-only hook
	•	no shared binding should be repointed yet

4.4. Exit criteria

Move to Phase 2 only if:
	•	helio_now.json is generated reliably
	•	the widget can render valid data
	•	sparse-data behavior does not break rendering
	•	the component is structurally complete

⸻

5. Phase 2 — staging rollout

5.1. Goal

Deploy the new pipeline and widget into staging as a parallel path.

5.2. Required state

Staging should now have both:
	•	legacy component path
	•	new Helio component path

The new path may be:
	•	on a separate route
	•	on a hidden panel
	•	on a dev toggle
	•	on a side-by-side internal test layout

Exact integration method is implementation-specific, but it must allow comparison without breaking current behavior.

5.3. Rules

Must do:
	•	keep legacy card functional
	•	keep data paths separate
	•	verify the new component with live-like data

Must not do:
	•	replace production-facing card by accident
	•	rely on the legacy dataset as hidden dependency
	•	patch old files to simulate success

5.4. Exit criteria

Move to Phase 3 only if:
	•	staging build is stable
	•	live-like data populates the new card
	•	no regressions are introduced in surrounding UI
	•	the component is usable for comparison

⸻

6. Phase 3 — side-by-side validation

6.1. Goal

Compare the new Helio path against the legacy space-weather path using real data over time.

This phase is critical.

6.2. Validation period

Recommended:
	•	at least several real update cycles
	•	ideally enough to observe different states:
	•	quiet
	•	active
	•	alert-heavy
	•	sparse/missing data

No exact duration is required in the spec, but the comparison must be meaningful, not just one snapshot.

6.3. What to compare

Compare:
	•	data freshness
	•	alert usefulness
	•	summary quality
	•	fallback behavior
	•	visual clarity
	•	stability under missing data
	•	consistency of scales and impacts

6.4. Evaluation questions

The new component should be judged against these questions:
	1.	Is the main state more understandable than the legacy one?
	2.	Are alerts more readable than raw SWPC code dumps?
	3.	Does the component better answer “what does this mean for the observer?”
	4.	Does it remain useful when data is partial?
	5.	Does it stay within correct domain boundaries?
	6.	Is it visually and semantically cleaner?

6.5. Exit criteria

Move to Phase 4 only if the answer is effectively “yes” across the above points.

⸻

7. Phase 4 — cutover decision

7.1. Goal

Make an explicit go/no-go decision for replacing the legacy component.

7.2. Decision inputs

The decision must use:
	•	backend contract validation
	•	frontend UI validation
	•	side-by-side comparison result
	•	sparse-data behavior result
	•	regression check result

7.3. Go conditions

Cutover is allowed only if:
	•	new pipeline is stable
	•	new widget is complete in collapsed and expanded states
	•	wording is consistent
	•	observer impacts are useful
	•	alerts are meaningfully better than legacy
	•	no critical gaps remain

7.4. No-go conditions

Do not cut over if any of these remain true:
	•	alert interpretation is still noisy
	•	missing data breaks layout
	•	scales or summaries are unstable
	•	widget still depends on hidden legacy logic
	•	staging behavior is inconsistent across refreshes
	•	component is not clearly better than legacy

⸻

8. Phase 5 — cutover enablement

8.1. Goal

Switch the active UI path from legacy space-weather component to the new Helio component.

8.2. Scope of change

This step should be intentionally narrow.

It should do only what is needed to:
	•	mount the Helio widget in the real slot
	•	bind the real slot to helio_now.json
	•	stop using the legacy component in that slot

8.3. Recommended approach

Preferred:
	•	controlled swap of component binding

Avoid:
	•	mixed hybrid mode where legacy UI consumes Helio data
	•	large cleanup in the same change
	•	hidden fallback logic that obscures what is live

8.4. Rules

Must do:
	•	keep the swap reviewable
	•	ensure rollback is easy
	•	preserve logs/visibility for the new dataset generation

Must not do:
	•	remove legacy files in the same change unless trivial and already proven safe
	•	combine cutover with unrelated refactors

8.5. Exit criteria

Move to Phase 6 only if the new component is actively serving the target UI slot and remains stable after deployment.

⸻

9. Phase 6 — legacy decommission

9.1. Goal

Remove obsolete legacy backend and frontend pieces after the new component has already replaced them successfully.

9.2. Preconditions

Do not start decommission until:
	•	cutover is complete
	•	the new component is stable in the active slot
	•	rollback is no longer likely or is otherwise controlled
	•	no remaining consumer depends on the legacy dataset/component

9.3. Decommission scope

Decommission may include:
	•	legacy dataset generation path
	•	legacy widget files
	•	legacy bindings
	•	dead imports
	•	obsolete references in config/docs

9.4. Rules

Decommission should be:
	•	separate
	•	reviewable
	•	reversible if needed

It should not be mixed into the initial rollout unless the dependency graph is tiny and fully verified.

⸻

10. Phase 7 — post-cutover observation window

10.1. Goal

Watch the new component after cutover before considering the migration fully closed.

10.2. What to monitor

Monitor:
	•	dataset generation stability
	•	rendering stability
	•	alert ranking quality
	•	empty-state behavior
	•	unexpected null propagation
	•	user-visible regressions

10.3. Exit criteria

Migration can be considered operationally complete when:
	•	no cutover regressions are observed
	•	the new component behaves correctly over multiple update cycles
	•	legacy removal has been completed or scheduled confidently

⸻

11. Rollback strategy

11.1. Principle

Rollback must be simple.

The safest rollback is:
	•	restore the previous widget binding
	•	restore legacy dataset usage if needed
	•	leave Helio code in place but inactive

11.2. Rollback triggers

Rollback should be available if:
	•	helio_now.json generation becomes unreliable
	•	the new widget fails to render
	•	summary or alert behavior becomes misleading
	•	user-visible layout breaks in the active slot
	•	missing data causes unacceptable degradation

11.3. Rollback rules

Must do:
	•	keep legacy path intact until confidence is sufficient
	•	make cutover change small enough to revert quickly

Must not do:
	•	remove legacy path before the new one proves stable
	•	entangle the new and old paths so rollback requires deep surgery

⸻

12. Recommended rollout artifacts

To keep rollout controlled, it is useful to maintain these artifacts:
	•	implementation checklist
	•	cutover checklist
	•	rollback checklist
	•	side-by-side comparison notes
	•	final decommission checklist

These do not have to be separate files, but the decisions should be explicit.

⸻

13. Suggested cutover checklist

Immediately before cutover, verify all of the following:

backend
	•	gen_helio.py runs successfully
	•	helio_now.json is valid
	•	required fields always present
	•	sparse data still produces valid payload

frontend
	•	collapsed state looks correct
	•	expanded state looks correct
	•	no raw SWPC codes dominate preview
	•	missing metric cells behave correctly

product behavior
	•	summary is clearer than legacy
	•	observer impacts are useful
	•	alerts preview is relevance-based
	•	wording is calm and consistent

operational safety
	•	legacy widget still exists
	•	rollback path is known
	•	no hidden dependency blocks reversal

⸻

14. Suggested rollback checklist

If rollback is needed:
	1.	revert active widget binding to legacy component
	2.	revert active dataset binding if it was switched
	3.	keep Helio code deployed but inactive unless it causes side effects
	4.	verify UI slot works again with legacy path
	5.	document reason for rollback
	6.	fix issue in Helio path separately
	7.	retry cutover only after validation

⸻

15. Suggested legacy shutdown checklist

After successful post-cutover observation:
	1.	confirm no consumer uses legacy dataset
	2.	confirm no route imports legacy widget
	3.	remove legacy widget files
	4.	remove legacy generation path
	5.	remove dead references
	6.	re-run staging validation
	7.	update docs/spec references

⸻

16. Risk areas during rollout

Main rollout risks:
	•	accidental in-place replacement before validation
	•	hidden dependency on legacy shape
	•	UI regressions from sparse data
	•	mismatch between backend contract and frontend assumptions
	•	insufficient comparison period before cutover
	•	cleanup being mixed into cutover too early

These risks are controlled by keeping rollout phased and explicit.

⸻

17. Definition of done

The Helio rollout is fully complete only when all of the following are true:
	1.	the new component is the active Space Weather component
	2.	helio_now.json is the active dataset
	3.	the legacy component is no longer used
	4.	the legacy pipeline is removed or formally deprecated
	5.	rollback is no longer needed under normal expectations
	6.	docs and code paths reflect the new architecture

⸻

18. Final note on rollout style

This rollout should be treated as a controlled domain migration, not as a widget refactor.

That distinction matters because:
	•	the namespace changes
	•	the data contract changes
	•	the interpretation model changes
	•	the ownership boundary changes

So the correct mental model is:

new domain introduced in parallel → validated → adopted → legacy retired

not

old widget edited until it somehow becomes the new thing
