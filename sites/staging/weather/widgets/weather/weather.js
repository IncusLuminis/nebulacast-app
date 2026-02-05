// URL from config (set by weather/index.html)
const ASTRO_WEATHER_URL = "/weather/daily_weather.json";
const LOCATIONS_INDEX_URL = window.__WEATHER_POC_CONFIG && window.__WEATHER_POC_CONFIG.locationsIndexUrl;
const LOCATION_DATA_BASE = window.__WEATHER_POC_CONFIG && window.__WEATHER_POC_CONFIG.locationDataBase;
const API_ASTRO_WEATHER_URL = "/api/astro-weather";


let weatherData = null;
let activeProfile = "default";
let locationsIndex = null;
let currentLocationId = null;
let currentLocationCoords = null; // {lat, lon, tz} for API mode
let isFetchingWeather = false;
let lastWeatherFetchTime = 0;
const WEATHER_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Helper: escape HTML
function escapeHtml(s) {
  if (!s) return "";
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

// Helper: format time (HH:00 for hourly cards)
function formatTime(isoStr) {
  const d = parseISO(isoStr);
  if (!d) return "—";
  // Format as HH:00 (always show :00 for hourly forecasts)
  const h = d.getHours();
  return String(h).padStart(2, "0") + ":00";
}

// Helper: format time for best window (h:mm AM/PM)
function formatTimeShort(isoStr) {
  const d = parseISO(isoStr);
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Helper: format date/time for "Updated" (MMM D, h:mm AM/PM)
function formatDateTime(isoStr) {
  if (!isoStr) return "unknown";
  const d = parseISO(isoStr);
  if (!d) return "unknown";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// Helper: format precip_prob (handle both fraction and percentage)
function formatPrecipProb(prob) {
  if (prob === null || prob === undefined) return 0;
  if (prob <= 1) return Math.round(prob * 100);
  return Math.round(prob);
}

// Helper: get observing label from score
function labelByScore(s) {
  if (s == null) return "No data";
  if (s >= 70) return "Good observing";
  if (s >= 50) return "Fair observing";
  return "Poor observing";
}

// Helper: parse ISO date safely
function parseISO(d) {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t;
}

// Helper: find nearest hour to now (returns hour, dt, and index i0)
function findNearestHour(hours) {
  if (!hours || !hours.length) return { hour: null, dt: null, idx: 0 };
  const now = Date.now();
  let best = null;
  let bestDt = null;
  let bestIdx = 0;
  let bestDiff = Infinity;

  hours.forEach((h, i) => {
    const dt = parseISO(h.time);
    if (!dt) return;
    const diff = Math.abs(dt.getTime() - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = h;
      bestDt = dt;
      bestIdx = i;
    }
  });
  return { hour: best, dt: bestDt, idx: bestIdx };
}

// Helper: format values according to rules
function formatScore(score) {
  return Math.round(score ?? 0);
}

function scoreRank(score) {
  if (score == null || score === undefined) return "—";
  const n = Number(score);
  if (Number.isNaN(n)) return "—";
  if (n >= 85) return "EXCELLENT";
  if (n >= 70) return "GOOD";
  if (n >= 55) return "FAIR";
  if (n >= 35) return "POOR";
  return "BAD";
}

function formatCloud(v) {
  return isValidValue(v) ? Math.round(v) : 0;
}

function formatPrecipMm(v) {
  if (!isValidValue(v) || v < 0.1) return 0;
  return Math.round(v * 10) / 10;
}

// Approximate astronomical night using location timezone (until JSON exposes explicit twilight times)
function isAstronomicalNight(hour) {
  if (!hour || !hour.time) return false;
  const dt = parseISO(hour.time);
  if (!dt) return false;

  const tz = weatherData?.location?.tz || null;
  let h;
  if (typeof Intl !== "undefined" && tz) {
    try {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "numeric",
        hour12: false
      });
      const parts = formatter.formatToParts(dt);
      const hourPart = parts.find(p => p.type === "hour");
      h = hourPart ? parseInt(hourPart.value, 10) : dt.getHours();
    } catch (e) {
      h = dt.getHours();
    }
  } else {
    h = dt.getHours();
  }
  // Heuristic: treat ~astronomical night as 20:00–05:00 local
  return (h >= 20 || h < 5);
}

// Pick weather icon by hour (JSON): fog → thunderstorm → night → cloud → partly-cloudy → sun
function pickIcon(hour) {
  if (!hour) return "sun.svg";
  const vis = hour.visibility_m;
  if (vis != null && vis !== -9999 && vis < 2000) return "fog.svg";
  const prob = (hour.precip_prob != null && hour.precip_prob <= 1) ? hour.precip_prob * 100 : (hour.precip_prob ?? 0);
  const mm = hour.precip_mm != null && hour.precip_mm !== -9999 ? hour.precip_mm : 0;
  if (prob >= 60 && mm > 0) return "thunderstorm.svg";
  const c = (hour.cloud_total != null && hour.cloud_total <= 1) ? hour.cloud_total * 100 : (hour.cloud_total ?? 0);
  if (isAstronomicalNight(hour) && c < 20) return "night.svg";
  if (c >= 80) return "cloud.svg";
  if (c >= 30) return "partly-cloudy.svg";
  return "sun.svg";
}

// Heads-up: compute from hours[] and i0 (index of nearest hour to now)
// Returns full string for heads-up row; use buildHeadsUpMessages() for bullet list in explain panel.
function buildHeadsUpMessages(hours, i0) {
  if (!hours || hours.length === 0) return [];
  const len = hours.length;
  const end24 = Math.min(i0 + 24, len - 1);
  const windowHours = hours.slice(i0, end24 + 1);

  const p0 = hours[i0]?.pressure_hpa;
  const i6 = Math.min(i0 + 6, len - 1);
  const p6 = hours[i6]?.pressure_hpa;
  let pressureTrend = null;
  if (p0 != null && p6 != null && isValidValue(p0) && isValidValue(p6)) {
    pressureTrend = Math.round((p6 - p0) * 10) / 10;
  }

  let windPeak = null, windPeakTime = null;
  windowHours.forEach(h => {
    const w = h.wind_m_s;
    if (w != null && isValidValue(w) && (windPeak == null || w > windPeak)) {
      windPeak = w;
      windPeakTime = h.time;
    }
  });

  let cloudPeak = null, cloudPeakTime = null;
  windowHours.forEach(h => {
    const c = h.cloud_total != null && h.cloud_total <= 1 ? h.cloud_total * 100 : (h.cloud_total ?? 0);
    if (isValidValue(h.cloud_total) && (cloudPeak == null || c > cloudPeak)) {
      cloudPeak = c;
      cloudPeakTime = h.time;
    }
  });

  let fogRisk = false;
  const visValues = windowHours.map(h => h.visibility_m).filter(v => v != null && v !== -9999);
  if (visValues.length > 0 && Math.min(...visValues) < 2000) fogRisk = true;
  if (!fogRisk) {
    fogRisk = windowHours.some(h => {
      const vis = h.visibility_m;
      const low = (h.cloud_low != null && h.cloud_low <= 1) ? h.cloud_low * 100 : (h.cloud_low ?? 0);
      return vis != null && vis !== -9999 && vis < 5000 && low >= 80;
    });
  }

  const messages = [];
  if (cloudPeak != null && cloudPeak >= 60 && cloudPeakTime) {
    const t = formatTime(cloudPeakTime);
    if (cloudPeak >= 80) messages.push(`Clouds likely after ${t}`);
    else messages.push(`Clouds increase after ${t}`);
  }
  if (windPeak != null && windPeak >= 7 && windPeakTime && messages.length < 3) {
    const t = formatTime(windPeakTime);
    const w = Math.round(windPeak * 10) / 10;
    if (windPeak >= 10) messages.push(`Wind peaks ${t} (~${w} m/s)`);
    else messages.push(`Breezy around ${t} (${w} m/s)`);
  }
  if (fogRisk && messages.length < 3) messages.push("Possible haze/fog late");
  if (pressureTrend != null && messages.length < 3) {
    const absTrend = Math.abs(pressureTrend);
    if (pressureTrend <= -3) messages.push(`Pressure falling fast (${pressureTrend} hPa/6h)`);
    else if (pressureTrend <= -1.5) messages.push(`Pressure falling (${pressureTrend} hPa/6h)`);
    else if (pressureTrend >= 3) messages.push(`Pressure rising fast (+${absTrend} hPa/6h)`);
    else if (pressureTrend >= 1.5) messages.push(`Pressure rising (+${absTrend} hPa/6h)`);
  }
  return messages;
}

function buildHeadsUp(hours, i0) {
  const messages = buildHeadsUpMessages(hours, i0);
  if (messages.length === 0) return "Heads-up: Stable tonight";
  return "Heads-up: " + messages.join(" • ");
}

function formatPressure(v) {
  return isValidValue(v) ? Math.round(v) : null;
}

function formatWind(v) {
  return isValidValue(v) ? Math.round(v * 10) / 10 : null;
}

function formatVisibility(v) {
  if (!isValidValue(v)) return null;
  const km = v / 1000;
  if (km >= 10) return Math.round(km);
  return Math.round(km * 10) / 10;
}

function formatSeeing(v) {
  return isValidValue(v) ? v : "—";
}

function formatTransparency(v) {
  return isValidValue(v) ? v : "—";
}

// Short labels for seeing (1=best .. 5=worst) and transparency (1=best .. 4/5=worst)
function seeingLabel(s) {
  if (s == null || Number.isNaN(s)) return "—";
  const n = Number(s);
  if (n <= 1) return "Ex";
  if (n <= 2) return "Good";
  if (n <= 3) return "Fair";
  if (n <= 4) return "Poor";
  return "Bad";
}
function transparencyLabel(t) {
  if (t == null || Number.isNaN(t)) return "—";
  const n = Number(t);
  if (n <= 1) return "Ex";
  if (n <= 2) return "Good";
  if (n <= 3) return "Fair";
  return "Poor";
}

// Next 24h window and derived metrics (for chips)
function computeNext24AndDerivatives(hours, idx) {
  const out = { next24: [], deltaP6h: null, cloudPeak: null, cloudPeakTime: null, windPeak: null, windPeakTime: null, rainRisk: null, rainRiskTime: null, bestScore: null, bestTime: null, goodHrs: 0 };
  if (!hours || hours.length === 0 || idx < 0) return out;
  const next24 = hours.slice(idx, Math.min(idx + 24, hours.length));
  out.next24 = next24;
  const nowP = hours[idx]?.pressure_hpa;
  const i6 = Math.min(idx + 6, hours.length - 1);
  const p6 = hours[i6]?.pressure_hpa;
  if (nowP != null && p6 != null && isValidValue(nowP) && isValidValue(p6)) {
    out.deltaP6h = Math.round((p6 - nowP) * 10) / 10;
  }
  next24.forEach(h => {
    const c = h.cloud_total != null && h.cloud_total <= 1 ? h.cloud_total * 100 : (h.cloud_total ?? 0);
    if (isValidValue(h.cloud_total) && (out.cloudPeak == null || c > out.cloudPeak)) {
      out.cloudPeak = Math.round(c);
      out.cloudPeakTime = h.time;
    }
    const w = h.wind_m_s;
    if (w != null && isValidValue(w) && (out.windPeak == null || w > out.windPeak)) {
      out.windPeak = Math.round(w * 10) / 10;
      out.windPeakTime = h.time;
    }
    const prob = (h.precip_prob != null && h.precip_prob <= 1) ? h.precip_prob * 100 : (h.precip_prob ?? 0);
    if (out.rainRisk == null || prob > out.rainRisk) {
      out.rainRisk = Math.round(prob);
      out.rainRiskTime = h.time;
    }
    const sc = getHourScore(h);
    if (sc != null && (out.bestScore == null || sc > out.bestScore)) {
      out.bestScore = Math.round(sc);
      out.bestTime = h.time;
    }
    if (sc != null && sc >= 70) out.goodHrs += 1;
  });
  return out;
}

// Helper: km from meters (for display)
function kmFromM(m) {
  if (!isValidValue(m)) return null;
  const km = m / 1000;
  if (km >= 10000) return Math.round(km);
  return Math.round(km * 10) / 10;
}


// L1 chips: Cloud, Temp (when present), Wind, Vis, Precip, Seeing, Trans
const L1_CHIPS = [
  { ico: "☁️", label: "Cloud", key: "cloud" },
  { ico: "🌡", label: "Temp", key: "temp" },
  { ico: "💨", label: "Wind", key: "wind" },
  { ico: "👁️", label: "Vis", key: "vis" },
  { ico: "🌧️", label: "Precip", key: "precip" },
  { ico: "🔭", label: "Seeing", key: "seeing" },
  { ico: "✨", label: "Trans", key: "transparency" },
];

function renderNowFactors(root, h, hours) {
  if (!h) return;
  const cloud = formatCloud(h.cloud_total);
  const tempC = h.temp_c != null && isValidValue(h.temp_c) ? Math.round(Number(h.temp_c)) : null;
  const wind = formatWind(h.wind_m_s);
  const visKm = h.visibility_km != null ? (typeof h.visibility_km === "number" ? Math.round(h.visibility_km * 10) / 10 : h.visibility_km) : kmFromM(h.visibility_m);
  const precipProb = formatPrecipProb(h.precip_prob);
  const precipMm = formatPrecipMm(h.precip_mm);
  const precipVal = (h.precip_prob != null && h.precip_prob !== undefined) ? `${precipProb}%` : (precipMm != null ? `${precipMm} mm` : "—");
  const seeing = seeingLabel(h.seeing);
  const trans = transparencyLabel(h.transparency);

  const vals = {
    cloud: `${cloud}%`,
    temp: tempC != null ? `${tempC}°C` : "—",
    wind: wind != null ? `${wind} m/s` : "—",
    vis: visKm != null ? `${visKm} km` : "—",
    precip: precipVal,
    seeing: String(seeing),
    transparency: String(trans),
  };

  const chipsToShow = L1_CHIPS.filter(x => x.key !== "temp" || tempC != null);
  root.innerHTML = chipsToShow.map(x => `
    <span class="chip now-pill" data-key="${escapeHtml(x.key)}" title="Click for details" aria-label="${escapeHtml(x.label)}: ${escapeHtml(vals[x.key] || "—")}">${x.ico} <b>${escapeHtml(vals[x.key] || "—")}</b></span>
  `).join("");

  if (!root._chipClickBound) {
    root._chipClickBound = true;
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-role=\"explain-toggle\"]")) return;
      const chip = e.target.closest(".chip");
      const key = chip?.dataset?.key;
      if (key) openChipSheet(key, chip);
    });
  }
}

