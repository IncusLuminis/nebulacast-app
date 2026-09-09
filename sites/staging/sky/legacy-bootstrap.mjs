/**
 * Legacy standalone Sky bootstrap.
 *
 * This is the only compatibility bridge for the historical SKY_CONFIG and
 * __skyWidget globals. The Sky implementation itself is mounted through the
 * explicit mountSky() API and does not inspect page globals.
 */

import { mountSky } from "./widget.js";

const DEFAULT_TIMEOUT_MS = 4000;
const POLL_INTERVAL_MS = 50;
const DEFAULT_LAT = 52.2297;
const DEFAULT_LON = 21.0122;

function isStandaloneSkyHost() {
  const pathname = typeof window !== "undefined" ? window.location?.pathname || "" : "";
  return pathname.endsWith("/sky/") || pathname.endsWith("/sky/index.html");
}

export function buildStandaloneSkyConfig(search = "") {
  const params = new URLSearchParams(search);
  const lat = parseFloat(params.get("lat") ?? "");
  const lon = parseFloat(params.get("lon") ?? "");

  return {
    baseUrl: "/sky",
    mountId: "skyMount",
    lat: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : DEFAULT_LAT,
    lon: Number.isFinite(lon) && lon >= -180 && lon <= 180 ? lon : DEFAULT_LON,
    datetimeISO: params.get("datetime") || null,
  };
}

function getLegacyConfig() {
  return typeof window !== "undefined" ? window.SKY_CONFIG : null;
}

function createLegacyContext(config) {
  const snapshot = {
    observer: {
      name: config?.name ?? null,
      lat: config?.lat,
      lon: config?.lon,
      timezone: config?.timezone ?? null,
    },
    time: {
      mode: config?.datetimeISO ? "manual" : "live",
      datetimeISO: config?.datetimeISO ?? null,
    },
    locale: config?.locale ?? "en",
    theme: config?.theme ?? "light",
  };

  return {
    get() {
      return structuredClone(snapshot);
    },
    subscribe() {
      return () => {};
    },
  };
}

export async function bootstrapLegacySky(config) {
  const resolvedConfig = config || getLegacyConfig() || buildStandaloneSkyConfig(window.location?.search || "");
  window.SKY_CONFIG = resolvedConfig;

  if (!resolvedConfig.mountId) {
    throw new Error("SKY_CONFIG.mountId is required (e.g. 'skyMount').");
  }

  const root = document.getElementById(resolvedConfig.mountId);
  if (!root) {
    throw new Error(`SKY mount element not found: #${resolvedConfig.mountId}`);
  }

  const handle = await mountSky(
    root,
    createLegacyContext(resolvedConfig),
    resolvedConfig,
    undefined,
    { compatibility: true },
  );
  window.__skyWidget = handle;
  return handle;
}

export function bootLegacySkyWhenReady({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollIntervalMs = POLL_INTERVAL_MS,
} = {}) {
  const initialConfig = getLegacyConfig();
  if (initialConfig?.mountId) {
    return bootstrapLegacySky(initialConfig).catch(error => {
      console.error("SKY init failed:", error);
    });
  }

  if (isStandaloneSkyHost()) {
    return bootstrapLegacySky().catch(error => {
      console.error("SKY init failed:", error);
    });
  }

  const startedAt = Date.now();
  const timer = setInterval(() => {
    const config = getLegacyConfig();
    if (config?.mountId) {
      clearInterval(timer);
      bootstrapLegacySky(config).catch(error => {
        console.error("SKY init failed:", error);
      });
      return;
    }

    if (Date.now() - startedAt > timeoutMs) {
      clearInterval(timer);
      console.error(
        "SKY init failed: SKY_CONFIG.mountId is required (e.g. 'skyMount').",
        "Current SKY_CONFIG:",
        config,
      );
    }
  }, pollIntervalMs);

  return timer;
}

if (typeof window !== "undefined" && (getLegacyConfig()?.mountId || isStandaloneSkyHost())) {
  bootLegacySkyWhenReady();
}
