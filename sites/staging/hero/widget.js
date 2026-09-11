import { createLunarSnapshot } from "../shared/lunar.mjs";
import { loadConsoleData } from "../console/data-loader.mjs";

const DEFAULT_LOCATION = Object.freeze({ lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" });
const DEFAULT_PROFILE = "balanced";
const METRICS = Object.freeze({
  cloud: { label: "Cloud", color: "rgba(143,182,255,0.55)", hiColor: "rgba(143,182,255,0.92)", get: h => h.cloud?.total_percent ?? null, fmt: v => `${Math.round(v)}%`, min: 0, max: 100 },
  dew: { label: "Dew", color: "rgba(80,210,220,0.55)", hiColor: "rgba(80,210,220,0.92)", get: h => { const t = h.air?.temperature_c, d = h.air?.dewpoint_c; return t != null && d != null ? +(t - d).toFixed(1) : null; }, fmt: v => `${v.toFixed(1)}° spread`, min: 0 },
  wind: { label: "Wind", color: "rgba(190,150,255,0.55)", hiColor: "rgba(190,150,255,0.92)", get: h => h.wind?.speed_mps ?? null, fmt: v => `${v.toFixed(1)} m/s`, min: 0 },
  pressure: { label: "Pressure", color: "rgba(100,210,130,0.55)", hiColor: "rgba(100,210,130,0.92)", get: h => h.air?.pressure_hpa ?? null, fmt: v => `${Math.round(v)} hPa` },
  temp: { label: "Temp", color: "rgba(255,160,80,0.55)", hiColor: "rgba(255,160,80,0.92)", get: h => h.air?.temperature_c ?? null, fmt: v => `${v.toFixed(1)}°C` },
  moon: { label: "Moon", color: "rgba(210,210,165,0.50)", hiColor: "rgba(210,210,165,0.88)", get: h => h._moon_alt ?? null, fmt: v => `${v.toFixed(1)}° alt`, min: 0 },
});
const METRIC_LABELS = Object.freeze({ moon: "🌙 Moon", cloud: "☁ Cloud", dew: "💧 Dew", wind: "💨 Wind", pressure: "⬆ Pressure", temp: "🌡 Temp" });

function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function weatherHours(weather) {
  if (Array.isArray(weather?.hourly)) return weather.hourly;
  if (Array.isArray(weather?.hours)) return weather.hours;
  return [];
}
function isWeatherReady(weather) {
  const decision = weather?.decision;
  const hasForecast = isObject(decision) && ["best_tonight", "best_window_2h", "best_window_3h"].some(key => Object.prototype.hasOwnProperty.call(decision, key));
  const rateLimited = weather?.source === "rate-limited" || weather?.rate_limited === true;
  return !rateLimited && weatherHours(weather).length > 0 && isObject(decision) && hasForecast;
}
function escapeText(value) { return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
function locationFromContext(context) {
  const observer = context?.getObserver?.() || context?.get?.()?.observer || {};
  return { name: observer.name, lat: observer.lat, lon: observer.lon, tz: observer.timezone || observer.tz || DEFAULT_LOCATION.tz };
}
function locationKey(location) { return Number.isFinite(location?.lat) && Number.isFinite(location?.lon) ? `${location.lat},${location.lon},${location.tz || ""}` : "default"; }
function isDefaultSite(location) { return !location || Math.abs(location.lat - DEFAULT_LOCATION.lat) < 0.05 && Math.abs(location.lon - DEFAULT_LOCATION.lon) < 0.05; }
function observerWeatherUrl(location) {
  const params = new URLSearchParams({ lat: String(location?.lat ?? DEFAULT_LOCATION.lat), lon: String(location?.lon ?? DEFAULT_LOCATION.lon), tz: location?.tz || DEFAULT_LOCATION.tz, bortle: "5" });
  return `/api/observer-weather?${params.toString()}`;
}
function formatTime(iso, timezone) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false, ...(timezone ? { timeZone: timezone } : {}) }); } catch (_) { return "—"; }
}
function parseSunMoonTime(value) {
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const match = value && value.match(/^(\d{4})-(\w{3})-(\d{2})\s+(\d{2}):(\d{2})Z?$/);
  return match ? new Date(Date.UTC(+match[1], months[match[2]] || 0, +match[3], +match[4], +match[5])) : null;
}
function scoreClass(score) { return score >= 85 ? "score-excellent" : score >= 70 ? "score-good" : score >= 50 ? "score-fair" : "score-poor"; }
function nqiColor(value) { return value === "excellent" ? "#4caf50" : value === "good" ? "#8bc34a" : value === "usable" ? "#ff9800" : value === "marginal" ? "#f44336" : "#9e3a3a"; }
function nqiLabel(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : "—"; }
function kpToG(value) { return value == null || value < 5 ? 0 : value < 6 ? 1 : value < 7 ? 2 : value < 8 ? 3 : value < 9 ? 4 : 5; }
function kpColor(value) { return value == null ? "rgba(255,255,255,0.35)" : value >= 8 ? "#e05c5c" : value >= 7 ? "#e0a84a" : value >= 6 ? "#d4cc5c" : value >= 5 ? "#5cce8c" : "#fff"; }
function scaleBadge(label, level) {
  const on = level > 0;
  const color = !on ? "rgba(255,255,255,0.2)" : level / 5 >= 0.6 ? "#f44336" : "#ff9800";
  const background = !on ? "rgba(255,255,255,0.05)" : level / 5 >= 0.6 ? "rgba(244,67,54,0.15)" : "rgba(255,152,0,0.13)";
  return `<span class="nop-scale-badge" style="color:${color};background:${background}">${label}${level}</span>`;
}