// --- Chip popover: helpers ---
function sliceNext(hours, nowIndex, n) {
  if (!hours || nowIndex < 0) return [];
  return hours.slice(nowIndex, Math.min(nowIndex + n, hours.length));
}
function argMax(arr, getter) {
  if (!arr || arr.length === 0) return -1;
  let best = 0;
  let bestVal = getter(arr[0]);
  for (let i = 1; i < arr.length; i++) {
    const v = getter(arr[i]);
    if (v != null && (bestVal == null || v > bestVal)) { best = i; bestVal = v; }
  }
  return bestVal != null ? best : -1;
}
function argMin(arr, getter) {
  if (!arr || arr.length === 0) return -1;
  let best = 0;
  let bestVal = getter(arr[0]);
  for (let i = 1; i < arr.length; i++) {
    const v = getter(arr[i]);
    if (v != null && (bestVal == null || v < bestVal)) { best = i; bestVal = v; }
  }
  return bestVal != null ? best : -1;
}
function fmtTime(isoStr) {
  const d = parseISO(isoStr);
  if (!d) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// --- Chip popover: content per key (Now + Next 24h) ---
function renderChipContent(key, nowHour, next24, allHours, nowIndex) {
  const h = nowHour;
  const rows = (label, val) => `<div class="row"><span class="label">${escapeHtml(label)}</span>${escapeHtml(String(val))}</div>`;
  let html = "";
  if (key === "cloud") {
    const c = h.cloud_total != null ? Math.round(h.cloud_total) : "—";
    const low = h.cloud_low != null ? Math.round(h.cloud_low) : "—";
    const mid = h.cloud_mid != null ? Math.round(h.cloud_mid) : "—";
    const high = h.cloud_high != null ? Math.round(h.cloud_high) : "—";
    html += rows("Now", `${c}% (low ${low}% / mid ${mid}% / high ${high}%)`);
    if (next24.length > 0) {
      const imax = argMax(next24, x => x.cloud_total);
      const imin = argMin(next24, x => x.cloud_total);
      const maxVal = imax >= 0 && next24[imax].cloud_total != null ? Math.round(next24[imax].cloud_total) : "—";
      const minVal = imin >= 0 && next24[imin].cloud_total != null ? Math.round(next24[imin].cloud_total) : "—";
      html += rows("Next 24h max", maxVal + "% @ " + (imax >= 0 ? fmtTime(next24[imax].time) : "—"));
      html += rows("Next 24h min", minVal + "% @ " + (imin >= 0 ? fmtTime(next24[imin].time) : "—"));
    }
  } else if (key === "temp") {
    const t = h.temp_c != null && isValidValue(h.temp_c) ? Math.round(Number(h.temp_c)) : "—";
    html += rows("Now", t !== "—" ? t + "°C" : "—");
    if (next24.length > 0) {
      const withTemp = next24.filter(x => x.temp_c != null && isValidValue(x.temp_c));
      if (withTemp.length > 0) {
        const imax = argMax(withTemp, x => x.temp_c);
        const imin = argMin(withTemp, x => x.temp_c);
        const maxVal = imax >= 0 ? Math.round(withTemp[imax].temp_c) : "—";
        const minVal = imin >= 0 ? Math.round(withTemp[imin].temp_c) : "—";
        html += rows("Next 24h max", maxVal !== "—" ? maxVal + "°C" : "—");
        html += rows("Next 24h min", minVal !== "—" ? minVal + "°C" : "—");
      }
    }
  } else if (key === "wind") {
    const w = h.wind_m_s != null ? (Math.round(h.wind_m_s * 10) / 10) : "—";
    html += rows("Now", w + " m/s");
    if (next24.length > 0) {
      const imax = argMax(next24, x => x.wind_m_s);
      const peakVal = imax >= 0 && next24[imax].wind_m_s != null ? (Math.round(next24[imax].wind_m_s * 10) / 10) : "—";
      html += rows("Next 24h peak", peakVal + " m/s @ " + (imax >= 0 ? fmtTime(next24[imax].time) : "—"));
      const next6 = next24.slice(0, 6);
      const sum = next6.reduce((s, x) => s + (x.wind_m_s != null ? x.wind_m_s : 0), 0);
      const cnt = next6.filter(x => x.wind_m_s != null).length;
      const avg6 = cnt ? (Math.round((sum / cnt) * 10) / 10) : "—";
      html += rows("Next 6h avg", avg6 + " m/s");
    }
  } else if (key === "vis") {
    const v = h.visibility_m != null ? (h.visibility_km != null ? h.visibility_km : (h.visibility_m / 1000)) : null;
    const vKm = v != null ? (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) : "—";
    html += rows("Now", vKm + " km");
    if (next24.length > 0) {
      const imin = argMin(next24, x => x.visibility_m != null ? x.visibility_m : Infinity);
      const minM = imin >= 0 && next24[imin].visibility_m != null ? next24[imin].visibility_m : null;
      const minKm = minM != null ? (minM >= 10000 ? Math.round(minM / 1000) : Math.round(minM / 1000 * 10) / 10) : "—";
      html += rows("Next 24h min", minKm + " km @ " + (imin >= 0 ? fmtTime(next24[imin].time) : "—"));
      const haze = minM != null ? (minM < 5000 ? "High" : minM < 10000 ? "Medium" : "Low") : "—";
      html += rows("Haze risk", haze);
    }
  } else if (key === "precip") {
    const prob = h.precip_prob != null ? (h.precip_prob > 1 ? Math.round(h.precip_prob) : Math.round(h.precip_prob * 100)) : null;
    const mm = h.precip_mm != null ? (Math.round(h.precip_mm * 10) / 10) : null;
    const nowStr = (prob != null ? prob + "%" : "") + (prob != null && mm != null ? " · " : "") + (mm != null ? mm + " mm" : "") || "—";
    html += rows("Now", nowStr);
    if (next24.length > 0) {
      const imax = argMax(next24, x => (x.precip_prob != null && x.precip_prob <= 1 ? x.precip_prob * 100 : x.precip_prob));
      const maxProb = imax >= 0 && next24[imax].precip_prob != null ? (next24[imax].precip_prob > 1 ? Math.round(next24[imax].precip_prob) : Math.round(next24[imax].precip_prob * 100)) : "—";
      html += rows("Next 24h max prob", maxProb + "% @ " + (imax >= 0 ? fmtTime(next24[imax].time) : "—"));
      const sumMm = next24.reduce((s, x) => s + (x.precip_mm != null ? x.precip_mm : 0), 0);
      html += rows("Next 24h total", (Math.round(sumMm * 10) / 10) + " mm");
    }
  } else if (key === "pressure") {
    const p = h.pressure_hpa != null ? Math.round(h.pressure_hpa) : "—";
    html += rows("Now", p + " hPa");
    const hours = allHours || [];
    const idx = nowIndex >= 0 ? nowIndex : hours.findIndex(x => x && x.time === h.time);
    if (idx >= 0 && idx + 6 < hours.length) {
      const p0 = hours[idx].pressure_hpa;
      const p6 = hours[idx + 6].pressure_hpa;
      if (p0 != null && p6 != null) {
        const trend = Math.round((p6 - p0) * 10) / 10;
        html += rows("Trend 6h", (trend >= 0 ? "+" : "") + trend + " hPa " + (trend > 0 ? "↑ Rising" : trend < 0 ? "↓ Falling" : ""));
      }
    }
    if (next24.length > 0) {
      const imax = argMax(next24, x => x.pressure_hpa);
      const imin = argMin(next24, x => x.pressure_hpa);
      const maxP = imax >= 0 && next24[imax].pressure_hpa != null ? Math.round(next24[imax].pressure_hpa) : "—";
      const minP = imin >= 0 && next24[imin].pressure_hpa != null ? Math.round(next24[imin].pressure_hpa) : "—";
      html += rows("Next 24h max", maxP + " hPa @ " + (imax >= 0 ? fmtTime(next24[imax].time) : "—"));
      html += rows("Next 24h min", minP + " hPa @ " + (imin >= 0 ? fmtTime(next24[imin].time) : "—"));
    }
  } else if (key === "seeing") {
    const val = h.seeing != null ? h.seeing : "—";
    const lab = seeingLabel(h.seeing);
    html += rows("Now", val + (lab !== "—" ? " (" + lab + ")" : ""));
    if (next24.length > 0) {
      const imin = argMin(next24, x => x.seeing != null ? x.seeing : Infinity);
      const imax = argMax(next24, x => x.seeing);
      const best = imin >= 0 && next24[imin].seeing != null ? next24[imin].seeing : "—";
      const worst = imax >= 0 && next24[imax].seeing != null ? next24[imax].seeing : "—";
      html += rows("Next 24h best", best + " @ " + (imin >= 0 ? fmtTime(next24[imin].time) : "—"));
      html += rows("Next 24h worst", worst + " @ " + (imax >= 0 ? fmtTime(next24[imax].time) : "—"));
    }
  } else if (key === "transparency") {
    const val = h.transparency != null ? h.transparency : "—";
    const lab = transparencyLabel(h.transparency);
    html += rows("Now", val + (lab !== "—" ? " (" + lab + ")" : ""));
    if (next24.length > 0) {
      const imin = argMin(next24, x => x.transparency != null ? x.transparency : Infinity);
      const imax = argMax(next24, x => x.transparency);
      const best = imin >= 0 && next24[imin].transparency != null ? next24[imin].transparency : "—";
      const worst = imax >= 0 && next24[imax].transparency != null ? next24[imax].transparency : "—";
      html += rows("Next 24h best", best + " @ " + (imin >= 0 ? fmtTime(next24[imin].time) : "—"));
      html += rows("Next 24h worst", worst + " @ " + (imax >= 0 ? fmtTime(next24[imax].time) : "—"));
    }
  } else {
    html = rows("Now", "—");
  }
  return html || rows("—", "—");
}

const CHIP_TITLES = { cloud: "☁️ Clouds", temp: "🌡 Temperature", wind: "💨 Wind", vis: "👁️ Visibility", precip: "🌧️ Precipitation", pressure: "🧭 Pressure", seeing: "🔭 Seeing", transparency: "✨ Transparency" };

function openChipSheet(key, chipEl) {
  const overlay = document.getElementById("chipOverlay");
  const sheet = document.getElementById("chipSheet");
  const titleEl = document.getElementById("chipSheetTitle");
  const bodyEl = document.getElementById("chipSheetBody");
  if (!overlay || !sheet || !titleEl || !bodyEl) return;
  const hours = weatherData?.hours || [];
  const { hour: nowHour, idx: nowIndex } = findNearestHour(hours);
  const next24 = sliceNext(hours, nowIndex >= 0 ? nowIndex : 0, 24);
  titleEl.textContent = CHIP_TITLES[key] || key;
  bodyEl.innerHTML = renderChipContent(key, nowHour || {}, next24, hours, nowIndex >= 0 ? nowIndex : 0);
  overlay.classList.add("active");

  requestAnimationFrame(() => {
    const container = document.getElementById("poc-weather");
    const containerRect = container ? container.getBoundingClientRect() : null;
    const rect = chipEl ? chipEl.getBoundingClientRect() : null;
    const gap = 8;
    const margin = 12;
    const minLeft = containerRect ? containerRect.left + margin : margin;
    const minTop = containerRect ? containerRect.top + margin : margin;
    const maxRight = containerRect ? containerRect.right - margin : (window.innerWidth - margin);
    const maxBottom = containerRect ? containerRect.bottom - margin : (window.innerHeight - margin);
    let top = rect ? rect.bottom + gap : minTop;
    let left = rect ? rect.left : minLeft;
    const sheetRect = sheet.getBoundingClientRect();
    if (rect) {
      if (top + sheetRect.height > maxBottom) {
        top = rect.top - sheetRect.height - gap;
      }
      if (top < minTop) top = minTop;
      if (top + sheetRect.height > maxBottom) top = maxBottom - sheetRect.height;
      if (left + sheetRect.width > maxRight) left = maxRight - sheetRect.width;
      if (left < minLeft) left = minLeft;
    } else {
      top = minTop;
      left = minLeft;
    }
    sheet.style.top = top + "px";
    sheet.style.left = left + "px";
  });
}

function closeChipSheet() {
  const overlay = document.getElementById("chipOverlay");
  if (overlay) overlay.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("chipOverlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeChipSheet(); });
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.getElementById("chipOverlay")?.classList.contains("active")) closeChipSheet(); });

  // Factor tooltip (breakdown (i) icons — one tooltip at a time)
  const factorTooltip = document.getElementById("factorTooltip");
  const factorTooltipTitle = document.getElementById("factorTooltipTitle");
  const factorTooltipBody = document.getElementById("factorTooltipBody");
  function closeFactorTooltip() {
    if (factorTooltip) {
      factorTooltip.classList.remove("visible");
      factorTooltip.setAttribute("aria-hidden", "true");
    }
  }
  function openFactorTooltip(key, anchorEl) {
    if (!factorTooltip || !key) return;
    const tip = typeof TOOLTIPS !== "undefined" && TOOLTIPS[key];
    if (!tip) return;
    if (factorTooltipTitle) factorTooltipTitle.textContent = tip.title;
    if (factorTooltipBody) {
      const bulletsHtml = (tip.bullets && tip.bullets.length)
        ? "<ul class=\"factor-tooltip-bullets\">" + tip.bullets.map(b => "<li>" + escapeHtml(b) + "</li>").join("") + "</ul>"
        : "";
      factorTooltipBody.innerHTML =
        (tip.what ? "<div class=\"factor-tooltip-what\">" + escapeHtml(tip.what) + "</div>" : "") +
        (tip.affects ? "<div class=\"factor-tooltip-affects\">" + escapeHtml(tip.affects) + "</div>" : "") +
        bulletsHtml +
        (tip.source ? "<div class=\"factor-tooltip-source\">Data source: " + escapeHtml(tip.source) + "</div>" : "");
    }
    factorTooltip.classList.add("visible");
    factorTooltip.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      const rect = anchorEl.getBoundingClientRect();
      const ttRect = factorTooltip.getBoundingClientRect();
      const margin = 8;
      let top = rect.bottom + margin;
      let left = rect.left;
      if (top + ttRect.height > window.innerHeight - margin) top = rect.top - ttRect.height - margin;
      if (left + ttRect.width > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - ttRect.width - margin);
      if (left < margin) left = margin;
      factorTooltip.style.top = top + "px";
      factorTooltip.style.left = left + "px";
    });
  }
  document.addEventListener("click", (e) => {
    const infoBtn = e.target.closest(".factor-info");
    const key = infoBtn ? (infoBtn.dataset.tooltipKey || infoBtn.dataset.factor) : null;
    if (infoBtn && key) {
      e.preventDefault();
      if (factorTooltip && factorTooltip.classList.contains("visible") && factorTooltip.dataset.currentFactor === key) {
        closeFactorTooltip();
        delete factorTooltip.dataset.currentFactor;
        return;
      }
      factorTooltip.dataset.currentFactor = key;
      openFactorTooltip(key, infoBtn);
      return;
    }
    if (factorTooltip && factorTooltip.classList.contains("visible") && !factorTooltip.contains(e.target)) {
      closeFactorTooltip();
      delete factorTooltip.dataset.currentFactor;
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && factorTooltip && factorTooltip.classList.contains("visible")) {
      closeFactorTooltip();
      delete factorTooltip.dataset.currentFactor;
    }
  });
});

