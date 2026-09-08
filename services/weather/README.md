# Weather service

Astro weather forecast: Open-Meteo (clouds, precip, wind, visibility) + 7Timer (seeing, transparency). Legacy penalty-based scoring; output for frontend is **weather** (naming: no "astro-" prefix).

---

## Pipelines

### Pipeline 1 — Scoring weather (`run_weather.py`)

Fetches Open-Meteo + 7Timer, applies penalty scoring, writes `daily_weather.json`.

**Outputs:**
- `outputs/daily_weather.json` — hourly forecast, scores, best windows, derived aggregates.
- Copied to `sites/staging/weather/daily_weather.json` for frontend.

**Config:** `configs/rules.yaml` — section `weather`: `location_name`, `latitude`, `longitude`, `timezone`, `horizon_hours`, `thresholds` (e.g. `min_visibility_m`, `max_wind_m_s`).

**Run from repo root** (use venv: `make deps-weather` once):

```bash
make weather-back
# or
PYTHONPATH=services/weather .venv/bin/python services/weather/pipelines/run_weather.py
```

---

### Pipeline 2 — Observer & Space Weather (`run_phase1.py`)

Fetches Open-Meteo + 7Timer + NOAA SWPC; normalizes into two frontend-ready JSON artifacts with no scoring, just facts.

**Outputs:**
- `sites/staging/data/observer_weather_now.json` — 72-hour hourly forecast with nested cloud/wind/air/astro fields, plus derived dew-risk, wind-risk, and best 2h clear window.
- `sites/staging/data/space_weather_now.json` — latest Kp index, 8-bin Kp forecast, solar wind speed/density, X-ray class, and recent NOAA SWPC alerts.

**Location config:** reads first location from `configs/locations.yaml` (keys: `name`, `lat`, `lon`, `tz`). Falls back to `configs/rules.yaml` if `locations.yaml` is absent.

**Run from repo root:**

```bash
PYTHONPATH=services/weather python services/weather/pipelines/run_phase1.py
```

Writes are atomic (`.tmp` + rename) and fail-soft per data source — a network failure on any one provider does not abort the others or overwrite the last good file.

**Run tests:**

```bash
PYTHONPATH=services/weather pytest services/weather/tests/test_phase1.py -v
```

**Cron cadence:** runs automatically after Pipeline 1 in `.github/workflows/cron-weather.yml` every 6 hours.

---

## Dependencies

- Python 3.10+
- PyYAML (see `requirements.txt`)
- All HTTP fetching uses stdlib `urllib.request` — no additional packages required for Phase 1.
