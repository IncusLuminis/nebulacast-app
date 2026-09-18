import { calendarDate, localMidnightUTC } from "../../../shared/zoned-date.mjs";
import { createLunarSnapshot } from "../../../shared/lunar.mjs";
/**
 * Sun Equation widget (sun_moon)
 * Sun and Moon positions use SunCalc; lunar phase uses the shared UTC source.
 */

const SUNMOON_DAYS_RANGE = 3; // today ±3 days (7 days total)

function getSunCalc() {
  const lib = window.SunCalc || (typeof SunCalc !== "undefined" ? SunCalc : null);
  if (!lib) {
    console.warn("[sun_moon] SunCalc not loaded");
  }
  return lib;
}

function formatDateLabel(baseDate, offset, tz) {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";
  return calendarDate(baseDate, tz, offset).toLocaleDateString(undefined, {
    weekday: "short", timeZone: "UTC",
  });
}

function getLocalDate(dateUtc, tz) {
  try {
    // toLocaleString with timeZone gives us local wall time; reconstruct Date from that
    const s = dateUtc.toLocaleString("en-US", { timeZone: tz || "UTC" });
    return new Date(s);
  } catch {
    return new Date(dateUtc);
  }
}

function getLocalHour(dateUtc, tz) {
  if (!dateUtc) return null;
  const local = getLocalDate(dateUtc, tz);
  return local.getHours() + local.getMinutes() / 60;
}

function formatLocalTime(dateUtc, tz) {
  if (!dateUtc) return "—";
  try {
    return new Intl.DateTimeFormat([], {
      hour: "2-digit", minute: "2-digit", hour12: false,
      timeZone: tz || "UTC"
    }).format(dateUtc);
  } catch (_) {
    const local = getLocalDate(dateUtc, tz);
    return local.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

function computeDaySamples(baseDate, offset, lat, lon, tz) {
  const SunCalcLib = getSunCalc();
  if (!SunCalcLib) return null;
  const d = calendarDate(baseDate, tz, offset);
  const midnightUTC = localMidnightUTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), tz);

  // Use local noon (UTC) for SunCalc — keeps it solidly on the right UTC calendar date
  const sunCalcDate = new Date(midnightUTC.getTime() + 12 * 3600000);

  const samples = [];
  for (let h = 0; h < 24; h++) {
    const utc = new Date(midnightUTC.getTime() + h * 3600000);
    const sunPos  = SunCalcLib.getPosition(utc, lat, lon);
    const moonPos = SunCalcLib.getMoonPosition(utc, lat, lon);
    samples.push({
      hour: h,
      time: utc.toISOString(),
      sunAlt:  (sunPos.altitude  || 0) * 180 / Math.PI,
      moonAlt: (moonPos.altitude || 0) * 180 / Math.PI
    });
  }

  const times     = SunCalcLib.getTimes(sunCalcDate, lat, lon);
  const moonTimes = SunCalcLib.getMoonTimes(sunCalcDate, lat, lon, true);
  const moonInfo = createLunarSnapshot({
    instant: sunCalcDate,
    location: { lat, lon, timezone: tz || "UTC" }
  }).lunar;

  // approximate moon culmination as max altitude sample
  let best = samples[0];
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].moonAlt > best.moonAlt) best = samples[i];
  }
  const moonCulmination = best ? new Date(best.time) : null;

  return { date: d, samples, times, moonTimes, moonInfo, moonCulmination, tz: tz || "UTC" };
}

function computeDurations(times) {
  function diffHours(a, b) {
    if (!a || !b) return null;
    return Math.max(0, (b - a) / 3600000);
  }
  function addNullable(a, b) {
    if (a == null && b == null) return null;
    return (a || 0) + (b || 0);
  }

  // Daylight: sunrise → sunset
  const day = diffHours(times.sunrise, times.sunset);

  // Astronomical night wraps around midnight: evening "night" → early-morning "nightEnd".
  // Both come from the same SunCalc date so nightEnd < night → diffHours would return 0.
  // Correct duration = 24h − span(nightEnd→night on same date).
  const astroNight = (() => {
    if (!times.night || !times.nightEnd) return null;
    const span = diffHours(times.nightEnd, times.night); // e.g. 04:12→19:23 = 15.18 h
    return span != null ? Math.max(0, 24 - span) : null;
  })();

  // Civil twilight: just the two marginal strips dawn→sunrise + sunset→dusk
  const civil = addNullable(
    diffHours(times.dawn, times.sunrise),
    diffHours(times.sunset, times.dusk)
  );

  // Astronomical twilight: nightEnd→nauticalDawn + nauticalDusk→night
  const astroTwilight = addNullable(
    diffHours(times.nightEnd, times.nauticalDawn || times.dawn),
    diffHours(times.nauticalDusk || times.dusk, times.night)
  );

  return { day, astroNight, civil, astroTwilight };
}

