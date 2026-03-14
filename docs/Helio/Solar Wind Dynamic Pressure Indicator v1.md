Solar Wind Dynamic Pressure Indicator — Spec v1

1. Purpose

The Solar Wind Dynamic Pressure Indicator visualizes the dynamic pressure of the solar wind impacting Earth’s magnetosphere.

Dynamic pressure is a key parameter controlling how strongly the solar wind compresses the magnetosphere.

Typical user-visible value:

Dynamic Pressure
2.1 nPa

The component converts this measurement into an intuitive gauge-style indicator, helping users understand how strongly the solar wind is pushing against Earth’s magnetic field.

⸻

2. Physical background

Solar wind dynamic pressure is defined as:

P = ρ v²

Where:
	•	ρ = plasma density
	•	v = solar wind speed

In practice the value is usually reported in:

nanoPascals (nPa)

Dynamic pressure directly influences:
	•	magnetopause compression
	•	magnetospheric activity
	•	geomagnetic response to solar wind conditions

⸻

3. Typical value ranges

Dynamic Pressure	Interpretation
< 1 nPa	weak solar wind
1–2 nPa	typical background conditions
2–4 nPa	elevated pressure
4–8 nPa	strong compression
> 8 nPa	extreme solar wind impact

Most of the time values remain around:

1–3 nPa


⸻

4. Component role in Helio

The Dynamic Pressure Indicator belongs to the solar wind interaction layer.

It complements:

Component	Role
Solar Wind Speed	flow velocity
Solar Wind Density	plasma concentration
IMF Bz Indicator	coupling efficiency
Magnetosphere Visualization	magnetopause response

Conceptual chain:

Solar wind speed + density
        ↓
Dynamic pressure
        ↓
Magnetosphere compression


⸻

5. UI concept

The component uses a gauge-style visualization.

Example:

Dynamic Pressure
───────────────

      0   2   4   6   8

        ●

      2.1 nPa

The needle indicates the current pressure.

⸻

6. Preferred visual layout

Semi-circular gauge:

Dynamic Pressure

      0    2    4    6    8
      |----|----|----|----|

           ▲
         2.1 nPa

Elements:

Element	Description
Gauge arc	pressure scale
Needle	current value
Numeric label	exact value


⸻

7. Color zones

The gauge should include severity bands.

Pressure	Zone color
0–2 nPa	green
2–4 nPa	yellow
4–6 nPa	orange

6 nPa | red |

Example:

Dynamic Pressure

[ green ][ yellow ][ orange ][ red ]

This helps users instantly recognize unusual conditions.

⸻

8. Data sources

Dynamic pressure is derived from solar wind measurements at L1.

Typical spacecraft sources:
	•	DSCOVR
	•	ACE

Operational feeds:
	•	NOAA SWPC real-time solar wind data

Reported parameter:

dynamic_pressure_npa


⸻

9. Data model

Suggested internal representation:

export interface SolarWindDynamicPressure {
  pressure_npa: number;

  solar_wind_speed_kms: number | null;
  solar_wind_density_cm3: number | null;

  updated_utc: string;
  source: string;
}

Example:

{
  "pressure_npa": 2.1,
  "solar_wind_speed_kms": 450,
  "solar_wind_density_cm3": 6.0,
  "updated_utc": "2026-03-14T08:20:00Z"
}


⸻

10. Hover interaction

Hovering over the gauge reveals additional parameters.

Example tooltip:

Solar Wind Dynamic Pressure

Pressure: 2.1 nPa
Solar wind speed: 450 km/s
Density: 6.0 p/cm³

Source: DSCOVR


⸻

11. Click interaction

Clicking opens a detail panel.

Example:

Solar Wind Dynamic Pressure

Current value: 2.1 nPa

Solar wind speed: 450 km/s
Solar wind density: 6.0 p/cm³

Magnetosphere response:
Normal compression

Optional additions:
	•	recent pressure trend
	•	magnetopause distance estimate

⸻

12. Integration with Magnetosphere visualization

Dynamic pressure directly affects the magnetopause.

Example interpretation:

Pressure	Magnetosphere effect
< 2 nPa	normal size
2–4 nPa	moderate compression

4 nPa | strong compression |

Example UI message:

Dynamic Pressure: 5.8 nPa
Magnetosphere compressed


⸻

13. Integration with Solar Wind Indicator

Dynamic pressure depends on:

solar wind speed
+
solar wind density

Thus it should appear near those parameters in the UI.

Example grouping:

Solar Wind

Speed      450 km/s
Density    6.0 p/cm³
Pressure   2.1 nPa


⸻

14. Temporal behavior

Dynamic pressure can change rapidly when:
	•	CME shocks arrive
	•	solar wind density spikes
	•	solar wind speed increases

Typical update cadence:

1–5 minutes

The gauge should update smoothly when values change.

⸻

15. Compact layout option

If UI space is limited:

Dynamic Pressure
2.1 nPa

or

Pressure: 2.1 nPa

However, the gauge visualization is preferred for Helio.

⸻

16. Handling missing data

If pressure data is unavailable:

Dynamic Pressure
Data unavailable

Avoid displaying stale values.

⸻

17. User benefit

Most users cannot easily interpret raw solar wind parameters.

Example:

density = 6 p/cm³
speed = 450 km/s

Dynamic pressure combines these parameters into a single meaningful quantity:

pressure = 2.1 nPa

The gauge visualization makes it easy to see when the solar wind is unusually strong.

⸻

18. MVP scope

Include:
	•	gauge visualization
	•	numeric value in nPa
	•	hover details
	•	color-coded zones
	•	automatic updates

Exclude:
	•	full magnetopause modeling
	•	detailed plasma physics calculations
	•	multi-parameter solar wind charts

⸻

19. Future extensions

Possible improvements:
	•	magnetopause distance estimation
	•	solar wind pressure timeline
	•	shock arrival detection
	•	integration with CME Tracker

⸻

20. Acceptance criteria

The component is considered complete when:
	1.	current dynamic pressure value is displayed
	2.	gauge correctly reflects the pressure range
	3.	color zones indicate pressure severity
	4.	hover reveals additional solar wind parameters
	5.	the indicator updates automatically with new data

⸻

This component completes the solar wind physics layer of Helio alongside:
	•	Solar Wind Speed Indicator
	•	IMF Bz Coupling Indicator
	•	Magnetosphere Visualization

Together they explain how solar wind conditions interact with Earth’s magnetic field.