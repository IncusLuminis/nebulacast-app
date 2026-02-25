Below is the complete specification in English, formatted as a single Markdown document.

⸻

GCN → alerts_gcn.json

Normalization and UI Interpretation Specification

1. Purpose

Transform raw Kafka/GCN (IGWN/LVK) gravitational-wave events into a normalized, UI-ready dataset:

services/sky/data/generated/alerts_gcn.json
sites/staging/sky/data/alerts_gcn.json

The output file must:
	•	Contain only the latest state of each superevent
	•	Remove duplicate PRELIMINARY/UPDATE entries
	•	Correctly handle RETRACTION
	•	Be directly consumable by the frontend
	•	Preserve essential physical interpretation

⸻

2. Input Data

Source: GCN Kafka stream (igwn.gwalert)

Relevant fields:

meta.gw.superevent_id
meta.gw.alert_type
meta.gw.time_created
meta.gw.event_time
meta.gw.instruments
meta.gw.pipeline
meta.gw.far
meta.gw.classification
meta.gw.significant
meta.gw.skymap


⸻

3. Aggregation Logic

3.1 Grouping

Group all incoming records by:

superevent_id


⸻

3.2 Selecting the Active State

For each group:
	1.	Sort events by time_created
	2.	The latest event defines the current state

⸻

3.3 State Rules

alert_type	Action
PRELIMINARY	Create or update
INITIAL	Update
UPDATE	Update
RETRACTION	Mark as status = "retracted"

The final state of the superevent determines the UI status.

⸻

4. UI Type (Human-Readable Classification)

The ui_type field provides a human-readable physical interpretation of the event.
It is not a technical class name but a descriptive label.

classification_top	ui_type
BNS	“Binary Neutron Star merger”
NSBH	“Neutron Star – Black Hole merger”
BBH	“Binary Black Hole merger”
Terrestrial	“Terrestrial noise candidate”
null	“Unclassified candidate”

If the event is retracted:

ui_type = "Retracted candidate"


⸻

5. Output Structure (alerts_gcn.json)

{
  "generated_utc": "ISO-8601",
  "source": "GCN Kafka / IGWN",
  "items": [
    {
      "id": "MS260223g",
      "kind": "gravitational_wave",

      "status": "active",         // active | retracted
      "state_rank": 2,            // 2 = active, 0 = retracted

      "title": "Binary Neutron Star merger",
      "subtitle": "H1, L1 · FAR 9.1e-14",

      "event_time_utc": "2026-02-23T06:37:11.754Z",
      "created_utc": "2026-02-23T07:07:09Z",

      "ui_type": "Binary Neutron Star merger",

      "classification": "BNS",
      "classification_prob": 0.999997,

      "instruments": ["H1", "L1"],
      "pipeline": "gstlal",

      "far": 9.1107e-14,
      "significant": true,

      "has_ns": true,
      "has_remnant": true,
      "has_mass_gap": false,

      "skymap_present": true,

      "importance": 0.93,

      "urls": {
        "gracedb": "https://gracedb.ligo.org/superevents/MS260223g/view/"
      }
    }
  ]
}


⸻

6. Importance Model

The importance field provides a normalized significance score for UI ranking.

6.1 Formula

importance = min(1.0, -log10(FAR) / 20)

Interpretation:
	•	FAR ≈ 1e-2 → low significance
	•	FAR ≈ 1e-6 → medium significance
	•	FAR ≈ 1e-12 → high significance

If:

status = "retracted"

then:

importance = 0


⸻

7. UI Behavior

7.1 Active Events
	•	Display in standard styling
	•	Sort by importance (descending)
	•	Show classification and probability
	•	Enable link to GraceDB
	•	Show instrument list and FAR

⸻

7.2 Retracted Events
	•	Display in muted/grey style
	•	importance = 0
	•	Sorted to bottom
	•	Subtitle includes “(Retracted)”

⸻

8. Exclusions

The system does NOT:
	•	Store historical versions of the same superevent
	•	Keep multiple PRELIMINARY/UPDATE entries
	•	Recompute astrophysical parameters
	•	Override official FAR or classification

⸻

9. Backend API Requirement

The backend must provide:

normalize_gcn_alerts(raw_items: list) -> dict

Output structure:

{
  generated_utc,
  source,
  items: [...]
}

This function is used inside:

gen_gcn_alerts.py


⸻

10. Integration with Global Alerts System

Each normalized item must comply with the general alerts contract:
	•	id
	•	group = "gcn"
	•	type = "gcn"
	•	score_norm = importance
	•	updated_utc = event_time_utc

This ensures compatibility with the unified alerts_now.json feed.

⸻

End of specification.