// Build sparkline (compact mini-chart)
function buildSpark(values, { min, max, maxBars = 24, invert = false } = {}) {
  if (!values || values.length === 0) return "";
  
  // Limit to maxBars
  const limited = values.slice(0, maxBars);
  
  // Auto-detect min/max if not provided
  const validValues = limited.filter(v => v != null && !Number.isNaN(v));
  if (validValues.length === 0) {
    // All missing - render empty bars
    return limited.map(() => '<span class="sparkline-bar missing"></span>').join("");
  }
  
  const actualMin = min != null ? min : Math.min(...validValues);
  const actualMax = max != null ? max : Math.max(...validValues);
  const range = actualMax - actualMin || 1;
  
  return limited.map(v => {
    if (v == null || Number.isNaN(v)) {
      return '<span class="sparkline-bar missing"></span>';
    }
    
    // Normalize value (0..1)
    let normalized = (v - actualMin) / range;
    if (invert) normalized = 1 - normalized;
    
    // Height: 10-18px
    const height = Math.round(10 + normalized * 8);
    
    // Determine color class based on normalized value
    let colorClass = "";
    if (!invert) {
      if (normalized >= 0.7) colorClass = "good";
      else if (normalized >= 0.4) colorClass = "mid";
      else colorClass = "bad";
    }
    
    // Opacity for "less important" points (lower values)
    const opacity = normalized < 0.3 ? 0.3 : 0.7;
    
    return `<span class="sparkline-bar ${colorClass}" style="height:${height}px;opacity:${opacity}"></span>`;
  }).join("");
}

// Helper: score color class
function scoreClass(score) {
  if (score >= 70) return "good";
  if (score >= 50) return "mid";
  return "bad";
}



const PROFILE_IDS = ["default", "visual", "broadband", "planetary"];
function getActiveProfile() {
  const profiles = Array.isArray(weatherData?.profiles) && weatherData.profiles.length
    ? ["default", ...weatherData.profiles.filter(p => p !== "default")]
    : PROFILE_IDS;
  if (!profiles.includes(activeProfile)) {
    const def = typeof weatherData?.default_profile === "string" ? weatherData.default_profile : "default";
    activeProfile = profiles.includes(def) ? def : profiles[0];
  }
  return activeProfile;
}
// Compute profile scores from raw hour data (same weights as Python fetch_astro_weather.py)
// so the profile switcher works even when JSON has no profile_scores.
function computeProfileScores(hour) {
  const clamp01 = (v) => {
    if (v == null || Number.isNaN(v)) return 0;
    const x = Number(v);
    return Math.max(0, Math.min(1, x > 1 ? x / 100 : x));
  };
  const clearFromCloud = (val) => clamp01(1 - (val != null && val > 1 ? val / 100 : val ?? 0));
  const c_total = clearFromCloud(hour.cloud_total);
  const c_high = clearFromCloud(hour.cloud_high);
  let p = 1 - clamp01(hour.precip_prob != null && hour.precip_prob > 1 ? hour.precip_prob / 100 : hour.precip_prob ?? 0);
  if (hour.precip_mm && hour.precip_mm > 0) p = Math.max(0, p - 0.15);
  const w = clamp01(hour.wind_m_s != null ? 1 - Number(hour.wind_m_s) / 12 : 0);
  const v = clamp01(hour.visibility_m != null ? Number(hour.visibility_m) / 10000 : 0);
  let seeing_n = 0;
  const s = Number(hour.seeing);
  if (!Number.isNaN(s)) {
    if (s >= 0 && s <= 1) seeing_n = s;
    else seeing_n = 1 - clamp01((s - 1) / 4);
  }
  let trans_n = 0;
  const t = Number(hour.transparency);
  if (!Number.isNaN(t)) {
    if (t >= 0 && t <= 1) trans_n = t;
    else trans_n = 1 - clamp01((t - 1) / 4);
  }
  const moon_ok = 1.0;
  const visual01 = 0.40 * c_total + 0.15 * p + 0.15 * trans_n + 0.15 * moon_ok + 0.10 * w + 0.05 * v;
  const broadband01 = 0.30 * trans_n + 0.25 * moon_ok + 0.20 * c_high + 0.10 * c_total + 0.10 * w + 0.05 * p;
  const planetary01 = 0.40 * seeing_n + 0.20 * w + 0.25 * c_total + 0.10 * trans_n + 0.05 * p;
  const toScore = (x) => Math.max(0, Math.min(100, Math.round(100 * Math.max(0, Math.min(1, x)))));
  return { visual: toScore(visual01), broadband: toScore(broadband01), planetary: toScore(planetary01) };
}

