import { loadConsoleData } from "../../../console/data-loader.mjs";

const DEFAULT_LOCATION = Object.freeze({ lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" });
const METRICS = Object.freeze({
  moon: { format: value => `${value.toFixed(1)}° alt`, min: 0, color: "rgba(210,210,165,0.50)", get: hour => hour._moon_alt ?? null },
  cloud: { format: value => `${Math.round(value)}%`, min: 0, max: 100, color: "rgba(143,182,255,0.55)", get: hour => hour.cloud?.total_percent ?? null },
  dew: { format: value => `${value.toFixed(1)}° spread`, min: 0, color: "rgba(80,210,220,0.55)", get: hour => hour.air?.temperature_c != null && hour.air?.dewpoint_c != null ? +(hour.air.temperature_c - hour.air.dewpoint_c).toFixed(1) : null },
  wind: { format: value => `${value.toFixed(1)} m/s`, min: 0, color: "rgba(190,150,255,0.55)", get: hour => hour.wind?.speed_mps ?? null },
  pressure: { format: value => `${Math.round(value)} hPa`, color: "rgba(100,210,130,0.55)", get: hour => hour.air?.pressure_hpa ?? null },
  temp: { format: value => `${value.toFixed(1)}°C`, color: "rgba(255,160,80,0.55)", get: hour => hour.air?.temperature_c ?? null },
});
const METRIC_KEYS = Object.freeze(["moon", "cloud", "dew", "wind", "pressure", "temp"]);
const METRIC_LABELS = Object.freeze({ moon: "🌙 Moon", cloud: "☁ Cloud", dew: "💧 Dew", wind: "💨 Wind", pressure: "⬆ Pressure", temp: "🌡 Temp" });

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireContext(context) {
  if (!isObject(context) || typeof context.get !== "function" || typeof context.subscribe !== "function") {
    throw new TypeError("Observing Window requires Platform Context");
  }
}

function documentFor(root) {
  return root?.ownerDocument || (typeof document !== "undefined" ? document : null);
}

function createElement(root, tagName, className, text) {
  const documentRef = documentFor(root);
  if (!documentRef?.createElement) throw new TypeError("Observing Window requires a DOM root");
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function clearRoot(root) {
  if (typeof root.replaceChildren === "function") root.replaceChildren();
  else root.textContent = "";
}

function locationFromContext(context) {
  const observer = context.get()?.observer || {};
  return {
    name: observer.name || "",
    lat: Number.isFinite(observer.lat) ? observer.lat : DEFAULT_LOCATION.lat,
    lon: Number.isFinite(observer.lon) ? observer.lon : DEFAULT_LOCATION.lon,
    tz: observer.timezone || observer.tz || DEFAULT_LOCATION.tz,
  };
}

function locationKey(location) {
  return `${location.lat},${location.lon},${location.tz}`;
}

function isDefaultSite(location) {
  return Math.abs(location.lat - DEFAULT_LOCATION.lat) < 0.05 &&
    Math.abs(location.lon - DEFAULT_LOCATION.lon) < 0.05;
}

function observerWeatherUrl(location) {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lon),
    tz: location.tz,
    bortle: "5",
  });
  return `/api/observer-weather?${params.toString()}`;
}

function weatherHours(weather) {
  if (Array.isArray(weather?.hourly)) return weather.hourly;
  if (Array.isArray(weather?.hours)) return weather.hours;
  return [];
}

function parseSunMoonTime(value) {
  if (typeof value !== "string") return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const match = /^(\d{4})-(\w{3})-(\d{2})\s+(\d{2}):(\d{2})Z?$/.exec(value);
  if (!match) return null;
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  return new Date(Date.UTC(Number(match[1]), months[match[2]] ?? 0, Number(match[3]), Number(match[4]), Number(match[5])));
}

