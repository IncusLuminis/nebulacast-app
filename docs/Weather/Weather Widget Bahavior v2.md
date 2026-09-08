# Weather Panel — Hourly Card Interaction Model

## Purpose

This specification defines how **hourly cards interact with the main Weather panel** and how the **selected Date/Time context** is displayed.

The goal is to:

- eliminate redundant inspectors
- maintain a **single scoring model**
- allow the user to explore the night **by selecting hours**
- clearly display the **current date and time context**

The hourly card strip becomes a **timeline selector**, not a dialog trigger.

---

# 1. Core Interaction Principle

Hourly cards act as **time selectors**.

Click on hourly card
↓
Set selected hour
↓
Update entire Weather panel

No separate inspector window is opened.

---

# 2. Selected Time Context

The application maintains a global state:

selected_hour

Possible values:

| State | Meaning |
|------|--------|
NULL | default system time ("Now") |
hour_index | user-selected hour |

Example state object:

```javascript
state = {
    selectedHourIndex: null,
    observingProfile: "balanced",
    mode: "observing"
}


⸻

3. Hourly Card Click Behavior

On click

onHourCardClick(hourIndex)

The system performs:
	1.	Set selected hour
	2.	Update Weather panel
	3.	Highlight active card

Example:

function onHourCardClick(hourIndex) {
    state.selectedHourIndex = hourIndex
    renderWeatherPanel(hourIndex)
    highlightHourCard(hourIndex)
}


⸻

4. Visual Feedback

When a card is selected:
	•	card receives active highlight
	•	Weather panel updates
	•	Date/Time display updates

Example active card styling:

outline: 2px solid accent-color
background: slightly brighter

Only one hour card can be active at a time.

⸻

5. Weather Panel Update

When the hour changes, the following elements refresh:

Element	Description
Observability Gate	OPEN / MARGINAL / CLOSED
Weather Quality	recalculated
Seeing Quality	recalculated
Final Score	updated
Solar state	day / twilight / night
Moon badge	phase + altitude
Weather icon	cloud / rain / haze etc
Temperature	if Weather mode active
Wind	if visible
Visibility	if visible

All calculations use the same scoring model (Scoring v2).

⸻

6. Removal of Hour Inspector

The hour inspector dialog is removed from the default interaction flow.

Reason:
	•	duplicates information already present in the Weather panel
	•	introduces multiple scoring interpretations
	•	increases UI complexity

If needed, a diagnostic inspector may exist in developer/debug mode only.

⸻

7. Date / Time Display

The Weather panel must explicitly display the current date and selected hour.

Currently the interface shows only hour values, which can be ambiguous.

A dedicated Date/Time indicator must be added.

⸻

8. Date/Time Display Location

The Date/Time indicator should appear in the Weather panel header, above the scoring section.

Recommended placement:

Weather Panel
────────────────────────

Date/Time (Local)
2026-03-06  23:00

Observability Gate
Weather Quality
Seeing Quality
Score

Example rendering:

Date / Time (Local)
Mar 06 2026 — 23:00


⸻

9. Behavior When No Hour Selected

If the user has not selected a card:

Date / Time (Local)
Now

or

Date / Time (Local)
Mar 06 2026 — Current


⸻

10. Hour Selection Rules

Action	Result
Click hour card	selects hour
Click another card	switches selected hour
Reload page	reset to default
Switch profile	keep selected hour

The selected hour persists while navigating Weather settings.

⸻

11. Optional Enhancement

A subtle vertical indicator line can connect the selected hour card with the Weather panel.

Example:

[ 22:00 ]  [ 23:00 ]  [ 00:00 ]
              │
              ▼
       Weather panel

This visually reinforces the relationship between the timeline and the panel.

⸻

12. Summary

Key interaction rules:

Hourly cards = timeline navigation
Weather panel = detailed conditions for selected hour
Inspector dialog = removed

The Weather interface now follows a single consistent data model, improving clarity and reducing cognitive load for users.