function getHourScore(hour) {
  if (!hour) return 0;
  const profile = getActiveProfile();
  if (profile === "default") {
    return hour.score != null ? formatScore(hour.score) : 0;
  }
  const ps = hour.profile_scores;
  if (ps && typeof ps === "object" && ps[profile] != null) {
    const v = ps[profile];
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  const computed = computeProfileScores(hour);
  return computed[profile] != null ? computed[profile] : (hour.score != null ? formatScore(hour.score) : 0);
}

// Score breakdown for explain panel: same weights as computeProfileScores; contributions sum to displayed score.
// Returns [{ label, value, contribution (display), contributionRaw (int) }, ...]
function buildScoreBreakdown(hour) {
  if (!hour) return [];
  const displayedScore = formatScore(getHourScore(hour));
  const clamp01 = (v) => {
    if (v == null || Number.isNaN(v)) return 0;
    const x = Number(v);
    return Math.max(0, Math.min(1, x > 1 ? x / 100 : x));
  };
  const clearFromCloud = (val) => clamp01(1 - (val != null && val > 1 ? val / 100 : val ?? 0));
  const c_total = clearFromCloud(hour.cloud_total);
  const c_high = clearFromCloud(hour.cloud_high);
  let p = 1 - clamp01(hour.precip_prob != null && hour.precip_prob > 1 ? hour.precip_prob / 100 : hour.precip_prob ?? 0);
  if (hour.precip_mm && hour.precip_mm > 0) p = Math.max(0, p - 0.15);
  const w = clamp01(hour.wind_m_s != null ? 1 - Number(hour.wind_m_s) / 12 : 0);
  const v = clamp01(hour.visibility_m != null ? Number(hour.visibility_m) / 10000 : 0);
  let seeing_n = 0;
  const s = Number(hour.seeing);
  if (!Number.isNaN(s)) {
    if (s >= 0 && s <= 1) seeing_n = s;
    else seeing_n = 1 - clamp01((s - 1) / 4);
  }
  let trans_n = 0;
  const t = Number(hour.transparency);
  if (!Number.isNaN(t)) {
    if (t >= 0 && t <= 1) trans_n = t;
    else trans_n = 1 - clamp01((t - 1) / 4);
  }
  const moon_ok = 1.0;

  const cloudPct = hour.cloud_total != null ? (hour.cloud_total <= 1 ? Math.round(hour.cloud_total * 100) : Math.round(hour.cloud_total)) : "—";
  const precipPct = hour.precip_prob != null ? (hour.precip_prob <= 1 ? Math.round(hour.precip_prob * 100) : Math.round(hour.precip_prob)) : "—";
  const windVal = formatWind(hour.wind_m_s);
  const visKm = formatVisibility(hour.visibility_m);
  const profile = getActiveProfile();

  function normalizeToSum(items, targetSum) {
    const raw = items.map(x => x.raw);
    const rounded = raw.map(r => Math.round(r));
    let sum = rounded.reduce((a, b) => a + b, 0);
    let diff = targetSum - sum;
    const indices = raw.map((_, i) => i).sort((a, b) => Math.abs(raw[b] - rounded[b]) - Math.abs(raw[a] - rounded[a]));
    for (let k = 0; k < Math.abs(diff) && k < indices.length; k++) {
      const i = indices[k];
      rounded[i] += diff > 0 ? 1 : -1;
      sum += diff > 0 ? 1 : -1;
      diff = targetSum - sum;
      if (diff === 0) break;
    }
    return items.map((x, i) => {
      const n = rounded[i];
      const contributionRaw = n;
      const contribution = (n >= 0 ? "+" : "") + n;
      return { label: x.label, value: x.value, contribution, contributionRaw, factorKey: x.factorKey, paramName: x.paramName, tooltipKey: x.tooltipKey };
    });
  }

  const precipMm = hour.precip_mm != null && isValidValue(hour.precip_mm) && hour.precip_mm > 0 ? formatPrecipMm(hour.precip_mm) : null;
  const valueCloud = cloudPct != null ? cloudPct + "% clouds" : "—";
  const valuePrecip = precipPct != null ? (precipMm != null ? precipPct + "% (" + precipMm + " mm)" : precipPct + "% precip") : "—";
  const valueWind = windVal != null ? (hour.wind_m_s != null ? windVal + " m/s (" + (Math.round(hour.wind_m_s * 3.6 * 10) / 10) + " km/h)" : windVal + " m/s") : "—";
  const valueVis = visKm != null ? visKm + " km" : "—";

  if (profile === "visual" || profile === "default") {
    const items = [
      { label: c_total >= 0.8 ? "Clear sky" : c_total >= 0.5 ? "Partly clear" : "Cloudy", value: valueCloud, raw: 40 * c_total, factorKey: "cloud", paramName: "Clouds", tooltipKey: "cloud" },
      { label: p >= 0.8 ? "Low precip risk" : p >= 0.5 ? "Some precip risk" : "Precip likely", value: valuePrecip, raw: 15 * p, factorKey: "precip", paramName: "Precipitation", tooltipKey: "precip" },
      { label: trans_n >= 0.7 ? "Good transparency" : trans_n >= 0.4 ? "Fair transparency" : "Poor transparency", value: hour.transparency != null ? "(" + (Number(hour.transparency) <= 5 ? hour.transparency + "/5" : hour.transparency) + ")" : "", raw: 15 * trans_n, factorKey: "transparency", paramName: "Transparency", tooltipKey: "transparency" },
      { label: "Moon OK", value: "OK", raw: 15 * moon_ok, factorKey: "moon", paramName: "Moon", tooltipKey: "moon" },
      { label: w >= 0.7 ? "Light wind" : w >= 0.4 ? "Moderate wind" : "Strong wind", value: valueWind, raw: 10 * w, factorKey: "wind", paramName: "Wind", tooltipKey: "wind" },
      { label: v >= 0.7 ? "Good visibility" : v >= 0.4 ? "Fair visibility" : "Low visibility", value: valueVis, raw: 5 * v, factorKey: "visibility", paramName: "Visibility", tooltipKey: "visibility" },
    ];
    return normalizeToSum(items, Math.min(100, Math.max(0, displayedScore)));
  }
  if (profile === "broadband") {
    const items = [
      { label: trans_n >= 0.7 ? "Good transparency" : trans_n >= 0.4 ? "Fair" : "Poor", value: hour.transparency != null ? String(hour.transparency) : "", raw: 30 * trans_n, factorKey: "transparency", paramName: "Transparency", tooltipKey: "transparency" },
      { label: "Moon OK", value: "OK", raw: 25 * moon_ok, factorKey: "moon", paramName: "Moon", tooltipKey: "moon" },
      { label: c_high >= 0.8 ? "Clear high clouds" : c_high >= 0.5 ? "Some high cloud" : "High clouds", value: "", raw: 20 * c_high, factorKey: "cloud", paramName: "High clouds", tooltipKey: "cloud" },
      { label: c_total >= 0.8 ? "Clear sky" : "Cloudy", value: valueCloud, raw: 10 * c_total, factorKey: "cloud", paramName: "Clouds", tooltipKey: "cloud" },
      { label: w >= 0.7 ? "Light wind" : "Wind", value: valueWind, raw: 10 * w, factorKey: "wind", paramName: "Wind", tooltipKey: "wind" },
      { label: p >= 0.8 ? "Low precip" : "Precip risk", value: valuePrecip, raw: 5 * p, factorKey: "precip", paramName: "Precipitation", tooltipKey: "precip" },
    ];
    return normalizeToSum(items, Math.min(100, Math.max(0, displayedScore)));
  }
  if (profile === "planetary") {
    const items = [
      { label: seeing_n >= 0.7 ? "Good seeing" : seeing_n >= 0.4 ? "Fair seeing" : "Poor seeing", value: hour.seeing != null ? "(" + hour.seeing + "/7)" : "", raw: 40 * seeing_n, factorKey: "seeing", paramName: "Seeing", tooltipKey: "seeing" },
      { label: w >= 0.7 ? "Light wind" : "Wind", value: valueWind, raw: 20 * w, factorKey: "wind", paramName: "Wind", tooltipKey: "wind" },
      { label: c_total >= 0.8 ? "Clear sky" : "Cloudy", value: valueCloud, raw: 25 * c_total, factorKey: "cloud", paramName: "Clouds", tooltipKey: "cloud" },
      { label: trans_n >= 0.7 ? "Good transparency" : "Transparency", value: hour.transparency != null ? String(hour.transparency) : "", raw: 10 * trans_n, factorKey: "transparency", paramName: "Transparency", tooltipKey: "transparency" },
      { label: p >= 0.8 ? "Low precip" : "Precip risk", value: valuePrecip, raw: 5 * p, factorKey: "precip", paramName: "Precipitation", tooltipKey: "precip" },
    ];
    return normalizeToSum(items, Math.min(100, Math.max(0, displayedScore)));
  }
  return [];
}

// Current details rows for expanded panel (right column)
// hourIndex + hours optional: used to compute temperature trend (current vs next hour)
function buildCurrentDetails(hour, hours, hourIndex) {
  if (!hour) return [];
  const h6 = (hours && hourIndex != null && hourIndex >= 0 && hours[hourIndex + 6]) ? hours[hourIndex + 6] : null;
  function arrow(nowVal, val6) {
    if (nowVal == null || val6 == null) return "—";
    return nowVal < val6 ? "↑" : nowVal > val6 ? "↓" : "—";
  }
  const cloud = formatCloud(hour.cloud_total);
  const cloud6 = h6 ? formatCloud(h6.cloud_total) : null;
  const cloudArrow = arrow(cloud, cloud6);
  const low = hour.cloud_low != null ? (hour.cloud_low <= 1 ? Math.round(hour.cloud_low * 100) : Math.round(hour.cloud_low)) : null;
  const low6 = h6 && h6.cloud_low != null ? (h6.cloud_low <= 1 ? Math.round(h6.cloud_low * 100) : Math.round(h6.cloud_low)) : null;
  const mid = hour.cloud_mid != null ? (hour.cloud_mid <= 1 ? Math.round(hour.cloud_mid * 100) : Math.round(hour.cloud_mid)) : null;
  const mid6 = h6 && h6.cloud_mid != null ? (h6.cloud_mid <= 1 ? Math.round(h6.cloud_mid * 100) : Math.round(h6.cloud_mid)) : null;
  const high = hour.cloud_high != null ? (hour.cloud_high <= 1 ? Math.round(hour.cloud_high * 100) : Math.round(hour.cloud_high)) : null;
  const high6 = h6 && h6.cloud_high != null ? (h6.cloud_high <= 1 ? Math.round(h6.cloud_high * 100) : Math.round(h6.cloud_high)) : null;
  const precipProb = formatPrecipProb(hour.precip_prob);
  const precipProb6 = h6 ? formatPrecipProb(h6.precip_prob) : null;
  const precipMm = formatPrecipMm(hour.precip_mm);
  const precipMm6 = h6 ? formatPrecipMm(h6.precip_mm) : null;
  const windMs = formatWind(hour.wind_m_s);
  const windMs6 = h6 ? formatWind(h6.wind_m_s) : null;
  const visKm = formatVisibility(hour.visibility_m);
  const visKm6 = h6 ? formatVisibility(h6.visibility_m) : null;
  const pressure = formatPressure(hour.pressure_hpa);
  const trendRaw = hour.pressure_trend_6h_hpa != null && isValidValue(hour.pressure_trend_6h_hpa) ? (Math.round(hour.pressure_trend_6h_hpa * 10) / 10) : null;
  const pressureArrow = trendRaw == null ? "—" : (trendRaw > 0 ? "↑" : trendRaw < 0 ? "↓" : "—");
  const temp = hour.temp_c != null && isValidValue(hour.temp_c) ? Math.round(Number(hour.temp_c)) : null;
  const temp6 = h6 && h6.temp_c != null && isValidValue(h6.temp_c) ? Math.round(Number(h6.temp_c)) : null;
  const tempArrow = arrow(temp, temp6);
  const tempValue = temp != null ? temp + " °C" : "—";
  const trendStr = trendRaw != null ? (trendRaw > 0 ? "+" : "") + trendRaw + " hPa" : "—";
  const windDisplay = windMs != null ? windMs + " m/s" : "—";
  const rows = [
    { label: "Clouds TOTAL " + cloudArrow + ":", value: cloud != null ? cloud + "%" : "—" },
    { label: "Low:", value: low != null ? low + "%" : "—", sub: true },
    { label: "Mid:", value: mid != null ? mid + "%" : "—", sub: true },
    { label: "High:", value: high != null ? high + "%" : "—", sub: true },
    { label: "Precip probability:", value: precipProb != null ? precipProb + "%" : "—" },
    { label: "Precip amount " + arrow(precipMm, precipMm6) + ":", value: precipMm != null && precipMm > 0 ? precipMm + " mm" : "—" },
    { label: "Wind " + arrow(windMs, windMs6) + ":", value: windDisplay },
    { label: "Visibility " + arrow(visKm, visKm6) + ":", value: visKm != null ? visKm + " km" : "—" },
    { label: "Pressure " + pressureArrow + ":", value: pressure != null ? pressure + " hPa" : "—" },
    { label: "Pressure trend (6h):", value: trendStr },
    { label: "Temperature " + tempArrow + ":", value: tempValue },
  ];
  return rows;
}

const FACTOR_TOOLTIPS = {
  seeing: "Atmospheric steadiness. Lower is better for planets. Scale: 1(best)…7(worst).",
  transparency: "Sky clarity for deep-sky objects. Lower is better. Scale: 1(best)…4(worst).",
  moon: "Moon brightness penalty depends on phase and altitude. Stronger effect for broadband imaging.",
};

const TOOLTIPS = {
  seeing: {
    title: "Seeing (image stability)",
    what: "How steady the atmosphere is. Poor seeing makes stars \"boil\" and smears fine detail.",
    affects: "Most critical for planets, Moon, double stars, and high magnification.",
    bullets: ["1–2: excellent (sharp at high power)", "3: good", "4: fair", "5: poor", "6–7: very poor (planets will look mushy)"],
    source: "hours[].seeing (7Timer \"astro\")",
  },
  wind_m_s: {
    title: "Wind",
    what: "Near-surface wind speed. Strong wind shakes mounts, causes tube currents, and increases local turbulence.",
    affects: "Impacts both visual and astrophotography (tracking stability), and indirectly seeing.",
    bullets: ["0–2 m/s: calm (ideal)", "2–5 m/s: ok", "5–8 m/s: noticeable shake risk", ">8 m/s: problematic (especially with long focal length)"],
    source: "hours[].wind_m_s (Open-Meteo, windspeed_10m)",
  },
  cloud_total: {
    title: "Cloud cover (total)",
    what: "Estimated fraction of sky covered by clouds. Even thin high clouds can kill contrast.",
    affects: "Primary blocker for everything; high clouds hurt deep-sky first.",
    bullets: ["0–10%: clear", "10–30%: mostly clear", "30–60%: mixed / gaps", "60–90%: mostly cloudy", ">90%: overcast"],
    source: "hours[].cloud_total (Open-Meteo cloudcover)",
  },
  transparency: {
    title: "Transparency (sky clarity)",
    what: "How transparent the air is (haze, thin cloud, aerosols). Low transparency reduces faint object visibility.",
    affects: "Most important for deep-sky objects and wide-field astrophotography.",
    bullets: ["1: excellent (dark, crisp sky)", "2: good", "3: fair (haze/thin veil)", "4: poor (washed-out sky)"],
    source: "hours[].transparency (7Timer \"astro\")",
  },
  precip_mm: {
    title: "Precipitation (amount)",
    what: "Expected precipitation volume during the hour (rain/snow). Any >0 is a hard stop for equipment.",
    affects: "Observing & imaging should be avoided if precipitation is expected.",
    bullets: ["0 mm: dry", "0–0.2 mm: possible drizzle/flurries", ">0.2 mm: precipitation likely (protect gear)"],
    source: "hours[].precip_mm (Open-Meteo precipitation)",
  },
  precip_prob: {
    title: "Precipitation probability",
    what: "Chance of precipitation during the hour. Useful even when amount is near zero.",
    affects: "Risk metric: higher probability = more likely session interruption.",
    bullets: ["0–10%: very unlikely", "10–30%: low risk", "30–60%: moderate risk", ">60%: high risk"],
    source: "hours[].precip_prob (Open-Meteo precipitation_probability)",
  },
  visibility_m: {
    title: "Visibility",
    what: "How far you can see horizontally. Low visibility often indicates haze/fog/smoke that ruins transparency.",
    affects: "Deep-sky suffers first; planetary can still be ok if seeing is good.",
    bullets: [">20 km: clear air", "10–20 km: some haze", "3–10 km: significant haze", "<3 km: fog / very poor clarity"],
    source: "hours[].visibility_m (Open-Meteo visibility), display in km",
  },
};
const BREAKDOWN_TOOLTIPS = TOOLTIPS;
const PENALTY_ORDER = ["cloud_total", "precip_mm", "wind_m_s", "visibility_m", "seeing", "transparency"];
const PENALTY_LABELS = { cloud_total: "Clouds", precip_mm: "Precipitation", wind_m_s: "Wind", visibility_m: "Visibility", seeing: "Seeing", transparency: "Transparency" };
function formatPenaltyValue(key, value) {
  if (value == null || value === "") return "—";
  const v = Number(value);
  if (Number.isNaN(v)) return String(value);
  if (key === "cloud_total") return v + "%";
  if (key === "precip_mm") return v + " mm";
  if (key === "wind_m_s") return v + " m/s";
  if (key === "visibility_m") return v >= 1000 ? (v / 1000) + " km" : v + " m";
  return String(Math.round(v));
}
function formatBreakdownRawForV2(key, raw) {
  if (raw == null || raw === "") return "—";
  const v = Number(raw);
  if (Number.isNaN(v)) return String(raw);
  if (key === "cloud_total" || key === "cloud_high") return v + "%";
  if (key === "precip_mm") return v + " mm";
  if (key === "precip_prob") return v + "%";
  if (key === "wind_m_s") return (Math.round(v * 10) / 10) + " m/s";
  if (key === "visibility_m") return v >= 1000 ? (v / 1000) + " km" : v + " m";
  if (key === "seeing") return v + " (1–7)";
  if (key === "transparency") return v + " (1–4)";
  return String(Math.round(v));
}

// Step 4: Render hourly list with mode support
let currentMode = "today";
function renderHourly(rootEl, hours) {
  // Find the weather card inside rootEl
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const hourlyEl = weatherCard.querySelector(".hourly");
  if (!hourlyEl) return;

  const now = Date.now();
  const tz = weatherData?.location?.tz || "UTC";
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  let futureHours = hours.filter(h => {
    const dt = parseISO(h.time);
    return dt && dt.getTime() > now;
  });

  // Apply mode filter
  if (currentMode === "today") {
    // TONIGHT: until 12:00 AM next day (same calendar day as "today" in location TZ)
    futureHours = futureHours.filter(h => h.time.slice(0, 10) === todayStr);
  } else if (currentMode === "48h") {
    // 48 HR: current hour + exactly 48 hours
    const end48 = now + 48 * 60 * 60 * 1000;
    futureHours = futureHours.filter(h => {
      const dt = parseISO(h.time);
      return dt && dt.getTime() <= end48;
    });
  } else if (currentMode === "7d") {
    // 7 days: from current hour until 12:00 AM of the 8th day (day 0 = today)
    const endDay8 = new Date(todayStr + "T12:00:00Z");
    endDay8.setDate(endDay8.getDate() + 8);
    const endDateStr = endDay8.toISOString().slice(0, 10);
    futureHours = futureHours.filter(h => h.time.slice(0, 10) < endDateStr);
  }

  if (futureHours.length === 0) {
    hourlyEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">No forecast hours</div>';
    return;
  }

  hourlyEl.innerHTML = futureHours.map((hour, futureIdx) => {
    // Find index in full hours array
    const fullIdx = hours.findIndex(h => h.time === hour.time);
    const hourIdx = fullIdx >= 0 ? fullIdx : futureIdx;
    
    const timeStr = formatTime(hour.time);
    const score = formatScore(getHourScore(hour));
    
    // Build meta string with more parameters
    const cloud = formatCloud(hour.cloud_total);
    const tempStr = hour.temp_c != null && isValidValue(hour.temp_c) ? Math.round(Number(hour.temp_c)) + "°C" : null;
    const wind = formatWind(hour.wind_m_s);
    const visKm = formatVisibility(hour.visibility_m);
    const prob = formatPrecipProb(hour.precip_prob);
    
    const iconName = pickIcon(hour);
    var iconBase = (window.__WEATHER_POC_CONFIG && window.__WEATHER_POC_CONFIG.iconBase) ? window.__WEATHER_POC_CONFIG.iconBase : "/assets/icons/weather";
    const iconPath = (iconBase.charAt(iconBase.length - 1) === "/" ? iconBase : iconBase + "/") + iconName;
    const paramLines = [
      `☁️ ${cloud}%`,
      tempStr ? `🌡 ${tempStr}` : null,
      prob > 0 ? `🌧️ ${prob}%` : null,
      wind != null ? `💨 ${wind}m/s` : null,
      visKm != null ? `👁️ ${visKm}km` : null
    ].filter(Boolean);
    if (paramLines.length === 0) paramLines.push("—");
    return `
      <div class="hour" data-hour-idx="${hourIdx}" style="cursor:pointer">
        <div class="t">${escapeHtml(timeStr)}</div>
        <div class="s-wrap">
          <img class="wx-ico" src="${escapeHtml(iconPath)}" alt="" aria-hidden="true">
          <span class="wx-score" style="color: var(--${scoreClass(score)})">${score}</span>
        </div>
        <div class="hour-params">
          ${paramLines.map(line => `<div class="b">${escapeHtml(line)}</div>`).join("")}
        </div>
      </div>
    `;
  }).join("");
  
  // Add click handlers to hourly cards
  hourlyEl.querySelectorAll(".hour[data-hour-idx]").forEach(card => {
    card.addEventListener("click", function() {
      const idx = parseInt(this.dataset.hourIdx, 10);
      if (!isNaN(idx)) {
        openHourInspector(idx);
      }
    });
  });
}

// Helper: check if value is invalid (-9999 or null)
function isValidValue(v) {
  return v != null && v !== -9999 && !Number.isNaN(v);
}

// Helper: format "why" string (max 3 worst factors)
function formatWhyString(nowHour) {
  const parts = [];
  
  // Cloud
  if (isValidValue(nowHour.cloud_total) && nowHour.cloud_total > 60) {
    parts.push(`☁️ ${formatCloud(nowHour.cloud_total)}%`);
  }
  
  // Precip
  const prob = formatPrecipProb(nowHour.precip_prob);
  const precipMm = formatPrecipMm(nowHour.precip_mm);
  if ((prob > 20 || precipMm > 0.1)) {
    parts.push(`🌧️ ${prob}%`);
  }
  
  // Wind
  const wind = formatWind(nowHour.wind_m_s);
  if (wind != null && wind > 8) {
    parts.push(`💨 ${wind}m/s`);
  }
  
  // Visibility
  const visKm = formatVisibility(nowHour.visibility_m);
  if (visKm != null && visKm < 10) {
    parts.push(`👁️ ${visKm}km`);
  }
  
  // Seeing
  const seeing = formatSeeing(nowHour.seeing);
  if (seeing !== "—" && seeing >= 5) {
    parts.push(`🔭 ${seeing}`);
  }
  
  // Transparency
  const trans = formatTransparency(nowHour.transparency);
  if (trans !== "—" && trans >= 3) {
    parts.push(`✨ ${trans}`);
  }
  
  // Return max 3 factors
  return parts.slice(0, 3).join(" • ") || "Good conditions";
}

// Step 3: Render "Now" KPI
function renderNow(rootEl, nowHour) {
  // Find the weather card inside rootEl
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const overallBox = weatherCard.querySelector(".kpi .box.wide");
  const scoreValEl = overallBox?.querySelector('[data-role="score-val"]');
  const scoreRankEl = overallBox?.querySelector('[data-role="score-rank"]');
  const scoreLabelEl = overallBox?.querySelector('[data-role="score-label"]');
  const scoreBar = overallBox?.querySelector('[data-role="score-bar"]');

  if (!nowHour) {
    if (scoreValEl) scoreValEl.textContent = "—";
    if (scoreRankEl) scoreRankEl.textContent = "—";
    if (scoreLabelEl) scoreLabelEl.textContent = "No data";
    if (scoreBar) {
      const fillEl = scoreBar.querySelector(".score-bar-fill");
      if (fillEl) {
        fillEl.className = "score-bar-fill poor";
        fillEl.style.width = "0%";
      }
    }
    return;
  }

  const score = formatScore(getHourScore(nowHour));
  const rank = scoreRank(score);

  if (scoreValEl) scoreValEl.textContent = score;
  if (scoreRankEl) scoreRankEl.textContent = rank;
  if (scoreLabelEl) scoreLabelEl.textContent = score + " / 100";

  if (overallBox) {
    const nf = overallBox.querySelector('[data-role="now-factors"]');
    if (nf) renderNowFactors(nf, nowHour, weatherData?.hours || []);

    if (scoreBar) {
      let barClass = "poor";
      if (score >= 70) barClass = "good";
      else if (score >= 40) barClass = "fair";
      let fillEl = scoreBar.querySelector(".score-bar-fill");
      if (!fillEl) {
        fillEl = document.createElement("div");
        fillEl.className = "score-bar-fill";
        scoreBar.appendChild(fillEl);
      }
      fillEl.className = "score-bar-fill " + barClass;
      fillEl.style.width = Math.max(0, Math.min(100, score)) + "%";
    }

    const hours = weatherData?.hours || [];
    const { idx: i0 } = findNearestHour(hours);
    const headsUpEl = overallBox.querySelector('[data-role="heads-up"]');
    if (headsUpEl) {
      const headsUpArr = weatherData?.derived?.now?.heads_up;
      const fallback = buildHeadsUpMessages(hours, i0);
      const firstLine = (Array.isArray(headsUpArr) && headsUpArr[0]) ? headsUpArr[0] : (fallback[0] || "—");
      headsUpEl.textContent = "Heads-up: " + firstLine;
    }

    const explainPanel = overallBox.querySelector('[data-role="explain-panel"]');
    const scoreTitle = overallBox.querySelector('[data-role="explain-score-title"]');
    const scoreList = overallBox.querySelector('[data-role="score-breakdown"]');
    const totalLine = overallBox.querySelector('[data-role="breakdown-total"]');
    const currentDetailsTbody = overallBox.querySelector('[data-role="current-details-table"] tbody');
    const warningsList = overallBox.querySelector('[data-role="warnings-list"]');
    if (scoreTitle) scoreTitle.textContent = "How this score was calculated" + (weatherData?.scoring_version === "v2" ? " (additive v2)" : weatherData?.scoring_version === "v1" ? " (legacy)" : "");
    const profile = getActiveProfile();
    const profileKey = profile === "default" ? "default" : (profile === "broadband" ? "broadband" : profile);
    const breakdown = profile === "default" ? (nowHour?.score_breakdown) : (nowHour?.score_breakdown_by_profile?.[profileKey] || nowHour?.score_breakdown_by_profile?.[profile]);
    const isV2Breakdown = Array.isArray(breakdown);
    const explainLines = nowHour?.score_explain;
    const hasPenaltyBreakdown = breakdown && typeof breakdown.penalties === "object";

    if (totalLine) {
      if (isV2Breakdown && breakdown.length > 0) {
        const sum = breakdown.reduce((s, b) => s + (b.earned || 0), 0);
        totalLine.textContent = "Sum: " + sum;
        totalLine.style.display = "block";
      } else if (hasPenaltyBreakdown) {
        const breakdownScore = breakdown.score != null ? breakdown.score : formatScore(getHourScore(nowHour));
        totalLine.innerHTML = "Sum penalties: " + (breakdown.total_penalty ?? 0) + "<br>Score = 100 − " + (breakdown.total_penalty ?? 0) + " = " + breakdownScore;
        totalLine.style.display = "block";
      } else {
        totalLine.textContent = "";
        totalLine.style.display = "none";
      }
    }
    if (scoreList) {
      if (isV2Breakdown && breakdown.length > 0) {
        scoreList.innerHTML = breakdown.map(b => {
          const textPart = (b.label || b.key) + (b.raw != null && b.raw !== "" ? ": " + formatBreakdownRawForV2(b.key, b.raw) : "");
          const hasTip = (TOOLTIPS && TOOLTIPS[b.key]);
          return `<div class="breakdown-line"><span class="factor-info breakdown-ii" data-tooltip-key="${escapeHtml(b.key)}" aria-label="Info" title="${hasTip ? "More info" : ""}">(i)</span><span class="breakdown-text">${escapeHtml(textPart)}</span><span class="contrib">→ +${b.earned ?? 0}</span></div>`;
        }).join("");
      } else if (hasPenaltyBreakdown && breakdown.penalties) {
        const order = PENALTY_ORDER.filter(k => breakdown.penalties[k] != null);
        scoreList.innerHTML = order.map(key => {
          const p = breakdown.penalties[key];
          const label = PENALTY_LABELS[key] || key;
          const valueStr = formatPenaltyValue(key, p.value);
          const penaltyNum = p.penalty != null ? p.penalty : 0;
          const penaltyStr = "-" + (Number(penaltyNum) === Math.round(penaltyNum) ? Math.round(penaltyNum) : Number(penaltyNum));
          const tooltipKey = escapeHtml(key);
          const hasTip = TOOLTIPS && TOOLTIPS[key];
          const infoIcon = `<span class="factor-info breakdown-ii" data-tooltip-key="${tooltipKey}" aria-label="Info" title="${hasTip ? "More info" : ""}">(i)</span>`;
          return `<div class="breakdown-line">${infoIcon}<span class="breakdown-text">${escapeHtml(label)}: ${escapeHtml(valueStr)}</span><span class="contrib negative">→ ${penaltyStr}</span></div>`;
        }).join("");
      } else {
        scoreList.innerHTML = '<div class="breakdown-unavailable">Breakdown not available in this build.</div>';
      }
    }
    if (currentDetailsTbody) {
      const details = buildCurrentDetails(nowHour, hours, i0);
      currentDetailsTbody.innerHTML = details.map(d => `<tr${d.sub ? ' class="sub-row"' : ''}><th>${escapeHtml(d.label)}</th><td>${escapeHtml(String(d.value))}</td></tr>`).join("");
    }
    if (warningsList) {
      const headsUpArr = weatherData?.derived?.now?.heads_up;
      const fallback = buildHeadsUpMessages(hours, i0);
      const list = Array.isArray(headsUpArr) && headsUpArr.length > 0 ? headsUpArr : fallback.slice(0, 5);
      warningsList.innerHTML = list.length ? list.map(w => `<li>${escapeHtml(w)}</li>`).join("") : "<li>No major changes expected.</li>";
    }

    if (overallBox && !overallBox._explainToggleBound) {
      overallBox._explainToggleBound = true;
      overallBox.addEventListener("click", function (e) {
        const toggleBtn = e.target.closest("[data-role=\"explain-toggle\"]");
        if (!toggleBtn) return;
        e.preventDefault();
        e.stopPropagation();
        const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
        const next = !expanded;
        toggleBtn.setAttribute("aria-expanded", String(next));
        toggleBtn.textContent = next ? "▼" : "▶";
        const panel = overallBox.querySelector('[data-role="explain-panel"]');
        if (panel) {
          panel.classList.toggle("expanded", next);
          panel.setAttribute("aria-hidden", String(!next));
        }
      });
    }
  }

  // Removed Cloud cover and Seeing/Transparency boxes - only chips remain
}

// Step 5: Render mini charts (compact sparklines)
function renderMiniCharts(rootEl, hours, mode, nowHour) {
  // Find the weather card inside rootEl
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const now = Date.now();
  let selectedHours = [];
  let maxBars = 24;
  
  if (mode === "today") {
    // TONIGHT: next 12 hours
    selectedHours = hours
      .map(h => ({ h, dt: parseISO(h.time) }))
      .filter(x => x.dt && x.dt.getTime() > now)
      .slice(0, 12)
      .map(x => x.h);
    maxBars = 12;
  } else if (mode === "48h") {
    selectedHours = hours
      .map(h => ({ h, dt: parseISO(h.time) }))
      .filter(x => x.dt && x.dt.getTime() > now)
      .slice(0, 48)
      .map(x => x.h);
    // Limit to 16 bars for display to prevent overflow in compact mini charts
    maxBars = 16;
  } else {
    // 7d: use next 24h
    selectedHours = hours
      .map(h => ({ h, dt: parseISO(h.time) }))
      .filter(x => x.dt && x.dt.getTime() > now)
      .slice(0, 24)
      .map(x => x.h);
    maxBars = 24;
  }

  if (selectedHours.length === 0) return;

  // 1. Score sparkline (0-100) - use legacy balanced score for history
  const scoreValues = selectedHours.map(h => h.score ?? null);
  const scoreBar = weatherCard.querySelector('[data-role="spark-score"]');
  const scoreNow = weatherCard.querySelector('[data-role="now-score"]');
  if (scoreBar) {
    scoreBar.innerHTML = buildSpark(scoreValues, { min: 0, max: 100, maxBars });
  }
  if (scoreNow && nowHour) {
    const nowScore = formatScore(getHourScore(nowHour));
    const profileLabel = getActiveProfile();
    const profileDisplay = profileLabel === "default" ? "Balanced" : profileLabel;
    scoreNow.textContent = `Now ${nowScore} (${profileDisplay})`;
  }

  // 2. Cloud sparkline (0-100%)
  const cloudValues = selectedHours.map(h => isValidValue(h.cloud_total) ? h.cloud_total : null);
  const cloudBar = weatherCard.querySelector('[data-role="spark-cloud"]');
  const cloudNow = weatherCard.querySelector('[data-role="now-cloud"]');
  if (cloudBar) {
    cloudBar.innerHTML = buildSpark(cloudValues, { min: 0, max: 100, maxBars });
  }
  if (cloudNow && nowHour) {
    const cloud = formatCloud(nowHour.cloud_total);
    cloudNow.textContent = `Now ${cloud}%`;
  }

  // 3. Pressure sparkline (normalize by min/max in window)
  const pressureValues = selectedHours.map(h => isValidValue(h.pressure_hpa) ? h.pressure_hpa : null);
  const validPressures = pressureValues.filter(v => v != null);
  const pressureBar = weatherCard.querySelector('[data-role="spark-pressure"]');
  const pressureNow = weatherCard.querySelector('[data-role="now-pressure"]');
  if (pressureBar && validPressures.length > 0) {
    const minP = Math.min(...validPressures);
    const maxP = Math.max(...validPressures);
    pressureBar.innerHTML = buildSpark(pressureValues, { min: minP, max: maxP, maxBars });
  }
  if (pressureNow && nowHour) {
    const pressure = formatPressure(nowHour.pressure_hpa);
    pressureNow.textContent = pressure != null ? `Now ${pressure} hPa` : "Now —";
  }

  // 4. Seeing sparkline (1-7, inverted: 1 best → high bar)
  const seeingValues = selectedHours.map(h => isValidValue(h.seeing) ? h.seeing : null);
  const seeingBar = weatherCard.querySelector('[data-role="spark-seeing"]');
  const seeingNow = weatherCard.querySelector('[data-role="now-seeing"]');
  if (seeingBar) {
    seeingBar.innerHTML = buildSpark(seeingValues, { min: 1, max: 7, maxBars, invert: true });
  }
  if (seeingNow && nowHour) {
    const seeing = formatSeeing(nowHour.seeing);
    seeingNow.textContent = `Now ${seeing}`;
  }

  // 5. Transparency sparkline (1-4, inverted: 1 best → high bar)
  const transValues = selectedHours.map(h => isValidValue(h.transparency) ? h.transparency : null);
  const transBar = weatherCard.querySelector('[data-role="spark-transparency"]');
  const transNow = weatherCard.querySelector('[data-role="now-transparency"]');
  if (transBar) {
    transBar.innerHTML = buildSpark(transValues, { min: 1, max: 4, maxBars, invert: true });
  }
  if (transNow && nowHour) {
    const trans = formatTransparency(nowHour.transparency);
    transNow.textContent = `Now ${trans}`;
  }
}

// Open parameter modal
function openParameterModal(param, nowHour, allHours = null) {
  // Use weatherData if allHours not provided
  if (!allHours && typeof weatherData !== 'undefined' && weatherData?.hours) {
    allHours = weatherData.hours;
  }
  if (!allHours) allHours = [];
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('modal-content');
  
  if (!modal || !title || !content) return;
  
  // Get current window hours (next 12-24h)
  const now = Date.now();
  const windowHours = allHours
    .map(h => ({ h, dt: parseISO(h.time) }))
    .filter(x => x.dt && x.dt.getTime() > now)
    .slice(0, 24)
    .map(x => x.h);
  
  let html = '';
  let sparkValues = [];
  let sparkConfig = {};
  
  if (param === 'cloud') {
    title.textContent = '☁️ Cloud Cover';
    const nowVal = formatCloud(nowHour.cloud_total);
    const values = windowHours.map(h => isValidValue(h.cloud_total) ? h.cloud_total : null);
    const validValues = values.filter(v => v != null);
    const min = validValues.length > 0 ? Math.min(...validValues) : 0;
    const max = validValues.length > 0 ? Math.max(...validValues) : 100;
    
    html = `
      <div><strong>Now:</strong> ${nowVal}%</div>
      <div style="margin-top:8px;"><strong>Range (next 24h):</strong> ${Math.round(min)}% - ${Math.round(max)}%</div>
    `;
    sparkValues = values;
    sparkConfig = { min: 0, max: 100, maxBars: 24 };
  } else if (param === 'wind') {
    title.textContent = '💨 Wind Speed';
    const nowVal = formatWind(nowHour.wind_m_s);
    const values = windowHours.map(h => isValidValue(h.wind_m_s) ? h.wind_m_s : null);
    const validValues = values.filter(v => v != null);
    const min = validValues.length > 0 ? Math.min(...validValues) : 0;
    const max = validValues.length > 0 ? Math.max(...validValues) : 10;
    
    html = `
      <div><strong>Now:</strong> ${nowVal != null ? nowVal + ' m/s' : '—'}</div>
      <div style="margin-top:8px;"><strong>Range (next 24h):</strong> ${min.toFixed(1)} - ${max.toFixed(1)} m/s</div>
    `;
    sparkValues = values;
    sparkConfig = { min: min, max: max, maxBars: 24 };
  } else {
    title.textContent = 'Parameter Details';
    html = '<div>Details coming soon...</div>';
  }
  
  content.innerHTML = html;
  if (sparkValues.length > 0) {
    const sparkEl = document.createElement('div');
    sparkEl.className = 'modal-spark';
    sparkEl.innerHTML = buildSpark(sparkValues, sparkConfig);
    content.appendChild(sparkEl);
  }
  
  modal.classList.add('active');
}

// Close modal
function closeModal() {
  const modal = document.getElementById('modal-overlay');
  if (modal) modal.classList.remove('active');
}

// Modal event handlers
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal-overlay');
  const closeBtn = modal?.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
});


