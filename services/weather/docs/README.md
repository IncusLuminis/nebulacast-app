# Weather service — documentation

Astro weather forecast: Open-Meteo + 7Timer, scoring, best windows.

## Overview

- **Main README**: [../README.md](../README.md) — run instructions, config
- **Output**: `sites/staging/weather/daily_weather.json`
- **Pipeline**: `pipelines/run_weather.py` → `fetch_weather.py`

## Config

- `configs/rules.yaml` — `weather` section: location, thresholds, horizon_hours