function formatDuration(h) {
  if (h == null) return "—";
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

function drawSunMoonCanvas(canvas, data, selectedHour) {
  if (!canvas || !data) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const widthCss = rect.width || 320;
  const heightCss = rect.height || 210;
  canvas.width = widthCss * dpr;
  canvas.height = heightCss * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = widthCss;
  const h = heightCss;
  ctx.clearRect(0, 0, w, h);

  const padding = { left: 42, right: 10, top: 10, bottom: 76 };
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;

  const sunAlts  = data.samples.map(s => s.sunAlt);
  const moonAlts = data.samples.map(s => s.moonAlt);
  // Include moon altitudes so the moon curve is never clipped at the bottom
  const minAlt = Math.min(-18, Math.min.apply(null, sunAlts), Math.min.apply(null, moonAlts)) - 2;
  const maxAlt = Math.max(60, Math.max.apply(null, sunAlts)) + 2;

  function xForHour(hr) {
    return padding.left + (hr / 23) * innerW;
  }
  function yForAlt(a) {
    const t = (a - minAlt) / (maxAlt - minAlt);
    return padding.top + (1 - t) * innerH;
  }
  function altForHour(hr) {
    const i0 = Math.max(0, Math.min(22, Math.floor(hr)));
    const i1 = i0 + 1;
    const t = hr - i0;
    return sunAlts[i0] + (sunAlts[i1] - sunAlts[i0]) * t;
  }
  function moonAltForHour(hr) {
    const i0 = Math.max(0, Math.min(22, Math.floor(hr)));
    const i1 = i0 + 1;
    const t = hr - i0;
    return moonAlts[i0] + (moonAlts[i1] - moonAlts[i0]) * t;
  }

  // Horizon line
  ctx.strokeStyle = "rgba(120,130,150,0.45)";
  ctx.lineWidth = 0.8;
  const yHorizon = yForAlt(0);
  const yBottom = padding.top + innerH;

  // ── 3 time-rows below chart ───────────────────────────────────────────────
  const ROW_SUN      = yBottom + 16;
  const ROW_MOON     = yBottom + 38;
  const ROW_TWILIGHT = yBottom + 60;

  // Thin separator lines between rows
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 0.8;
  for (const sepY of [yBottom + 7, yBottom + 28, yBottom + 49]) {
    ctx.beginPath();
    ctx.moveTo(padding.left, sepY);
    ctx.lineTo(w - padding.right, sepY);
    ctx.stroke();
  }
  ctx.restore();

  // Row labels on the left margin
  const _rowLabels = [
    { y: ROW_SUN,      text: "Sun",   color: "#ffd36b"                  },
    { y: ROW_MOON,     text: "Moon",  color: "rgba(143,182,255,0.88)"   },
    { y: ROW_TWILIGHT, text: "Twil.", color: "rgba(165,165,195,0.65)"   },
  ];
  ctx.save();
  ctx.font = "bold 7px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (const rl of _rowLabels) {
    ctx.fillStyle = rl.color;
    ctx.globalAlpha = 0.75;
    ctx.fillText(rl.text, 2, rl.y);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(padding.left, yHorizon);
  ctx.lineTo(padding.left + innerW, yHorizon);
  ctx.stroke();

  // Hour ticks
  ctx.font = "10px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(150,160,175,0.85)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let hr = 0; hr <= 23; hr += 3) {
    const x = xForHour(hr);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(120,130,150,0.45)";
    ctx.lineWidth = 0.8;
    ctx.moveTo(x, yHorizon);
    ctx.lineTo(x, yHorizon + 3);
    ctx.stroke();
    ctx.fillText(String(hr).padStart(2, "0"), x, yHorizon + 4);
  }

  const tz = data.tz || "UTC";

  // ── Twilight zone fills ──────────────────────────────────────────────────
  // Rectangular strips below the horizon between event-time markers.
  // Night→Astro→Nautical→Civil (darkest → lightest grey)
  function fillTwilightZones(times) {
    if (!times) return;
    const xL = padding.left;
    const xR = padding.left + innerW;
    function xOf(t) {
      if (!t) return null;
      const hr = getLocalHour(t, tz);
      return hr != null ? xForHour(Math.max(0, Math.min(23, hr))) : null;
    }
    const xNightEnd = xOf(times.nightEnd)    ?? xL;
    const xNautDawn = xOf(times.nauticalDawn) ?? xNightEnd;
    const xDawn     = xOf(times.dawn)         ?? xNautDawn;
    const xSunrise  = xOf(times.sunrise)      ?? xDawn;
    const xSunset   = xOf(times.sunset)       ?? xR;
    const xDusk     = xOf(times.dusk)         ?? xSunset;
    const xNautDusk = xOf(times.nauticalDusk) ?? xDusk;
    const xNight    = xOf(times.night)        ?? xNautDusk;

    const zoneH = yBottom - yHorizon;
    function fillZone(x1, x2, color) {
      if (x2 <= x1) return;
      ctx.fillStyle = color;
      ctx.fillRect(x1, yHorizon, x2 - x1, zoneH);
    }
    // Night (darkest)
    fillZone(xL,        xNightEnd, "rgba(8,  8,  22, 0.85)");
    fillZone(xNight,    xR,        "rgba(8,  8,  22, 0.85)");
    // Astronomical twilight
    fillZone(xNightEnd, xNautDawn, "rgba(14, 14, 36, 0.68)");
    fillZone(xNautDusk, xNight,    "rgba(14, 14, 36, 0.68)");
    // Nautical twilight
    fillZone(xNautDawn, xDawn,     "rgba(20, 20, 50, 0.50)");
    fillZone(xDusk,     xNautDusk, "rgba(20, 20, 50, 0.50)");
    // Civil twilight (lightest)
    fillZone(xDawn,     xSunrise,  "rgba(28, 28, 62, 0.32)");
    fillZone(xSunset,   xDusk,     "rgba(28, 28, 62, 0.32)");
  }
  fillTwilightZones(data.times);

  // ── Daylight fill (above horizon, between sunrise and sunset) ────────────
  function fillDaylight(times) {
    if (!times || !times.sunrise || !times.sunset) return;
    const srHr = getLocalHour(times.sunrise, tz);
    const ssHr = getLocalHour(times.sunset, tz);
    if (srHr == null || ssHr == null) return;
    const start = Math.max(0, Math.min(23, srHr));
    const end   = Math.max(0, Math.min(23, ssHr));
    if (end <= start) return;
    const steps = 80;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xForHour(start), yHorizon);
    for (let i = 0; i <= steps; i++) {
      ctx.lineTo(xForHour(start + (end - start) * i / steps), yHorizon);
    }
    for (let i = steps; i >= 0; i--) {
      const hr = start + (end - start) * i / steps;
      ctx.lineTo(xForHour(hr), yForAlt(Math.max(0, altForHour(hr))));
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 230, 140, 0.16)";
    ctx.fill();
    ctx.restore();
  }
  fillDaylight(data.times);

  // ── Event markers ────────────────────────────────────────────────────────
  // dir     = "up"  → dashed line from chart top down to horizon (day/moon events)
  //           "down"→ dashed line from horizon down (twilight/night events)
  // rowType = "sun" | "moon" | "twilight" → which time row to write the time into
  function drawEvent(label, timeStr, dateObj, color, isMoon, dir, rowType) {
    if (!dateObj) return;
    const hr = getLocalHour(dateObj, tz);
    if (hr == null || hr < 0 || hr >= 24) return;
    const xLine = xForHour(hr);

    const rowY = rowType === "sun" ? ROW_SUN
               : rowType === "moon" ? ROW_MOON
               : ROW_TWILIGHT;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash(isMoon ? [2, 3] : [3, 4]);

    // Main segment (above or below horizon)
    ctx.beginPath();
    if (dir === "up") {
      ctx.moveTo(xLine, padding.top);
      ctx.lineTo(xLine, yHorizon);
    } else {
      ctx.moveTo(xLine, yHorizon);
      ctx.lineTo(xLine, yHorizon + 12);
    }
    ctx.stroke();

    // Extension: thin line down to the row, lower opacity
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(xLine, (dir === "up") ? yHorizon : yHorizon + 12);
    ctx.lineTo(xLine, rowY - 5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Event name label (near its origin)
    const labelY = (dir === "up") ? padding.top + 2 : yHorizon + 2;
    ctx.save();
    ctx.font = "7.5px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.globalAlpha = 0.82;
    ctx.fillText(label, xLine + 3, labelY);
    ctx.restore();

    // Time in its row — bold, larger, readable
    if (timeStr) {
      ctx.save();
      ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.92;
      ctx.fillText(timeStr, xLine, rowY);
      ctx.restore();
    }

    ctx.restore();
  }

  // ── Sun curve ────────────────────────────────────────────────────────────
  ctx.beginPath();
  data.samples.forEach((s, idx) => {
    const x = xForHour(s.hour);
    const y = yForAlt(s.sunAlt);
    if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#ffd36b";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // ── Moon curve ───────────────────────────────────────────────────────────
  ctx.beginPath();
  data.samples.forEach((s, idx) => {
    const x = xForHour(s.hour);
    const y = yForAlt(s.moonAlt);
    if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "rgba(143,182,255,0.9)";
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // (Altitude labels on left removed — no longer needed)

  // ── Draw event markers ───────────────────────────────────────────────────
  // Exact sequence per design: Night end | Moon culm. | Astro | Civil |
  //   Sunrise | Sun culm. | Sunset | Civil | Astro | Night | Moonset
  if (data.times) {
    const t = data.times;
    drawEvent("Night end",       formatLocalTime(t.nightEnd, tz),
              t.nightEnd,                        "rgba(160,160,185,0.80)", false, "down", "twilight");
    drawEvent("Astro twilight",  formatLocalTime(t.nauticalDawn || t.nightEnd, tz),
              t.nauticalDawn || t.nightEnd,      "rgba(140,140,170,0.80)", false, "down", "twilight");
    drawEvent("Civil twilight",  formatLocalTime(t.dawn, tz),
              t.dawn,                            "rgba(180,180,205,0.85)", false, "down", "twilight");
    drawEvent("Sunrise",         formatLocalTime(t.sunrise, tz),
              t.sunrise,                         "#ffd36b",                false, "up",   "sun");
    drawEvent("Sun culmination", formatLocalTime(t.solarNoon, tz),
              t.solarNoon,                       "#ffd36b",                false, "up",   "sun");
    drawEvent("Sunset",          formatLocalTime(t.sunset, tz),
              t.sunset,                          "#ffd36b",                false, "up",   "sun");
    drawEvent("Civil twilight",  formatLocalTime(t.dusk, tz),
              t.dusk,                            "rgba(180,180,205,0.85)", false, "down", "twilight");
    drawEvent("Astro twilight",  formatLocalTime(t.nauticalDusk || t.night, tz),
              t.nauticalDusk || t.night,         "rgba(140,140,170,0.80)", false, "down", "twilight");
    drawEvent("Night",           formatLocalTime(t.night, tz),
              t.night,                           "rgba(160,160,185,0.80)", false, "down", "twilight");
  }
  if (data.moonCulmination) {
    drawEvent("Moon culm.",      formatLocalTime(data.moonCulmination, tz),
              data.moonCulmination,              "#8fb6ff",                true,  "up",   "moon");
  }
  if (data.moonTimes && data.moonTimes.set) {
    drawEvent("Moonset",         formatLocalTime(data.moonTimes.set, tz),
              data.moonTimes.set,                "#8fb6ff",                true,  "up",   "moon");
  }

  // ── Selected hour marker ─────────────────────────────────────────────────
  if (selectedHour != null) {
    const s = data.samples.find(s => s.hour === selectedHour) || data.samples[0];
    const x = xForHour(s.hour);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, yBottom);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Sun & moon emoji — double-draw trick:
    //   pass 1: large glow halo
    //   pass 2: crisp emoji on top (shadowBlur=0) → looks vivid and saturated
    ctx.globalAlpha = 1.0;
    ctx.font = "22px system-ui, Apple Color Emoji, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const ySun = yForAlt(s.sunAlt);
    ctx.shadowColor = "rgba(255, 200, 30, 1.0)";
    ctx.shadowBlur  = 22;
    ctx.fillText("🌞", x, ySun);
    ctx.shadowBlur  = 0;
    ctx.fillText("🌞", x, ySun);

    if (data.moonInfo) {
      const yMoon = yForAlt(s.moonAlt);
      ctx.shadowColor = "rgba(160, 200, 255, 1.0)";
      ctx.shadowBlur  = 18;
      ctx.fillText(data.moonInfo.emoji, x, yMoon);
      ctx.shadowBlur  = 0;
      ctx.fillText(data.moonInfo.emoji, x, yMoon);
    }

    ctx.shadowBlur  = 0;
    ctx.shadowColor = "transparent";
    ctx.restore();
  }

  // Expose coordinate helpers for the tooltip (attached to canvas element)
  canvas._smHelpers = { xForHour, yForAlt, altForHour, moonAltForHour, yHorizon, padding, innerW };
}

export function mountSunMoon(rootEl, storeApi) {
  const state = storeApi.getState();
  let baseDate = new Date();

  rootEl.innerHTML = `
    <div class="sunmoon-card">
      <div class="sunmoon-header">
        <div class="sunmoon-title">Sun Equation</div>
        <div class="sunmoon-hourline" data-role="hour-line"></div>
      </div>
      <div class="sunmoon-controls" data-role="day-controls"></div>
      <div class="sunmoon-graph-wrap">
        <canvas class="sunmoon-canvas" data-role="canvas" role="img" tabindex="0" aria-label="Sun and Moon altitude chart. Use arrow keys to inspect an hour."></canvas>
        <div class="sunmoon-tooltip" data-role="tooltip"></div>
      </div>
      <div class="sunmoon-summary">
        <div class="sunmoon-summary-item">
          <span class="sunmoon-summary-label">Day length</span>
          <span class="sunmoon-summary-value" data-role="day-length">—</span>
        </div>
        <div class="sunmoon-summary-item">
          <span class="sunmoon-summary-label">Astronomical night</span>
          <span class="sunmoon-summary-value" data-role="night-length">—</span>
        </div>
        <div class="sunmoon-summary-item">
          <span class="sunmoon-summary-label">Civil twilight</span>
          <span class="sunmoon-summary-value" data-role="civil-length">—</span>
        </div>
        <div class="sunmoon-summary-item">
          <span class="sunmoon-summary-label">Astro twilight</span>
          <span class="sunmoon-summary-value" data-role="astro-length">—</span>
        </div>
      </div>
    </div>
  `;

  const dayControlsEl = rootEl.querySelector("[data-role=day-controls]");
  const canvas        = rootEl.querySelector("[data-role=canvas]");
  const tooltipEl     = rootEl.querySelector("[data-role=tooltip]");
  const hourLineEl    = rootEl.querySelector("[data-role=hour-line]");
  const dayLenEl      = rootEl.querySelector("[data-role=day-length]");
  const nightLenEl    = rootEl.querySelector("[data-role=night-length]");
  const civilLenEl    = rootEl.querySelector("[data-role=civil-length]");
  const astroLenEl    = rootEl.querySelector("[data-role=astro-length]");

  let cachedDays = new Map(); // key: offset, value: computed data
  let selectedOffset = 0;
  let followNow = true;
  let selectedHour = Math.floor(getLocalHour(new Date(), storeApi.getState().location.tz));
  let currentData = null;

  function getLocation(currentState) {
    return {
      lat: currentState.location.lat,
      lon: currentState.location.lon,
      tz: currentState.location.tz || "UTC",
      name: currentState.location.name
    };
  }

  function ensureDay(offset) {
    const loc = getLocation(storeApi.getState());
    baseDate = new Date();
    const key = calendarDate(baseDate, loc.tz).toISOString() + "|" + offset + "|" + loc.lat.toFixed(4) + "|" + loc.lon.toFixed(4) + "|" + (loc.tz || "UTC");
    if (cachedDays.has(key)) return cachedDays.get(key);
    const data = computeDaySamples(baseDate, offset, loc.lat, loc.lon, loc.tz);
    if (cachedDays.size >= 21) cachedDays.clear();
    cachedDays.set(key, data);

    // publish sun:times event for this date
    if (data && data.times) {
      const payload = {
        type: "sun:times",
        date: data.date.toISOString().slice(0,10),
        location: { lat: loc.lat, lon: loc.lon, tz: loc.tz || "UTC", name: loc.name },
        times: {
          sunrise: Number.isFinite(data.times.sunrise?.getTime()) ? data.times.sunrise.toISOString() : null,
          sunset: Number.isFinite(data.times.sunset?.getTime()) ? data.times.sunset.toISOString() : null,
          solarNoon: Number.isFinite(data.times.solarNoon?.getTime()) ? data.times.solarNoon.toISOString() : null,
          dawn: Number.isFinite(data.times.dawn?.getTime()) ? data.times.dawn.toISOString() : null,
          dusk: Number.isFinite(data.times.dusk?.getTime()) ? data.times.dusk.toISOString() : null,
          nauticalDawn: Number.isFinite(data.times.nauticalDawn?.getTime()) ? data.times.nauticalDawn.toISOString() : null,
          nauticalDusk: Number.isFinite(data.times.nauticalDusk?.getTime()) ? data.times.nauticalDusk.toISOString() : null,
          night: Number.isFinite(data.times.night?.getTime()) ? data.times.night.toISOString() : null,
          nightEnd: Number.isFinite(data.times.nightEnd?.getTime()) ? data.times.nightEnd.toISOString() : null
        }
      };
      window.dispatchEvent(new CustomEvent("nc:sun-times", { detail: payload }));
    }

    return data;
  }

  function renderControls() {
    if (!dayControlsEl) return;
    dayControlsEl.innerHTML = "";
    for (let offset = -SUNMOON_DAYS_RANGE; offset <= SUNMOON_DAYS_RANGE; offset++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sunmoon-daychip" + (offset === selectedOffset ? " is-active" : "");
      btn.textContent = formatDateLabel(baseDate, offset, storeApi.getState().location.tz);
      btn.dataset.offset = String(offset);
      btn.addEventListener("click", () => {
        selectedOffset = offset;
        renderControls();
        update();
      });
      dayControlsEl.appendChild(btn);
    }
  }

  function update() {
    if (followNow) selectedHour = Math.floor(getLocalHour(new Date(), storeApi.getState().location.tz));
    const data = ensureDay(selectedOffset);
    if (!data) {
      if (hourLineEl) hourLineEl.textContent = "SunCalc unavailable";
      return;
    }
    currentData = data;
    const { times } = data;

    const durations = computeDurations(times);
    if (dayLenEl)   dayLenEl.textContent   = formatDuration(durations.day);
    if (nightLenEl) nightLenEl.textContent = formatDuration(durations.astroNight);
    if (civilLenEl) civilLenEl.textContent = formatDuration(durations.civil);
    if (astroLenEl) astroLenEl.textContent = formatDuration(durations.astroTwilight);

    // Header right: selected-hour status + moon phase
    if (hourLineEl) {
      const sample = data.samples.find(s => s.hour === selectedHour) || data.samples[0];
      let timeStr, sunAlt, moonAlt;

      // When viewing today's current hour: use live SunCalcLib position (exact current minute)
      // so the displayed altitude matches the map and sky widget exactly.
      const isToday   = selectedOffset === 0;
      const loc       = getLocation(storeApi.getState());
      const SC        = getSunCalc();
      const nowLocal  = new Date();
      const isNowHour = isToday && sample.hour === Math.floor(getLocalHour(nowLocal, loc.tz));
      const moonInfo = createLunarSnapshot({
        instant: isNowHour ? nowLocal : new Date(sample.time),
        location: { lat: loc.lat, lon: loc.lon, timezone: loc.tz || "UTC" }
      }).lunar;
      data.moonInfo = moonInfo;

      if (isNowHour && SC && loc.lat != null && loc.lon != null) {
        const sPos = SC.getPosition(nowLocal, loc.lat, loc.lon);
        const mPos = SC.getMoonPosition(nowLocal, loc.lat, loc.lon);
        sunAlt  = (sPos.altitude * 180 / Math.PI).toFixed(1);
        moonAlt = (mPos.altitude * 180 / Math.PI).toFixed(1);
        timeStr = nowLocal.toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit", hour12: false, timeZone: loc.tz || "UTC"
        });
      } else {
        sunAlt  = sample.sunAlt.toFixed(1);
        moonAlt = sample.moonAlt.toFixed(1);
        timeStr = String(sample.hour).padStart(2, "0") + ":00";
      }

      hourLineEl.textContent =
        `${timeStr} • Sun ${sunAlt}° • Moon ${moonAlt}° • ${moonInfo.emoji} ${moonInfo.phase_name}, illum. ${Math.round(moonInfo.illuminated_percent)}%`;
      canvas?.setAttribute?.("aria-label", `Sun and Moon altitude chart for ${timeStr}: Sun ${sunAlt} degrees, Moon ${moonAlt} degrees, ${moonInfo.phase_name}, ${Math.round(moonInfo.illuminated_percent)}% illuminated. Use arrow keys to inspect an hour.`);
    }

    drawSunMoonCanvas(canvas, data, selectedHour);
  }

  // Canvas interactions: smart tooltip + click to select hour
  if (canvas) {
    const CURVE_HIT = 13; // px proximity to show altitude tooltip

    canvas.addEventListener("mousemove", (e) => {
      if (!currentData || !tooltipEl) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const helpers = canvas._smHelpers;
      if (!helpers) return;

      const { yForAlt: yFA, altForHour: aFH, moonAltForHour: mFH, padding: pad, innerW: iW } = helpers;

      // Map cursor x → fractional hour
      const hrFrac = Math.max(0, Math.min(23, ((cx - pad.left) / iW) * 23));
      const sunAlt  = aFH(hrFrac);
      const moonAlt = mFH(hrFrac);
      const ySun    = yFA(sunAlt);
      const yMoon   = yFA(moonAlt);

      let text;
      if (Math.abs(cy - ySun) < CURVE_HIT) {
        text = `☀️ ${sunAlt.toFixed(1)}°`;
      } else if (Math.abs(cy - yMoon) < CURVE_HIT) {
        text = `${currentData.moonInfo ? currentData.moonInfo.emoji : "🌙"} ${moonAlt.toFixed(1)}°`;
      } else if (sunAlt > 0) {
        text = "Day";
      } else if (sunAlt > -6) {
        text = "Civil twilight";
      } else if (sunAlt > -12) {
        text = "Nautical twilight";
      } else if (sunAlt > -18) {
        text = "Astronomical twilight";
      } else {
        text = "Night";
      }

      tooltipEl.textContent = text;
      tooltipEl.style.left = (cx + 14) + "px";
      tooltipEl.style.top  = (cy - 30) + "px";
      tooltipEl.style.display = "block";
    });

    canvas.addEventListener("mouseleave", () => {
      if (tooltipEl) tooltipEl.style.display = "none";
    });

    canvas.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      followNow = false;
      if (event.key === "ArrowLeft") selectedHour = Math.max(0, selectedHour - 1);
      if (event.key === "ArrowRight") selectedHour = Math.min(23, selectedHour + 1);
      if (event.key === "Home") selectedHour = 0;
      if (event.key === "End") selectedHour = 23;
      update();
    });

    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const w = rect.width || 1;
      const hr = Math.round((x / w) * 23);
      followNow = false;
      selectedHour = Math.max(0, Math.min(23, hr));
      update();
    });
  }

  renderControls();
  update();

  // Re-render at correct pixel density after layout is complete.
  // getBoundingClientRect() can return 0-width on the first synchronous call,
  // so we observe the canvas and redraw whenever it gains a valid width.
  let ro;
  if (typeof ResizeObserver !== "undefined" && canvas) {
    ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 0 && currentData) {
        drawSunMoonCanvas(canvas, currentData, selectedHour);
      }
    });
    ro.observe(canvas);
  } else if (canvas) {
    // Fallback: double rAF ensures layout has settled
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (currentData) drawSunMoonCanvas(canvas, currentData, selectedHour);
    }));
  }

  // React to location changes from global store
  const unsubscribe = storeApi.subscribe(() => {
    cachedDays.clear();
    renderControls();
    update();
  });
  const timer = setInterval(update, 60000);
  return () => { clearInterval(timer); ro?.disconnect(); unsubscribe?.(); };
}