// Step 6: Show error
function showError(rootEl, msg) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const metaEl = weatherCard.querySelector("[data-role=weather-meta]");
  if (metaEl) metaEl.innerHTML = `<span style="color: var(--bad)">Error: ${escapeHtml(msg)}</span>`;
}

// Non-blocking banner when API failed and we use cached JSON
function showApiFallbackBanner(rootEl) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  let banner = weatherCard.querySelector("[data-role=api-fallback-banner]");
  if (!banner) {
    banner = document.createElement("div");
    banner.setAttribute("data-role", "api-fallback-banner");
    banner.className = "api-fallback-banner";
    banner.setAttribute("role", "status");
    weatherCard.insertBefore(banner, weatherCard.firstChild);
  }
  banner.textContent = "API error (staging). Using cached JSON.";
  banner.style.display = "block";
}

// Step 6: Show loading
function showLoading(rootEl) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const metaEl = weatherCard.querySelector("[data-role=weather-meta]");
  if (metaEl) metaEl.textContent = "Loading…";
}

// Render best windows (TONIGHT = next 12 hours)
function renderBestWindows(rootEl, bestWindows, hours) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const bestWindowEl = weatherCard.querySelector("[data-role=best-window]");
  if (!bestWindowEl) return;
  bestWindowEl.textContent = "";

  let text = "";
  if (!bestWindows || bestWindows.length === 0) {
    // Calculate best window from hours (next 12 hours)
    const now = Date.now();
    const next12h = hours
      .map(h => ({ h, dt: parseISO(h.time) }))
      .filter(x => x.dt && x.dt.getTime() > now)
      .slice(0, 12);
    
    if (next12h.length >= 2) {
      let bestStart = 0;
      let bestAvg = 0;
      let bestLen = 2;
      for (let i = 0; i <= next12h.length - 2; i++) {
        const window = next12h.slice(i, i + 3);
        const avg = window.reduce((sum, x) => sum + (x.h.score ?? 0), 0) / window.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestStart = i;
          bestLen = window.length;
        }
      }
      const start = next12h[bestStart].dt;
      const end = next12h[bestStart + bestLen - 1].dt;
      if (start && end) {
        const startStr = formatTimeShort(start.toISOString());
        const endStr = formatTimeShort(end.toISOString());
        const score = Math.round(bestAvg * 10) / 10;
        text = "Best window: " + startStr + "\u2013" + endStr;
      }
    }
    bestWindowEl.textContent = text;
    return;
  }
  
  const now = Date.now();
  const next12hEnd = now + 12 * 60 * 60 * 1000;
  let bestWindow = null;
  for (const win of bestWindows) {
    const start = parseISO(win.start);
    if (start && start.getTime() >= now && start.getTime() <= next12hEnd) {
      if (!bestWindow || win.score_avg > bestWindow.score_avg) {
        bestWindow = win;
      }
    }
  }
  if (!bestWindow && bestWindows.length > 0) {
    bestWindow = bestWindows[0];
  }
  if (bestWindow) {
    const start = parseISO(bestWindow.start);
    const end = parseISO(bestWindow.end);
    if (start && end) {
      const startStr = formatTimeShort(start.toISOString());
      const endStr = formatTimeShort(end.toISOString());
      const score = Math.round(bestWindow.score_avg * 10) / 10;
      text = "Best window: " + startStr + "\u2013" + endStr;
    }
  }
  bestWindowEl.textContent = text;
}

