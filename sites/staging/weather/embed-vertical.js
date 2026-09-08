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
 *   data-width="360" or "100%"      — Iframe width (default: 360)
 *   data-height="600" or "100%"     — Iframe height (default: 600)
 */
(function () {
  var WIDGET_ORIGIN = "https://staging.nebulacast.app";
  var WIDGET_PATH = "/weather/weather-vertical";
  var STORAGE_KEY = "nc-weather-embed-state";

  function getStoredState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && (s.lat != null || s.lon != null || s.tab)) return s;
      }
    } catch (e) {}
    return null;
  }

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
    var stored = getStoredState();
    var debug = script && script.getAttribute("data-debug") === "true";
    if (stored) {
      if (lat == null && stored.lat != null) lat = String(stored.lat);
      if (lon == null && stored.lon != null) lon = String(stored.lon);
      if (stored.tz) tz = stored.tz;
      if (stored.name) name = stored.name;
      if (stored.tab === "observing" || stored.tab === "weather") params.set("tab", stored.tab);
      if (debug) console.log("[Nebulacast] Restoring state:", stored);
    }
    if (lat) params.set("lat", lat);
    if (lon) params.set("lon", lon);
    if (tz) params.set("tz", tz);
    if (name) params.set("name", name);

    var width = (script && script.getAttribute("data-width")) || "360";
    var height = (script && script.getAttribute("data-height")) || "600";

    var url = WIDGET_ORIGIN + WIDGET_PATH + (params.toString() ? "?" + params.toString() : "");
    var iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.title = "Nebulacast Weather Forecast";
    var fullWidth = width === "100%" || width.indexOf("%") >= 0;
    if (fullWidth) {
      var style = document.createElement("style");
      style.textContent = "#" + mountId + "{width:100%!important;max-width:100%!important;display:block!important;box-sizing:border-box!important}" +
        "#" + mountId + " iframe{width:100%!important;max-width:100%!important;min-width:0!important;display:block!important;box-sizing:border-box!important}";
      (document.head || document.documentElement).appendChild(style);
      iframe.style.width = "100%";
      iframe.style.maxWidth = "100%";
      el.style.width = "100%";
      el.style.maxWidth = "100%";
    } else {
      iframe.width = width;
    }
    if (height === "100%" || height.indexOf("%") >= 0) {
      iframe.style.height = height;
    } else {
      iframe.height = height;
    }

    el.appendChild(iframe);

    window.addEventListener("message", function (e) {
      if (e.origin !== WIDGET_ORIGIN) return;
      if (!e.data || e.data.type !== "nc-weather-state") return;
      try {
        var loc = e.data.location;
        var tab = e.data.tab;
        var toStore = {};
        if (loc && typeof loc.lat === "number" && typeof loc.lon === "number") {
          toStore.lat = loc.lat;
          toStore.lon = loc.lon;
          toStore.tz = loc.tz || "Europe/Warsaw";
          toStore.name = loc.name || "";
        }
        if (tab === "observing" || tab === "weather") toStore.tab = tab;
        if (Object.keys(toStore).length) {
          var existing = getStoredState() || {};
          var merged = { ...existing, ...toStore };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          var script = document.querySelector('script[src*="embed-vertical.js"]');
          if (script && script.getAttribute("data-debug") === "true") {
            console.log("[Nebulacast] Saved state:", merged);
          }
        }
      } catch (err) {}
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