/** Select the upcoming contiguous night and enrich it with Sun/Moon frame data. */
export function selectNightHours(weather, sunMoon, now = new Date()) {
  const nowHour = new Date(now).toISOString().slice(0, 13);
  const selected = [];
  let inNight = false;
  for (const sourceHour of weatherHours(weather)) {
    const timestamp = sourceHour?.timestamp_utc || sourceHour?.time;
    if (!timestamp || timestamp.slice(0, 13) < nowHour) continue;
    if (sourceHour.night === true) {
      selected.push({ ...sourceHour, timestamp_utc: timestamp });
      inNight = true;
    } else if (inNight) {
      break;
    }
  }

  for (const hour of selected) {
    const timestamp = new Date(hour.timestamp_utc).getTime();
    let closest = null;
    let distance = Infinity;
    for (const frame of sunMoon?.frames || []) {
      const frameTime = parseSunMoonTime(frame?.t_utc);
      const delta = frameTime ? Math.abs(frameTime.getTime() - timestamp) : Infinity;
      if (delta < distance) {
        distance = delta;
        closest = frame;
      }
    }
    hour._moon_alt = closest?.moon?.alt_deg != null ? Math.max(0, closest.moon.alt_deg) : null;
  }
  return selected;
}

function formatTime(iso, timezone) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timezone || "UTC" });
  } catch (_) {
    return "—";
  }
}

function hasUsableWeather(data) {
  return weatherHours(data?.wx).length > 0;
}

function hasPayload(data) {
  return Boolean(data?.wx || data?.sunMoon);
}

function createStatus(root, message) {
  const status = createElement(root, "div", "dbp-window-info");
  status.appendChild(createElement(root, "div", "dbp-window-sub", message));
  return status;
}

function renderChart(root, chart, hours, bestWindow, metric, timezone) {
  const definition = METRICS[metric] || METRICS.moon;
  const values = hours.map(definition.get);
  const defined = values.filter(value => value != null);
  let min = definition.min ?? (defined.length ? Math.min(...defined) : 0);
  let max = definition.max ?? (defined.length ? Math.max(...defined) : 1);
  if (max - min < 1) {
    const middle = (max + min) / 2;
    min = middle - 1;
    max = middle + 1;
  }

  hours.forEach((hour, index) => {
    const value = values[index];
    const normalized = value == null ? null : Math.max(0, Math.min(1, (value - min) / (max - min)));
    const bar = createElement(root, "div", "nop-bar");
    bar.style.height = `${normalized == null ? 3 : Math.max(3, Math.round(normalized * 24))}px`;
    const selected = bestWindow && hour.timestamp_utc >= bestWindow.start && hour.timestamp_utc < bestWindow.end;
    bar.style.background = selected ? definition.color.replace(".55", ".92") : definition.color;
    const tipValue = value == null ? "—" : definition.format(value);
    bar.setAttribute("data-tip", `${formatTime(hour.timestamp_utc, timezone)}: ${tipValue}`);
    chart.appendChild(bar);
  });
}

function render(root, view) {
  clearRoot(root);
  if (view.status) {
    root.appendChild(createStatus(root, view.status));
    return;
  }

  const { hours, bestWindow, metric, timezone } = view;
  if (bestWindow?.start && bestWindow?.end) {
    const info = createElement(root, "div", "dbp-window-info");
    info.appendChild(createElement(root, "div", "dbp-window-time", `${formatTime(bestWindow.start, timezone)} – ${formatTime(bestWindow.end, timezone)}`));
    info.appendChild(createElement(root, "div", "dbp-window-sub", "Best observing window tonight"));
    root.appendChild(info);
  } else if (!hours.length) {
    root.appendChild(createStatus(root, "No weather data available for tonight."));
  }

  const chart = createElement(root, "div", "dbp-window-chart");
  chart.id = "dbp-window-chart";
  renderChart(root, chart, hours, bestWindow, metric, timezone);
  root.appendChild(chart);

  const chipRow = createElement(root, "div", "dbp-window-chip-row");
  for (const key of METRIC_KEYS) {
    const chip = createElement(root, "button", "dbp-window-chip", METRIC_LABELS[key]);
    chip.type = "button";
    chip.dataset.wmetric = key;
    if (key === metric) chip.classList.add("is-active");
    chipRow.appendChild(chip);
  }
  root.appendChild(chipRow);
}