// Main: Load and render
async function loadWeather(rootEl, state, forceRefresh) {
  if (isFetchingWeather && !forceRefresh) {
    console.log("[weather] Already fetching, skipping duplicate request");
    return;
  }
  isFetchingWeather = true;
  showLoading(rootEl);
  try {
    var url;
    var useApi = false;
    
    // Use state location for API mode
    if (state && state.location && state.location.lat && state.location.lon && API_ASTRO_WEATHER_URL) {
      var params = new URLSearchParams({
        lat: String(state.location.lat),
        lon: String(state.location.lon),
        tz: state.location.tz || "Europe/Warsaw",
        hours: "72",
        profile: state.profile || activeProfile || "default",
      });
      if (state.location.name) {
        params.append("name", state.location.name);
      }
      url = API_ASTRO_WEATHER_URL + "?" + params.toString();
      useApi = true;
    }
    // Priority 2: Static multi-location JSON
    else if (LOCATION_DATA_BASE && currentLocationId) {
      var base = LOCATION_DATA_BASE;
      if (base.charAt(base.length - 1) === "/") base = base.slice(0, -1);
      url = base + "/" + currentLocationId + ".json";
    }
    // Priority 3: Legacy single-location JSON
    else {
      url = ASTRO_WEATHER_URL;
    }
    
    if (!useApi) {
      url = url + (url.indexOf("?") >= 0 ? "&" : "?") + "ts=" + Date.now();
    }
    var res = await fetch(url);
    var data;
    if (!res.ok) {
      if (useApi && state && state.location) {
        var errBody = null;
        try {
          errBody = await res.json();
        } catch (e) {
          errBody = null;
        }
        if (errBody) {
          console.warn("[weather] API error response:", errBody);
        } else {
          console.warn("[weather] API returned", res.status, res.statusText);
        }
        showApiFallbackBanner(rootEl);
        console.warn("API failed, falling back to legacy JSON");
        url = ASTRO_WEATHER_URL + "?ts=" + Date.now();
        var res2 = await fetch(url);
        if (!res2.ok) throw new Error("HTTP " + res2.status + ": " + res2.statusText);
        var contentType2 = res2.headers.get("content-type") || "";
        if (contentType2.indexOf("application/json") < 0 && contentType2.indexOf("text/json") < 0) {
          var text2 = await res2.text();
          throw new Error("Expected JSON but got " + contentType2);
        }
        data = await res2.json();
      } else {
        throw new Error("HTTP " + res.status + ": " + res.statusText);
      }
    } else {
      var contentType = res.headers.get("content-type") || "";
      if (contentType.indexOf("application/json") < 0 && contentType.indexOf("text/json") < 0) {
        var text = await res.text();
        throw new Error("Expected JSON but got " + contentType);
      }
      data = await res.json();
    }
    if (!data || !data.hours || !Array.isArray(data.hours) || data.hours.length === 0) {
      throw new Error("Invalid JSON: missing or empty hours array");
    }
    weatherData = data;
    var profileList;
    if (Array.isArray(data.profiles) && data.profiles.length) {
      profileList = ["default"].concat(data.profiles.filter(function(p){ return p !== "default"; }));
    } else {
      // Fallback profiles for per-location JSON (balanced + 3 profiles)
      profileList = ["default", "visual", "broadband", "planetary"];
    }
    var def = typeof data.default_profile === "string" ? data.default_profile : "default";
    activeProfile = (state && state.profile) || (profileList.length > 0 ? (profileList.indexOf(def) >= 0 ? def : profileList[0]) : "default");
    currentMode = (state && state.range) || "today";
    data.hours.sort(function(a,b){ var da=parseISO(a.time),db=parseISO(b.time); if(!da||!db)return 0; return da.getTime()-db.getTime(); });
    var nowHourResult = findNearestHour(data.hours || []);
    var nowHour = nowHourResult.hour;
    const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
    var metaEl = weatherCard.querySelector("[data-role=weather-meta]");
    if (metaEl) {
      var horizonHours = data.horizon_hours || data.hours.length;
      var updatedTime = data.generated_at ? new Date(data.generated_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";
      metaEl.textContent = "Updated " + updatedTime + " · " + (horizonHours >= 70 ? "~" : "") + horizonHours + "h forecast";
    }
    var bestWindowsArr = null;
    if (data.summary && Array.isArray(data.summary.best_windows)) {
      bestWindowsArr = data.summary.best_windows;
    } else if (data.best_windows && data.best_windows.tonight) {
      bestWindowsArr = [data.best_windows.tonight];
    }
    if (bestWindowsArr) renderBestWindows(rootEl, bestWindowsArr, data.hours);
    else renderBestWindows(rootEl, null, data.hours);
    renderNow(rootEl, nowHour);
    renderHourly(rootEl, data.hours);
    renderMiniCharts(rootEl, data.hours, currentMode, nowHour);
    lastWeatherFetchTime = Date.now();
  } catch (err) {
    console.error("[weather] Weather load failed:", err);
    showError(rootEl, err.message || "Failed to load weather data");
    const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
    var kpiEl = weatherCard.querySelector(".kpi");
    if (kpiEl) kpiEl.innerHTML = "<div style=\"padding:20px;text-align:center;color:var(--bad)\">Failed to load weather JSON: " + escapeHtml(err.message) + "</div>";
  } finally {
    isFetchingWeather = false;
  }
}
// Chart overlay functionality
let currentChartParam = null;

function getChartElements() {
  return {
    overlay: document.getElementById("chartOverlay"),
    canvas: document.getElementById("chartCanvas"),
    tooltip: document.getElementById("chartTooltip"),
    title: document.getElementById("chartOverlayTitle"),
    subheader: document.getElementById("chartOverlaySubheader"),
    statNow: document.getElementById("chartStatNow"),
    statMin: document.getElementById("chartStatMin"),
    statMax: document.getElementById("chartStatMax")
  };
}

function openChartOverlay(paramKey) {
  if (!weatherData || !weatherData.hours) return;
  const els = getChartElements();
  if (!els.overlay) return;
  currentChartParam = paramKey;
  els.overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderChart(paramKey);
}

function closeChartOverlay() {
  const els = getChartElements();
  if (!els.overlay) return;
  els.overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  currentChartParam = null;
}

function getChartData(paramKey, hours) {
  const now = Date.now();
  let selectedHours = [];
  
  if (currentMode === "today") {
    selectedHours = hours
      .map(h => ({ h, dt: parseISO(h.time) }))
      .filter(x => x.dt && x.dt.getTime() > now)
      .slice(0, 12)
      .map(x => x.h);
  } else if (currentMode === "48h") {
    selectedHours = hours
      .map(h => ({ h, dt: parseISO(h.time) }))
      .filter(x => x.dt && x.dt.getTime() > now)
      .slice(0, 48)
      .map(x => x.h);
  } else {
    // 7d: use all available hours (up to 72)
    selectedHours = hours
      .map(h => ({ h, dt: parseISO(h.time) }))
      .filter(x => x.dt && x.dt.getTime() > now)
      .map(x => x.h);
  }
  
  const values = [];
  const times = [];
  const nowIdx = -1;
  let nearestIdx = 0;
  let nearestDiff = Infinity;
  
  selectedHours.forEach((h, i) => {
    const dt = parseISO(h.time);
    if (!dt) return;
    const diff = Math.abs(dt.getTime() - now);
    if (diff < nearestDiff) {
      nearestDiff = diff;
      nearestIdx = i;
    }
    
    let val = null;
    if (paramKey === "score") {
      val = h.score ?? null;
    } else if (paramKey === "cloud") {
      val = isValidValue(h.cloud_total) ? h.cloud_total : null;
    } else if (paramKey === "pressure") {
      val = isValidValue(h.pressure_hpa) ? h.pressure_hpa : null;
    } else if (paramKey === "seeing") {
      val = isValidValue(h.seeing) ? h.seeing : null;
    } else if (paramKey === "trans") {
      val = isValidValue(h.transparency) ? h.transparency : null;
    }
    
    values.push(val);
    times.push(dt);
  });
  
  return { values, times, nowIdx: nearestIdx, hours: selectedHours };
}

function renderChart(paramKey) {
  const els = getChartElements();
  if (!els.canvas || !weatherData || !els.title || !els.subheader) return;
  
  const ctx = els.canvas.getContext("2d");
  const chartData = getChartData(paramKey, weatherData.hours);
  const { values, times, nowIdx, hours } = chartData;
  
  if (values.length === 0) return;
  
  // Update title and subheader
  const paramTitles = {
    score: "Score",
    cloud: "Cloud",
    pressure: "Pressure",
    seeing: "Seeing",
    trans: "Transparency"
  };
  const locationName = weatherData.location?.name || "Unknown";
  els.title.textContent = paramTitles[paramKey] + " • " + locationName;
  
  const horizonLabels = {
    today: "TONIGHT",
    "48h": "48H",
    "7d": "7D"
  };
  const profileLabels = {
    default: "Balanced",
    visual: "Visual",
    broadband: "Photography",
    planetary: "Planetary"
  };
  const horizonLabel = horizonLabels[currentMode] || "TONIGHT";
  const profileLabel = profileLabels[activeProfile] || "Balanced";
  const updatedStr = formatDateTime(weatherData.generated_at);
  const maxHours = weatherData.horizon_hours || weatherData.hours.length;
  const horizonText = currentMode === "7d" && maxHours < 168 
    ? horizonLabel + " (Max available: " + maxHours + "h)" 
    : horizonLabel;
  els.subheader.textContent = "Horizon: " + horizonText + " • Profile: " + profileLabel + " • Updated: " + updatedStr;
  
  // Calculate stats
  const validValues = values.filter(v => v != null);
  const nowValue = nowIdx >= 0 && nowIdx < values.length ? values[nowIdx] : null;
  const minValue = validValues.length > 0 ? Math.min(...validValues) : null;
  const maxValue = validValues.length > 0 ? Math.max(...validValues) : null;
  
  // Update stats
  const formatValue = (v) => {
    if (v == null) return "—";
    if (paramKey === "score") return Math.round(v);
    if (paramKey === "cloud") return Math.round(v) + "%";
    if (paramKey === "pressure") return Math.round(v) + " hPa";
    if (paramKey === "seeing") return v + " (1 best – 7 worst)";
    if (paramKey === "trans") return v + " (1 best – 4 worst)";
    return String(v);
  };
  
  if (els.statNow) els.statNow.textContent = formatValue(nowValue);
  if (els.statMin) els.statMin.textContent = formatValue(minValue);
  if (els.statMax) els.statMax.textContent = formatValue(maxValue);
  
  // Set canvas size (guard: avoid negative/zero dimensions that can cause SVG rect errors when overlay is hidden)
  const dpr = window.devicePixelRatio || 1;
  const rect = els.canvas.getBoundingClientRect();
  const w = Math.max(0, rect.width);
  const h = Math.max(0, rect.height);
  if (w <= 0 || h <= 0) return;
  els.canvas.width = w * dpr;
  els.canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  els.canvas.style.width = w + "px";
  els.canvas.style.height = h + "px";

  // Clear canvas
  ctx.clearRect(0, 0, w, h);
  
  if (validValues.length === 0) {
    ctx.fillStyle = "var(--muted)";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No data available", w / 2, h / 2);
    return;
  }
  
  // Determine if labels should be rotated (for X axis)
  const maxLabels = 20;
  const shouldRotate = values.length > maxLabels;
  
  // Chart dimensions (increase left padding for Y axis labels with units)
  const padding = { top: 20, right: 20, bottom: shouldRotate ? 50 : 40, left: 70 };
  const chartWidth = Math.max(0, w - padding.left - padding.right);
  const chartHeight = Math.max(0, h - padding.top - padding.bottom);
  if (chartWidth <= 0 || chartHeight <= 0) return;
  
  // Determine min/max for Y axis
  let yMin, yMax;
  if (paramKey === "score") {
    yMin = 0;
    yMax = 100;
  } else if (paramKey === "cloud") {
    yMin = 0;
    yMax = 100;
  } else if (paramKey === "pressure") {
    yMin = Math.min(...validValues) - 5;
    yMax = Math.max(...validValues) + 5;
  } else if (paramKey === "seeing") {
    yMin = 1;
    yMax = 7;
  } else if (paramKey === "trans") {
    yMin = 1;
    yMax = 4;
  } else {
    yMin = Math.min(...validValues);
    yMax = Math.max(...validValues);
  }
  
  const yRange = yMax - yMin || 1;
  
  // Calculate number of Y ticks
  const yTickCount = 10; // Total ticks
  
  // Format Y axis label with units
  function formatYAxisLabel(val) {
    if (paramKey === "score") {
      return Math.round(val);
    } else if (paramKey === "cloud") {
      return Math.round(val) + "%";
    } else if (paramKey === "pressure") {
      return Math.round(val) + " hPa";
    } else if (paramKey === "seeing") {
      return Math.round(val * 10) / 10;
    } else if (paramKey === "trans") {
      return Math.round(val * 10) / 10;
    }
    return Math.round(val * 10) / 10;
  }
  
  // Draw Y axis ticks (will draw labels after graph)
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= yTickCount; i++) {
    const yPos = padding.top + chartHeight - (chartHeight * i / yTickCount);
    ctx.beginPath();
    ctx.moveTo(padding.left, yPos);
    ctx.lineTo(padding.left - 4, yPos);
    ctx.stroke();
  }
  
  // Draw X axis ticks (will draw labels after graph)
  for (let i = 0; i < values.length; i++) {
    if (i >= times.length) break;
    const xPos = padding.left + (chartWidth * i / (values.length - 1 || 1));
    ctx.beginPath();
    ctx.moveTo(xPos, padding.top + chartHeight);
    ctx.lineTo(xPos, padding.top + chartHeight + 4);
    ctx.stroke();
  }
  
  // Draw axis lines
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  // Y axis line
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.stroke();
  // X axis line
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.stroke();
  
  // Draw grid lines (horizontal, aligned with Y ticks)
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= yTickCount; i++) {
    const yPos = padding.top + chartHeight - (chartHeight * i / yTickCount);
    ctx.beginPath();
    ctx.moveTo(padding.left, yPos);
    ctx.lineTo(padding.left + chartWidth, yPos);
    ctx.stroke();
  }
  
  // Draw vertical grid lines (aligned with X ticks, every second for readability)
  const xGridStep = Math.max(1, Math.floor(values.length / 12)); // Show grid every ~12th point
  for (let i = 0; i < values.length; i += xGridStep) {
    if (i >= times.length) break;
    const xPos = padding.left + (chartWidth * i / (values.length - 1 || 1));
    ctx.beginPath();
    ctx.moveTo(xPos, padding.top);
    ctx.lineTo(xPos, padding.top + chartHeight);
    ctx.stroke();
  }
  
  // Draw "NOW" vertical line
  if (nowIdx >= 0 && nowIdx < values.length) {
    const xNow = padding.left + (chartWidth * nowIdx / (values.length - 1 || 1));
    ctx.strokeStyle = "rgba(143,182,255,0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xNow, padding.top);
    ctx.lineTo(xNow, padding.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // "NOW" label
    ctx.fillStyle = "rgba(143,182,255,0.9)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("NOW", xNow, padding.top - 4);
  }
  
  // Draw line chart
  ctx.strokeStyle = "rgba(143,182,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  let hasStart = false;
  
  values.forEach((val, i) => {
    if (val == null) {
      hasStart = false;
      return;
    }
    const x = padding.left + (chartWidth * i / (values.length - 1 || 1));
    const y = padding.top + chartHeight - ((val - yMin) / yRange * chartHeight);
    
    if (!hasStart) {
      ctx.moveTo(x, y);
      hasStart = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  // Draw points
  ctx.fillStyle = "rgba(143,182,255,0.9)";
  values.forEach((val, i) => {
    if (val == null) return;
    const x = padding.left + (chartWidth * i / (values.length - 1 || 1));
    const y = padding.top + chartHeight - ((val - yMin) / yRange * chartHeight);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw axis labels AFTER graph (so they're visible on top)
  // Y axis labels (VALUES with units)
  ctx.fillStyle = "rgba(255,255,255,0.8)"; // More visible than var(--muted)
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  
  for (let i = 0; i <= yTickCount; i++) {
    const yVal = yMin + (yRange * i / yTickCount);
    const yPos = padding.top + chartHeight - (chartHeight * i / yTickCount);
    const labelText = formatYAxisLabel(yVal);
    ctx.fillText(labelText, padding.left - 8, yPos);
  }
  
  // X axis labels (TIME - hours)
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "10px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  
  for (let i = 0; i < values.length; i++) {
    if (i >= times.length) break;
    const xPos = padding.left + (chartWidth * i / (values.length - 1 || 1));
    const dt = times[i];
    const timeStr = formatTime(dt.toISOString()); // Format: "HH:00"
    
    if (shouldRotate && i % 2 === 0) {
      // Rotate labels if too many points
      ctx.save();
      ctx.translate(xPos, padding.top + chartHeight + 20);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(timeStr, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(timeStr, xPos, padding.top + chartHeight + 10);
    }
  }
  
  // Mouse hover tooltip
  if (els.canvas._chartTooltipHandler) {
    els.canvas.removeEventListener("mousemove", els.canvas._chartTooltipHandler);
    els.canvas.removeEventListener("mouseleave", els.canvas._chartTooltipLeaveHandler);
  }
  
  els.canvas._chartTooltipHandler = function(e) {
    if (!els.tooltip) return;
    
    const canvasRect = els.canvas.getBoundingClientRect();
    const wrapperRect = els.canvas.parentElement.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    if (x < padding.left || x > padding.left + chartWidth || y < padding.top || y > padding.top + chartHeight) {
      els.tooltip.setAttribute("aria-hidden", "true");
      return;
    }
    
    const idx = Math.round(((x - padding.left) / chartWidth) * (values.length - 1));
    if (idx < 0 || idx >= values.length || values[idx] == null) {
      els.tooltip.setAttribute("aria-hidden", "true");
      return;
    }
    
    const val = values[idx];
    const dt = times[idx];
    const hour = hours[idx];
    
    let tooltipHTML = '<div class="chart-tooltip-time">' + escapeHtml(formatTime(dt.toISOString())) + '</div>';
    tooltipHTML += '<div class="chart-tooltip-value">' + escapeHtml(formatValue(val)) + '</div>';
    
    if (paramKey === "cloud" && hour) {
      const low = hour.cloud_low != null ? Math.round(hour.cloud_low) : null;
      const mid = hour.cloud_mid != null ? Math.round(hour.cloud_mid) : null;
      const high = hour.cloud_high != null ? Math.round(hour.cloud_high) : null;
      if (low != null || mid != null || high != null) {
        tooltipHTML += '<div class="chart-tooltip-cloud-detail">';
        if (low != null) tooltipHTML += 'Low: ' + low + '%<br>';
        if (mid != null) tooltipHTML += 'Mid: ' + mid + '%<br>';
        if (high != null) tooltipHTML += 'High: ' + high + '%';
        tooltipHTML += '</div>';
      }
    }
    
    els.tooltip.innerHTML = tooltipHTML;
    els.tooltip.setAttribute("aria-hidden", "false");
    
    // Position relative to canvas wrapper (which has position:relative)
    // Calculate position relative to wrapper
    const wrapperX = e.clientX - wrapperRect.left;
    const wrapperY = e.clientY - wrapperRect.top;
    
    // Show tooltip near cursor, but adjust if it goes outside wrapper
    els.tooltip.style.display = "block";
    const tooltipRect = els.tooltip.getBoundingClientRect();
    
    let tooltipX = wrapperX + 10;
    let tooltipY = wrapperY - tooltipRect.height - 10;
    
    // Adjust if tooltip goes outside wrapper bounds
    const maxX = wrapperRect.width - tooltipRect.width - 10;
    const maxY = wrapperRect.height - tooltipRect.height - 10;
    
    if (tooltipX > maxX) tooltipX = wrapperX - tooltipRect.width - 10; // Show on left side
    if (tooltipY < 10) tooltipY = wrapperY + 10; // Show below cursor
    
    els.tooltip.style.left = Math.max(10, Math.min(tooltipX, maxX)) + "px";
    els.tooltip.style.top = Math.max(10, Math.min(tooltipY, maxY)) + "px";
  };
  
  els.canvas._chartTooltipLeaveHandler = function() {
    if (els.tooltip) els.tooltip.setAttribute("aria-hidden", "true");
  };
  
  els.canvas.addEventListener("mousemove", els.canvas._chartTooltipHandler);
  els.canvas.addEventListener("mouseleave", els.canvas._chartTooltipLeaveHandler);
}

// Hour Inspector functionality
let hourInspectorOpen = false;

function getHourInspectorElements() {
  return {
    backdrop: document.getElementById("hourInspectorBackdrop"),
    sheet: document.getElementById("hourInspectorSheet"),
    time: document.getElementById("hourInspectorTime"),
    scoreVal: document.getElementById("hourInspectorScoreVal"),
    scoreLabel: document.getElementById("hourInspectorScoreLabel"),
    summary: document.getElementById("hourInspectorSummary"),
    body: document.getElementById("hourInspectorBody")
  };
}

function openHourInspector(hourIdx) {
  if (!weatherData || !weatherData.hours || hourIdx < 0 || hourIdx >= weatherData.hours.length) return;
  
  const els = getHourInspectorElements();
  if (!els.backdrop || !els.sheet) return;
  
  // Position sheet centered vertically within widget container bounds
  const widgetContainer = document.getElementById("poc-weather") || document.getElementById("w-weather") || document.querySelector(".card");
  if (widgetContainer) {
    const widgetRect = widgetContainer.getBoundingClientRect();
    const padding = window.innerWidth <= 768 ? 8 : 16; // Smaller padding on mobile
    const minPadding = 8; // Minimum padding from screen edges
    
    // Calculate left and right positions
    const leftPos = Math.max(minPadding, widgetRect.left + padding);
    const rightPos = Math.max(minPadding, window.innerWidth - widgetRect.right + padding);
    const maxWidth = Math.min(widgetRect.width - padding * 2, window.innerWidth - leftPos - rightPos);
    
    // Calculate max height - centered but constrained by widget and viewport
    const verticalPadding = padding * 2; // Padding top and bottom
    const maxHeight = Math.min(
      widgetRect.height - verticalPadding, // Don't exceed widget height
      window.innerHeight - verticalPadding // Don't exceed viewport
    );
    
    els.sheet.style.left = leftPos + "px";
    els.sheet.style.right = rightPos + "px";
    els.sheet.style.maxWidth = maxWidth + "px";
    els.sheet.style.maxHeight = maxHeight + "px";
    els.sheet.style.width = "auto";
    els.sheet.style.top = "50%";
    els.sheet.style.transform = "translateY(-50%)";
  } else {
    // Fallback: center on screen
    els.sheet.style.left = "50%";
    els.sheet.style.right = "auto";
    els.sheet.style.transform = "translate(-50%, -50%)";
    els.sheet.style.maxWidth = "90%";
    els.sheet.style.maxHeight = "80vh";
    els.sheet.style.width = "auto";
    els.sheet.style.top = "50%";
  }
  
  hourInspectorOpen = true;
  document.body.style.overflow = "hidden";
  
  els.backdrop.setAttribute("aria-hidden", "false");
  els.sheet.setAttribute("aria-hidden", "false");
  
  renderHourInspector(hourIdx);
}

function closeHourInspector() {
  const els = getHourInspectorElements();
  if (!els.backdrop || !els.sheet) return;
  
  hourInspectorOpen = false;
  document.body.style.overflow = "";
  
  els.backdrop.setAttribute("aria-hidden", "true");
  els.sheet.setAttribute("aria-hidden", "true");
  
  // Reset positioning
  els.sheet.style.left = "";
  els.sheet.style.right = "";
  els.sheet.style.maxWidth = "";
  els.sheet.style.maxHeight = "";
  els.sheet.style.width = "";
  els.sheet.style.top = "";
  els.sheet.style.transform = "";
}

function renderHourInspector(hourIdx) {
  if (!weatherData || !weatherData.hours || hourIdx < 0 || hourIdx >= weatherData.hours.length) return;
  
  const els = getHourInspectorElements();
  if (!els.time || !els.scoreVal || !els.scoreLabel || !els.summary || !els.body) return;
  
  const hour = weatherData.hours[hourIdx];
  const hours = weatherData.hours;
  
  // Header: time and score (compact single row)
  const timeStr = formatTime(hour.time);
  const score = formatScore(getHourScore(hour));
  const rank = scoreRank(score);
  
  // Update header structure: time + score + label in one row
  els.time.textContent = timeStr;
  els.scoreVal.textContent = score;
  els.scoreVal.style.color = "var(--" + scoreClass(score) + ")";
  els.scoreLabel.textContent = rank;
  els.scoreLabel.style.color = "var(--" + scoreClass(score) + ")";
  
  // Summary line (below header, smaller font)
  const summaryParts = [];
  const cloud = formatCloud(hour.cloud_total);
  if (cloud <= 20) summaryParts.push("Clear sky");
  else if (cloud >= 60) summaryParts.push("Cloudy");
  
  const wind = formatWind(hour.wind_m_s);
  if (wind != null) {
    if (wind <= 4) summaryParts.push("Calm wind");
    else if (wind >= 8) summaryParts.push("Windy");
    else summaryParts.push(wind + " m/s wind");
  }
  
  const visKm = formatVisibility(hour.visibility_m);
  if (visKm != null) summaryParts.push("Visibility " + visKm + " km");
  
  const tempStr = hour.temp_c != null && isValidValue(hour.temp_c) ? Math.round(Number(hour.temp_c)) + "°C" : null;
  if (tempStr) summaryParts.push(tempStr);
  
  els.summary.textContent = summaryParts.length > 0 ? summaryParts.join(" · ") : "—";
  
  // Body content
  let bodyHTML = "";
  
  // Context mini-chart (±4 hours, compact)
  const contextStart = Math.max(0, hourIdx - 4);
  const contextEnd = Math.min(hours.length - 1, hourIdx + 4);
  const contextHours = hours.slice(contextStart, contextEnd + 1);
  
  bodyHTML += '<div class="hour-inspector-section">';
  bodyHTML += '<div class="hour-inspector-mini-chart">';
  contextHours.forEach((h, i) => {
    const ctxIdx = contextStart + i;
    const ctxScore = formatScore(getHourScore(h));
    // Container height is 24px, so calculate pixel height (min 6px, max 20px)
    const barHeightPx = Math.max(6, Math.min(20, (ctxScore / 100) * 20));
    const isSelected = ctxIdx === hourIdx;
    const isMissing = ctxScore === 0 || h.score == null;
    bodyHTML += '<div class="hour-inspector-mini-bar' + (isSelected ? ' selected' : '') + (isMissing ? ' missing' : '') + '" style="height:' + barHeightPx + 'px" title="' + escapeHtml(formatTime(h.time)) + ': ' + ctxScore + '"></div>';
  });
  bodyHTML += '</div></div>';
  
  // Primary metrics grid (compact two-column list)
  bodyHTML += '<div class="hour-inspector-section">';
  bodyHTML += '<div class="hour-inspector-metric-grid">';
  
  // Clouds
  bodyHTML += '<div class="hour-inspector-metric-row"><span class="hour-inspector-metric-label">☁ Clouds</span><span class="hour-inspector-metric-value">' + cloud + '%</span></div>';
  
  // Wind
  bodyHTML += '<div class="hour-inspector-metric-row"><span class="hour-inspector-metric-label">🌬 Wind</span><span class="hour-inspector-metric-value">' + (wind != null ? wind + ' m/s' : '—') + '</span></div>';
  
  // Visibility
  bodyHTML += '<div class="hour-inspector-metric-row"><span class="hour-inspector-metric-label">👁 Visibility</span><span class="hour-inspector-metric-value">' + (visKm != null ? visKm + ' km' : '—') + '</span></div>';
  
  // Precip
  const prob = formatPrecipProb(hour.precip_prob);
  bodyHTML += '<div class="hour-inspector-metric-row"><span class="hour-inspector-metric-label">🌧 Precip</span><span class="hour-inspector-metric-value">' + prob + '%</span></div>';
  
  // Pressure
  const pressure = hour.pressure_hpa != null && isValidValue(hour.pressure_hpa) ? Math.round(hour.pressure_hpa) : null;
  bodyHTML += '<div class="hour-inspector-metric-row"><span class="hour-inspector-metric-label">🧭 Pressure</span><span class="hour-inspector-metric-value">' + (pressure != null ? pressure + ' hPa' : '—') + '</span></div>';
  
  // Seeing
  const seeing = formatSeeing(hour.seeing);
  const seeingLabel = seeing !== "—" ? (seeing <= 2 ? "Excellent" : seeing <= 4 ? "Fair" : "Poor") : "—";
  bodyHTML += '<div class="hour-inspector-metric-row"><span class="hour-inspector-metric-label">🔭 Seeing</span><span class="hour-inspector-metric-value">' + seeing + (seeingLabel !== "—" ? ' (' + seeingLabel + ')' : '') + '</span></div>';
  
  // Transparency
  const trans = formatTransparency(hour.transparency);
  const transLabel = trans !== "—" ? (trans <= 1 ? "Excellent" : trans <= 2 ? "Fair" : "Poor") : "—";
  bodyHTML += '<div class="hour-inspector-metric-row"><span class="hour-inspector-metric-label">✨ Transparency</span><span class="hour-inspector-metric-value">' + trans + (transLabel !== "—" ? ' (' + transLabel + ')' : '') + '</span></div>';
  
  // Temperature
  bodyHTML += '<div class="hour-inspector-metric-row"><span class="hour-inspector-metric-label">🌡 Temp</span><span class="hour-inspector-metric-value">' + (tempStr || '—') + '</span></div>';
  
  bodyHTML += '</div></div>';
  
  // "Why this hour" section
  const whyItems = [];
  const isGood = score >= 70;
  
  if (cloud <= 20) whyItems.push({ text: "Clear sky", positive: true });
  if (cloud >= 60) whyItems.push({ text: "Cloudy", positive: false });
  
  if (wind != null) {
    if (wind <= 4) whyItems.push({ text: "Calm wind", positive: true });
    if (wind >= 8) whyItems.push({ text: "Windy", positive: false });
  }
  
  if (visKm != null && visKm < 10) whyItems.push({ text: "Low visibility", positive: false });
  
  const seeingNum = hour.seeing != null && isValidValue(hour.seeing) ? Number(hour.seeing) : null;
  if (seeingNum != null && seeingNum >= 6) whyItems.push({ text: "Poor seeing", positive: false });
  
  const transNum = hour.transparency != null && isValidValue(hour.transparency) ? Number(hour.transparency) : null;
  if (transNum != null && transNum >= 3) whyItems.push({ text: "Poor transparency", positive: false });
  
  if (tempStr && hour.temp_c != null && hour.temp_c <= -10) whyItems.push({ text: "Very cold", positive: false });
  
  // "Why this hour" section (compact inline)
  if (whyItems.length > 0) {
    bodyHTML += '<div class="hour-inspector-section">';
    bodyHTML += '<ul class="hour-inspector-why-list">';
    whyItems.slice(0, 5).forEach(item => {
      bodyHTML += '<li class="' + (item.positive ? 'positive' : 'negative') + '">' + escapeHtml(item.text) + '</li>';
    });
    bodyHTML += '</ul></div>';
  }
  
  // Profile recommendations (compact one line)
  const profileScores = computeProfileScores(hour);
  const getProfileStatus = (s) => s >= 70 ? "good" : s >= 50 ? "fair" : "poor";
  const getProfileStatusLabel = (s) => s >= 70 ? "Good" : s >= 50 ? "Fair" : "Poor";
  
  bodyHTML += '<div class="hour-inspector-section">';
  bodyHTML += '<div class="hour-inspector-profile-grid">';
  bodyHTML += '<div class="hour-inspector-profile-item"><span class="hour-inspector-profile-label">Visual:</span><span class="hour-inspector-profile-status ' + getProfileStatus(profileScores.visual) + '">' + getProfileStatusLabel(profileScores.visual) + '</span></div>';
  bodyHTML += '<div class="hour-inspector-profile-item"><span class="hour-inspector-profile-label">Photo:</span><span class="hour-inspector-profile-status ' + getProfileStatus(profileScores.broadband) + '">' + getProfileStatusLabel(profileScores.broadband) + '</span></div>';
  bodyHTML += '<div class="hour-inspector-profile-item"><span class="hour-inspector-profile-label">Planetary:</span><span class="hour-inspector-profile-status ' + getProfileStatus(profileScores.planetary) + '">' + getProfileStatusLabel(profileScores.planetary) + '</span></div>';
  bodyHTML += '</div></div>';
  
  els.body.innerHTML = bodyHTML;
}

// Hour Inspector event handlers (initialize after DOM ready)
function initHourInspector() {
  const els = getHourInspectorElements();
  
  if (els.backdrop) {
    els.backdrop.addEventListener("click", function(e) {
      if (e.target === els.backdrop) {
        closeHourInspector();
      }
    });
  }
  
  if (els.sheet) {
    const closeBtn = els.sheet.querySelector(".hour-inspector-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeHourInspector);
    }
  }
  
  // ESC key for hour inspector
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && hourInspectorOpen && els.sheet && els.sheet.getAttribute("aria-hidden") === "false") {
      closeHourInspector();
    }
  });
}

// Initialize hour inspector handlers
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHourInspector);
} else {
  initHourInspector();
}

// Update sheet position on window resize
window.addEventListener("resize", function() {
  if (hourInspectorOpen) {
    const els = getHourInspectorElements();
    if (els.sheet && els.sheet.getAttribute("aria-hidden") === "false") {
      const widgetContainer = weatherCard || document.getElementById("poc-weather") || document.querySelector(".weather-widget") || document.querySelector("#widget-weather");
      if (widgetContainer) {
        const widgetRect = widgetContainer.getBoundingClientRect();
        const padding = window.innerWidth <= 768 ? 8 : 16;
        const minPadding = 8;
        
        const leftPos = Math.max(minPadding, widgetRect.left + padding);
        const rightPos = Math.max(minPadding, window.innerWidth - widgetRect.right + padding);
        const maxWidth = Math.min(widgetRect.width - padding * 2, window.innerWidth - leftPos - rightPos);
        
        const verticalPadding = padding * 2;
        const maxHeight = Math.min(
          widgetRect.height - verticalPadding,
          window.innerHeight - verticalPadding
        );
        
        els.sheet.style.left = leftPos + "px";
        els.sheet.style.right = rightPos + "px";
        els.sheet.style.maxWidth = maxWidth + "px";
        els.sheet.style.maxHeight = maxHeight + "px";
        els.sheet.style.width = "auto";
        els.sheet.style.top = "50%";
        els.sheet.style.transform = "translateY(-50%)";
      }
    }
  }
});

// Click handler for mini cards - moved to mountWeather function

// Close overlay handlers - initialized on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
  const els = getChartElements();
  if (els.overlay) {
    const closeBtn = els.overlay.querySelector(".chart-overlay-close");
    const backdrop = els.overlay.querySelector(".chart-overlay-backdrop");
    
    if (closeBtn) {
      closeBtn.addEventListener("click", closeChartOverlay);
    }
    
    if (backdrop) {
      backdrop.addEventListener("click", function(e) {
        if (e.target === backdrop) {
          closeChartOverlay();
        }
      });
    }
    
    // ESC key
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && els.overlay.getAttribute("aria-hidden") === "false") {
        closeChartOverlay();
      }
    });
  }
});