function createEvent(root, type, detail, config) {
  const CustomEventRef = config.CustomEvent || root.ownerDocument?.defaultView?.CustomEvent || globalThis.CustomEvent;
  if (typeof CustomEventRef === "function") return new CustomEventRef(type, { bubbles: false, detail });
  return { type, detail };
}

function drawMoon(root, canvas, illumination, waxing) {
  if (!canvas?.getContext) return;
  const documentRef = root.ownerDocument;
  const size = canvas.width, radius = size / 2 - 1, center = size / 2;
  const context = canvas.getContext("2d");
  const ImageRef = root.ownerDocument?.defaultView?.Image || globalThis.Image;
  if (typeof ImageRef !== "function") return;
  const image = new ImageRef();
  image.src = "/assets/bitmaps/Moon.png";
  const render = () => {
    context.clearRect(0, 0, size, size);
    context.save(); context.beginPath(); context.arc(center, center, radius, 0, Math.PI * 2); context.clip();
    if (image.naturalWidth || image.complete) context.drawImage(image, center - radius, center - radius, radius * 2, radius * 2);
    context.restore();
    if (illumination > 0.98 || !documentRef?.createElement) return;
    const extent = radius * (1 - 2 * illumination);
    const shadow = documentRef.createElement("canvas"); shadow.width = size; shadow.height = size;
    const shadowContext = shadow.getContext("2d"); shadowContext.fillStyle = "rgba(4,8,20,0.93)";
    const left = waxing;
    shadowContext.beginPath(); shadowContext.moveTo(center, center - radius); shadowContext.arc(center, center, radius, -Math.PI / 2, Math.PI / 2, left); shadowContext.closePath(); shadowContext.fill();
    if (Math.abs(extent) > 0.02) {
      shadowContext.beginPath(); shadowContext.ellipse(center, center, Math.abs(extent), radius, 0, 0, Math.PI * 2);
      if ((left && extent < 0) || (!left && extent < 0)) shadowContext.globalCompositeOperation = "destination-out";
      shadowContext.fill();
    }
    const mask = documentRef.createElement("canvas"); mask.width = size; mask.height = size;
    const maskContext = mask.getContext("2d"); maskContext.beginPath(); maskContext.arc(center, center, radius, 0, Math.PI * 2); maskContext.fillStyle = "#000"; maskContext.fill(); maskContext.globalCompositeOperation = "source-in"; maskContext.drawImage(shadow, 0, 0); context.drawImage(mask, 0, 0);
  };
  if (image.complete && image.naturalWidth) render(); else image.onload = render;
}

