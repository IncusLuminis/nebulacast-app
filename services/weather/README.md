# Weather service

Astro weather forecast: Open-Meteo (clouds, precip, wind, visibility) + 7Timer (seeing, transparency). Legacy penalty-based scoring; output for frontend is **weather** (naming: no "astro-" prefix).

## Outputs

- `outputs/daily_weather.json` — hourly forecast, scores, best windows, derived aggregates.
- Copied to `sites/staging/weather/daily_weather.json` for frontend.

## Config

- `configs/rules.yaml` — section `weather`: `location_name`, `latitude`, `longitude`, `timezone`, `horizon_hours`, `thresholds` (e.g. `min_visibility_m`, `max_wind_m_s`).

## Run

From repo root (use venv: `make deps-weather` once):

```bash
make weather-back
# or
PYTHONPATH=services/weather .venv/bin/python services/weather/pipelines/run_weather.py
```

## Dependencies

- Python 3.10+
- PyYAML (see `requirements.txt`)