// Render weather widget HTML structure (location-agnostic; no city, profile, or time-range controls)
function renderWeatherHTML(rootEl) {
  rootEl.innerHTML = `
    <section class="card" id="poc-weather">
      <div class="kpi">
        <div class="box wide">
          <div class="overall-score-label">Overall score</div>
          <div class="overall-top">
            <div class="overall-left">
              <div class="overall-score-block">
                <div class="val" data-role="score-val">—</div>
                <div class="score-rank" data-role="score-rank">—</div>
              </div>
            </div>
            <div class="overall-right" data-role="heads-up" aria-live="polite">Heads-up: —</div>
            <div class="overall-bar-row">
              <div class="overall-bar-full">
                <div class="score-bar" data-role="score-bar">
                  <div class="score-bar-fill" style="width:0%"></div>
                </div>
              </div>
              <span class="score-bar-suffix" data-role="score-label">0 / 100</span>
            </div>
            <div class="overall-best-window" data-role="best-window" aria-live="polite"></div>
          </div>
          <div class="overall-explain-wrap">
            <div class="disclosure-row chips-row">
              <button type="button" class="explain-toggle-chip" data-role="explain-toggle" aria-expanded="false" aria-label="Expand score explanation">▶</button>
              <div class="now-factors" data-role="now-factors"></div>
            </div>
            <div class="explain-panel score-breakdown" data-role="explain-panel" aria-hidden="true">
              <div class="score-breakdown-panel">
                <div class="explain-panel-grid">
                  <div class="explain-column-left">
                    <h4 class="explain-title" data-role="explain-score-title">How this score was calculated</h4>
                    <div class="breakdown-lines" data-role="score-breakdown"></div>
                    <div class="breakdown-sum-wrap">
                      <div class="breakdown-sum" data-role="breakdown-total">Sum: —</div>
                    </div>
                  </div>
                  <div class="explain-column-right current-details-block">
                    <h4 class="explain-title">Current details</h4>
                    <table class="current-details-table" data-role="current-details-table">
                      <tbody></tbody>
                    </table>
                  </div>
                </div>
                <div class="expect-banner">
                  <h4 class="expect-banner-title">What to expect the next few hours:</h4>
                  <ul class="expect-banner-list" data-role="warnings-list"></ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="miniCharts" aria-label="mini trends" id="miniChartsContainer">
        <div class="mini" data-role="mini-score" data-chart="score" aria-label="Open chart: Score" tabindex="0">
          <div class="t">Score</div>
          <div class="bar" data-role="spark-score"></div>
          <div class="now" data-role="now-score">Now —</div>
        </div>
        <div class="mini" data-role="mini-cloud" data-chart="cloud" aria-label="Open chart: Cloud" tabindex="0">
          <div class="t">Cloud</div>
          <div class="bar" data-role="spark-cloud"></div>
          <div class="now" data-role="now-cloud">Now —%</div>
        </div>
        <div class="mini" data-role="mini-pressure" data-chart="pressure" aria-label="Open chart: Pressure" tabindex="0">
          <div class="t">Pressure</div>
          <div class="bar" data-role="spark-pressure"></div>
          <div class="now" data-role="now-pressure">Now — hPa</div>
        </div>
        <div class="mini" data-role="mini-seeing" data-chart="seeing" aria-label="Open chart: Seeing" tabindex="0">
          <div class="t">Seeing</div>
          <div class="bar" data-role="spark-seeing"></div>
          <div class="now" data-role="now-seeing">Now —</div>
        </div>
        <div class="mini" data-role="mini-transparency" data-chart="trans" aria-label="Open chart: Transparency" tabindex="0">
          <div class="t">Trans</div>
          <div class="bar" data-role="spark-transparency"></div>
          <div class="now" data-role="now-transparency">Now —</div>
        </div>
      </div>

      <div class="sectionTitle">Hourly (score)</div>
      <div class="hourly" aria-label="hourly scores" data-role="hourly">
        <!-- Will be populated by renderHourly -->
      </div>

      <div class="legend">
        <span><span class="dot" style="background:var(--good)"></span>good</span>
        <span><span class="dot" style="background:var(--mid)"></span>fair</span>
        <span><span class="dot" style="background:var(--bad)"></span>poor</span>
      </div>
      <div class="weather-meta" data-role="weather-meta" aria-live="polite">—</div>
    </section>
  `;
}

