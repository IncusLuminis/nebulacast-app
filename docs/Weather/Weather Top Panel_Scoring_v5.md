
Weather Top Panel — Update for Scoring v5

Observer Console

Version: v5 adaptation

⸻

Purpose

Top panels must reflect the hierarchical scoring model introduced in Scoring v5.

The previous design mixed raw weather parameters and derived indicators.
In v5 the interface must clearly distinguish between:

Level 1 — Final Observing Score
Level 2 — Category Scores
Level 3 — Physical Parameters

The top panel must therefore:
	1.	show Observing Quality (final score)
	2.	show four category scores
	3.	show a minimal diagnostic subset of physical parameters

This ensures:
	•	fast decision making
	•	transparency of the scoring model
	•	consistency with the scoring hierarchy

⸻

Updated Top Panel Layout

The row layout remains unchanged.

[ TIME & LOCATION ] [ OBSERVING QUALITY ] [ BEST WINDOW ] [ SKY STATUS ]

Panel widths remain equal.

Recommended height:

100 px

⸻

Panel 1 — Time & Location

Unchanged.

Purpose: contextual information.

Fields:

Location name
Latitude / Longitude
Local time
Date
Bortle class

Optional:

Elevation
Timezone

Example:

Warsaw
52.23°N 21.01°E

13:42 — Mar 7
Bortle 6

Interaction:

Open location selector.

⸻

Panel 2 — Observing Quality (Scoring v5)

This panel now reflects Level 1 of the scoring hierarchy.

Previously:

Observational Opportunity Score

Now:

Observing Quality

⸻

Content

Required elements:

Final score
Score label
Observability Gate state
Active profile
Score bar

Example:

Observing Quality

82
GOOD

Gate: OPEN
Profile: Balanced

██████████░░░░


⸻

Score Labels

Score ranges:

Score	Label
90–100	Excellent
75–89	Good
60–74	Fair
40–59	Poor
<40	Very Poor


⸻

Gate Indicator

The panel must show gate state.

States:

OPEN
MARGINAL
CLOSED

Example:

Gate: MARGINAL

Meaning:

score may be capped even if categories are good.

⸻

Profiles

User may switch scoring profile.

Available:

Balanced
Visual
Broadband
Planetary

Interaction:

Click → cycle profile.

⸻

Panel 3 — Best Observing Window

Minor adjustment for v5.

Previously window was derived from mixed metrics.

Now it must be derived from:

ObservingQuality(t)

Window selection algorithm:
	1.	compute score curve
	2.	find continuous segments where

score ≥ 70
AND gate != CLOSED

	3.	choose longest segment.

Display:

Best Window

21:15 — 02:40

Score 78–88
Deep Sky

Optional mini timeline.

⸻

Panel 4 — Sky Status (Category Scores)

This panel is the main change in v5.

Instead of listing weather variables directly, it now shows:

Category Scores (Level 2)

⸻

Category Indicators

The panel must show four category scores.

Atmosphere
Sky Darkness
Dew Risk
Stability

Example layout:

Atmosphere   86
Sky Dark     74
Dew Safe     91
Stability    65

These values come directly from the v5 scoring model
￼.

⸻

Category Icons

Recommended icons:

Atmosphere → 🌫
Sky Darkness → 🌌
Dew Risk → 💧
Stability → 🧭

Example:

🌫 86
🌌 74
💧 91
🧭 65


⸻

Diagnostic Parameters (Minimal)

Below category scores a small diagnostic line may show key physical parameters.

Purpose:

quick interpretation.

Recommended parameters:

Clouds
Seeing
Wind
Humidity
Temperature
Moon altitude

Example:

☁ 12%   🔭 1.1"
🌬 2 m/s  💧 72%
🌡 3°C    🌙 14°


⸻

Removed Parameters

The following elements from the old design should no longer appear as primary indicators:

Removed:

Transparency
Visibility distance
Raw humidity score
Raw wind score
Raw cloud score

Reason:

these are now internal inputs to category scores.

They remain visible only in advanced panel / inspector.

⸻

Trend Indicator

Trend is now computed using final score, not atmosphere only.

Formula:

trend = ObservingQuality(t+3h) - ObservingQuality(now)

States:

↑ improving
→ stable
↓ deteriorating

Displayed in panel 4.

⸻

Responsive Behaviour

Mobile layout remains:

[ TIME ] [ SCORE ]
[ WINDOW ] [ SKY ]

Category scores must remain visible even in compact mode.

Diagnostic parameters may collapse.

⸻

Interaction Behaviour

Panel interactions:

Panel	Action
Time & Location	open location selector
Observing Quality	change scoring profile
Best Window	open nightly forecast
Sky Status	open weather breakdown panel


⸻

Data Dependencies

Top panel requires the following computed values:

ObservingQuality
GateState
CategoryScores
BestWindow
SelectedProfile

CategoryScores include:

AtmosphereScore
SkyDarknessScore
DewSafetyScore
StabilityScore

⸻

Data Sources

No new data sources required.

Inputs remain:

cloud layers
seeing index
humidity
wind
temperature
pressure
sun altitude
moon altitude
moon illumination
bortle class

As defined in Scoring v5
￼.

⸻

Design Principles

The v5 top panel follows three principles.

1. Hierarchical clarity

UI must reflect scoring structure.

Final score
→ category scores
→ raw parameters.

⸻

2. Operational focus

The observer should answer three questions instantly:

Can I observe?
How good will it be?
When is the best time?

⸻

3. Parameter transparency

Raw weather data is still accessible but does not dominate the UI.

⸻

Result

Compared with the previous version:

Old Top Panel → weather dashboard
New Top Panel → observing decision console

The user now sees:

Can I observe?
How good is it?
Why?

within a single compact row.

-----
# WIREFRAME

Ниже wireframe для Weather Top Panel — Scoring v5. Он отражает структуру панели после перехода на иерархию скоринга (Final Score → Category Scores → Diagnostics), описанную в Scoring v5  ￼ и адаптированную для Top Panel  ￼.

Wireframe ориентирован на Observer Console / Cockpit-style UI, чтобы панель работала как оперативный центр наблюдателя.

⸻

Top Panel Wireframe — Scoring v5

Desktop layout

┌────────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┐
│ TIME & LOCATION        │ OBSERVING QUALITY      │ BEST OBSERVING WINDOW  │ SKY STATUS             │
│                        │                        │                        │                        │
│ 📍 Warsaw              │        82              │ Best Window            │ 🌫 Atmosphere     86   │
│ 52.23°N 21.01°E        │       GOOD             │ 21:15 — 02:40          │ 🌌 Sky Darkness   74   │
│                        │                        │                        │ 💧 Dew Safety     91   │
│ 🕒 13:42               │ Gate: OPEN             │ Score 78–88            │ 🧭 Stability      65   │
│ 📅 Mar 8               │ Profile: Balanced      │ Deep Sky               │                        │
│ 🌌 Bortle 6            │                        │                        │ ☁ 12%  🔭 1.1"        │
│                        │ ██████████░░░░         │ ░░██████░░░░           │ 🌬 2 m/s  💧 72%      │
│                        │                        │                        │ 🌡 3°C    🌙 14°      │
└────────────────────────┴────────────────────────┴────────────────────────┴────────────────────────┘

Высота панели:

~100 px

Ширина:

4 равных блока


⸻

Panel 1 — Time & Location

📍 Warsaw
52.23°N 21.01°E

🕒 13:42
📅 Mar 8
🌌 Bortle 6

Click:

open location selector


⸻

Panel 2 — Observing Quality

Центральный элемент интерфейса.

82
GOOD

Дополнительная информация:

Gate: OPEN
Profile: Balanced

Progress bar:

██████████░░░░

Interaction:

click → change profile

Profiles:

Balanced
Visual
Broadband
Planetary


⸻

Panel 3 — Best Observing Window

Best Window

21:15 — 02:40

Score 78–88
Deep Sky

Мини-таймлайн:

░░░░██████░░░░

Interaction:

click → open nightly forecast


⸻

Panel 4 — Sky Status

Основная диагностическая панель.

Category scores

🌫 Atmosphere      86
🌌 Sky Darkness    74
💧 Dew Safety      91
🧭 Stability       65

Diagnostic parameters

☁ 12%      cloud cover
🔭 1.1"     seeing
🌬 2 m/s    wind
💧 72%      humidity
🌡 3°C      temperature
🌙 14°      moon altitude

Trend indicator:

↑ improving


⸻

Visual Hierarchy

LEVEL 1
Observing Quality

LEVEL 2
Atmosphere
Sky Darkness
Dew Safety
Stability

LEVEL 3
Weather parameters

Это полностью соответствует структуре Scoring v5  ￼.

⸻

Compact Tablet Layout

┌───────────────────────┬───────────────────────┐
│ TIME & LOCATION       │ OBSERVING QUALITY     │
│                       │                       │
│ Warsaw                │ 82 GOOD               │
│ 13:42                 │ Gate: OPEN            │
│ Bortle 6              │ ██████████░░░░        │
└───────────────────────┴───────────────────────┘

┌───────────────────────┬───────────────────────┐
│ BEST WINDOW           │ SKY STATUS            │
│                       │                       │
│ 21:15 — 02:40         │ 🌫 86  🌌 74           │
│ Score 78–88           │ 💧 91  🧭 65           │
│ Deep Sky              │ ☁12% 🔭1.1"           │
└───────────────────────┴───────────────────────┘


⸻

Mobile Layout

[ TIME ]
Warsaw
13:42

[ SCORE ]
82 GOOD
Gate OPEN

[ WINDOW ]
21:15 — 02:40

[ SKY ]
🌫 86
🌌 74
💧 91
🧭 65


⸻

UI Principles

Cockpit philosophy

Top panel работает как instrument panel:

Score  → decision
Window → planning
Sky    → diagnosis


⸻

Information density

Все ключевые ответы пользователь получает за 1 секунду:

Can I observe?
How good?
When?
Why?