export function mountObservingWindow(root, context, options = {}, host) {
  requireContext(context);
  if (!isObject(root) || typeof root.addEventListener !== "function") {
    throw new TypeError("Observing Window requires a supplied root");
  }

  let config = { ...options };
  let data = null;
  let metric = METRICS[config.metric] ? config.metric : "moon";
  let location = locationFromContext(context);
  let currentLocationKey = locationKey(location);
  let alive = true;
  let sequence = 0;
  let controller = null;
  let timeoutTimer = null;
  let unsubscribe = null;
  let resizeObserver = null;

  const setState = state => { try { host?.setState?.(state); } catch (_) {} };
  const fetchImpl = () => config.fetch || globalThis.fetch;
  const nowFromContext = () => {
    const value = context.get()?.time?.datetimeISO;
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  };

  function renderCurrent() {
    const weather = data?.wx;
    const hours = selectNightHours(weather, data?.sunMoon, nowFromContext());
    render(root, {
      hours,
      bestWindow: data?.wx?.decision?.best_tonight || null,
      metric,
      timezone: location.tz,
    });
  }

  async function requestData(force = false) {
    if (!alive) return undefined;
    const requestId = ++sequence;
    controller?.abort?.();
    controller = typeof AbortController === "function" ? new AbortController() : null;
    setState("loading");
    render(root, { status: "Loading observing window…" });
    if (timeoutTimer) clearTimeout(timeoutTimer);
    const timeout = Number(config.fetchTimeout) > 0 ? Number(config.fetchTimeout) : 15000;
    timeoutTimer = setTimeout(() => controller?.abort?.(), timeout);

    try {
      const nextData = config.data !== undefined
        ? await Promise.resolve(config.data)
        : await loadConsoleData({
          location,
          isDefaultSite,
          observerWeatherUrl: observerWeatherUrl(location),
          fetchImpl: fetchImpl(),
          signal: controller?.signal,
        });
      if (!alive || requestId !== sequence) return undefined;
      data = nextData || null;
      renderCurrent();
      if (hasUsableWeather(data) && data?.wx?.decision) setState("ready");
      else if (hasPayload(data)) setState("degraded");
      else setState("error");
      return data;
    } catch (error) {
      if (!alive || requestId !== sequence || error?.name === "AbortError") return undefined;
      if (data) {
        renderCurrent();
        setState("stale");
      } else {
        render(root, { status: `Failed to load observing window${error?.message ? `: ${error.message}` : "."}` });
        setState("error");
      }
      return undefined;
    } finally {
      if (requestId === sequence) {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    }
  }

  function onContextChange() {
    location = locationFromContext(context);
    const nextKey = locationKey(location);
    if (nextKey !== currentLocationKey) {
      currentLocationKey = nextKey;
      void requestData(true);
    } else if (data) {
      renderCurrent();
    }
  }

  function onClick(event) {
    const chip = event.target?.closest?.(".dbp-window-chip[data-wmetric]");
    if (!chip || !root.contains?.(chip)) return;
    metric = METRICS[chip.dataset.wmetric] ? chip.dataset.wmetric : metric;
    renderCurrent();
  }

  root.addEventListener("click", onClick);
  unsubscribe = context.subscribe(onContextChange);
  const ResizeObserverRef = config.ResizeObserver || globalThis.ResizeObserver;
  if (typeof ResizeObserverRef === "function") {
    resizeObserver = new ResizeObserverRef(() => { if (alive && data) renderCurrent(); });
    resizeObserver.observe(root);
  }
  void requestData(false);

  return {
    update(patch = {}) {
      if (!alive || !isObject(patch)) return undefined;
      const sourceChanged = ["data", "fetch", "fetchTimeout"].some(key => patch[key] !== undefined);
      config = { ...config, ...patch };
      if (patch.metric && METRICS[patch.metric]) metric = patch.metric;
      if (sourceChanged) return requestData(true);
      if (data) renderCurrent();
      return undefined;
    },
    resize() {
      if (alive && data) renderCurrent();
      return undefined;
    },
    refresh() {
      return requestData(true);
    },
    destroy() {
      if (!alive) return undefined;
      alive = false;
      ++sequence;
      controller?.abort?.();
      controller = null;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      timeoutTimer = null;
      unsubscribe?.();
      unsubscribe = null;
      resizeObserver?.disconnect?.();
      resizeObserver = null;
      root.removeEventListener("click", onClick);
      return undefined;
    },
  };
}
