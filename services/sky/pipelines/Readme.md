# objects_today generator (gen_objects.py)

This pipeline produces `objects_today.json`: a curated list (top 25–30) of the best things to observe tonight for an enthusiast observer.

## Inputs
- `sites/staging/calendar/daily_signal.json` — curated calendar signals (meteor peaks, conjunctions, occultations, etc.)
- `sites/staging/sky/data/planets.json` — precomputed planetary ephemerides in short frames
- `sites/staging/sky/data/dso_seed.json` — a lightweight seed catalog (Messier / a few bright NGC / showcase DSOs)

All file paths and site parameters are configured in:
- `yaml/sources.yml`
- `yaml/rules.yml`

## Output
- `sites/staging/sky/data/objects_today.json`
- A copy is also written into `services/sky/data/generated/objects_today.json`

## Scoring model (high level)
We build a candidate pool from multiple sources and rank them with a visibility-based score:

1) **Calendar events first**  
Calendar signals receive a very large base score so they naturally float to the top.
If an event has RA/Dec, we also add a visibility score.

2) **Planets are always near the top**  
Planets are scored using the precomputed `planets.json` frames within the observing window.
They get a strong base score plus visibility terms.

3) **Deep-sky objects fill the rest**  
DSOs are scored mainly by:
- maximum altitude during the night
- mean altitude
- fraction of time above a minimum altitude threshold
- (optional) brightness term if magnitude is known

4) **Meridian bonus (02:00–04:00 local)**  
For extended objects (especially DSOs), we add a bonus if the target is close to the meridian
(±10 degrees hour angle by default) during the darkest pre-dawn window.

## Human-readable visibility text
For each item we generate a short English `text_en` summary like:
- "Best around 06:30 local, 25° high toward W. Great even in twilight."

This is intentionally simple and can be expanded later with richer phrasing.