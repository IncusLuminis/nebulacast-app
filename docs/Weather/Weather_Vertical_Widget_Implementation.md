# Weather Vertical Widget — Implementation Summary

This document summarizes the implementation of the vertical weather widget per [weather_vertical_widget_spec.md](weather_vertical_widget_spec.md).

## Files

| File | Description |
|------|-------------|
| `sites/staging/weather/widgets/weather/weather_vertical.js` | Thin wrapper; inherits from `weather.js` via `mountWeather(..., { layout: "vertical" })` |
| `sites/staging/weather/widgets/weather/weather_vertical.css` | Imports `weather.css`; adds vertical layout overrides (sidebar 280–420px) |
| `sites/staging/weather/weather-vertical.html` | Standalone test page with location widget and vertical weather widget |

## Usage

### Standalone test page

Open `weather-vertical.html` in a browser (with a local server). The page mounts the location widget and vertical weather widget in a narrow column.

### Programmatic mount (with store)

```js
import { mountWeatherVertical } from "./widgets/weather/weather_vertical.js";
import { initState, getState, setState, subscribe } from "./core/state.js";

const storeApi = { getState, setState, subscribe };
initState();

const rootEl = document.getElementById("w-weather-vertical");
mountWeatherVertical(rootEl, storeApi);
```

### Embed API (external sites)

```js
import { WeatherWidget } from "./widgets/weather/weather_vertical.js";

WeatherWidget.mount({
  mountId: "weatherVerticalMount",
  layout: "vertical",
  lat: 52.2297,
  lon: 21.0122,
  timezone: "Europe/Warsaw",
  name: "Warsaw"
});
```

Requires a container: `<div id="weatherVerticalMount"></div>`

---

## Embedding into a site

### Option 1: Iframe (simplest)

Embed the standalone page in an iframe. The widget and API must be on the same origin (or CORS-enabled).

```html
<iframe
  src="https://your-domain.com/weather/weather-vertical.html"
  width="360"
  height="600"
  frameborder="0"
  title="Weather forecast"
></iframe>
```

Adjust `width` and `height` to fit your layout. The page includes the location picker and weather widget.

### Option 2: Script-based embed (same origin)

For embedding directly into your page (same origin as the API):

1. **Add a mount point:**
   ```html
   <div id="weatherVerticalMount" class="widget-container"></div>
   ```

2. **Include required assets** (before your script):
   ```html
   <link rel="stylesheet" href="/weather/assets/weather.css">
   <link rel="stylesheet" href="/weather/widgets/weather/weather_vertical.css">
   <script src="https://cdn.jsdelivr.net/npm/suncalc@1.9.0/suncalc.js"></script>
   ```

3. **Set config** (paths relative to your site):
   ```html
   <script>
     window.__WEATHER_POC_CONFIG = {
       locationsIndexUrl: "/weather/locations_index.json",
       locationDataBase: "/weather/data",
       iconBase: "/weather/assets/icons/weather"
     };
   </script>
   ```

4. **Add modals** (required for Hour Inspector, charts, tooltips). Copy the modal markup from `weather-vertical.html` (lines 17–74): `modal-overlay`, `factor-tooltip`, `chip-overlay`, `chart-overlay`, `hour-inspector-backdrop`, `hour-inspector-sheet`.

5. **Mount the widget:**
   ```html
   <script type="module">
     import { WeatherWidget } from "/weather/widgets/weather/weather_vertical.js";

     WeatherWidget.mount({
       mountId: "weatherVerticalMount",
       layout: "vertical",
       lat: 52.2297,
       lon: 21.0122,
       timezone: "Europe/Warsaw",
       name: "Warsaw"
     });
   </script>
   ```

**Note:** The weather API (`/api/astro-weather`) must be served from the same origin. Paths above assume the weather app is under `/weather/`; adjust if your structure differs.

### Config options (`window.__WEATHER_POC_CONFIG`)

| Option | Default | Description |
|-------|---------|-------------|
| `apiAstroWeatherUrl` | `"/api/astro-weather"` | API endpoint for live weather |
| `fallbackLegacyUrl` | `"/weather/daily_weather.json"` | Fallback JSON when API fails |
| `locationsIndexUrl` | — | Locations index JSON |
| `locationDataBase` | — | Base path for per-location JSON |
| `iconBase` | `"/assets/icons/weather"` | Base path for weather icons |

**Staging / 500 errors:** If the API returns 500, the widget falls back to `fallbackLegacyUrl`. If that file is missing or returns HTML (e.g. 404 page), you get "Expected JSON but got text/html". Fix by either: (1) fixing the API 500 (check Cloudflare Workers / function logs), or (2) ensuring `daily_weather.json` exists and is deployed, or (3) setting `fallbackLegacyUrl` to a known-good JSON URL.

## Architecture

- `weather_vertical.js` calls `mountWeather(rootEl, storeApi, { layout: "vertical" })`
- `weather.js` branches on `layoutMode === "vertical"` for HTML structure and renderers
- Vertical layout: `renderWeatherHTMLVertical`, `renderNowVertical`, `renderVerticalCardStack`
- `weather_vertical.css` imports `weather.css` and overrides for vertical layout

## Block order (per spec)

1. Time / Location
2. Current hour card (compact metrics line, no details toggle)
3. Observing / Weather switch
4. Legend (Observation Gate: Open / Marginal / Closed)
5. Vertical forecast card stack (~72h)
6. Footer (Updated HH:MM · ~72h forecast)
