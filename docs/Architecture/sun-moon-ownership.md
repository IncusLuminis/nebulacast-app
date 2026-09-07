# Static Sun/Moon ownership

`/sky/data/sun_moon.json` is a generated pipeline artifact for the default
Warsaw observer site. Version 2 marks that ownership explicitly:

```json
{
  "version": 2,
  "schema": "sun_moon.v2",
  "ownership": {
    "kind": "static",
    "location_id": "default-warsaw",
    "location_name": "Warsaw",
    "timezone": "Europe/Warsaw",
    "coordinates": {"lat_deg": 52.2297, "lon_deg": 21.0122}
  }
}
```

Consumers may use this artifact only when the selected observer coordinates
match the owned coordinates (within 0.05 degrees). A different location must
use `/api/sun-moon?lat=&lon=` or show no static ephemeris data. Legacy or
unmarked payloads are rejected by the pipeline weather loaders so a stale
Warsaw file cannot silently become a cross-location fallback.