function deriveCrossings(sunMoon, location, sunCalc) {
  let sunset = null, sunrise = null, moonrise = null, moonset = null;
  const frames = sunMoon?.frames || [];
  if (typeof sunCalc?.getTimes === "function" && location?.lat != null && location?.lon != null) {
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: location.tz || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const today = new Date(`${localDate}T12:00:00Z`), tomorrow = new Date(today.getTime() + 86400000);
    const first = sunCalc.getTimes(today, location.lat, location.lon), second = sunCalc.getTimes(tomorrow, location.lat, location.lon), now = Date.now();
    const sunsetDate = first.sunset?.getTime() > now - 3600000 ? first.sunset : second.sunset;
    const sunriseDate = first.sunrise?.getTime() > sunsetDate?.getTime() ? first.sunrise : second.sunrise;
    if (sunsetDate instanceof Date && !Number.isNaN(sunsetDate.getTime())) sunset = sunsetDate.toISOString();
    if (sunriseDate instanceof Date && !Number.isNaN(sunriseDate.getTime())) sunrise = sunriseDate.toISOString();
    if (typeof sunCalc.getMoonTimes === "function") {
      const start = sunset ? new Date(sunset).getTime() - 7200000 : now, end = sunrise ? new Date(sunrise).getTime() + 7200000 : now + 50400000;
      for (const date of [today, tomorrow]) {
        const moon = sunCalc.getMoonTimes(date, location.lat, location.lon, true);
        if (!moonrise && moon.rise instanceof Date && moon.rise.getTime() >= start && moon.rise.getTime() <= end) moonrise = moon.rise.toISOString();
        if (!moonset && moon.set instanceof Date && moon.set.getTime() >= start && moon.set.getTime() <= end) moonset = moon.set.toISOString();
      }
    }
    return { sunset, sunrise, moonrise, moonset };
  }
  const now = Date.now(), start = now - 8 * 3600000, end = now + 32 * 3600000;
  for (let index = 1; index < frames.length; index += 1) {
    const time = parseSunMoonTime(frames[index].t_utc); if (!time) continue;
    const ms = time.getTime(); if (ms < start || ms > end) continue;
    const previous = frames[index - 1], current = frames[index];
    if (previous.sun?.alt_deg > 0 && current.sun?.alt_deg <= 0 && !sunset) sunset = time.toISOString();
    if (previous.sun?.alt_deg <= 0 && current.sun?.alt_deg > 0 && sunset && !sunrise) sunrise = time.toISOString();
  }
  const nightStart = sunset ? new Date(sunset).getTime() - 7200000 : now, nightEnd = sunrise ? new Date(sunrise).getTime() + 7200000 : now + 50400000;
  for (let index = 1; index < frames.length; index += 1) {
    const time = parseSunMoonTime(frames[index].t_utc); if (!time) continue;
    const ms = time.getTime(); if (ms < nightStart || ms > nightEnd) continue;
    const previous = frames[index - 1], current = frames[index];
    if (previous.moon?.alt_deg <= 0 && current.moon?.alt_deg > 0 && !moonrise) moonrise = time.toISOString();
    if (previous.moon?.alt_deg > 0 && current.moon?.alt_deg <= 0 && !moonset) moonset = time.toISOString();
  }
  return { sunset, sunrise, moonrise, moonset };
}

function selectNightHours(wx, sunMoon) {
  const nowHour = new Date().toISOString().slice(0, 13), selected = [];
  let inNight = false;
  for (const hour of wx?.hourly || []) {
    if ((hour.timestamp_utc || "").slice(0, 13) < nowHour) continue;
    if (hour.night === true) { inNight = true; selected.push({ ...hour }); } else if (inNight) break;
  }
  for (const hour of selected) {
    const timestamp = new Date(hour.timestamp_utc).getTime(); if (!Number.isFinite(timestamp)) continue;
    let closest = null, distance = Infinity;
    for (const frame of sunMoon?.frames || []) { const frameTime = parseSunMoonTime(frame.t_utc); const delta = frameTime ? Math.abs(frameTime.getTime() - timestamp) : Infinity; if (delta < distance) { distance = delta; closest = frame; } }
    hour._moon_alt = closest?.moon?.alt_deg != null ? Math.max(0, closest.moon.alt_deg) : null;
  }
  return selected;
}

