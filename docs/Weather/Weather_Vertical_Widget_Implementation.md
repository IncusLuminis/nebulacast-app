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

### Option 1: Embed script (recommended for external sites)

Add a mount point and load the embed script. Works on any site; the widget runs inside an iframe from the widget origin.

```html
<div id="nc-weather-widget"></div>
<script src="https://staging.nebulacast.app/weather/embed-vertical.js"></script>
```

Optional attributes on the script tag:

| Attribute | Default | Description |
|----------|---------|-------------|
| `data-mount` | `nc-weather-widget` | ID of the mount element |
| `data-lat` | — | Initial latitude |
| `data-lon` | — | Initial longitude |
| `data-tz` | `Europe/Warsaw` | Timezone |
| `data-name` | — | Location name |
| `data-width` | `360` | Iframe width |
| `data-height` | `600` | Iframe height |

Example with location preset:

```html
<div id="nc-weather-widget"></div>
<script src="https://staging.nebulacast.app/weather/embed-vertical.js"
        data-lat="52.2297"
        data-lon="21.0122"
        data-tz="Europe/Warsaw"
        data-name="Warsaw"
        data-width="360"
        data-height="600"></script>
```

**Blogger / full-width column:** Use a wrapper to force full width of the sidebar or content area:

```html
<div style="width:100%;max-width:100%;margin:0;padding:0;overflow:hidden;">
  <div id="nc-weather-widget"></div>
  <script src="https://staging.nebulacast.app/weather/embed-vertical.js"
          data-lat="52.2297"
          data-lon="21.0122"
          data-tz="Europe/Warsaw"
          data-name="Warsaw"
          data-width="100%"
          data-height="600"></script>
</div>
```

### Option 2: Raw iframe

Embed the standalone page directly:

```html
<iframe
  src="https://staging.nebulacast.app/weather/weather-vertical"
  width="360"
  height="600"
  style="border:none"
  title="Nebulacast Weather Forecast"
></iframe>
```

With URL params for initial location: `?lat=52.23&lon=21.01&tz=Europe/Warsaw&name=Warsaw`

### Option 3: Script-based embed (same origin)

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