export function mountWeather(rootEl, storeApi) {
  // Render HTML structure
  renderWeatherHTML(rootEl);
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  
  // Set up event handlers for mini charts
  const miniChartsContainer = weatherCard.querySelector("#miniChartsContainer");
  if (miniChartsContainer) {
    miniChartsContainer.addEventListener("click", function(e) {
      const mini = e.target.closest(".mini[data-chart]");
      if (!mini) return;
      const paramKey = mini.dataset.chart;
      openChartOverlay(paramKey);
    });
    
    // Keyboard support
    miniChartsContainer.addEventListener("keydown", function(e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const mini = e.target.closest(".mini[data-chart]");
      if (!mini) return;
      e.preventDefault();
      const paramKey = mini.dataset.chart;
      openChartOverlay(paramKey);
    });
  }
  
  // Subscribe to state changes (profile + range from Controls; location from Location widget)
  let lastLocKey = "";
  const unsubscribe = storeApi.subscribe(async (state) => {
    if (!state.location || !state.location.lat || !state.location.lon) return;
    const locKey = state.location.lat + "," + state.location.lon;
    const locationChanged = lastLocKey !== locKey;
    lastLocKey = locKey;
    activeProfile = state.profile || "default";
    currentMode = state.range || "today";
    if (locationChanged) {
      await loadWeather(rootEl, state);
    } else if (weatherData && weatherData.hours) {
      var r = findNearestHour(weatherData.hours);
      renderNow(rootEl, r.hour);
      renderHourly(rootEl, weatherData.hours);
      renderMiniCharts(rootEl, weatherData.hours, currentMode, r.hour);
      renderBestWindows(rootEl, null, weatherData.hours);
      const chartEls = getChartElements();
      if (currentChartParam && chartEls.overlay && chartEls.overlay.getAttribute("aria-hidden") === "false") {
        renderChart(currentChartParam);
      }
    }
  });
  
  // Auto-refresh: only if tab is active and at least 5 minutes passed
  let autoRefreshTimer = null;
  function setupAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(function() {
      if (document.hidden) return; // Tab not active
      if (Date.now() - lastWeatherFetchTime < WEATHER_REFRESH_INTERVAL_MS) return;
      const currentState = storeApi.getState();
      if (currentState.location && currentState.location.lat && currentState.location.lon) {
        loadWeather(rootEl, currentState, true).catch(function(err) {
          console.error("[weather] Auto-refresh failed:", err);
        });
      }
    }, WEATHER_REFRESH_INTERVAL_MS);
  }
  
  // Initial load - trigger immediately with current state
  const initialState = storeApi.getState();
  if (initialState.location && initialState.location.lat && initialState.location.lon) {
    lastLocKey = initialState.location.lat + "," + initialState.location.lon;
    loadWeather(rootEl, initialState).catch(err => {
      console.error("[weather] Initial weather load failed:", err);
    });
  }
  
  setupAutoRefresh();
  
  // Pause auto-refresh when tab becomes hidden
  document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
      }
    } else {
      setupAutoRefresh();
    }
  });
  
  return {
    unmount: () => {
      if (unsubscribe) unsubscribe();
    }
  };
}

