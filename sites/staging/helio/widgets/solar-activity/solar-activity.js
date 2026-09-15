const DEFAULT_DATA_URL = "/data/helio_now.json";
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const EVENT_TYPES = new Set(["solar_flare", "cme_launch", "cme_arrival"]);
const COLORS = Object.freeze({ none: "#607880", low: "#5cce8c", moderate: "#d4cc5c", strong: "#e0a84a", severe: "#e05c5c" });

function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function requireRoot(root) {
  if (!root || typeof root.appendChild !== "function" || typeof root.ownerDocument?.createElement !== "function") {
    throw new TypeError("Solar Activity requires a DOM root");
  }
}
function requireContext(context) {
  if (!isObject(context) || typeof context.get !== "function" || typeof context.subscribe !== "function") {
    throw new TypeError("Solar Activity requires Platform Context");
  }
}
function node(root, tag, className, text) {
  const item = root.ownerDocument.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = String(text);
  return item;
}
function clear(root) { root.replaceChildren?.(); }
function validTimestamp(value) { return typeof value === "string" && Number.isFinite(new Date(value).getTime()); }
function validateData(data) {
  if (!isObject(data) || data.schema_version !== "helio_now/v1" || !validTimestamp(data.updated_utc)) {
    throw new Error("Invalid helio_now/v1 dataset");
  }
  return data;
}
function valueOrDash(value, format = value => value) { return value === null || value === undefined || value === "" ? "—" : format(value); }
function formatTime(value) {
  if (!validTimestamp(value)) return "—";
  return new Date(value).toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }) + " UTC";
}
function formatUpdated(value) {
  const age = Date.now() - new Date(value).getTime();
  if (age < 60000) return "Updated just now";
  if (age < 3600000) return "Updated " + Math.floor(age / 60000) + "m ago";
  return "Updated " + Math.floor(age / 3600000) + "h ago";
}
function addStyles(root) {
  const doc = root.ownerDocument;
  if (doc.getElementById("nc-solar-activity-styles")) return;
  const style = doc.createElement("style");
  style.id = "nc-solar-activity-styles";
  style.textContent = [
    ".nc-solar-activity{box-sizing:border-box;width:100%;padding:14px;color:#d6e1e4;background:#161c1e;border-radius:6px;font:inherit}",
    ".nc-solar-activity__meta{display:flex;justify-content:space-between;gap:8px;margin-bottom:10px;font-size:10px;color:#82979d}",
    ".nc-solar-activity__state{font-weight:700;text-transform:uppercase;letter-spacing:.08em}",
    ".nc-solar-activity__columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}",
    ".nc-solar-activity[data-orientation=vertical] .nc-solar-activity__columns{grid-template-columns:1fr}",
    ".nc-solar-activity__column{min-width:0;padding:10px;border:1px solid #2a3c42;border-radius:6px;background:#11191b}",
    ".nc-solar-activity__title{margin:0 0 8px;color:#96a8b8;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}",
    ".nc-solar-activity__value{margin-bottom:7px;font-size:22px;font-weight:700;line-height:1.1}",
    ".nc-solar-activity__row{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid #1e2c30;font-size:11px}",
    ".nc-solar-activity__key{color:#82979d}.nc-solar-activity__value-small{font-weight:600;text-align:right}",
    ".nc-solar-activity__bars{display:flex;align-items:flex-end;gap:2px;height:38px;margin:8px 0 4px}",
    ".nc-solar-activity__bar{min-width:2px;flex:1;border-radius:2px 2px 0 0}",
    ".nc-solar-activity__events{display:flex;flex-direction:column;gap:6px}",
    ".nc-solar-activity__event{padding:6px 7px;border-left:2px solid #607880;background:#182225}",
    ".nc-solar-activity__event-title{font-size:11px;font-weight:600;line-height:1.3;word-break:break-word}",
    ".nc-solar-activity__event-meta{margin-top:2px;color:#82979d;font-size:9px}",
    ".nc-solar-activity__event-description{margin-top:4px;color:#96a8b8;font-size:10px;line-height:1.4;white-space:pre-wrap}",
    ".nc-solar-activity__empty,.nc-solar-activity__error{color:#82979d;font-size:11px;font-style:italic}",
    ".nc-solar-activity__error{padding:12px;color:#e0a84a;text-align:center}",
    "@media (max-width:520px){.nc-solar-activity__columns{grid-template-columns:1fr}.nc-solar-activity__meta{display:block}}",
  ].join("");
  doc.head?.appendChild(style);
}
function appendRow(root, column, key, value) {
  const row = node(root, "div", "nc-solar-activity__row");
  row.append(node(root, "span", "nc-solar-activity__key", key), node(root, "span", "nc-solar-activity__value-small", value));
  column.append(row);
}
function appendHistory(root, column, points, key, color) {
  if (!Array.isArray(points) || !points.length) return;
  const bars = node(root, "div", "nc-solar-activity__bars");
  const values = points.map(point => Number(point?.[key])).filter(Number.isFinite);
  const max = Math.max(...values, 1);
  points.slice(-24).forEach(point => {
    const value = Number(point?.[key]);
    const bar = node(root, "div", "nc-solar-activity__bar");
    bar.style.height = (Number.isFinite(value) ? Math.max(3, Math.round((value / max) * 34)) : 3) + "px";
    bar.style.background = color;
    bars.append(bar);
  });
  column.append(bars);
}
function appendEvents(root, column, timeline) {
  const events = Array.isArray(timeline) ? timeline.filter(event => EVENT_TYPES.has(event?.event_type)).slice(0, 4) : [];
  if (!events.length) {
    column.append(node(root, "div", "nc-solar-activity__empty", "No recent solar events"));
    return;
  }
  const list = node(root, "div", "nc-solar-activity__events");
  events.forEach(event => {
    const item = node(root, "article", "nc-solar-activity__event");
    item.style.borderLeftColor = event.level === "warning" ? COLORS.severe : event.level === "watch" ? COLORS.moderate : COLORS.none;
    item.append(node(root, "div", "nc-solar-activity__event-title", event.event_title || event.event_type));
    item.append(node(root, "div", "nc-solar-activity__event-meta",
      formatTime(event.event_time) + " · " + (event.severity_label ? event.event_type + " · " + event.severity_label : event.event_type)));
    if (event.description) item.append(node(root, "div", "nc-solar-activity__event-description", event.description));
    list.append(item);
  });
  column.append(list);
}
export function renderSolarActivity(root, data, orientation = "horizontal") {
  requireRoot(root);
  clear(root);
  root.classList.add("nc-solar-activity");
  root.dataset.orientation = orientation;
  const stale = Date.now() - new Date(data.updated_utc).getTime() > STALE_AFTER_MS;
  const meta = node(root, "div", "nc-solar-activity__meta");
  const state = node(root, "span", "nc-solar-activity__state", stale ? "Stale data" : "Live data");
  state.style.color = stale ? COLORS.moderate : COLORS.low;
  meta.append(state, node(root, "span", "", formatUpdated(data.updated_utc)));
  root.append(meta);
  const columns = node(root, "div", "nc-solar-activity__columns");
  const metrics = data.metrics || {};
  const xray = node(root, "section", "nc-solar-activity__column");
  xray.append(node(root, "h3", "nc-solar-activity__title", "X-Ray"));
  const xrayClass = valueOrDash(metrics.xray_class);
  const xrayValue = node(root, "div", "nc-solar-activity__value", xrayClass);
  xrayValue.style.color = String(xrayClass).charAt(0) === "X" ? COLORS.severe : String(xrayClass).charAt(0) === "M" ? COLORS.moderate : COLORS.low;
  xray.append(xrayValue);
  appendRow(root, xray, "Flux", valueOrDash(metrics.xray_flux_wm2, value => Number(value).toExponential(2) + " W/m²"));
  appendRow(root, xray, "R scale", valueOrDash(data.scales?.r_scale));
  appendHistory(root, xray, metrics.xray_history_1h, "flux", COLORS.low);

  const activity = node(root, "section", "nc-solar-activity__column");
  activity.append(node(root, "h3", "nc-solar-activity__title", "Solar Activity"));
  const sun = data.chain_panel?.sun || {};
  const sunValue = node(root, "div", "nc-solar-activity__value", valueOrDash(sun.label, () => "Quiet"));
  sunValue.style.color = COLORS[sun.severity] || COLORS.none;
  activity.append(sunValue);
  const impact = Array.isArray(data.observer_impacts) ? data.observer_impacts.find(item => item?.kind === "solar_activity") : null;
  appendRow(root, activity, "Impact", valueOrDash(impact?.summary));
  appendEvents(root, activity, data.timeline);

  const wind = node(root, "section", "nc-solar-activity__column");
  wind.append(node(root, "h3", "nc-solar-activity__title", "Solar Wind"));
  wind.append(node(root, "div", "nc-solar-activity__value", valueOrDash(metrics.solar_wind_kms, value => Math.round(value) + " km/s")));
  appendRow(root, wind, "Density", valueOrDash(metrics.density, value => Number(value).toFixed(2) + " p/cm³"));
  appendRow(root, wind, "Pressure", valueOrDash(metrics.pressure_npa, value => Number(value).toFixed(2) + " nPa"));
  appendRow(root, wind, "IMF Bz", valueOrDash(metrics.imf_bz_nt, value => Number(value).toFixed(1) + " nT"));
  appendRow(root, wind, "IMF Bt", valueOrDash(metrics.imf_bt_nt, value => Number(value).toFixed(1) + " nT"));
  appendHistory(root, wind, metrics.wind_history_1h, "kms", "rgba(143,182,255,.7)");
  columns.append(xray, activity, wind);
  root.append(columns);
  return { stale };
}
export async function mountSolarActivity(root, context, options = {}, host) {
  requireRoot(root);
  requireContext(context);
  addStyles(root);
  let config = { dataUrl: DEFAULT_DATA_URL, orientation: "horizontal", ...options };
  let data = null;
  let alive = true;
  let sequence = 0;
  let controller = null;
  let unsubscribe = context.subscribe(() => {});
  const fetchImpl = () => config.fetch || globalThis.fetch;
  const setState = state => host?.setState?.(state);
  const renderError = error => {
    clear(root);
    root.classList.add("nc-solar-activity");
    root.append(node(root, "div", "nc-solar-activity__error", error?.message || "Solar activity data unavailable."));
  };
  async function load() {
    if (!alive) return;
    const request = ++sequence;
    controller?.abort?.();
    controller = typeof AbortController === "function" ? new AbortController() : null;
    setState("loading");
    try {
      const incoming = config.data !== undefined
        ? await Promise.resolve(config.data)
        : await fetchImpl()(config.dataUrl || DEFAULT_DATA_URL, { signal: controller?.signal, cache: "no-store" }).then(response => {
          if (!response.ok) throw new Error("Solar activity request failed (" + response.status + ")");
          return response.json();
        });
      if (!alive || request !== sequence) return;
      data = validateData(incoming);
      renderSolarActivity(root, data, config.orientation);
      setState(Date.now() - new Date(data.updated_utc).getTime() > STALE_AFTER_MS ? "stale" : "ready");
    } catch (error) {
      if (!alive || request !== sequence || error?.name === "AbortError") return;
      renderError(error);
      setState("error");
    }
  }
  void load();
  return {
    update(patch = {}) {
      if (!alive || !isObject(patch)) return undefined;
      config = { ...config, ...patch };
      if (patch.data !== undefined || patch.dataUrl !== undefined || patch.fetch !== undefined) return load();
      if (data) renderSolarActivity(root, data, config.orientation);
      return undefined;
    },
    resize() { if (alive && data) renderSolarActivity(root, data, config.orientation); },
    refresh: load,
    destroy() {
      if (!alive) return;
      alive = false;
      ++sequence;
      controller?.abort?.();
      unsubscribe?.();
      unsubscribe = null;
      clear(root);
    },
  };
}