export function mountHero(root, context, suppliedConfig = {}, host) {
  if (!isObject(root) || typeof root.querySelector !== "function") throw new TypeError("Hero widget requires a supplied root with querySelector");
  let config = { ...suppliedConfig };
  let data = null, nightHours = [], bestWindow = null, activeProfile = DEFAULT_PROFILE, activeMetric = "moon", activePanels = {};
  let alive = true, destroyed = false, sequence = 0, inFlight = null, controller = null, timeoutTimer = null, clockTimer = null, contextUnsubscribe = null, resizeObserver = null;
  let currentLocation = locationFromContext(context), currentLocationKey = locationKey(currentLocation);
  const documentRef = root.ownerDocument;
  const view = documentRef?.defaultView;
  const setIntervalRef = config.setInterval || globalThis.setInterval;
  const clearIntervalRef = config.clearInterval || globalThis.clearInterval;
  const setTimeoutRef = config.setTimeout || globalThis.setTimeout;
  const clearTimeoutRef = config.clearTimeout || globalThis.clearTimeout;

  const setState = state => { try { host?.setState?.(state); } catch (_) {} };
  const emit = (type, detail) => { if (alive) root.dispatchEvent(createEvent(root, type, detail, config)); };
  const localTime = (iso, timezone) => formatTime(iso, timezone);

  function renderStatus(message) { root.innerHTML = `<div class="hero-skeleton" data-role="status" role="status" aria-live="polite">${escapeText(message)}</div>`; }
  function moonCanvasLabel(illumination, crossings) {
    const phase = illumination?.phase_name || "Moon";
    const percent = illumination?.illuminated_percent == null ? "unknown" : `${Math.round(illumination.illuminated_percent)}%`;
    const rise = crossings?.moonrise ? ` Moonrise ${localTime(crossings.moonrise, currentLocation.tz)}.` : "";
    const set = crossings?.moonset ? ` Moonset ${localTime(crossings.moonset, currentLocation.tz)}.` : "";
    return `${phase}, ${percent} illuminated.${rise}${set}`;
  }
  function renderPanelState() {
    root.querySelectorAll(".hero-card[data-panel]").forEach(card => {
      card.classList.toggle("db-panel-open", Boolean(activePanels[card.dataset.panel]));
    });
  }
  function renderChart(hours, window, metric) {
    const definition = METRICS[metric] || METRICS.cloud, values = hours.map(definition.get), defined = values.filter(value => value != null);
    let min = definition.min ?? (defined.length ? Math.min(...defined) : 0), max = definition.max ?? (defined.length ? Math.max(...defined) : 1);
    if (max - min < 1) { const middle = (max + min) / 2; min = middle - 1; max = middle + 1; }
    return hours.map((hour, index) => { const value = values[index], normalized = value != null ? Math.max(0, Math.min(1, (value - min) / (max - min))) : null, height = normalized != null ? Math.max(3, Math.round(normalized * 24)) : 3, inWindow = window && hour.timestamp_utc >= window.start && hour.timestamp_utc < window.end, tip = `${localTime(hour.timestamp_utc, currentLocation.tz)}: ${value != null ? definition.fmt(value) : "—"}`; return `<div class="nop-bar" style="height:${height}px;background:${inWindow ? definition.hiColor : definition.color}" data-tip="${escapeText(tip)}"></div>`; }).join("");
  }
  function buildSummary(wx, sw) {
    if (!nightHours.length) return "Weather data unavailable for tonight.";
    const cloudAverage = nightHours.reduce((sum, hour) => sum + (hour.cloud?.total_percent || 0), 0) / nightHours.length;
    const windMax = Math.max(...nightHours.map(hour => hour.wind?.speed_mps || 0));
    const precipitation = nightHours.some(hour => (hour.precip?.probability_percent || 0) > 30), dewRisk = wx?.decision?.risks?.dew || "low";
    const first = cloudAverage < 20 ? "Clear skies expected throughout the night." : cloudAverage < 40 ? "Mostly clear with occasional cloud patches." : cloudAverage < 60 ? "Partly cloudy — some patches will affect views." : cloudAverage < 80 ? "Significant cloud cover will limit observations." : "Heavy overcast. Observing not recommended.";
    const second = precipitation ? "Precipitation possible, limiting clear windows." : windMax > 10 ? `Winds up to ${Math.round(windMax * 3.6)} km/h may affect stability.` : dewRisk === "high" ? "High dew risk — protect optics." : cloudAverage < 30 ? "Conditions are favorable for most observations." : "Observing windows will be limited.";
    const third = sw?.summary?.status === "storm" || sw?.summary?.status === "active" ? "Elevated geomagnetic activity may affect radio observations." : "";
    return [first, second, third].filter(Boolean).join(" ");
  }
  function renderClock() {
    const dateElement = root.querySelector("[data-role=clock-date]"), timeElement = root.querySelector("[data-role=clock-time]"); if (!dateElement || !timeElement) return;
    const now = new Date(), options = currentLocation.tz ? { timeZone: currentLocation.tz } : {};
    dateElement.textContent = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", ...options });
    timeElement.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, ...options });
    const frame = view?.requestAnimationFrame || globalThis.requestAnimationFrame;
    if (typeof frame === "function") frame(() => { const dateWidth = dateElement.getBoundingClientRect?.().width, timeWidth = timeElement.getBoundingClientRect?.().width; if (dateWidth > 0 && timeWidth > 0) timeElement.style.fontSize = `${(parseFloat((view?.getComputedStyle || globalThis.getComputedStyle)(timeElement).fontSize) * dateWidth / timeWidth).toFixed(1)}px`; });
  }
  function render() {
    if (!alive) return;
    const wx = data?.wx, sw = data?.sw, sunMoon = data?.sunMoon, crossings = deriveCrossings(sunMoon, currentLocation, config.sunCalc);
    nightHours = selectNightHours(wx, sunMoon); bestWindow = wx?.decision?.best_tonight || null;
    const profiles = wx?.decision?.mode_scores || {}, nqi = wx?.night_summary?.nqi || {}, averages = wx?.night_summary?.avg_score || {}, profileKeys = Object.keys(profiles).length ? Object.keys(profiles) : Object.keys(nqi);
    if (profileKeys.length && !profiles[activeProfile] && !nqi[activeProfile]) activeProfile = profileKeys[0];
    const kp = sw?.metrics?.kp_latest ?? null, scales = sw?.scales || {}, rLevel = parseInt(String(scales.r_scale || "R0").replace(/\D/g, ""), 10) || 0, sLevel = parseInt(String(scales.s_scale || "S0").replace(/\D/g, ""), 10) || 0, status = sw?.summary?.status || "quiet";
    const liveStatus = kpToG(kp) >= 3 ? "storm" : kpToG(kp) >= 1 ? "elevated" : kp != null && kp >= 4 ? "active" : "quiet", liveLabel = { storm: "Storm", elevated: "Elevated", active: "Active", quiet: "Quiet" }[liveStatus];
    const forecast = sw?.forecast?.kp_max_next_24h ?? null, forecastG = kpToG(forecast), forecastStatus = forecastG >= 3 ? "storm" : forecastG >= 1 ? "elevated" : forecast != null && forecast >= 4 ? "active" : "quiet", trend = sw?.forecast?.trend || "steady", trendArrow = trend === "rising" ? "↑" : trend === "falling" ? "↓" : "→";
    const sunBorder = { quiet: "#5cce8c", active: "#d4cc5c", elevated: "#e0a84a", storm: "#e05c5c" }[status] || "#5cce8c", sunWave = { quiet: "171", active: "195", elevated: "284", storm: "304" }[status] || "171";
    const currentHour = (wx?.hourly || []).findIndex(hour => (hour.timestamp_utc || "").slice(0, 13) >= new Date().toISOString().slice(0, 13)), currentWeather = currentHour >= 0 ? wx.hourly[currentHour] : null, nextWeather = currentHour >= 0 ? wx.hourly[currentHour + 1] : null;
    const cloud = currentWeather?.cloud?.total_percent ?? null, precipitation = currentWeather?.precip?.probability_percent ?? 0, icon = cloud == null ? "" : cloud < 15 ? "☀" : cloud < 40 ? "🌤" : cloud < 75 ? "⛅" : precipitation > 30 ? "🌧" : "☁", temperature = currentWeather?.air?.temperature_c ?? null, nextTemperature = nextWeather?.air?.temperature_c ?? null, temperatureArrow = temperature != null && nextTemperature != null ? nextTemperature > temperature + 0.4 ? "↑" : nextTemperature < temperature - 0.4 ? "↓" : "" : "", pressure = currentWeather?.air?.pressure_hpa ?? null, pressureTrend = wx?.decision?.pressure?.trend_label || "", pressureArrow = pressureTrend === "rising" ? "↑" : pressureTrend === "falling" ? "↓" : "";
    const activeNqi = nqi[activeProfile] || {}, profileLabels = { balanced: "Balanced", visual: "Visual", photography: "Photo", broadband: "Broadband", planetary: "Planetary" }, profilesHtml = profileKeys.map(key => `<button type="button" class="nop-profile-btn${key === activeProfile ? " is-active" : ""}" data-profile="${escapeText(key)}" aria-pressed="${key === activeProfile}">${escapeText(profileLabels[key] || key)}</button>`).join("");
    const illumination = createLunarSnapshot({ instant: new Date(), location: { lat: currentLocation.lat || DEFAULT_LOCATION.lat, lon: currentLocation.lon || DEFAULT_LOCATION.lon, timezone: currentLocation.tz || DEFAULT_LOCATION.tz } }).lunar;
    const weatherChips = currentWeather ? `<div class="hero-weather-chips"><span>🌡</span><span class="temp">${temperature != null ? `${Math.round(temperature)}°${temperatureArrow}` : "—"}</span><span class="separator">·</span><span>${icon}</span><span class="cloud">${cloud != null ? `${Math.round(cloud)}%` : "—"}</span><span class="separator">·</span><span class="pressure-label">hPa</span><span class="pressure">${pressure != null ? `${Math.round(pressure)}${pressureArrow}` : "—"}</span></div>` : "";
    const forecastLabel = ({ storm: "Storm Risk", elevated: "Elevated", active: "Active", quiet: "Quiet" })[forecastStatus];
    const moonStatus = wx?.moon?.moon_up_now === true ? "↑up" : wx?.moon?.moon_up_now === false ? "↓below" : "";
    const moonStatusHtml = moonStatus ? `<span class="moon-status">${escapeText(moonStatus)}</span>` : "";
    root.innerHTML = `<div class="hero-card" data-panel="weather"><div class="hero-card-label">Local Date &amp; Time</div><div class="hero-card-center"><div data-role="clock-date"></div><div data-role="clock-time"></div>${weatherChips}</div></div><div class="hero-card" data-panel="matrix"><div class="hero-card-label">Night Quality<button id="nqi-info-btn" class="nqi-info-btn" aria-label="How NQI is calculated" title="How it's calculated">i</button></div><div class="hero-card-row"><div><div class="nqi-value" style="color:${nqiColor(activeNqi.class)}">${activeNqi.value != null ? activeNqi.value.toFixed(1) : "—"}<span>/10</span></div><span class="nqi-label" style="color:${nqiColor(activeNqi.class)}">${nqiLabel(activeNqi.class)}</span></div><div class="nop-profiles">${profilesHtml}</div></div></div><div class="hero-card" data-panel="window"><div class="hero-card-label">Tonight</div><div class="window-time">Best window: ${bestWindow ? `${localTime(bestWindow.start, currentLocation.tz)} – ${localTime(bestWindow.end, currentLocation.tz)}` : "—"}</div><div class="nop-summary-text">${escapeText(buildSummary(wx, sw))}</div></div><div class="hero-card" data-panel="sunmoon"><div class="hero-card-label">Moon</div><div class="hero-card-center"><canvas id="nop-moon-canvas" width="72" height="72"></canvas></div><div class="moon-meta">Illum. ${Math.round(illumination.illuminated_percent)}% ${moonStatusHtml} ${crossings.moonrise ? `↑${localTime(crossings.moonrise, currentLocation.tz)}` : ""}${crossings.moonrise && crossings.moonset ? " " : ""}${crossings.moonset ? `↓${localTime(crossings.moonset, currentLocation.tz)}` : ""}</div></div><div class="hero-card" data-panel="solar"><div class="hero-card-label">Sun</div><div class="hero-card-center"><div class="sun-disc" style="border-color:${sunBorder}44;box-shadow:0 0 10px ${sunBorder}55,0 0 24px ${sunBorder}22"><img src="/assets/gifs/current_eit_${sunWave}.gif" alt="Sun EIT ${sunWave}"></div></div><div class="sun-times">↓ ${localTime(crossings.sunset, currentLocation.tz)} &nbsp; ↑ ${localTime(crossings.sunrise, currentLocation.tz)}</div></div><div class="hero-card" data-panel="helio"><div class="hero-card-label">Kp NOW</div><div class="hero-card-body"><span class="kp-value" style="color:${kpColor(kp)}">${kp != null ? kp.toFixed(1) : "—"}</span><span class="sw-badge ${liveStatus}">${liveLabel}</span><span class="card-note">Live 3h avg</span></div><div class="nop-scales">${scaleBadge("G", kpToG(kp))}${scaleBadge("R", rLevel)}${scaleBadge("S", sLevel)}</div></div><div class="hero-card" data-panel="helio"><div class="hero-card-label">FORECAST</div><div class="hero-card-body"><span class="kp-value" style="color:${kpColor(forecast)}">${forecast != null ? forecast.toFixed(1) : "—"} <span class="forecast-arrow">${trendArrow}</span></span><span class="sw-badge ${forecastStatus}">${forecastLabel}</span><span class="card-note">Max Kp · Next 24h</span></div><div class="nop-scales">${scaleBadge("G", forecastG)}${scaleBadge("R", rLevel)}${scaleBadge("S", sLevel)}</div></div>`;
    const panelLabels = { weather: "Local Date and Time", matrix: "Night Quality", window: "Tonight", sunmoon: "Moon", solar: "Sun", helio: "Kp forecast" };
    root.querySelectorAll(".hero-card[data-panel]").forEach(card => {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Open ${panelLabels[card.dataset.panel] || "panel"}`);
    });
    const moonCanvas = root.querySelector("#nop-moon-canvas");
    moonCanvas?.setAttribute("role", "img");
    moonCanvas?.setAttribute("aria-label", moonCanvasLabel(illumination, crossings));
    renderPanelState();
    drawMoon(root, moonCanvas, illumination.illuminated_fraction, illumination.waxing);
    renderClock();
    emit("nc:hero-data", { wx, sw, sunMoon, sunsetT: crossings.sunset, sunriseT: crossings.sunrise, moonriseT: crossings.moonrise, moonsetT: crossings.moonset, moonIllum: illumination.illuminated_percent, moonWaxing: illumination.waxing, nightHours, bestWindow, profiles, nqi, averages, activeProfile, activeMetric });
  }
  function requestData(force = false) {
    if (!alive) return Promise.resolve();
    if (inFlight && !force) return inFlight;
    if (force) { controller?.abort?.(); inFlight = null; }
    const requestSequence = ++sequence, AbortControllerRef = config.AbortController || globalThis.AbortController;
    controller = typeof AbortControllerRef === "function" ? new AbortControllerRef() : null;
    setState("loading"); renderStatus("Loading conditions…");
    const fetchTimeout = Number(config.fetchTimeout) > 0 ? Number(config.fetchTimeout) : 15000;
    if (timeoutTimer) clearTimeoutRef(timeoutTimer);
    timeoutTimer = setTimeoutRef(() => controller?.abort?.(), fetchTimeout);
    const fetchRef = config.fetch || view?.fetch || globalThis.fetch;
    const promise = config.data ? Promise.resolve(config.data) : loadConsoleData({ location: currentLocation, isDefaultSite, observerWeatherUrl: observerWeatherUrl(currentLocation), fetchImpl: fetchRef, signal: controller?.signal });
    inFlight = Promise.resolve(promise).then(result => { if (!alive || requestSequence !== sequence) return; data = result || null; render(); const hasPayload = Boolean(data?.wx || data?.sw || data?.sunMoon), weatherReady = isWeatherReady(data?.wx); setState(hasPayload ? weatherReady ? "ready" : "degraded" : "error"); }).catch(error => { if (!alive || requestSequence !== sequence) return; if (data) { render(); setState("stale"); } else { renderStatus(`Failed to load conditions${error?.message ? `: ${error.message}` : "."}`); setState("error"); } }).finally(() => { if (timeoutTimer) { clearTimeoutRef(timeoutTimer); timeoutTimer = null; } if (inFlight === promise) inFlight = null; });
    return inFlight;
  }
  function onContextChange() {
    const nextLocation = locationFromContext(context), nextKey = locationKey(nextLocation);
    currentLocation = nextLocation;
    renderClock();
    if (nextKey !== currentLocationKey) { currentLocationKey = nextKey; requestData(true); }
  }
  function updateLocation(nextLocation) {
    const nextKey = locationKey(nextLocation);
    currentLocation = { ...currentLocation, ...nextLocation };
    if (nextKey !== currentLocationKey) { currentLocationKey = nextKey; return requestData(true); }
    renderClock();
    return undefined;
  }
  function onClick(event) {
    const target = event.target, info = target?.closest?.("#nqi-info-btn"), profile = target?.closest?.(".nop-profile-btn"), card = target?.closest?.(".hero-card[data-panel]");
    if (info) { emit("nc:hero-action", { action: "nqi-info", element: info }); return; }
    if (profile) { activeProfile = profile.dataset.profile || activeProfile; render(); emit("nc:hero-action", { action: "profile-change", profile: activeProfile }); return; }
    if (card) emit("nc:hero-action", { action: "toggle-panel", panel: card.dataset.panel });
  }
  function onKeyDown(event) {
    const card = event.target?.closest?.(".hero-card[data-panel]");
    if (!card || card !== event.target || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    emit("nc:hero-action", { action: "toggle-panel", panel: card.dataset.panel });
  }

  root.classList.add("nc-hero"); root.addEventListener("click", onClick); root.addEventListener("keydown", onKeyDown); renderStatus("Loading conditions…");
  contextUnsubscribe = context?.subscribe?.(onContextChange);
  const ResizeObserverRef = config.ResizeObserver || globalThis.ResizeObserver;
  if (typeof ResizeObserverRef === "function") { resizeObserver = new ResizeObserverRef(() => renderClock()); resizeObserver.observe(root); }
  clockTimer = setIntervalRef(renderClock, 1000); requestData();
  return {
    update(patch = {}) { if (!alive || !isObject(patch)) return; if (patch.location) updateLocation(patch.location); const sourceChanged = ["fetch", "fetchTimeout", "data", "sunCalc", "AbortController"].some(key => patch[key] !== undefined), panelStateChanged = patch.activePanels !== undefined; if (panelStateChanged) activePanels = { ...(patch.activePanels || {}) }; config = { ...config, ...patch }; if (patch.data !== undefined) { data = patch.data; render(); } else if (sourceChanged) return requestData(true); else if (panelStateChanged) renderPanelState(); else renderClock(); },
    resize() { renderClock(); },
    refresh() { return requestData(true); },
    destroy() { if (destroyed) return; destroyed = true; alive = false; ++sequence; controller?.abort?.(); if (timeoutTimer) clearTimeoutRef(timeoutTimer); if (clockTimer) clearIntervalRef(clockTimer); resizeObserver?.disconnect?.(); contextUnsubscribe?.(); root.removeEventListener("click", onClick); root.removeEventListener("keydown", onKeyDown); root.classList.remove("nc-hero"); inFlight = null; },
  };
}

export const mount = mountHero;
