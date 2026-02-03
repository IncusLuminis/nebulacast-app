# Astro Weather API Service

Cloudflare Pages Function backend for generating astro-weather JSON on-demand.

## API Endpoint

`GET /api/astro-weather`

### Query Parameters

- `lat` (required): Latitude [-90, 90]
- `lon` (required): Longitude [-180, 180]
- `tz` (optional): Timezone string (default: "Europe/Warsaw")
- `hours` (optional): Forecast horizon in hours (default: 72, range: 24-120)
- `profile` (optional): Scoring profile (default: "default", options: "default", "visual", "broadband", "planetary")

### Example

```
GET /api/astro-weather?lat=52.2297&lon=21.0122&tz=Europe/Warsaw&hours=72&profile=default
```

### Response

JSON matching the astro-weather contract with:
- `generated_at`: ISO timestamp
- `location`: Location object
- `horizon_hours`: Number of hours in forecast
- `profile`: Scoring profile used
- `hours[]`: Array of hourly records with scores and breakdowns
- `derived`: Derived metrics (pressure trend, peaks, fog risk, heads-up)

## Architecture

- **`/functions/api/astro-weather.ts`**: Cloudflare Pages Function endpoint
- **`/services/astro_weather/providers/`**: External API clients (Open-Meteo, 7Timer)
- **`/services/astro_weather/score.ts`**: Scoring engine with profile weights
- **`/services/astro_weather/merge.ts`**: Data alignment and merging
- **`/services/astro_weather/derived.ts`**: Derived metrics computation
- **`/services/astro_weather/types.ts`**: TypeScript interfaces

## Caching

- Cache key: full request URL (including query params)
- TTL: 10 minutes (`Cache-Control: public, max-age=600`)
- Uses Cloudflare `caches.default`

## CORS

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- Handles OPTIONS preflight requests

## Scoring Profiles

- **default**: Balanced weights
- **visual**: Emphasizes clouds, transparency, moderate wind
- **broadband**: Emphasizes transparency, high clouds
- **planetary**: Emphasizes seeing, wind, clouds

Each profile uses positive points (0..weight per component), summed and clamped to 0..100.
