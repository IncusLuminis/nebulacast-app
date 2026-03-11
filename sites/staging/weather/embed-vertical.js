/**
 * Nebulacast Weather Vertical Widget — Embed Script
 *
 * Usage:
 *   1. Add mount point: <div id="nc-weather-widget"></div>
 *   2. Load script: <script src="https://staging.nebulacast.app/weather/embed-vertical.js"></script>
 *
 * Optional data attributes on the script tag:
 *   data-mount="nc-weather-widget"  — ID of mount element (default)
 *   data-lat="52.2297"              — Initial latitude
 *   data-lon="21.0122"              — Initial longitude
 *   data-tz="Europe/Warsaw"         — Timezone
 *   data-name="Warsaw"               — Location name
 *   data-width="360"                — Iframe width (default: 360)
 *   data-height="600"               — Iframe height (default: 600)
 */
(function () {
  var WIDGET_ORIGIN = "https://staging.nebulacast.app";
  var WIDGET_PATH = "/weather/weather-vertical";

  function mount() {
    var script = document.currentScript;
    var mountId = (script && script.getAttribute("data-mount")) || "nc-weather-widget";
    var el = document.getElementById(mountId);
    if (!el) {
      console.warn("[Nebulacast] Mount element not found: #" + mountId);
      return;
    }

    var params = new URLSearchParams();
    var lat = script && script.getAttribute("data-lat");
    var lon = script && script.getAttribute("data-lon");
    var tz = (script && script.getAttribute("data-tz")) || "Europe/Warsaw";
    var name = script && script.getAttribute("data-name");

    if (lat) params.set("lat", lat);
    if (lon) params.set("lon", lon);
    if (tz) params.set("tz", tz);
    if (name) params.set("name", name);

    var width = (script && script.getAttribute("data-width")) || "360";
    var height = (script && script.getAttribute("data-height")) || "600";

    var url = WIDGET_ORIGIN + WIDGET_PATH + (params.toString() ? "?" + params.toString() : "");
    var iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.width = width;
    iframe.height = height;
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.title = "Nebulacast Weather Forecast";

    el.appendChild(iframe);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
