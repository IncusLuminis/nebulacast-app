// URL from config (set by weather/index.html)
const ASTRO_WEATHER_URL = (window.__WEATHER_POC_CONFIG && window.__WEATHER_POC_CONFIG.fallbackLegacyUrl) || "/weather/daily_weather.json";
const LOCATIONS_INDEX_URL = window.__WEATHER_POC_CONFIG && window.__WEATHER_POC_CONFIG.locationsIndexUrl;
const LOCATION_DATA_BASE = window.__WEATHER_POC_CONFIG && window.__WEATHER_POC_CONFIG.locationDataBase;
const API_ASTRO_WEATHER_URL = (window.__WEATHER_POC_CONFIG && window.__WEATHER_POC_CONFIG.apiAstroWeatherUrl) || "/api/astro-weather";


let weatherData = null;
let activeProfile = "balanced";
let locationsIndex = null;
let currentLocationId = null;
let currentLocationCoords = null; // {lat, lon, tz} for API mode
let isFetchingWeather = false;
let lastWeatherFetchTime = 0;
const WEATHER_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let sunMoonEventsCache = null; // null = not loaded yet; [] = loaded (may be empty)
let layoutMode = "default"; // "default" | "vertical"

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
  const tz = weatherData && weatherData.location && weatherData.location.tz;
  if (tz) {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
      const hPart = parts.find(p => p.type === "hour");
      if (hPart) return hPart.value.padStart(2, "0") + ":00";
    } catch (_) {}
  }
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
  if (s >= 75) return "Excellent atmosphere";
  if (s >= 50) return "Good atmosphere";
  if (s >= 30) return "Fair atmosphere";
  return "Poor atmosphere";
}

// Helper: parse ISO date safely
function parseISO(d) {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t;
}

/// Helper: find the current hour (floor to hour boundary, same logic as hourly "NOW" card)
function findNearestHour(hours) {
  if (!hours || !hours.length) return { hour: null, dt: null, idx: 0 };
  const currentHourStart = Math.floor(Date.now() / 3600000) * 3600000;

  // Prefer the hour whose timestamp falls within the current hour window
  let best = null, bestDt = null, bestIdx = 0, bestDiff = Infinity;
  hours.forEach((h, i) => {
    const dt = parseISO(h.time);
    if (!dt) return;
    const ms = dt.getTime();
    // Exact match: this slot IS the current hour
    if (ms >= currentHourStart && ms < currentHourStart + 3600000) {
      if (ms - currentHourStart < bestDiff) {
        bestDiff = ms - currentHourStart;
        best = h; bestDt = dt; bestIdx = i;
      }
    } else if (best === null) {
      // Fallback: nearest by abs diff
      const diff = Math.abs(ms - currentHourStart);
      if (diff < bestDiff) { bestDiff = diff; best = h; bestDt = dt; bestIdx = i; }
    }
  });
  return { hour: best, dt: bestDt, idx: bestIdx };
}

// Helper: format values according to rules
function formatScore(score) {
  return Math.round(score ?? 0);
}

function scoreRank(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "—";
  if (n >= 90) return "EXCELLENT";
  if (n >= 75) return "GOOD";
  if (n >= 60) return "FAIR";
  if (n >= 40) return "POOR";
  return "VERY POOR";
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
  const isNight = isAstronomicalNight(hour);
  const code = hour.weather_code;

  // Primary: WMO weather_code from Open-Meteo (#117)
  if (code != null) {
    if (code === 0 || code === 1)             return isNight ? "night.svg" : "sun.svg";
    if (code === 2)                            return "partly-cloudy.svg";
    if (code === 3) {
      // Overcast, but still check if actual precipitation is expected
      const mm3 = hour.precip_mm != null && hour.precip_mm !== -9999 ? hour.precip_mm : 0;
      const prob3 = (hour.precip_prob != null && hour.precip_prob <= 1) ? hour.precip_prob * 100 : (hour.precip_prob ?? 0);
      if (mm3 > 0 || prob3 >= 50) return "rain.svg";
      return "cloud.svg";
    }
    if (code === 45 || code === 48)            return "fog.svg";
    if (code >= 51 && code <= 67)             return "rain.svg";
    if (code >= 71 && code <= 77)             return "rain.svg";   // snow → rain fallback (no snow.svg yet)
    if (code >= 80 && code <= 82)             return "rain.svg";
    if (code >= 85 && code <= 86)             return "rain.svg";   // snow showers
    if (code >= 95 && code <= 99)             return "thunderstorm.svg";
  }

  // Fallback: derive from raw fields
  const vis = hour.visibility_m;
  if (vis != null && vis !== -9999 && vis < 2000) return "fog.svg";
  const prob = (hour.precip_prob != null && hour.precip_prob <= 1) ? hour.precip_prob * 100 : (hour.precip_prob ?? 0);
  const mm = hour.precip_mm != null && hour.precip_mm !== -9999 ? hour.precip_mm : 0;
  if (prob >= 60 && mm > 0) return "thunderstorm.svg";
  if (mm > 0 || prob >= 50) return "rain.svg";
  const c = (hour.cloud_total != null && hour.cloud_total <= 1) ? hour.cloud_total * 100 : (hour.cloud_total ?? 0);
  if (isNight && c < 20) return "night.svg";
  if (c >= 80) return "cloud.svg";
  if (c >= 30) return "partly-cloudy.svg";
  return "sun.svg";
}

// Weather condition label for cards: rain / snow / fog / haze (#117)
// Returns { icon: string, label: string } or null
function weatherConditionLabel(hour) {
  if (!hour) return null;
  const snow = hour.snow_mm != null && hour.snow_mm > 0;
  const rain = hour.rain_mm != null && hour.rain_mm > 0;
  const precip = hour.precip_mm != null && hour.precip_mm > 0;
  const prob   = hour.precip_prob != null
    ? (hour.precip_prob <= 1 ? hour.precip_prob * 100 : hour.precip_prob) : 0;
  const visKm  = hour.visibility_km != null ? hour.visibility_km
    : (hour.visibility_m != null ? hour.visibility_m / 1000 : null);
  const fogRisk = hour.fog_risk;

  // Precipitation takes priority
  if (snow)             return { icon: "❄️", label: "snow" };
  if (rain || precip)   return { icon: "🌧", label: "rain" };
  if (prob >= 30)       return { icon: "🌦", label: "rain possible" };

  // Visibility-based fog / haze
  if (visKm != null) {
    if (visKm < 1)  return { icon: "🌁", label: "fog" };
    if (visKm < 5)  return { icon: "🌫", label: "mist" };
    if (visKm < 10) return { icon: "🌫", label: "haze" };
  }
  if (fogRisk === "HIGH") return { icon: "🌫", label: "fog risk" };

  return null;
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
  { ico: "☁️", label: "Clouds", key: "cloud" },
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
  if (score >= 75) return "good";   // EXCELLENT + GOOD → green
  if (score >= 50) return "mid";    // FAIR → yellow
  return "bad";                     // POOR + CLOSED → red
}

// Solar illumination state: day / twilight / night (#114)
function getSolarState(hour) {
  if (hour.solar_state) return hour.solar_state;
  const alt = hour.sun_alt_deg;
  if (alt == null) return "night";
  if (alt > 0) return "day";
  if (alt >= -18) return "twilight";
  return "night";
}

// Moon phase emoji from illumination fraction (0-1) + waxing flag (#115)
function moonPhaseEmoji(illumPct, waxing) {
  if (illumPct == null) return "🌙";
  const f = illumPct > 1 ? illumPct / 100 : illumPct; // normalise to 0-1
  if (f < 0.03) return "🌑";
  if (f > 0.97) return "🌕";
  if (f < 0.47) return waxing ? "🌒" : "🌘";
  if (f < 0.53) return waxing ? "🌓" : "🌗";
  return waxing ? "🌔" : "🌖";
}

// Moon phase name for tooltip (#115)
function moonPhaseName(illumPct, waxing) {
  if (illumPct == null) return "Unknown";
  const f = illumPct > 1 ? illumPct / 100 : illumPct;
  if (f < 0.03) return "New Moon";
  if (f > 0.97) return "Full Moon";
  if (f < 0.47) return waxing ? "Waxing Crescent" : "Waning Crescent";
  if (f < 0.53) return waxing ? "First Quarter"   : "Last Quarter";
  return waxing ? "Waxing Gibbous" : "Waning Gibbous";
}

// Moon badge: top-right corner, hidden during day or when moon below horizon (#115)
function renderMoonBadge(hour) {
  const alt = hour.moon_alt_deg;
  if (alt == null || alt <= 0 || getSolarState(hour) === "day") return "";
  const emoji = moonPhaseEmoji(hour.moon_illum_pct, hour.moon_waxing);
  const altRounded = Math.round(alt);
  const illum = hour.moon_illum_pct != null ? Math.round(hour.moon_illum_pct) + "%" : "—";
  const phaseName = moonPhaseName(hour.moon_illum_pct, hour.moon_waxing);
  const tip = `Moon\nPhase: ${phaseName}\nAltitude: ${altRounded}°\nIllumination: ${illum}`;
  return `<div class="moon-badge" title="${escapeHtml(tip)}">${emoji}${altRounded}°</div>`;
}

function renderSunBadge(hour) {
  const alt = hour.sun_alt_deg;
  if (alt == null || alt <= 0) return "";
  const altRounded = Math.round(alt);
  return `<div class="sun-badge" title="Sun altitude: ${altRounded}°">☀${altRounded}°</div>`;
}

function renderCelestialBadges(hour) {
  const sun  = renderSunBadge(hour);
  const moon = renderMoonBadge(hour);
  if (!sun && !moon) return "";
  return `<div class="celestial-badges">${sun}${moon}</div>`;
}

// Condition marker quality class from 0-100 score or null (#115)
function _markerClass(quality) {
  if (quality == null) return "cq-none";
  if (quality >= 80) return "cq-excellent";
  if (quality >= 60) return "cq-good";
  if (quality >= 40) return "cq-fair";
  return "cq-poor";
}

// 4 condition markers: Clouds · Transparency · Seeing · Moon (#115)
function renderConditionMarkers(hour) {
  // Cloud quality: 0-100% cover → inverted quality
  const cloud = hour.cloud_total != null ? Math.max(0, 100 - (hour.cloud_total > 1 ? hour.cloud_total : hour.cloud_total * 100)) : null;

  // Transparency: 1–4 scale (4 = best) → map to 0–100
  const trans = hour.transparency != null && hour.transparency > 0
    ? (hour.transparency - 1) / 3 * 100 : null;

  // Seeing: fwhm arcsec → quality score (spec thresholds)
  let seeingQ = null;
  const fwhm = hour.seeing && hour.seeing.fwhm_arcsec;
  if (fwhm != null && isValidValue(fwhm)) {
    if (fwhm <= 1.0)      seeingQ = 90;
    else if (fwhm <= 1.5) seeingQ = 70;
    else if (fwhm <= 2.5) seeingQ = 50;
    else                  seeingQ = 20;
  }

  // Moon impact: above horizon → depends on illumination
  let moonQ = null;
  const moonAlt = hour.moon_alt_deg;
  const moonIllum = hour.moon_illum_pct;
  if (getSolarState(hour) === "day") {
    moonQ = null; // irrelevant in daytime
  } else if (moonAlt != null && moonAlt <= 0) {
    moonQ = 100; // below horizon – no impact
  } else if (moonIllum != null) {
    // Matches backend: moon_q = max(0, 100 - 1.1 × illum)
    const illum = moonIllum > 1 ? moonIllum : moonIllum * 100;
    moonQ = Math.max(0, Math.round(100 - 1.1 * illum));
  }

  const markers = [
    { q: cloud,   icon: "☁",  tip: "Cloud cover quality" },
    { q: trans,   icon: "🌫", tip: "Transparency quality" },
    { q: seeingQ, icon: "🔭", tip: "Seeing quality" },
    { q: moonQ,   icon: "🌙", tip: "Moon brightness impact" },
  ];

  const bars  = markers.map(m => `<div class="cond-mark ${_markerClass(m.q)}" title="${escapeHtml(m.tip)}"></div>`).join("");
  const icons = markers.map(m => `<div class="cond-icon" title="${escapeHtml(m.tip)}">${m.icon}</div>`).join("");
  return `<div class="cond-markers">${bars}</div><div class="cond-icons">${icons}</div>`;
}



const PROFILE_IDS = ["balanced", "visual", "broadband", "planetary"];
function getActiveProfile() {
  const profiles = Array.isArray(weatherData?.profiles) && weatherData.profiles.length
    ? ["balanced", ...weatherData.profiles.filter(p => p !== "balanced")]
    : PROFILE_IDS;
  if (!profiles.includes(activeProfile)) {
    const def = typeof weatherData?.default_profile === "string" ? weatherData.default_profile : "balanced";
    activeProfile = profiles.includes(def) ? def : profiles[0];
  }
  return activeProfile;
}
// v5 category weights (mirrors backend score.ts) — profile_weight × category_score
const V5_CATEGORY_WEIGHTS = {
  balanced:  { atmosphere:0.40, sky_darkness:0.40, dew_safety:0.10, stability:0.10 },
  visual:    { atmosphere:0.30, sky_darkness:0.40, dew_safety:0.10, stability:0.20 },
  broadband: { atmosphere:0.30, sky_darkness:0.30, dew_safety:0.20, stability:0.20 },
  planetary: { atmosphere:0.20, sky_darkness:0.20, dew_safety:0.10, stability:0.50 },
};

// Normalize cloud_total to 0-100 regardless of whether stored as fraction (0-1) or percent (0-100)
function _cloudPct(hour) {
  const v = hour?.cloud_total;
  if (v == null) return 0;
  return v <= 1 ? Math.round(v * 100) : Math.round(v);
}

function getHourScore(hour) {
  if (!hour) return 0;

  const profile = getActiveProfile();
  // Daylight gate: sun above horizon → sky_darkness = 0.
  // The backend already computes atmosphere/dew/stability correctly for any cloud type,
  // so we trust those scores and only override sky_darkness on our side.
  const daytime = getSolarState(hour) === "day";

  if (!daytime) {
    // No gates active — prefer pre-computed sentinel from Python backend
    const profBd = hour.score_breakdown_by_profile?.[profile];
    if (Array.isArray(profBd)) {
      const sentinel = profBd.find(b => b._final_score != null);
      if (sentinel != null) return sentinel._final_score;
    }
  }

  // v5: recompute from the 4 category scores, applying daylight gate to sky_darkness
  if (
    hour.sky_darkness_score != null &&
    hour.dew_safety_score   != null &&
    hour.stability_score    != null
  ) {
    const w        = V5_CATEGORY_WEIGHTS[profile] || V5_CATEGORY_WEIGHTS.balanced;
    const skyScore = daytime ? 0 : (hour.sky_darkness_score_by_profile?.[profile] ?? hour.sky_darkness_score);
    const atmScore = hour.atmosphere_score ?? 0;
    const raw =
      Math.round(w.atmosphere   * atmScore)              +
      Math.round(w.sky_darkness * skyScore)              +
      Math.round(w.dew_safety   * hour.dew_safety_score) +
      Math.round(w.stability    * hour.stability_score);
    return Math.max(0, Math.min(100, raw));
  }

  // Fallback: for "balanced" profile use API score directly
  if (profile === "balanced") {
    return hour.score != null ? formatScore(hour.score) : 0;
  }
  // Fallback: legacy profile_scores field
  const ps = hour.profile_scores;
  if (ps && typeof ps === "object" && ps[profile] != null) {
    const v = ps[profile];
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return hour.score != null ? formatScore(hour.score) : 0;
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
let hourlyMode = "observing"; // "observing" | "weather"
const STORAGE_KEY_VERTICAL_TAB = "nc-weather-vertical-tab";
const STORAGE_KEY_PROFILE = "nc-weather-profile";
const STORAGE_KEY_MATRIX_OVERLAYS = "nc-weather-matrix-overlays";
const STORAGE_KEY_VERTICAL_PANELS = "nc-weather-vertical-panels";
let matrixOverlayParams = new Set(["sun", "moon"]); // active overlay keys (multi)

// Helper: FWHM seeing indicator for observing mode cards
function seingIndicator(hour) {
  const fwhm = hour.seeing && hour.seeing.fwhm_arcsec;
  if (fwhm == null || !isValidValue(fwhm)) return "";
  let circle, cls;
  if (fwhm <= 1.0)      { circle = "●"; cls = "seeing-excellent"; }
  else if (fwhm <= 1.5) { circle = "◉"; cls = "seeing-good"; }
  else if (fwhm <= 2.5) { circle = "○"; cls = "seeing-fair"; }
  else                   { circle = "◯"; cls = "seeing-poor"; }
  return `<div class="seeing-ind ${cls}">${circle} ${fwhm.toFixed(1)}" <span>Seeing</span></div>`;
}

// Helper: human-readable label for score — delegates to scoreRank for consistency
function scoreLabelText(sc, score) {
  return scoreRank(score);
}

// Card renderer: Observing mode
function renderObservingCard(hour, hourIdx, isCurrent = false) {
  const timeStr = formatTime(hour.time);
  const score = formatScore(getHourScore(hour));
  const sc = scoreClass(score);
  const gateStatus = typeof hour.gate === "string" ? hour.gate : ((hour.gate && hour.gate.status) ? hour.gate.status : "OPEN");
  const solarCls = getSolarState(hour);

  const cloud = formatCloud(hour.cloud_total);
  const tempStr = hour.temp_c != null && isValidValue(hour.temp_c) ? Math.round(Number(hour.temp_c)) + "°C" : null;
  const wind = formatWind(hour.wind_m_s);
  const visKm = formatVisibility(hour.visibility_m);
  const prob = formatPrecipProb(hour.precip_prob);

  const paramLines = [
    `☁️ ${cloud}%`,
    tempStr ? `🌡 ${tempStr}` : null,
    prob > 0 ? `🌧️ ${prob}%` : null,
    wind != null ? `💨 ${wind}m/s` : null,
    visKm != null ? `👁️ ${visKm}km` : null
  ].filter(Boolean);
  if (paramLines.length === 0) paramLines.push("—");

  return `
    <div class="hour gate-${gateStatus} ${solarCls}${isCurrent ? ' is-current' : ''}" data-hour-idx="${hourIdx}" style="cursor:pointer">
      ${isCurrent ? '<div class="now-marker">Now</div>' : ''}
      <div class="hour-top-row">
        <div class="t">${escapeHtml(timeStr)}</div>
        ${renderCelestialBadges(hour)}
      </div>
      ${renderConditionMarkers(hour)}
      <div class="obs-score" style="color:var(--${sc})">${score}</div>
      <div class="score-label ${sc}">${scoreLabelText(sc, score)}</div>
      ${seingIndicator(hour)}
      <div class="hour-params">
        ${paramLines.map(line => `<div class="b">${escapeHtml(line)}</div>`).join("")}
      </div>
    </div>
  `;
}

// Card renderer: Weather mode
function renderWeatherCard(hour, hourIdx, isCurrent = false) {
  const timeStr = formatTime(hour.time);
  const score = formatScore(getHourScore(hour));
  const sc = scoreClass(score);
  const gateStatus = typeof hour.gate === "string" ? hour.gate : ((hour.gate && hour.gate.status) ? hour.gate.status : "OPEN");
  const solarCls = getSolarState(hour);

  const tempStr = hour.temp_c != null && isValidValue(hour.temp_c) ? Math.round(Number(hour.temp_c)) + "°C" : "—";
  const cloud = formatCloud(hour.cloud_total);
  const wind = formatWind(hour.wind_m_s);
  const visKm = formatVisibility(hour.visibility_m);
  const prob = formatPrecipProb(hour.precip_prob);

  const cond = weatherConditionLabel(hour);
  const paramLines = [
    `☁️ ${cloud}%`,
    prob > 0 ? `🌧️ ${prob}%` : null,
    cond ? `${cond.icon} ${cond.label}` : null,
    wind != null ? `💨 ${wind}m/s` : null,
    visKm != null ? `👁️ ${visKm}km` : null
  ].filter(Boolean);
  if (paramLines.length === 0) paramLines.push("—");

  const iconName = pickIcon(hour);
  var iconBase = (window.__WEATHER_POC_CONFIG && window.__WEATHER_POC_CONFIG.iconBase) ? window.__WEATHER_POC_CONFIG.iconBase : "/assets/icons/weather";
  const iconPath = (iconBase.charAt(iconBase.length - 1) === "/" ? iconBase : iconBase + "/") + iconName;

  return `
    <div class="hour gate-${gateStatus} ${solarCls}${isCurrent ? ' is-current' : ''}" data-hour-idx="${hourIdx}" style="cursor:pointer">
      ${isCurrent ? '<div class="now-marker">Now</div>' : ''}
      <div class="t">${escapeHtml(timeStr)}</div>
      <img class="wx-ico" src="${escapeHtml(iconPath)}" alt="" aria-hidden="true">
      <div class="wx-temp">${escapeHtml(tempStr)}</div>
      <div class="hour-params">
        ${paramLines.map(line => `<div class="b">${escapeHtml(line)}</div>`).join("")}
      </div>
      <div class="obs-score-small" style="color:var(--${sc})">Obs: ${score}</div>
    </div>
  `;
}

function renderHourly(rootEl, hours) {
  ensureFbStyles();
  // Find the weather card inside rootEl
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const hourlyEl = weatherCard.querySelector(".hourly");
  if (!hourlyEl) return;

  const now = Date.now();
  const tz = weatherData?.location?.tz || "UTC";
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  // Include the current hour (floor now to hour boundary)
  const currentHourStart = Math.floor(now / 3600000) * 3600000;
  let futureHours = hours.filter(h => {
    const dt = parseISO(h.time);
    return dt && dt.getTime() >= currentHourStart;
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
    const dt = parseISO(hour.time);
    const isCurrent = dt && dt.getTime() >= currentHourStart && dt.getTime() < currentHourStart + 3600000;
    return hourlyMode === "weather"
      ? renderWeatherCard(hour, hourIdx, isCurrent)
      : renderObservingCard(hour, hourIdx, isCurrent);
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
  const hours = weatherData?.hours || [];
  renderTpTimeLocation(rootEl, nowHour);
  renderTpQuality(rootEl, nowHour);
  renderTpBestWindow(rootEl, hours);
  renderTpSkyStatus(rootEl, nowHour, hours);
  renderExplainPanel(rootEl, nowHour, hours);
}

// Shared param row renderer — used in both renderExplainPanel and Hour Inspector
function renderScoreParamRow(p) {
  const label = escapeHtml(p.label || '');

  if (p.display === 'skybrightness_bar') {
    const bPct = typeof p.value === 'number' ? p.value : 0;
    const barClr = _fbColor(100 - bPct);
    const wtStr = p.weight != null ? '<span class="hi-param-weight">×' + p.weight.toFixed(2) + '</span>' : '<span class="hi-param-weight"></span>';
    const sum = (p.sun_c ?? 0) + (p.moon_c ?? 0) + (p.bortle_c ?? 0);
    const ptsStr = '<span class="hi-param-pts">' + Math.round(sum * 100) + '</span>';
    return '<div class="hi-param-row">'
      + '<span class="hi-param-label">' + label + '</span>'
      + '<div class="hi-param-bar-wrap">'
      + '<div class="hi-param-bar-fill" style="width:' + bPct + '%;background:' + barClr + '"></div>'
      + '<span class="hi-param-bar-text">' + bPct + '%</span>'
      + '</div>'
      + wtStr + ptsStr
      + '</div>';
  }

  if (p.display === 'sky_icons') {
    const factor = typeof p.value === 'number' ? p.value : 0;
    const count  = Math.min(10, Math.round(factor * 10));
    const ico    = p.icon || '●';
    const filled = ico.repeat(count);
    const empty  = count < 10 ? '<span style="opacity:0.18">' + ico.repeat(10 - count) + '</span>' : '';
    const contrib = p.contribution != null
      ? '<span class="hi-param-pts" style="color:var(--muted);font-weight:400">=' + p.contribution.toFixed(2) + '</span>'
      : '<span class="hi-param-pts hi-param-pts-na"></span>';
    const wt = p.weight != null
      ? '<span class="hi-param-weight">×' + p.weight.toFixed(2) + '</span>'
      : '<span class="hi-param-weight"></span>';
    return '<div class="hi-param-row hi-param-row-icons">'
      + '<span class="hi-param-label">' + label + '</span>'
      + '<span class="hi-param-icons-val">' + filled + empty + '</span>'
      + wt + contrib
      + '</div>';
  }

  if (p.display === 'cloudness_bar') {
    const cPct = typeof p.value === 'number' ? p.value : 0;
    const barClr = _fbColor(100 - cPct);
    const wtStr = p.weight != null ? '<span class="hi-param-weight">×' + p.weight.toFixed(2) + '</span>' : '<span class="hi-param-weight"></span>';
    const sum = (p.low_c ?? 0) + (p.mid_c ?? 0) + (p.high_c ?? 0);
    const ptsStr = '<span class="hi-param-pts">' + Math.round(sum * 100) + '</span>';
    return '<div class="hi-param-row">'
      + '<span class="hi-param-label">' + label + '</span>'
      + '<div class="hi-param-bar-wrap">'
      + '<div class="hi-param-bar-fill" style="width:' + cPct + '%;background:' + barClr + '"></div>'
      + '<span class="hi-param-bar-text">' + cPct + '%</span>'
      + '</div>'
      + wtStr + ptsStr
      + '</div>';
  }

  if (p.display === 'cloud_icons') {
    const pct   = typeof p.value === 'number' ? p.value : 0;
    const count = Math.min(10, Math.round(pct / 10));
    const filled = '☁'.repeat(count);
    const empty  = count < 10 ? '<span style="opacity:0.18">' + '☁'.repeat(10 - count) + '</span>' : '';
    const contrib = p.contribution != null
      ? '<span class="hi-param-pts" style="color:var(--muted);font-weight:400">=' + p.contribution.toFixed(2) + '</span>'
      : '<span class="hi-param-pts hi-param-pts-na"></span>';
    const wt = p.weight != null
      ? '<span class="hi-param-weight">×' + p.weight.toFixed(1) + '</span>'
      : '<span class="hi-param-weight"></span>';
    return '<div class="hi-param-row hi-param-row-icons">'
      + '<span class="hi-param-label">' + label + '</span>'
      + '<span class="hi-param-icons-val">' + filled + empty + '</span>'
      + wt + contrib
      + '</div>';
  }

  // Default: bar row
  const pts      = p.points != null ? Math.round(p.points)  : null;
  const rawPct   = p.score  != null ? Math.round(p.score)   : pts;
  const paramPct = rawPct   != null ? Math.max(0, Math.min(100, rawPct)) : null;
  const paramClr = paramPct != null ? _fbColor(paramPct) : '#555';
  const wt       = p.weight != null ? p.weight.toFixed(2) : null;
  const wtStr    = wt != null ? '<span class="hi-param-weight">×' + wt + '</span>' : '<span class="hi-param-weight"></span>';
  const ptsStr   = pts != null
    ? '<span class="hi-param-pts" style="color:' + paramClr + '">='+  pts + '</span>'
    : '<span class="hi-param-pts hi-param-pts-na">—</span>';
  return '<div class="hi-param-row">'
    + '<span class="hi-param-label">' + label + '</span>'
    + '<div class="hi-param-bar-wrap">'
    + (paramPct != null
        ? '<div class="hi-param-bar-fill" style="width:' + paramPct + '%;background:' + paramClr + '"></div>'
          + '<span class="hi-param-bar-text">' + paramPct + '%</span>'
        : '')
    + '</div>'
    + wtStr + ptsStr
    + '</div>';
}

function renderExplainPanel(rootEl, nowHour, hours) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const { idx: i0 } = findNearestHour(hours);
  const scoreTitle = weatherCard.querySelector('[data-role="explain-score-title"]');
  const scoreList = weatherCard.querySelector('[data-role="score-breakdown"]');
  const totalLine = weatherCard.querySelector('[data-role="breakdown-total"]');
  const currentDetailsTbody = weatherCard.querySelector('[data-role="current-details-table"] tbody');
  const warningsList = weatherCard.querySelector('[data-role="warnings-list"]');

  if (!nowHour) return;

  if (scoreTitle) scoreTitle.textContent = "How this score was calculated" + (weatherData?.scoring_version === "v5" ? " (v5)" : weatherData?.scoring_version === "v2" ? " (additive v2)" : weatherData?.scoring_version === "v1" ? " (legacy)" : "");
  const profile = getActiveProfile();
  const profileKey = profile === "balanced" ? "balanced" : (profile === "broadband" ? "broadband" : profile);
  // Prefer v5 score_breakdown (has display fields) over score_breakdown_by_profile (v2 engine format)
  const _bdV5 = nowHour?.score_breakdown;
  const _bdByProfile = nowHour?.score_breakdown_by_profile?.[profileKey] || nowHour?.score_breakdown_by_profile?.[profile];
  const breakdown = (Array.isArray(_bdV5?.categories) && _bdV5.categories.length > 0) ? _bdV5 : (_bdByProfile || _bdV5);
  const isV2Breakdown = Array.isArray(breakdown);
  const isV5Breakdown = breakdown && Array.isArray(breakdown.categories) && breakdown.categories.length > 0;
  const hasPenaltyBreakdown = breakdown && typeof breakdown.penalties === "object";

  if (totalLine) {
    if (isV5Breakdown || isV2Breakdown) {
      // Always show v5 getHourScore so Details total matches the panel and hourly cards
      const finalScore = formatScore(getHourScore(nowHour));
      const gate = typeof nowHour?.gate === "string" ? nowHour.gate : (nowHour?.gate?.status ?? "OPEN");
      const gateInfo = gate !== "OPEN" ? ` (gate: ${gate})` : "";
      totalLine.textContent = `Score: ${finalScore}${gateInfo}`;
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
      ensureFbStyles();
      // Filter out hidden sentinel items; render multiplier rows differently
      scoreList.innerHTML = breakdown.filter(b => !b.is_info).map(b => {
        const textPart = (b.label || b.key);
        const hasTip = (TOOLTIPS && TOOLTIPS[b.key]);
        const fs2 = b.factor_score != null ? b.factor_score : Math.round(100 * (b.normalized || 0));
        const fc2 = _fbColor(fs2);
        if (b.is_multiplier) {
          // Solar factor row: show ×N multiplier instead of → +X
          return `<div class="breakdown-line breakdown-multiplier"><span class="factor-info breakdown-ii" data-tooltip-key="${escapeHtml(b.key)}" aria-label="Info">(i)</span><span class="breakdown-text">${escapeHtml(textPart)}</span><div class="bd-bar-wrap"><div class="bd-bar-fill" style="width:${fs2}%;background:${fc2}"></div></div><span class="contrib contrib-mult">×${b.raw ?? fs2 / 100}</span></div>`;
        }
        const contribSign = (b.earned < 0) ? "" : "+";
        return `<div class="breakdown-line"><span class="factor-info breakdown-ii" data-tooltip-key="${escapeHtml(b.key)}" aria-label="Info" title="${hasTip ? "More info" : ""}">(i)</span><span class="breakdown-text">${escapeHtml(textPart)}</span><div class="bd-bar-wrap"><div class="bd-bar-fill" style="width:${fs2}%;background:${fc2}"></div></div><span class="contrib${b.earned < 0 ? ' negative' : ''}">${contribSign}${b.earned ?? 0}</span></div>`;
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
    } else if (breakdown && Array.isArray(breakdown.categories) && breakdown.categories.length > 0) {
      // v5.1 — inspector-style category cards with collapsible param rows
      ensureFbStyles();
      const w = V5_CATEGORY_WEIGHTS[profile] || V5_CATEGORY_WEIGHTS.balanced;
      const CAT_ICO = { atmosphere:'🌫', sky_darkness:'🌌', dew_safety:'💧', stability:'🧭' };
      // Preserve CATS display order (sky_darkness first)
      const CAT_ORDER = ['sky_darkness','atmosphere','dew_safety','stability'];
      const orderedCats = [...breakdown.categories].sort((a,b) => {
        const ai = CAT_ORDER.indexOf(a.key); const bi = CAT_ORDER.indexOf(b.key);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
      const cards = orderedCats.map(cat => {
        const catScore  = Math.round(cat.score);
        const catWeight = (w[cat.key] != null ? w[cat.key] : cat.weight) || 0;
        const catPts    = Math.round(catScore * catWeight);
        const fc        = _fbColor(catScore);
        const ico       = CAT_ICO[cat.key] || '';
        const panelId   = 'tp-cat-' + cat.key;
        let paramsHTML  = '';
        if (Array.isArray(cat.parameters) && cat.parameters.length > 0) {
          // Details panel always uses bar display (icons don't scale; icons only in Hour Inspector)
          paramsHTML = cat.parameters.map(p => {
            if (p.display === 'sky_icons') {
              // sky_icons: value is 0-1 factor, contribution is 0-1. Use default bar renderer.
              const pct = Math.round((p.value ?? 0) * 100);
              const pts = p.contribution != null ? Math.round(p.contribution * 100) : null;
              return renderScoreParamRow(Object.assign({}, p, { display: null, score: pct, points: pts, weight: p.weight ?? null }));
            }
            if (p.display === 'cloud_icons') {
              // cloud_icons value is already 0-100 (percent)
              return renderScoreParamRow(Object.assign({}, p, { display: 'cloudness_bar' }));
            }
            return renderScoreParamRow(p);
          }).join('');
        } else {
          paramsHTML = '<div style="font-size:11px;color:var(--muted);padding:4px 0">No parameter detail available.</div>';
        }
        const catClosed = (cat.key === 'sky_darkness' && nowHour?.sky_cat_closed)
                        || (cat.key === 'atmosphere'   && nowHour?.atm_cat_closed);
        const catClosedBadge = catClosed
          ? '<span class="gate-badge gate-closed" style="font-size:9px;padding:1px 5px;margin-left:4px">CLOSED</span>'
          : '';
        return '<div class="hi-cat-card">'
          + '<div class="hi-cat-header" data-panel="' + panelId + '">'
          +   '<span class="hi-toggle-btn">▶</span>'
          +   '<span class="hi-cat-ico">' + ico + '</span>'
          +   '<span class="hi-cat-name">' + escapeHtml(cat.label) + '</span>'
          +   catClosedBadge
          +   '<div class="hi-cat-bar-wrap"><div class="hi-cat-bar-fill" style="width:' + catScore + '%;background:' + fc + '"></div></div>'
          +   '<span class="hi-cat-formula">'
          +     '<span class="hi-cat-score" style="color:' + fc + '">' + catScore + '</span>'
          +     '<span class="hi-cat-weight">×' + catWeight.toFixed(2) + '</span>'
          +     '<span class="hi-cat-pts" style="color:' + fc + '">='+catPts+'</span>'
          +   '</span>'
          + '</div>'
          + '<div class="hi-cat-params" id="' + panelId + '" style="display:none">'
          + paramsHTML
          + '</div>'
          + '</div>';
      });
      scoreList.innerHTML = '<div class="hi-cat-section">' + cards.join('') + '</div>';
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

  if (!weatherCard._explainToggleBound) {
    weatherCard._explainToggleBound = true;
    weatherCard.addEventListener("click", function(e) {
      // Main "Details" expand/collapse toggle
      const toggleBtn = e.target.closest('[data-role="explain-toggle"]');
      if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
        const next = !expanded;
        toggleBtn.setAttribute("aria-expanded", String(next));
        toggleBtn.textContent = next ? "Details ▼" : "Details ▶";
        const panel = weatherCard.querySelector('[data-role="explain-panel"]');
        if (panel) {
          panel.classList.toggle("expanded", next);
          panel.setAttribute("aria-hidden", String(!next));
        }
        return;
      }
      // Category card expand/collapse inside breakdown panel (tp-cat-*)
      const catHeader = e.target.closest('.hi-cat-header[data-panel]');
      if (catHeader) {
        const panel = document.getElementById(catHeader.dataset.panel);
        const btn   = catHeader.querySelector('.hi-toggle-btn');
        if (!panel) return;
        const isOpen = panel.style.display !== 'none';
        panel.style.display = isOpen ? 'none' : '';
        if (btn) btn.textContent = isOpen ? '▶' : '▼';
      }
    });
  }
}

// ── Top Panel v2 renderers (issue #125) ─────────────────────────────────────

function renderTpTimeLocation(rootEl, nowHour) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const loc = weatherData?.location;

  // Location name + coordinates on one line
  const locLineEl = weatherCard.querySelector('[data-role="tp-loc-line"]');
  if (locLineEl) {
    const name = loc?.name || "";
    let coords = "";
    if (loc?.lat != null && loc?.lon != null) {
      const latDir = loc.lat >= 0 ? "N" : "S";
      const lonDir = loc.lon >= 0 ? "E" : "W";
      coords = `${Math.abs(loc.lat).toFixed(2)}°${latDir} ${Math.abs(loc.lon).toFixed(2)}°${lonDir}`;
    }
    locLineEl.textContent = [name, coords].filter(Boolean).join("  ") || "—";
  }

  // Live clock: "9 Mar 03:46" on one line
  const datetimeEl = weatherCard.querySelector('[data-role="tp-datetime-line"]');
  if (datetimeEl) {
    const tz = loc?.tz || "UTC";
    const updateClock = () => {
      const now = new Date();
      const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: tz }).format(now);
      const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(now);
      datetimeEl.textContent = date + "  " + time;
    };
    updateClock();
    if (rootEl._clockTimer) clearInterval(rootEl._clockTimer);
    rootEl._clockTimer = setInterval(updateClock, 60000);
  }
}

function renderTpQuality(rootEl, nowHour) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;

  // Profile switcher (horizontal pills via CSS)
  renderProfileSwitcher(rootEl);

  if (!nowHour) {
    const scoreValEl = weatherCard.querySelector('[data-role="score-val"]');
    const scoreRankEl = weatherCard.querySelector('[data-role="score-rank"]');
    if (scoreValEl) scoreValEl.textContent = "—";
    if (scoreRankEl) scoreRankEl.textContent = "—";
    return;
  }

  const gateRaw    = nowHour?.gate || { status: "OPEN" };
  const gateStatus = typeof gateRaw === "string" ? gateRaw : (gateRaw.status || "OPEN");
  // Always use v5 getHourScore so the panel matches hourly cards
  const score      = formatScore(getHourScore(nowHour));
  const rank = scoreRank(score);

  const scoreValEl = weatherCard.querySelector('[data-role="score-val"]');
  const scoreRankEl = weatherCard.querySelector('[data-role="score-rank"]');
  const scoreClr = _fbColor(score);
  if (scoreValEl) { scoreValEl.textContent = score; scoreValEl.style.color = scoreClr; }
  if (scoreRankEl) { scoreRankEl.textContent = rank; scoreRankEl.style.color = scoreClr; }

  // Gate badge
  const gateBadge = weatherCard.querySelector('[data-role="gate-badge"]');
  if (gateBadge) {
    gateBadge.textContent = "Gate: " + gateStatus;
    gateBadge.className = "gate-badge " + (gateStatus === "OPEN" ? "gate-open" : gateStatus === "MARGINAL" ? "gate-marginal" : "gate-closed");
  }

  // Score bar
  const scoreBar = weatherCard.querySelector('[data-role="score-bar"]');
  if (scoreBar) {
    let fillEl = scoreBar.querySelector(".score-bar-fill");
    if (!fillEl) {
      fillEl = document.createElement("div");
      fillEl.className = "score-bar-fill";
      scoreBar.appendChild(fillEl);
    }
    fillEl.className = "score-bar-fill";
    fillEl.style.width = Math.max(0, Math.min(100, score)) + "%";
    fillEl.style.background = scoreClr;
  }
}

function findBestObservingWindow(hours, fromIdx) {
  const MAX_LOOK = 48;
  const MIN_SCORE = 70;
  const segments = [];
  let seg = null;

  for (let i = fromIdx; i < Math.min(hours.length, fromIdx + MAX_LOOK); i++) {
    const h = hours[i];
    const gate = typeof h.gate === "string" ? h.gate : (h.gate?.status ?? "OPEN");
    const sc = getHourScore(h);
    if (gate !== "CLOSED" && sc >= MIN_SCORE) {
      if (!seg) seg = { start: h.time, end: h.time, scores: [sc] };
      else { seg.end = h.time; seg.scores.push(sc); }
    } else {
      if (seg) { segments.push(seg); seg = null; }
    }
  }
  if (seg) segments.push(seg);
  if (!segments.length) return null;

  // longest segment wins (ties: highest avg score)
  segments.sort((a, b) => b.scores.length - a.scores.length ||
    (b.scores.reduce((s, x) => s + x, 0) / b.scores.length) - (a.scores.reduce((s, x) => s + x, 0) / a.scores.length));
  const w = segments[0];
  return { start: w.start, end: w.end, scoreMin: Math.min(...w.scores), scoreMax: Math.max(...w.scores) };
}

function renderTpBestWindow(rootEl, hours) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const { idx } = findNearestHour(hours);
  const win = findBestObservingWindow(hours, idx);
  const rangeEl = weatherCard.querySelector('[data-role="tp-window-range"]');
  const scoreEl = weatherCard.querySelector('[data-role="tp-window-score"]');

  if (!win) {
    if (rangeEl) rangeEl.textContent = "No clear window";
    if (scoreEl) scoreEl.textContent = "score < 70 or gate closed";
    return;
  }
  if (rangeEl) rangeEl.textContent = formatTimeShort(win.start) + " – " + formatTimeShort(win.end);
  if (scoreEl) scoreEl.textContent = "Score " + win.scoreMin + "–" + win.scoreMax;
}

const CATS = [
  { key: "sky_darkness_score", label: "Dark Sky Level", ico: "🌌" },
  { key: "atmosphere_score",   label: "Atmosphere",   ico: "🌫" },
  { key: "dew_safety_score",   label: "Dew Safety",   ico: "💧" },
  { key: "stability_score",    label: "Stability",    ico: "🧭" },
];

function renderTpSkyStatus(rootEl, nowHour, hours) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;

  // Trend: score delta at t+3h
  const { idx } = findNearestHour(hours);
  const h3 = hours[idx + 3];
  const delta = h3 ? Math.round(getHourScore(h3) - getHourScore(nowHour)) : null;
  const trendEl = weatherCard.querySelector('[data-role="tp-trend"]');
  if (trendEl) {
    const cls = delta == null ? "" : delta >= 5 ? "trend-up" : delta <= -5 ? "trend-down" : "trend-stable";
    const txt = delta == null ? "" : delta >= 5 ? `↑${delta}` : delta <= -5 ? `↓${Math.abs(delta)}` : "→";
    trendEl.textContent = txt;
    trendEl.className = "tp-trend " + cls;
  }

  // Category mini-bars — update in-place to avoid layout jitter
  const catsEl = weatherCard.querySelector('[data-role="tp-categories"]');
  if (catsEl) {
    const existingRows = catsEl.querySelectorAll(".cat-score-row");
    if (existingRows.length !== CATS.length) {
      // First render: build DOM
      catsEl.innerHTML = CATS.map(c => {
        const sc = c.key === 'sky_darkness_score'
          ? (nowHour?.sky_darkness_score_by_profile?.[activeProfile] ?? nowHour?.[c.key] ?? null)
          : nowHour?.[c.key] ?? null;
        const pct = sc ?? 0;
        const barStyle = pct > 0
          ? `width:${pct}%;background:${_fbColor(pct)}`
          : `width:0%;background:transparent`;
        return `<div class="cat-score-row" data-cat="${c.key}">
          <span class="cat-ico">${c.ico}</span>
          <span class="cat-label">${c.label}</span>
          <div class="cat-bar-wrap"><div class="cat-bar-fill" style="${barStyle}"></div></div>
          <span class="cat-val">${sc != null ? sc : "—"}</span>
        </div>`;
      }).join("");
    } else {
      // Subsequent renders: patch fills and values in-place
      CATS.forEach((c, i) => {
        const sc = c.key === 'sky_darkness_score'
          ? (nowHour?.sky_darkness_score_by_profile?.[activeProfile] ?? nowHour?.[c.key] ?? null)
          : nowHour?.[c.key] ?? null;
        const pct = sc ?? 0;
        const row = existingRows[i];
        const fill = row.querySelector(".cat-bar-fill");
        if (fill) {
          fill.style.width = pct > 0 ? `${pct}%` : "0%";
          fill.style.background = pct > 0 ? _fbColor(pct) : "transparent";
        }
        const valEl = row.querySelector(".cat-val");
        if (valEl) valEl.textContent = sc != null ? sc : "—";
      });
    }
  }

  // Diagnostic sub-row
  const h = nowHour;
  const diagEl = weatherCard.querySelector('[data-role="tp-diag-row"]');
  if (diagEl) {
    diagEl.innerHTML = [
      `☁ ${h?.cloud_total != null ? Math.round(h.cloud_total) + "%" : "—"}`,
      `🔭 ${seeingLabel(h?.seeing)}`,
      `🌬 ${h?.wind_m_s != null ? Math.round(h.wind_m_s) + " m/s" : "—"}`,
      `💧 ${h?.humidity_pct != null ? Math.round(h.humidity_pct) + "%" : "—"}`,
      `🌡 ${h?.temp_c != null ? Math.round(h.temp_c) + "°C" : "—"}`,
      `🌙 ${h?.moon_alt_deg != null ? Math.round(h.moon_alt_deg) + "°" : "—"}`,
    ].map(s => `<span>${s}</span>`).join("");
  }
}

// ── End Top Panel v2 renderers ───────────────────────────────────────────────

// Render Bortle sky-quality badge from weatherData.bortle (issue #99)
function renderBortleBadge(rootEl) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const badge = weatherCard.querySelector('[data-role="bortle-badge"]');
  if (!badge) return;
  const bortle = weatherData && weatherData.bortle;
  if (!bortle || !bortle.class) {
    badge.style.display = "none";
    return;
  }
  const cls = Math.min(9, Math.max(1, parseInt(bortle.class, 10) || 5));
  const hint = bortle.hint || "Suburban sky";
  badge.textContent = "B" + cls;
  badge.className = "bortle-badge bortle-" + cls;
  badge.title = "Bortle " + cls + ": " + hint;
  badge.style.display = "";
}

// Render profile switcher pills below score (issue #99)
function renderProfileSwitcher(rootEl) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const switcher = weatherCard.querySelector('[data-role="profile-switcher"]');
  if (!switcher) return;
  const profileLabels = { balanced: "Balanced", visual: "Visual", broadband: "Broadband", planetary: "Planetary" };
  const allProfiles = Array.isArray(weatherData && weatherData.profiles) && weatherData.profiles.length
    ? ["balanced"].concat(weatherData.profiles.filter(function(p) { return p !== "balanced"; }))
    : ["balanced", "visual", "broadband", "planetary"];
  const currentProfile = getActiveProfile();
  switcher.innerHTML = allProfiles.map(function(p) {
    const label = profileLabels[p] || p;
    const active = p === currentProfile ? " data-active=\"true\"" : "";
    return "<button type=\"button\" class=\"profile-pill\" data-profile=\"" + escapeHtml(p) + "\"" + active + ">" + escapeHtml(label) + "</button>";
  }).join("");
  if (!switcher._profileBound) {
    switcher._profileBound = true;
    switcher.addEventListener("click", function(e) {
      const pill = e.target.closest(".profile-pill[data-profile]");
      if (!pill) return;
      activeProfile = pill.dataset.profile;
      try { localStorage.setItem(STORAGE_KEY_PROFILE, activeProfile); } catch (_) {}
      const r = findNearestHour(weatherData && weatherData.hours || []);
      renderNow(rootEl, r.hour);
      renderHourly(rootEl, weatherData && weatherData.hours || []);
      if (hourlyMode === "matrix") renderForecastMatrix(rootEl, weatherData && weatherData.hours || []);
      if (hourInspectorOpen && currentInspectorHourIdx >= 0) {
        renderHourInspector(currentInspectorHourIdx);
      }
    });
  }
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
    const profileDisplay = profileLabel === "balanced" ? "Balanced" : profileLabel;
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

// ── Sun/Moon precise rise-set events from sun_moon.json ─────────────────────

const _SM_MONTHS = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
function parseSunMoonTimeUTC(t) {
  // "2026-Mar-07 05:17Z" → Date (UTC)
  const m = t.match(/(\d{4})-(\w{3})-(\d{2}) (\d{2}):(\d{2})Z/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], _SM_MONTHS[m[2]], +m[3], +m[4], +m[5]));
}

function computeSunMoonEvents(frames) {
  const events = [];
  for (let i = 1; i < frames.length; i++) {
    for (const body of ["sun", "moon"]) {
      const pa = frames[i - 1][body].alt_deg;
      const ca = frames[i][body].alt_deg;
      if (pa === ca || pa * ca >= 0) continue; // no sign change
      const frac = Math.abs(pa) / (Math.abs(pa) + Math.abs(ca));
      const t0 = parseSunMoonTimeUTC(frames[i - 1].t_utc);
      const t1 = parseSunMoonTimeUTC(frames[i].t_utc);
      if (!t0 || !t1) continue;
      const exactMs = t0.getTime() + (t1.getTime() - t0.getTime()) * frac;
      const kind = pa < 0
        ? (body === "sun" ? "sunrise" : "moonrise")
        : (body === "sun" ? "sunset"  : "moonset");
      events.push({ kind, ms: exactMs });
    }
  }
  return events;
}

async function fetchSunMoonEvents(loc) {
  const _DEFAULT_LAT = 52.2297, _DEFAULT_LON = 21.0122;
  const isDefault = !loc || !isFinite(loc.lat) || !isFinite(loc.lon) ||
    (Math.abs(loc.lat - _DEFAULT_LAT) < 0.05 && Math.abs(loc.lon - _DEFAULT_LON) < 0.05);
  const url = isDefault
    ? "/sky/data/sun_moon.json"
    : `/api/sun-moon?lat=${loc.lat}&lon=${loc.lon}&days=7&step_min=10`;
  try {
    const res = await fetch(url);
    if (!res.ok) { sunMoonEventsCache = []; return; }
    const data = await res.json();
    sunMoonEventsCache = computeSunMoonEvents(data.frames || []);
  } catch (e) {
    console.warn("[weather] sun_moon load failed:", e.message);
    sunMoonEventsCache = [];
  }
}

// Return "HH:MM" in the location's timezone for a horizon crossing event
function getPreciseEventTime(kind, prevHour, curHour) {
  const tz = (weatherData && weatherData.location && weatherData.location.tz) || "UTC";
  const fmt = (ms) => new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false
  }).format(new Date(ms));

  // Try precise lookup in sun_moon events
  if (sunMoonEventsCache && sunMoonEventsCache.length) {
    const prevT = new Date(prevHour.time).getTime();
    const curT  = new Date(curHour.time).getTime();
    const ev = sunMoonEventsCache.find(e =>
      e.kind === kind && e.ms >= prevT && e.ms <= curT
    );
    if (ev) return fmt(ev.ms);
  }

  // Fallback: linear interpolation from hourly altitudes
  const altKey = (kind === "sunrise" || kind === "sunset") ? "sun_alt_deg" : "moon_alt_deg";
  const pa = prevHour[altKey], ca = curHour[altKey];
  if (pa != null && ca != null && (Math.abs(pa) + Math.abs(ca)) > 0) {
    const frac = Math.abs(pa) / (Math.abs(pa) + Math.abs(ca));
    const prevT = new Date(prevHour.time).getTime();
    const curT  = new Date(curHour.time).getTime();
    return fmt(prevT + (curT - prevT) * frac);
  }
  return formatTime(curHour.time);
}

// ── Forecast Matrix ─────────────────────────────────────────────────────────

// Sun altitude → CSS class for matrix row
function sunAltClass(alt) {
  if (alt == null) return "sun-night";
  if (alt > 0)     return "sun-day";
  if (alt > -6)    return "sun-civil";
  if (alt > -12)   return "sun-nautical";
  if (alt > -18)   return "sun-astro";
  return "sun-night";
}

// Color style for a 0-100 quality value (higher = better)
function matrixQualityStyle(quality100) {
  if (quality100 >= 70) return "background:rgba(125,255,154,0.18);color:var(--good)";
  if (quality100 >= 40) return "background:rgba(255,211,107,0.18);color:var(--mid)";
  return "background:rgba(255,107,107,0.15);color:var(--bad)";
}

// Color style for score (0-100)
function matrixScoreStyle(score) {
  if (score >= 75) return "background:rgba(125,255,154,0.15);color:var(--good)";
  if (score >= 50) return "background:rgba(255,211,107,0.15);color:var(--mid)";
  return "background:rgba(255,107,107,0.12);color:var(--bad)";
}

// Render a single matrix row's cells HTML
function matrixRowCells(hours, nowIdx, getCellData) {
  return hours.map((hour, i) => {
    const { cls, style, text, title } = getCellData(hour, i);
    const nowCls = i === nowIdx ? " matrix-now" : "";
    const escapedTitle = title ? escapeHtml(title) : "";
    return `<div class="matrix-cell${nowCls}${cls ? " " + cls : ""}" data-hour-idx="${i}" style="${style || ""}" title="${escapedTitle}">${text || ""}</div>`;
  }).join("");
}

// Format a raw overlay value for the hover tooltip
function formatOverlayValue(key, v) {
  if (v == null || isNaN(v)) return "—";
  const n = Number(v);
  switch (key) {
    case "sun":
    case "moon":     return Math.round(n) + "°";
    case "score":    return Math.round(n) + " pts";
    case "clouds":   return Math.round(n) + "%";
    case "seeing":   return n.toFixed(1) + "\u2033";
    case "trans":    return String(Math.round(n));
    case "wind":     return n.toFixed(1) + " m/s";
    case "temp":     return Math.round(n) + "\u00b0C";
    case "humidity": return Math.round(n) + "%";
    case "pressure": return Math.round(n) + " hPa";
    default:         return String(Math.round(n));
  }
}

// ── Matrix overlay configuration ────────────────────────────────────────────
// Each entry: label, getValue(hour)→number|null, min/max (null=auto), invert (lower=better=top), color
const MATRIX_OVERLAY_CONFIGS = {
  sun:      { label: "Sun",      getValue: h => h.sun_alt_deg,                                                                                                                          min: -18,  max: 90,   invert: false, color: "#fdd835" },
  moon:     { label: "Moon",     getValue: h => h.moon_alt_deg,                                                                                                                         min: -10,  max: 90,   invert: false, color: "#e0e0e0" },
  score:    { label: "Score",    getValue: h => getHourScore(h),                                                                                                                        min: 0,    max: 100,  invert: false, color: "#66bb6a" },
  clouds:   { label: "Clouds",   getValue: h => h.cloud_total,                                                                                                                          min: 0,    max: 100,  invert: true,  color: "#90a4ae" },
  seeing:   { label: "Seeing",   getValue: h => (h.seeing && h.seeing.fwhm_arcsec_est != null) ? h.seeing.fwhm_arcsec_est : (h.seeing && h.seeing.fwhm_arcsec != null ? h.seeing.fwhm_arcsec : (h.seeing_fwhm_arcsec_est != null ? h.seeing_fwhm_arcsec_est : null)), min: 0.5, max: 4, invert: true, color: "#ce93d8" },
  trans:    { label: "Trans.",   getValue: h => h.transparency,                                                                                                                         min: 1,    max: 4,    invert: true,  color: "#4dd0e1" },
  wind:     { label: "Wind",     getValue: h => h.wind_m_s,                                                                                                                             min: 0,    max: 15,   invert: true,  color: "#ef9a9a" },
  temp:     { label: "Temp.",    getValue: h => h.temp_c,                                                                                                                               min: null, max: null, invert: false, color: "#ffa726" },
  humidity: { label: "Humid.",   getValue: h => h.humidity_pct,                                                                                                                         min: 0,    max: 100,  invert: true,  color: "#42a5f5" },
  pressure: { label: "Pressure", getValue: h => h.pressure_hpa,                                                                                                                        min: null, max: null, invert: false, color: "#ba68c8" },
};

// ── Matrix overlay functions (multi-layer) ───────────────────────────────────

// Toggle a single overlay layer on/off; redraw all active layers
function toggleMatrixOverlay(key, hours, wrapEl) {
  if (matrixOverlayParams.has(key)) {
    matrixOverlayParams.delete(key);
  } else {
    matrixOverlayParams.add(key);
  }
  try { localStorage.setItem(STORAGE_KEY_MATRIX_OVERLAYS, JSON.stringify([...matrixOverlayParams])); } catch (_) {}
  applyMatrixOverlayState(hours, wrapEl);
}

// Clear all overlay layers (called on Esc)
function clearAllMatrixOverlays(wrapEl) {
  matrixOverlayParams.clear();
  try { localStorage.setItem(STORAGE_KEY_MATRIX_OVERLAYS, JSON.stringify([])); } catch (_) {}
  applyMatrixOverlayState([], wrapEl);
}

// Sync DOM + canvas to current matrixOverlayParams state
function applyMatrixOverlayState(hours, wrapEl) {
  const active = matrixOverlayParams;

  // Update eye-icon active class on labels
  wrapEl.querySelectorAll(".matrix-label[data-overlay-key]").forEach(el => {
    el.classList.toggle("overlay-active", active.has(el.dataset.overlayKey));
  });

  const canvas = wrapEl.querySelector("#matrixOverlayCanvas");
  if (!canvas) return;

  if (active.size === 0) {
    canvas.style.display = "none";
    if (wrapEl._matrixTipEl) wrapEl._matrixTipEl.style.display = "none";
    // Restore native cell tooltips
    wrapEl.querySelectorAll(".matrix-cell[data-title-saved]").forEach(c => {
      c.title = c.dataset.titleSaved || "";
      delete c.dataset.titleSaved;
    });
    if (document._matrixOverlayEsc) {
      document.removeEventListener("keydown", document._matrixOverlayEsc);
      document._matrixOverlayEsc = null;
    }
    return;
  }

  // Suppress native cell tooltips (idempotent)
  wrapEl.querySelectorAll(".matrix-cell:not([data-title-saved])").forEach(c => {
    c.dataset.titleSaved = c.title || "";
    c.title = "";
  });

  canvas.style.display = "";
  const inner = canvas.closest(".matrix-inner");
  redrawAllMatrixOverlays(canvas, hours, inner ? inner.offsetHeight : 260);

  // Register Esc handler once
  if (!document._matrixOverlayEsc) {
    document._matrixOverlayEsc = e => {
      if (e.key !== "Escape") return;
      const w = document.querySelector("#forecastMatrix");
      if (w) clearAllMatrixOverlays(w);
    };
    document.addEventListener("keydown", document._matrixOverlayEsc);
  }
}

// Redraw all active overlay layers onto the canvas (clears first)
function redrawAllMatrixOverlays(canvas, hours, totalH) {
  const dpr = window.devicePixelRatio || 1;
  const W = hours.length * 84;
  const H = totalH;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  matrixOverlayParams.forEach(key => drawMatrixOverlayLayer(ctx, key, hours, W, H));
}

// Draw a single overlay layer onto an already-configured ctx (no clear)
function drawMatrixOverlayLayer(ctx, key, hours, W, H) {
  const cfg = MATRIX_OVERLAY_CONFIGS[key];
  if (!cfg) return;

  const vals = hours.map(h => { const v = cfg.getValue(h); return (v == null || isNaN(v)) ? null : Number(v); });

  let lo = cfg.min, hi = cfg.max;
  if (lo == null || hi == null) {
    const nonNull = vals.filter(v => v != null);
    if (!nonNull.length) return;
    lo = Math.min(...nonNull);
    hi = Math.max(...nonNull);
    const pad = (hi - lo) * 0.1 || 1;
    lo -= pad; hi += pad;
  }
  const range = hi - lo || 1;
  const cellW = 84;
  const toY = v => { const norm = (v - lo) / range; return cfg.invert ? norm * H : (1 - norm) * H; };

  const pts = vals.map((v, i) => v != null ? [i * cellW + cellW / 2, toY(v)] : null);
  const valid = pts.filter(Boolean);
  if (!valid.length) return;

  // Area fill
  const baseline = cfg.invert ? 0 : H;
  ctx.beginPath();
  let first = true;
  pts.forEach(p => {
    if (!p) return;
    if (first) { ctx.moveTo(p[0], baseline); ctx.lineTo(p[0], p[1]); first = false; }
    else ctx.lineTo(p[0], p[1]);
  });
  ctx.lineTo(valid[valid.length - 1][0], baseline);
  ctx.closePath();
  ctx.fillStyle = cfg.color + "33"; // ~20% opacity per layer
  ctx.fill();

  // Line
  ctx.beginPath();
  first = true;
  pts.forEach(p => {
    if (!p) return;
    if (first) { ctx.moveTo(p[0], p[1]); first = false; }
    else ctx.lineTo(p[0], p[1]);
  });
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.stroke();
}

// Render the full forecast matrix into #forecastMatrix
function renderForecastMatrix(rootEl, hours) {
  const wrap = (rootEl.querySelector("#poc-weather") || rootEl).querySelector("#forecastMatrix");
  if (!wrap || !hours || !hours.length) return;

  const { idx: nowIdx } = findNearestHour(hours);

  // ── Horizon event SVG icons ───────────────────────────────────────────────
  // Sunrise: golden semicircle above horizon line + 3 rays
  const sunriseIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="13" viewBox="0 0 18 13" fill="none">'
    + '<line x1="0" y1="9" x2="18" y2="9" stroke="#fbbf24" stroke-width="1.3" stroke-linecap="round"/>'
    + '<path d="M3.5 9 A5.5 5.5 0 0 1 14.5 9" fill="#fbbf24"/>'
    + '<line x1="9" y1="1" x2="9" y2="3.5" stroke="#fbbf24" stroke-width="1.3" stroke-linecap="round"/>'
    + '<line x1="2.5" y1="3.5" x2="4" y2="5.2" stroke="#fbbf24" stroke-width="1.1" stroke-linecap="round"/>'
    + '<line x1="15.5" y1="3.5" x2="14" y2="5.2" stroke="#fbbf24" stroke-width="1.1" stroke-linecap="round"/>'
    + '</svg>';
  // Sunset: orange semicircle above horizon + two dusk lines below
  const sunsetIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="13" viewBox="0 0 18 13" fill="none">'
    + '<path d="M3.5 7 A5.5 5.5 0 0 1 14.5 7" fill="#f97316"/>'
    + '<line x1="0" y1="7" x2="18" y2="7" stroke="#f97316" stroke-width="1.3" stroke-linecap="round"/>'
    + '<line x1="2" y1="10" x2="6.5" y2="10" stroke="#f97316" stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>'
    + '<line x1="11.5" y1="10" x2="16" y2="10" stroke="#f97316" stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>'
    + '<line x1="3" y1="12.5" x2="15" y2="12.5" stroke="#f97316" stroke-width="1" stroke-linecap="round" opacity="0.3"/>'
    + '</svg>';
  // Moonrise: silver-blue semicircle above horizon
  const moonriseIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none">'
    + '<line x1="0" y1="8" x2="16" y2="8" stroke="#8fb6ff" stroke-width="1.2" stroke-linecap="round"/>'
    + '<path d="M2.5 8 A5.5 5.5 0 0 1 13.5 8" fill="#8fb6ff" opacity="0.85"/>'
    + '</svg>';
  // Moonset: faded semicircle with lower half hint (sinking)
  const moonsetIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none">'
    + '<path d="M2.5 6 A5.5 5.5 0 0 1 13.5 6" fill="#8fb6ff" opacity="0.45"/>'
    + '<line x1="0" y1="6" x2="16" y2="6" stroke="#8fb6ff" stroke-width="1.2" stroke-linecap="round" opacity="0.65"/>'
    + '<path d="M2.5 6 A5.5 5.5 0 0 0 13.5 6" fill="#8fb6ff" opacity="0.18"/>'
    + '</svg>';

  // Row definitions: [label, getCellData(hour, i) → {cls, style, text, title}, overlayKey]
  const rows = [
    // ── Sun ──────────────────────────────────────────
    ["Sun", (hour, i) => {
      const alt = hour.sun_alt_deg;
      const cls = sunAltClass(alt);
      // Look AHEAD: event happened between this hour and the next → icon in current column
      const nextAlt = i < hours.length - 1 ? hours[i + 1].sun_alt_deg : null;
      const isSunrise = alt != null && alt <= 0 && nextAlt != null && nextAlt > 0;
      const isSunset  = alt != null && alt > 0  && nextAlt != null && nextAlt <= 0;
      const stateLabel = isSunrise ? "Sunrise" : isSunset ? "Sunset"
        : cls === "sun-day" ? "Day" : cls === "sun-civil" ? "Civil twilight"
        : cls === "sun-nautical" ? "Nautical twilight" : cls === "sun-astro" ? "Astronomical twilight" : "Night";
      const eventColor = isSunrise ? "#fbbf24" : "#f97316";
      let text;
      if (isSunrise || isSunset) {
        text = `<span style="display:flex;align-items:center;gap:2px">${isSunrise ? sunriseIcon : sunsetIcon}<span style="font-size:8px;color:${eventColor};font-weight:600;line-height:1">${getPreciseEventTime(isSunrise ? "sunrise" : "sunset", hour, hours[i + 1])}</span></span>`;
      } else if (cls === "sun-day" && alt != null) {
        text = `<span style="display:flex;align-items:center;gap:1px;line-height:1"><span style="font-size:11px">☀</span><span style="font-size:8px;color:#fde68a;font-weight:600">${Math.round(alt)}°</span></span>`;
      } else {
        text = "";
      }
      return { cls, style: "", text, title: alt != null ? `${stateLabel} (${Math.round(alt)}°)` : stateLabel };
    }, "sun"],

    // ── Moon ─────────────────────────────────────────
    ["Moon", (hour, i) => {
      const alt = hour.moon_alt_deg;
      const above = alt != null && alt > 0;
      // Look AHEAD: event happened between this hour and the next → icon in current column
      const nextAlt = i < hours.length - 1 ? hours[i + 1].moon_alt_deg : null;
      const isMoonrise = alt != null && alt <= 0 && nextAlt != null && nextAlt > 0;
      const isMoonset  = alt != null && alt > 0  && nextAlt != null && nextAlt <= 0;
      const illum = hour.moon_illum_pct != null ? (hour.moon_illum_pct > 1 ? hour.moon_illum_pct : hour.moon_illum_pct * 100) : null;
      const illumStr = illum != null ? Math.round(illum) + "%" : "—";
      const altStr = alt != null ? Math.round(alt) + "°" : "—";
      const phaseName = moonPhaseName(hour.moon_illum_pct, hour.moon_waxing);
      if (isMoonrise) {
        const timeStr = getPreciseEventTime("moonrise", hour, hours[i + 1]);
        return { cls: "moon-event", style: "",
          text: `<span style="display:flex;align-items:center;gap:2px">${moonriseIcon}<span style="font-size:8px;color:#8fb6ff;font-weight:600;line-height:1">${timeStr}</span></span>`,
          title: `Moonrise\nPhase: ${phaseName}\nIllumination: ${illumStr}` };
      }
      if (isMoonset) {
        const timeStr = getPreciseEventTime("moonset", hour, hours[i + 1]);
        return { cls: "moon-event", style: "",
          text: `<span style="display:flex;align-items:center;gap:2px">${moonsetIcon}<span style="font-size:8px;color:#8fb6ff;font-weight:600;opacity:0.65;line-height:1">${timeStr}</span></span>`,
          title: `Moonset\nPhase: ${phaseName}\nIllumination: ${illumStr}` };
      }
      const opacity = above && illum != null ? 0.4 + 0.6 * (illum / 100) : 1;
      const emoji = above ? moonPhaseEmoji(hour.moon_illum_pct, hour.moon_waxing) : "";
      const titleStr = above
        ? `Moon above horizon\nPhase: ${phaseName}\nAltitude: ${altStr}\nIllumination: ${illumStr}`
        : `Moon below horizon\nPhase: ${phaseName}\nIllumination: ${illumStr}`;
      const moonText = above && alt != null
        ? `<span style="display:flex;align-items:center;gap:1px;line-height:1"><span style="font-size:13px">${emoji}</span><span style="font-size:8px;color:#8fb6ff;font-weight:600">${Math.round(alt)}°</span></span>`
        : emoji;
      return {
        cls: above ? "moon-above" : "moon-below",
        style: above ? `opacity:${opacity.toFixed(2)}` : "opacity:0.25",
        text: moonText,
        title: titleStr
      };
    }, "moon"],

    // ── Score ─────────────────────────────────────────
    ["Score", (hour) => {
      const score = formatScore(getHourScore(hour));
      const label = scoreRank(score);
      return {
        cls: "",
        style: matrixScoreStyle(score),
        text: String(score),
        title: `Score: ${score} (${label})`
      };
    }, "score"],

    // ── Clouds ────────────────────────────────────────
    ["Clouds", (hour) => {
      const cloud = hour.cloud_total != null ? Math.round(hour.cloud_total > 1 ? hour.cloud_total : hour.cloud_total * 100) : null;
      if (cloud == null) return { cls: "", style: "", text: "—", title: "Clouds: —" };
      const q = Math.max(0, 100 - cloud); // higher cloud = lower quality
      return {
        cls: "",
        style: matrixQualityStyle(q),
        text: cloud + "%",
        title: `Clouds: ${cloud}%\nLow: ${hour.cloud_low != null ? Math.round(hour.cloud_low > 1 ? hour.cloud_low : hour.cloud_low * 100) : "—"}%  Mid: ${hour.cloud_mid != null ? Math.round(hour.cloud_mid > 1 ? hour.cloud_mid : hour.cloud_mid * 100) : "—"}%  High: ${hour.cloud_high != null ? Math.round(hour.cloud_high > 1 ? hour.cloud_high : hour.cloud_high * 100) : "—"}%`
      };
    }, "clouds"],

    // ── Seeing ────────────────────────────────────────
    ["Seeing", (hour) => {
      const sq = hour.seeing;
      const fwhm = (sq && sq.fwhm_arcsec != null) ? sq.fwhm_arcsec : (hour.seeing_fwhm_arcsec_est != null ? hour.seeing_fwhm_arcsec_est : null);
      if (fwhm == null || !isValidValue(fwhm)) return { cls: "", style: "color:var(--muted)", text: "—", title: "Seeing: no data" };
      let q;
      if (fwhm <= 1.0)      q = 85;
      else if (fwhm <= 1.5) q = 70;
      else if (fwhm <= 2.5) q = 45;
      else                  q = 15;
      return {
        cls: "",
        style: matrixQualityStyle(q),
        text: fwhm.toFixed(1) + "\u2033",
        title: `Seeing FWHM: ${fwhm.toFixed(2)}\u2033\n${q >= 70 ? "Good" : q >= 45 ? "Fair" : "Poor"}`
      };
    }, "seeing"],

    // ── Transparency ──────────────────────────────────
    ["Trans.", (hour) => {
      const t = hour.transparency;
      if (t == null || !isValidValue(t)) return { cls: "", style: "color:var(--muted)", text: "—", title: "Transparency: no data" };
      // 7Timer scale: 1=very poor, 7=excellent. Or 1-4 where 4=best.
      // Normalise: treat both scales — detect by range
      let q;
      const tn = Number(t);
      if (tn <= 4) {
        // 1-4 scale (4 = best): map to 0-100
        q = Math.round((tn - 1) / 3 * 100);
      } else {
        // 1-7 scale (7 = best)
        q = Math.round((tn - 1) / 6 * 100);
      }
      const labels4 = ["—", "Very poor", "Poor", "Average", "Good", "Excellent", "Excellent", "Excellent"];
      const label = labels4[Math.min(Math.round(tn), labels4.length - 1)] || String(tn);
      return {
        cls: "",
        style: matrixQualityStyle(q),
        text: String(Math.round(tn)),
        title: `Transparency: ${label} (${Math.round(tn)})`
      };
    }, "trans"],

    // ── Wind ──────────────────────────────────────────
    ["Wind", (hour) => {
      const w = hour.wind_m_s;
      if (w == null || !isValidValue(w)) return { cls: "", style: "color:var(--muted)", text: "—", title: "Wind: no data" };
      const wn = Math.round(Number(w) * 10) / 10;
      let q;
      if (wn <= 3)  q = 90;
      else if (wn <= 6)  q = 65;
      else if (wn <= 10) q = 35;
      else               q = 10;
      return {
        cls: "",
        style: matrixQualityStyle(q),
        text: wn + "m/s",
        title: `Wind: ${wn} m/s${hour.wind_gust_m_s != null ? "\nGusts: " + Math.round(Number(hour.wind_gust_m_s) * 10) / 10 + " m/s" : ""}`
      };
    }, "wind"],

    // ── Temperature ───────────────────────────────────
    ["Temp.", (hour) => {
      const temp = hour.temp_c;
      if (temp == null || !isValidValue(temp)) return { cls: "", style: "color:var(--muted)", text: "—", title: "Temperature: no data" };
      const tn = Math.round(Number(temp));
      // Colour: comfortable range ~10-20°C → neutral; extremes tinted
      const absT = Math.abs(tn);
      const col = absT < 5 ? "color:#6ec6ff" : tn > 25 ? "color:#ffa07a" : "color:var(--text)";
      return {
        cls: "",
        style: col,
        text: tn + "\u00b0",
        title: `Temperature: ${tn}\u00b0C${hour.dewpoint_c != null ? "\nDewpoint: " + Math.round(Number(hour.dewpoint_c)) + "\u00b0C" : ""}${hour.feels_like_c != null ? "\nFeels like: " + Math.round(Number(hour.feels_like_c)) + "\u00b0C" : ""}`
      };
    }, "temp"],

    // ── Humidity ──────────────────────────────────────
    ["Humid.", (hour) => {
      const h = hour.humidity_pct;
      if (h == null || !isValidValue(h)) return { cls: "", style: "color:var(--muted)", text: "—", title: "Humidity: no data" };
      const hn = Math.round(Number(h));
      let q;
      if (hn < 60)  q = 85;
      else if (hn < 80) q = 50;
      else              q = 15;
      return {
        cls: "",
        style: matrixQualityStyle(q),
        text: hn + "%",
        title: `Humidity: ${hn}%\n${hn >= 80 ? "Dew risk" : hn >= 60 ? "Caution" : "Safe"}`
      };
    }, "humidity"],

    // ── Pressure ──────────────────────────────────────
    ["Pressure", (hour) => {
      const p = hour.pressure_hpa;
      if (p == null || !isValidValue(p)) return { cls: "", style: "color:var(--muted)", text: "—", title: "Pressure: no data" };
      const pn = Math.round(Number(p));
      return {
        cls: "",
        style: "color:var(--text)",
        text: pn + "",
        title: `Pressure: ${pn} hPa${hour.pressure_trend_6h_hpa != null ? "\n6h trend: " + (Number(hour.pressure_trend_6h_hpa) > 0 ? "+" : "") + Math.round(Number(hour.pressure_trend_6h_hpa) * 10) / 10 + " hPa" : ""}`
      };
    }, "pressure"],
  ];

  // Build time-header row
  const timeHeaderCells = hours.map((hour, i) => {
    const nowCls = i === nowIdx ? " matrix-now" : "";
    const timeStr = formatTime(hour.time);
    return `<div class="matrix-cell matrix-time-cell${nowCls}" data-hour-idx="${i}">${timeStr}</div>`;
  }).join("");

  // Clean up any previous cursor / tooltip elements from a previous render
  const prevCursor = document.querySelector(".matrix-cursor-line");
  if (prevCursor) prevCursor.remove();
  const prevTip = document.querySelector(".matrix-overlay-tip");
  if (prevTip) prevTip.remove();

  // SVG eye icon — always in label DOM; CSS dims it when inactive
  const eyeSvg = `<svg class="overlay-eye" xmlns="http://www.w3.org/2000/svg" width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden="true"><ellipse cx="5.5" cy="4" rx="4.8" ry="3.2" stroke="currentColor" stroke-width="1"/><circle cx="5.5" cy="4" r="1.5" fill="currentColor"/></svg>`;

  // Build all row HTML
  const rowsHTML = rows.map(([label, getCellData, overlayKey]) => {
    const keyAttr = overlayKey ? ` data-overlay-key="${overlayKey}"` : "";
    const eye = overlayKey ? eyeSvg : "";
    return `<div class="matrix-row"><div class="matrix-label"${keyAttr}><span class="label-text">${escapeHtml(label)}</span>${eye}</div><div class="matrix-cells">${matrixRowCells(hours, nowIdx, getCellData)}</div></div>`;
  }).join("");

  wrap.innerHTML = `
    <div class="matrix-inner">
      <div class="matrix-row matrix-header-row">
        <div class="matrix-label"></div>
        <div class="matrix-cells">${timeHeaderCells}</div>
      </div>
      ${rowsHTML}
    </div>
  `;

  // Append overlay canvas to .matrix-inner
  const inner = wrap.querySelector(".matrix-inner");
  if (inner) {
    inner.style.position = "relative";
    const overlayCanvas = document.createElement("canvas");
    overlayCanvas.id = "matrixOverlayCanvas";
    overlayCanvas.style.cssText = [
      "position:absolute",
      "top:0",
      "left:72px",
      `width:${hours.length * 84}px`,
      "height:100%",
      "pointer-events:none",
      "z-index:3",
      "display:none",
    ].join(";");
    inner.appendChild(overlayCanvas);
  }

  // Apply initial overlay state (draws Sun + Moon by default, or whatever is in matrixOverlayParams)
  // Deferred one frame so the inner element has its final height
  requestAnimationFrame(() => applyMatrixOverlayState(hours, wrap));

  // Mouse cursor line (position:fixed, follows viewport X while overlay is active)
  const cursorEl = document.createElement("div");
  cursorEl.className = "matrix-cursor-line";
  document.body.appendChild(cursorEl);

  // Hover tooltip showing overlay graph value
  const tipEl = document.createElement("div");
  tipEl.className = "matrix-overlay-tip";
  document.body.appendChild(tipEl);
  wrap._matrixTipEl = tipEl;
  wrap._matrixHours = hours;

  // Remove any previously attached handlers (avoid accumulation on re-renders)
  if (wrap._matrixClickHandler) wrap.removeEventListener("click", wrap._matrixClickHandler);
  if (wrap._matrixMoveHandler)  wrap.removeEventListener("mousemove", wrap._matrixMoveHandler);
  if (wrap._matrixLeaveHandler) wrap.removeEventListener("mouseleave", wrap._matrixLeaveHandler);

  wrap._matrixMoveHandler = e => {
    if (matrixOverlayParams.size === 0) { cursorEl.style.display = "none"; tipEl.style.display = "none"; return; }
    cursorEl.style.cssText = `display:block;left:${e.clientX}px;`;
    // Show tooltip with values of all active overlays for the hovered hour
    const cell = e.target.closest(".matrix-cell[data-hour-idx]");
    if (cell) {
      const idx = parseInt(cell.dataset.hourIdx, 10);
      const h = wrap._matrixHours && wrap._matrixHours[idx];
      if (h) {
        const lines = Array.from(matrixOverlayParams).map(key => {
          const cfg = MATRIX_OVERLAY_CONFIGS[key];
          const raw = cfg ? cfg.getValue(h) : null;
          const val = (raw != null && !isNaN(raw)) ? Number(raw) : null;
          return `<span style="color:${cfg ? cfg.color : "var(--text)"}">${escapeHtml(cfg ? cfg.label : key)}: <b>${escapeHtml(formatOverlayValue(key, val))}</b></span>`;
        });
        tipEl.innerHTML = lines.join("<br>");
        tipEl.style.cssText = `display:block;left:${e.clientX + 14}px;top:${e.clientY - 32}px;`;
      }
    } else {
      tipEl.style.display = "none";
    }
  };
  wrap._matrixLeaveHandler = () => { cursorEl.style.display = "none"; tipEl.style.display = "none"; };

  // Unified click handler: label → toggle overlay, cell → hour inspector
  wrap._matrixClickHandler = e => {
    const labelEl = e.target.closest(".matrix-label[data-overlay-key]");
    if (labelEl) {
      toggleMatrixOverlay(labelEl.dataset.overlayKey, hours, wrap);
      return;
    }
    const cell = e.target.closest(".matrix-cell[data-hour-idx]");
    if (cell) openHourInspector(parseInt(cell.dataset.hourIdx, 10));
  };

  wrap.addEventListener("mousemove", wrap._matrixMoveHandler);
  wrap.addEventListener("mouseleave", wrap._matrixLeaveHandler);
  wrap.addEventListener("click", wrap._matrixClickHandler);

  // Scroll to now column
  const nowCell = wrap.querySelector(`.matrix-cell[data-hour-idx="${nowIdx}"]`);
  if (nowCell) {
    requestAnimationFrame(() => {
      const labelW = 80;
      wrap.scrollLeft = Math.max(0, nowCell.offsetLeft - labelW - 84);
    });
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
      var bortleVal = (weatherData && typeof weatherData.bortle === "number") ? weatherData.bortle : 5;
      var rawProfile = state.profile || activeProfile || "balanced";
      var apiProfile = ["balanced", "visual", "broadband", "planetary"].includes(rawProfile) ? rawProfile : "balanced";
      var params = new URLSearchParams({
        lat: String(state.location.lat),
        lon: String(state.location.lon),
        tz: state.location.tz || "Europe/Warsaw",
        hours: "72",
        profile: apiProfile,
        bortle: String(bortleVal),
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
    // Log the actual URL being requested (helpful for debugging path issues)
    console.log("[weather] Fetching from URL:", url, "(useApi:", useApi + ", base:", window.location.origin + window.location.pathname + ")");
    var res = await fetch(url);
    console.log("[weather] Fetch response:", res.status, res.statusText, "Content-Type:", res.headers.get("content-type"), "URL:", res.url);
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
        console.log("[weather] Response Content-Type:", contentType, "Status:", res.status);
        if (contentType.indexOf("application/json") < 0 && contentType.indexOf("text/json") < 0) {
          var text = await res.text();
          console.error("[weather] Expected JSON but got:", contentType, "Body preview:", text.slice(0, 200));
          throw new Error("Expected JSON but got " + contentType);
        }
        data = await res.json();
        console.log("[weather] JSON parsed successfully. Keys:", Object.keys(data || {}), "hasHours:", !!data.hours, "hoursLength:", data && Array.isArray(data.hours) ? data.hours.length : "N/A");
        // Log successful API response structure for debugging
        if (useApi) {
          console.log("[weather] API response:", {
            ok: data.ok,
            source: data.source,
            hasHours: !!data.hours,
            hoursLength: Array.isArray(data.hours) ? data.hours.length : "N/A",
            status: res.status
          });
        }
      }
    // Log response structure for debugging
    if (data && (!data.hours || !Array.isArray(data.hours) || data.hours.length === 0)) {
      console.warn("[weather] Response missing or empty hours:", {
        ok: data.ok,
        source: data.source,
        message: data.message,
        hasHours: !!data.hours,
        hoursType: Array.isArray(data.hours) ? "array" : typeof data.hours,
        hoursLength: Array.isArray(data.hours) ? data.hours.length : "N/A",
        keys: Object.keys(data || {}),
        useApi: useApi,
        url: url
      });
    }
    // Handle empty hours response gracefully (rate-limited or other issues)
    // Try legacy JSON fallback if we got empty hours from API OR from static JSON
    var usedLegacyFallback = false;
    var hasEmptyHours = !data || !data.hours || !Array.isArray(data.hours) || data.hours.length === 0;
    if (hasEmptyHours) {
      var isRateLimited = data && data.ok === true && data.source === "rate-limited";
      var isApiResponse = useApi && data && (data.source || data.ok !== undefined);
      
      console.warn("[weather] Empty hours detected, attempting legacy JSON fallback:", {
        useApi: useApi,
        isApiResponse: isApiResponse,
        isRateLimited: isRateLimited,
        dataKeys: data ? Object.keys(data) : [],
        originalUrl: url
      });
      
      if (isApiResponse) {
        showApiFallbackBanner(rootEl);
        const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
        var metaEl = weatherCard.querySelector("[data-role=weather-meta]");
        if (metaEl) {
          if (isRateLimited) {
            metaEl.innerHTML = `<span style="color: var(--muted)">${escapeHtml(data.message || "Rate limited")}</span>`;
          } else {
            metaEl.innerHTML = `<span style="color: var(--muted)">API returned empty data, using cached JSON</span>`;
          }
        }
      }
      
      // Try legacy JSON fallback (only if we haven't already tried this URL)
      var fallbackUrl = ASTRO_WEATHER_URL + (ASTRO_WEATHER_URL.indexOf("?") >= 0 ? "&" : "?") + "ts=" + Date.now();
      // Skip fallback if we already tried to load this exact URL (without timestamp)
      var alreadyTriedLegacy = !useApi && url && url.indexOf(ASTRO_WEATHER_URL) === 0;
      if (alreadyTriedLegacy) {
        console.warn("[weather] Skipping legacy JSON fallback - already tried:", url);
      } else {
        console.warn("[weather] Trying legacy JSON fallback from:", ASTRO_WEATHER_URL, "Full URL:", fallbackUrl, "Base:", window.location.origin + window.location.pathname);
        try {
          var res2 = await fetch(fallbackUrl);
          console.log("[weather] Legacy JSON fetch result:", res2.status, res2.statusText, "URL:", res2.url || fallbackUrl, "Content-Type:", res2.headers.get("content-type"), "Content-Length:", res2.headers.get("content-length") || "unknown");
        if (res2.ok) {
          var contentType2 = res2.headers.get("content-type") || "";
          var contentLength2 = res2.headers.get("content-length");
          console.log("[weather] Legacy JSON headers - Content-Type:", contentType2, "Content-Length:", contentLength2 || "chunked");
          if (contentType2.indexOf("application/json") >= 0 || contentType2.indexOf("text/json") >= 0) {
            // Clone response to read text first for debugging
            var responseClone = res2.clone();
            var responseText = await responseClone.text();
            console.log("[weather] Legacy JSON raw response preview (first 500 chars):", responseText.slice(0, 500));
            console.log("[weather] Legacy JSON raw response preview (last 200 chars):", responseText.slice(-200));
            console.log("[weather] Legacy JSON response length:", responseText.length, "chars");
            
            var legacyData = await res2.json();
            console.log("[weather] Legacy JSON parsed, hasHours:", !!legacyData && !!legacyData.hours, "hoursLength:", legacyData && Array.isArray(legacyData.hours) ? legacyData.hours.length : "N/A", "keys:", legacyData ? Object.keys(legacyData) : []);
            if (legacyData && legacyData.hours && Array.isArray(legacyData.hours) && legacyData.hours.length > 0) {
              data = legacyData; // Use legacy data if valid
              usedLegacyFallback = true;
              console.log("[weather] Legacy JSON fallback successful, hours:", legacyData.hours.length, "data keys:", Object.keys(data));
            } else {
              console.error("[weather] Legacy JSON fallback has empty hours:", {
                hasHours: !!legacyData && !!legacyData.hours,
                hoursLength: legacyData && Array.isArray(legacyData.hours) ? legacyData.hours.length : "N/A",
                hoursType: legacyData && legacyData.hours ? typeof legacyData.hours : "N/A",
                keys: legacyData ? Object.keys(legacyData) : [],
                sampleHours: legacyData && legacyData.hours && Array.isArray(legacyData.hours) && legacyData.hours.length > 0 ? legacyData.hours[0] : null
              });
              // Don't throw here - let final validation handle it with better error message
            }
          } else {
            var errorText = await res2.text().catch(function() { return ""; });
            console.error("[weather] Legacy JSON wrong content-type:", contentType2, "body:", errorText.slice(0, 200));
            // Don't throw here - let final validation handle it
          }
        } else {
          var errorText2 = await res2.text().catch(function() { return ""; });
          console.error("[weather] Legacy JSON fetch failed:", res2.status, res2.statusText, "body:", errorText2.slice(0, 200));
          // Don't throw here - let final validation handle it
        }
        } catch (fallbackError) {
          console.error("[weather] Legacy JSON fallback exception:", fallbackError);
          // Don't throw here - let final validation handle it
        }
      }
    }
    // Final validation: ensure we have valid hours array (skip if we just loaded legacy JSON successfully)
    if (!usedLegacyFallback && (!data || !data.hours || !Array.isArray(data.hours) || data.hours.length === 0)) {
      var errorMsg = "Invalid JSON: missing or empty hours array";
      var userFriendlyMsg = "Weather data file is corrupted or incomplete. Please try again later.";
      if (data) {
        errorMsg += " (ok: " + data.ok + ", source: " + (data.source || "none") + ")";
        if (data.message) {
          errorMsg += ", message: " + data.message;
        }
        // Check if file looks corrupted (has some fields but missing hours)
        if (data.location || data.meta || data.generated_at) {
          userFriendlyMsg = "Weather data file is missing forecast hours. The backend may need to regenerate the data file.";
        }
      }
      errorMsg += " (useApi: " + useApi + ", usedLegacyFallback: " + usedLegacyFallback + ", url: " + url + ")";
      console.error("[weather] Final validation failed:", errorMsg, {
        data: data,
        dataKeys: data ? Object.keys(data) : [],
        hasHours: !!data && !!data.hours,
        hoursType: data && data.hours ? typeof data.hours : "N/A",
        hoursLength: data && Array.isArray(data.hours) ? data.hours.length : "N/A",
        useApi: useApi,
        usedLegacyFallback: usedLegacyFallback,
        url: url
      });
      throw new Error(userFriendlyMsg + " (" + errorMsg + ")");
    }
    weatherData = data;
    fetchSunMoonEvents(data.location);
    var profileList;
    if (Array.isArray(data.profiles) && data.profiles.length) {
      profileList = ["balanced"].concat(data.profiles.filter(function(p){ return p !== "balanced"; }));
    } else {
      // Fallback profiles for per-location JSON (balanced + 3 profiles)
      profileList = ["balanced", "visual", "broadband", "planetary"];
    }
    var def = typeof data.default_profile === "string" ? data.default_profile : "balanced";
    // Priority: URL/state > localStorage > default "balanced"
    if (state && state.profile && state.profile !== "default") {
      activeProfile = state.profile;
    } else {
      try {
        var _storedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
        activeProfile = (_storedProfile && PROFILE_IDS.includes(_storedProfile)) ? _storedProfile : "balanced";
      } catch (_) { activeProfile = "balanced"; }
    }
    currentMode = "7d"; // Always show full 7D view (issue #99)
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
    if (layoutMode === "vertical") {
      renderNowVertical(rootEl, nowHour);
      renderVerticalCardStack(rootEl, data.hours);
    } else {
      renderNow(rootEl, nowHour);
      renderHourly(rootEl, data.hours);
      if (hourlyMode === "matrix") {
        renderForecastMatrix(rootEl, data.hours);
        var _hEl = rootEl.querySelector("[data-role=hourly]");
        var _mEl = rootEl.querySelector("#forecastMatrix");
        if (_hEl) _hEl.style.display = "none";
        if (_mEl) _mEl.style.display = "";
      }
    }
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
    cloud: "Clouds",
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
  
  // Helper to draw a single data series line
  function drawSeriesLine(seriesValues, color, lineWidth, dashed) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (dashed) ctx.setLineDash([4, 3]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    let started = false;
    seriesValues.forEach((val, i) => {
      if (val == null) { started = false; return; }
      const x = padding.left + (chartWidth * i / (seriesValues.length - 1 || 1));
      const y = padding.top + chartHeight - ((val - yMin) / yRange * chartHeight);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // For cloud chart, draw Low/Mid/High layers first (behind the total line)
  if (paramKey === "cloud") {
    const lowVals = hours.map(h => h.cloud_low != null ? h.cloud_low : null);
    const midVals = hours.map(h => h.cloud_mid != null ? h.cloud_mid : null);
    const highVals = hours.map(h => h.cloud_high != null ? h.cloud_high : null);
    drawSeriesLine(lowVals, "rgba(255, 180, 80, 0.7)", 1.5, true);
    drawSeriesLine(midVals, "rgba(100, 220, 130, 0.7)", 1.5, true);
    drawSeriesLine(highVals, "rgba(200, 150, 255, 0.7)", 1.5, true);
  }

  // Draw line chart (total / main series)
  drawSeriesLine(values, "rgba(143,182,255,0.8)", 2, false);

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

  // Draw cloud layer legend
  if (paramKey === "cloud") {
    const legend = [
      { label: "Total", color: "rgba(143, 182, 255, 0.9)", dashed: false },
      { label: "Low",   color: "rgba(255, 180, 80, 0.9)",  dashed: true },
      { label: "Mid",   color: "rgba(100, 220, 130, 0.9)", dashed: true },
      { label: "High",  color: "rgba(200, 150, 255, 0.9)", dashed: true },
    ];
    const lineLen = 18;
    const gap = 5;
    const rowH = 15;
    const legendPad = 8;
    ctx.font = "10px sans-serif";
    ctx.textBaseline = "middle";
    // Measure widest label
    const maxLabelW = Math.max(...legend.map(l => ctx.measureText(l.label).width));
    const entryW = lineLen + gap + maxLabelW;
    const legendX = padding.left + chartWidth - legendPad - entryW;
    const legendY = padding.top + legendPad;
    legend.forEach((item, idx) => {
      const y = legendY + idx * rowH + rowH / 2;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.dashed ? 1.5 : 2;
      if (item.dashed) ctx.setLineDash([4, 3]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(legendX, y);
      ctx.lineTo(legendX + lineLen, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = item.color;
      ctx.textAlign = "left";
      ctx.fillText(item.label, legendX + lineLen + gap, y);
    });
    ctx.textAlign = "center";
  }
  
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
let currentInspectorHourIdx = -1;

function getHourInspectorElements() {
  return {
    backdrop:  document.getElementById("hourInspectorBackdrop"),
    sheet:     document.getElementById("hourInspectorSheet"),
    time:      document.getElementById("hourInspectorTime"),
    scoreVal:  document.getElementById("hourInspectorScoreVal"),
    scoreLabel:document.getElementById("hourInspectorScoreLabel"),
    summary:   document.getElementById("hourInspectorSummary"),
    moonLine:  document.getElementById("hourInspectorMoonLine"),
    scoreBar:  document.getElementById("hourInspectorScoreBar"),
    fwhmSlot:  document.getElementById("hourInspectorFwhmSlot"),
    chartSlot: document.getElementById("hourInspectorChartSlot"),
    body:      document.getElementById("hourInspectorBody")
  };
}

function openHourInspector(hourIdx) {
  if (!weatherData || !weatherData.hours || hourIdx < 0 || hourIdx >= weatherData.hours.length) return;
  
  const els = getHourInspectorElements();
  if (!els.backdrop || !els.sheet) return;
  
  // Position sheet centered on the viewport.
  // Previously this used getBoundingClientRect() on a named widget container, but when
  // multiple widget instances exist some may be display:none — their rects return all-zeros,
  // causing the sheet to snap to the far left. Viewport-centering is simpler and correct
  // regardless of how many instances are mounted.
  {
    const padding = window.innerWidth <= 768 ? 8 : 16;
    const maxPopupWidth = Math.min(480, window.innerWidth - padding * 2);
    const leftPos = Math.round((window.innerWidth - maxPopupWidth) / 2);
    const rightPos = window.innerWidth - leftPos - maxPopupWidth;

    els.sheet.style.left      = Math.max(padding, leftPos) + "px";
    els.sheet.style.right     = Math.max(padding, rightPos) + "px";
    els.sheet.style.maxWidth  = maxPopupWidth + "px";
    els.sheet.style.maxHeight = Math.round(window.innerHeight * 0.85) + "px";
    els.sheet.style.width     = "auto";
    els.sheet.style.top       = "50%";
    els.sheet.style.transform = "translateY(-50%)";
  }
  
  hourInspectorOpen = true;
  currentInspectorHourIdx = hourIdx;
  document.body.style.overflow = "hidden";

  els.backdrop.setAttribute("aria-hidden", "false");
  els.sheet.setAttribute("aria-hidden", "false");

  renderHourInspector(hourIdx);
}

function closeHourInspector() {
  const els = getHourInspectorElements();
  if (!els.backdrop || !els.sheet) return;

  hourInspectorOpen = false;
  currentInspectorHourIdx = -1;
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

// ── Explainable factor bars (#88) ─────────────────────────────────────────
function _fbColor(score) {
  if (score == null) return '#555';
  if (score >= 75) return '#4ade80';
  if (score >= 50) return '#fbbf24';
  return '#f87171';
}

function renderFactorBarsHTML(breakdown) {
  if (!Array.isArray(breakdown) || !breakdown.length) {
    return '<div style="color:#666;font-size:10px;padding:4px 0">No breakdown data</div>';
  }
  return breakdown.filter(function(b) { return b.max > 0; }).map(function(b) {
    var fs = b.factor_score != null ? b.factor_score : Math.round(100 * (b.normalized || 0));
    var color = _fbColor(fs);
    var label = escapeHtml(b.label || b.key);
    var pts = (b.earned != null ? b.earned : 0) + '/' + b.max;
    return '<div class="fb-row">' +
      '<span class="fb-label" title="' + label + '">' + label + '</span>' +
      '<div class="fb-track"><div class="fb-fill" style="width:' + fs + '%;background:' + color + '"></div></div>' +
      '<span class="fb-val" style="color:' + color + '">' + fs + '</span>' +
      '<span class="fb-pts">' + pts + 'pt</span>' +
      '</div>';
  }).join('');
}

var _fbStylesInjected = false;
function ensureFbStyles() {
  if (_fbStylesInjected) return;
  _fbStylesInjected = true;
  var s = document.createElement('style');
  s.id = 'fb-styles';
  s.textContent = [
    '.fb-row{display:flex;align-items:center;gap:5px;margin:3px 0;min-height:18px}',
    '.fb-label{width:78px;font-size:10px;color:#9aa3b2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0}',
    '.fb-track{flex:1;height:5px;background:#1e2330;border-radius:3px;overflow:hidden;min-width:30px}',
    '.fb-fill{height:100%;border-radius:3px;transition:width .15s}',
    '.fb-val{width:24px;font-size:10px;font-weight:700;text-align:right;flex-shrink:0}',
    '.fb-pts{width:36px;font-size:9px;color:#555;text-align:right;flex-shrink:0}',
    '.hi-tab-row{display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap}',
    '.hi-tab{background:none;border:1px solid #2a2f3a;border-radius:4px;color:#9aa3b2;font-size:9px;font-weight:600;padding:2px 7px;cursor:pointer;text-transform:uppercase;letter-spacing:.04em;line-height:1.6}',
    '.hi-tab.active{background:#1a2235;border-color:#8fb6ff;color:#8fb6ff}',
    '.hi-tab-panel{display:none}.hi-tab-panel.active{display:block}',
    '.fwhm-row{display:flex;align-items:center;gap:10px;margin-top:8px;padding:6px 0;border-top:1px solid #1e2330}',
    '.fwhm-val{font-size:13px;font-weight:700;color:#8fb6ff}',
    '.fwhm-label{font-size:10px;color:#9aa3b2}',
    '.fwhm-conf{font-size:9px;color:#555}',
    '.bd-bar-wrap{flex:1;min-width:20px;height:4px;background:#1e2330;border-radius:2px;overflow:hidden;margin:0 4px}',
    '.bd-bar-fill{height:100%;border-radius:2px}',
    '.breakdown-multiplier{opacity:.75;border-top:1px solid #1e2330;margin-top:4px;padding-top:4px}',
    '.contrib-mult{color:#8fb6ff!important;font-style:italic}',
    // Gate status styles (#97, #146)
    '.hour.gate-CLOSED{border-left:3px solid #F85149}',
    '.hour.gate-MARGINAL{border-left:3px solid #F2CC60}',
    '.hour.gate-OPEN{border-left:3px solid #3FB950}',
    // Solar state card backgrounds (#114)
    '.hour.night{background:#0b0f14}',
    '.hour.twilight{background:#1b2230}',
    '.hour.day{background:#273040}',
    // Moon badge + condition markers (#115)
    '.hour-top-row{display:flex;align-items:flex-start;justify-content:space-between;gap:4px}',
    '.celestial-badges{display:flex;flex-direction:column;align-items:flex-end;gap:1px;flex-shrink:0}',
    '.moon-badge{font-size:10px;color:var(--muted);white-space:nowrap;line-height:1.4}',
    '.sun-badge{font-size:12px;color:#facc15;white-space:nowrap;line-height:1.4}',
    '.cond-markers{display:flex;gap:2px;margin-top:5px}',
    '.cond-mark{flex:1;height:4px;border-radius:2px}',
    '.cond-icons{display:flex;gap:2px;margin-top:2px;margin-bottom:2px}',
    '.cond-icon{flex:1;font-size:9px;text-align:center;line-height:1}',
    '.cq-excellent{background:#4ade80}',
    '.cq-good{background:#86efac}',
    '.cq-fair{background:#fbbf24}',
    '.cq-poor{background:#f87171}',
    '.cq-none{background:#374151}',
    '.gate-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.05em;margin-bottom:6px}',
    '.gate-badge.gate-OPEN{background:#0d3320;color:#3FB950}',
    '.gate-badge.gate-MARGINAL{background:#3d2e00;color:#F2CC60}',
    '.gate-badge.gate-CLOSED{background:#3d0a08;color:#F85149}',
    '.gate-reasons{list-style:none;margin:4px 0 0;padding:0;font-size:10px}',
    '.gate-reasons li{padding:1px 0;color:#9aa3b2}',
    '.gate-reasons li.neg{color:#f87171}',
    '.gate-reasons li.cau{color:#fbbf24}',
    '.hi-closed-msg{font-size:11px;color:#f87171;padding:8px 0;font-style:italic}',
    '.hi-section-title{font-size:12px;font-weight:600;color:#9aa3b2;margin:10px 0 6px;display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none}',
    '.hi-toggle-btn{font-size:10px;flex-shrink:0;line-height:1}',
    '.weather-class-badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;background:#1e2330;color:#9aa3b2}',
    '.seeing-bar-wrap{height:6px;background:#1e2330;border-radius:3px;overflow:hidden;margin:4px 0}',
    '.seeing-bar-fill{height:100%;border-radius:3px}',
    // Hourly mode tabs (#102)
    '.hourly-header{display:flex;align-items:center;gap:12px;margin-bottom:8px}',
    '.hourly-header .sectionTitle{padding:8px 0;border-bottom:none;margin-top:0}',
    '.hourly-tabs{display:flex;gap:4px;align-items:center}',
    '.htab{font-size:13px;font-weight:700;padding:3px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:transparent;color:var(--muted);cursor:pointer;line-height:1.5}',
    '.htab[data-active]{background:rgba(255,255,255,.08);color:var(--title)}',
    // Observing mode card elements (#102)
    '.obs-score{font-size:27px;font-weight:950;line-height:1;margin-top:9px}',
    '.score-label{font-size:10px;font-weight:700;letter-spacing:.06em;margin-top:2px}',
    '.score-label.good{color:#4ade80}.score-label.mid{color:#fbbf24}.score-label.bad{color:#f87171}.score-label.muted{color:rgba(255,255,255,0.3)}',
    '.marginal-badge{font-size:10px;font-weight:700;color:#fbbf24;display:block;margin-top:4px}',
    // Seeing indicator (#102)
    '.seeing-ind{font-size:12px;margin-top:6px;color:var(--muted)}',
    '.seeing-ind span{font-size:10px}',
    '.seeing-excellent{color:#4ade80}.seeing-good{color:#a3e635}.seeing-fair{color:#fbbf24}.seeing-poor{color:#f87171;opacity:.7}',
    // Inspector gate sun altitude line (#146)
    '.hi-gate-sunalt{font-size:11px;color:#9aa3b2;margin-top:2px;padding-bottom:4px}',
    // Weather mode card elements (#102)
    '.wx-temp{font-size:22px;font-weight:800;margin-top:4px;color:var(--title)}',
    '.obs-score-small{font-size:10px;color:var(--muted);margin-top:6px}',
  ].join('');
  document.head.appendChild(s);
}
// ──────────────────────────────────────────────────────────────────────────

function drawHiCloudsChart(canvas, contextHours, selectedIdx, contextStart) {
  var dpr = window.devicePixelRatio || 1;
  var w = canvas.parentElement ? Math.round(canvas.parentElement.clientWidth) : 120;
  if (w < 4) w = 120;
  var h = 24;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  var n = contextHours.length;
  if (n < 2) return;
  function xOf(i) { return (i / (n - 1)) * (w - 2) + 1; }
  function yOf(v) { return (h - 2) - (v / 100) * (h - 4) + 1; }
  function drawLine(vals, color, dashed) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash(dashed ? [3, 2] : []);
    ctx.beginPath();
    var started = false;
    for (var i = 0; i < n; i++) {
      var v = vals[i];
      if (v == null) { started = false; continue; }
      if (!started) { ctx.moveTo(xOf(i), yOf(v)); started = true; }
      else ctx.lineTo(xOf(i), yOf(v));
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  drawLine(contextHours.map(function(h) { return h.cloud_high != null ? h.cloud_high : null; }), 'rgba(200,150,255,0.55)', true);
  drawLine(contextHours.map(function(h) { return h.cloud_mid  != null ? h.cloud_mid  : null; }), 'rgba(100,220,130,0.55)', true);
  drawLine(contextHours.map(function(h) { return h.cloud_low  != null ? h.cloud_low  : null; }), 'rgba(255,180,80,0.55)',  true);
  drawLine(contextHours.map(function(h) { return h.cloud_total != null ? h.cloud_total : null; }), 'rgba(143,182,255,0.9)', false);
  // Selected hour marker
  var localSel = selectedIdx - contextStart;
  if (localSel >= 0 && localSel < n) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xOf(localSel), 0);
    ctx.lineTo(xOf(localSel), h);
    ctx.stroke();
  }
}

// Static fallback parameters per category (used when score_breakdown absent)
const HI_FALLBACK_PARAMS = {
  atmosphere: (h) => [
    { label: "Cloud Cover",   val: h.cloud_total != null   ? Math.round(h.cloud_total) + "%" : "—",   pts: null },
    { label: "Transparency",  val: formatTransparency(h.transparency),                                pts: null },
    { label: "Seeing",        val: seeingLabel(h.seeing_fwhm_arcsec_est || (h.seeing && h.seeing.fwhm_arcsec)), pts: null },
    { label: "Visibility",    val: formatVisibility(h.visibility_m) != null ? formatVisibility(h.visibility_m) + " km" : "—", pts: null },
  ],
  sky_darkness: (h) => [
    { label: "Sun",           val: h.sun_alt_deg  != null ? Math.round(h.sun_alt_deg)  + "°" : "—",  pts: null },
    { label: "Moon",          val: h.moon_alt_deg != null ? Math.round(h.moon_alt_deg) + "°" : "—",  pts: null },
    { label: "Moon illum.",   val: h.moon_phase_pct != null ? Math.round(h.moon_phase_pct) + "%" : "—", pts: null },
  ],
  dew_safety: (h) => [
    { label: "Humidity",  val: h.humidity_pct  != null ? Math.round(h.humidity_pct)  + "%" : "—",  pts: null },
    { label: "Temp",      val: h.temp_c        != null ? Math.round(h.temp_c)        + "°C" : "—", pts: null },
    { label: "Dew Point", val: h.dew_point_c   != null ? Math.round(h.dew_point_c)   + "°C" : "—", pts: null },
  ],
  stability: (h) => [
    { label: "Wind Speed", val: h.wind_m_s      != null ? Math.round(h.wind_m_s)      + " m/s" : "—",  pts: null },
    { label: "Wind Gust",  val: h.wind_gust_m_s != null ? Math.round(h.wind_gust_m_s) + " m/s" : "—",  pts: null },
    { label: "Pressure",   val: h.pressure_hpa  != null ? Math.round(h.pressure_hpa)  + " hPa" : "—",  pts: null },
  ],
};

// ── Hour Inspector — mini-chart parameter switcher ───────────────────────────
const HI_CHART_PARAMS = [
  { key: 'moon_alt', ico: '🌙', label: 'Moon altitude',
    get: h => h.moon_alt_deg,        fmt: v => Math.round(v) + '°',
    color: 'rgba(224,224,160,.4)',   colorSel: 'rgba(224,224,160,.95)' },
  { key: 'clouds',   ico: '☁',  label: 'Clouds',
    get: h => h.cloud_total,         fmt: v => Math.round(v) + '%',
    color: 'rgba(143,182,255,.45)',   colorSel: 'rgba(143,182,255,.95)' },
  { key: 'temp',     ico: '🌡', label: 'Temperature',
    get: h => h.temp_c,              fmt: v => Math.round(v) + '°C',
    color: 'rgba(255,160,80,.5)',     colorSel: 'rgba(255,160,80,.95)' },
  { key: 'pressure', ico: '⬆',  label: 'Pressure',
    get: h => h.pressure_hpa,        fmt: v => Math.round(v) + ' hPa',
    color: 'rgba(100,210,130,.5)',   colorSel: 'rgba(100,210,130,.95)' },
  { key: 'dew',      ico: '💧', label: 'Dew spread',
    get: h => h.dewpoint_spread_c,   fmt: v => (Math.round(v * 10) / 10) + '°',
    color: 'rgba(80,210,220,.5)',    colorSel: 'rgba(80,210,220,.95)' },
  { key: 'wind',     ico: '💨', label: 'Wind',
    get: h => h.wind_m_s,            fmt: v => (Math.round(v * 10) / 10) + ' m/s',
    color: 'rgba(190,150,255,.5)',   colorSel: 'rgba(190,150,255,.95)' },
];

function renderHiChart(els, hours, hourIdx, paramKey) {
  if (!els.chartSlot) return;
  if (els.sheet) els.sheet.dataset.activeChartParam = paramKey;

  const param    = HI_CHART_PARAMS.find(p => p.key === paramKey) || HI_CHART_PARAMS[0];
  const ctxStart = Math.max(0, hourIdx - 3);
  const ctxEnd   = Math.min(hours.length - 1, hourIdx + 3);
  const slice    = hours.slice(ctxStart, ctxEnd + 1);

  // Collect values for relative normalisation within the window
  const vals    = slice.map(h => param.get(h));
  const defined = vals.filter(v => v != null && isFinite(v));
  let minV = defined.length ? Math.min(...defined) : 0;
  let maxV = defined.length ? Math.max(...defined) : 1;
  if (param.key === 'clouds')   { minV = 0;   maxV = 100; } // clouds: fixed 0-100%
  if (param.key === 'moon_alt') { minV = -10; maxV = 90;  } // moon: fixed -10..90°
  if (maxV - minV < 0.5) { minV -= 0.5; maxV += 0.5; }    // avoid zero-range

  // Chart bars
  let chartHTML = '<div class="hour-inspector-mini-chart">';
  slice.forEach((h, i) => {
    const ctxIdx   = ctxStart + i;
    const val      = param.get(h);
    const norm     = (val != null && isFinite(val)) ? (val - minV) / (maxV - minV) : null;
    const heightPx = norm != null ? Math.max(3, Math.min(60, norm * 60)) : 3;
    const isSel    = ctxIdx === hourIdx;
    const isMissing = val == null || !isFinite(val);
    const bg       = isMissing ? '' : (isSel ? param.colorSel : param.color);
    const tip      = escapeHtml(formatTime(h.time)) + ': ' + (val != null ? param.fmt(val) : '—');
    chartHTML += '<div class="hour-inspector-mini-bar'
      + (isSel ? ' selected' : '') + (isMissing ? ' missing' : '')
      + '" style="height:' + heightPx + 'px' + (bg ? ';background:' + bg : '') + '"'
      + ' title="' + tip + '"></div>';
  });
  chartHTML += '</div>';

  // Chips (icon buttons) — below the chart
  let chipsHTML = '<div class="hi-chart-chips">';
  HI_CHART_PARAMS.forEach(p => {
    chipsHTML += '<button class="hi-chart-chip' + (p.key === paramKey ? ' active' : '')
      + '" data-chart-param="' + p.key + '" title="' + p.label + '">'
      + p.ico + '</button>';
  });
  chipsHTML += '</div>';

  const labelHTML = '<div class="hi-chart-param-label">' + escapeHtml(param.label) + '</div>';
  els.chartSlot.innerHTML = labelHTML + chartHTML + chipsHTML;
}

function renderHourInspector(hourIdx, overrideEls) {
  if (!weatherData || !weatherData.hours || hourIdx < 0 || hourIdx >= weatherData.hours.length) return;

  const els = overrideEls || getHourInspectorElements();
  if (!els.time || !els.body) return;
  const idPrefix = overrideEls ? "v-emb-" : "";
  ensureFbStyles();

  const hour  = weatherData.hours[hourIdx];
  const hours = weatherData.hours;

  // ── Gate ────────────────────────────────────────────────────────────────────
  const gateRaw    = hour.gate || { status: "OPEN", reasons: [] };
  const gateStatus = typeof gateRaw === "string" ? gateRaw : (gateRaw.status || "OPEN");
  const gateReasons= Array.isArray(gateRaw.reasons) ? gateRaw.reasons : [];
  const isGateClosed  = gateStatus === "CLOSED";
  const isGateCaution = gateStatus === "MARGINAL";

  // ── Header: date + time (in location timezone) ───────────────────────────────
  const hourDate = parseISO(hour.time);
  const loc = weatherData?.location || {};
  const tz = loc.tz || "UTC";
  const use12h = (typeof loc.lon === "number" && loc.lon < -30) || (tz && typeof tz === "string" && tz.indexOf("America/") === 0);
  let dateStr = null;
  let timeStr = null;
  if (hourDate && typeof Intl !== "undefined") {
    try {
      dateStr = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: tz
      }).format(hourDate);
      timeStr = new Intl.DateTimeFormat(use12h ? "en-US" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: use12h,
        timeZone: tz
      }).format(hourDate);
    } catch (e) {
      dateStr = hourDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      timeStr = formatTime(hour.time);
    }
  } else {
    dateStr = hourDate ? hourDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
    timeStr = formatTime(hour.time);
  }
  const timeContent = (dateStr ? dateStr + "  " : "") + (timeStr || formatTime(hour.time));
  els.time.textContent = overrideEls ? "Observation Conditions for " + timeContent : timeContent;

  // Score + rank — for CLOSED gate use breakdown.total (actual sky quality)
  const hiProfile = getActiveProfile();
  // Prefer v5 score_breakdown (has display fields) over score_breakdown_by_profile (v2 engine format)
  const _hiV5bd = hour.score_breakdown;
  const hiBd = (Array.isArray(_hiV5bd?.categories) && _hiV5bd.categories.length > 0) ? _hiV5bd : (hour.score_breakdown_by_profile?.[hiProfile] || _hiV5bd);
  const score = formatScore(getHourScore(hour));
  const rank  = scoreRank(score);
  const scoreClr = _fbColor(score);
  if (els.scoreVal) {
    els.scoreVal.textContent      = score;
    els.scoreVal.style.color      = scoreClr;
    els.scoreVal.style.visibility = "";
  }
  if (els.scoreLabel) {
    els.scoreLabel.textContent      = rank;
    els.scoreLabel.style.visibility = "";
  }

  // Score bar
  if (els.scoreBar) {
    const fill = els.scoreBar.querySelector(".hour-inspector-score-bar-fill");
    if (fill) {
      fill.style.width      = Math.max(0, Math.min(100, score)) + "%";
      fill.style.background = scoreClr;
    }
  }

  // Summary line (conditions): sky · wind · temp
  const summaryParts = [];
  const cloud  = formatCloud(hour.cloud_total);
  const wind   = formatWind(hour.wind_m_s);
  const visKm  = formatVisibility(hour.visibility_m);
  const tempStr = hour.temp_c != null && isValidValue(hour.temp_c) ? Math.round(Number(hour.temp_c)) + "°C" : null;
  if (cloud <= 20) summaryParts.push("Clear sky");
  else if (cloud >= 60) summaryParts.push("Cloudy");
  if (wind != null) {
    if (wind <= 4) summaryParts.push("Calm");
    else if (wind >= 8) summaryParts.push(wind + " m/s wind");
    else summaryParts.push(wind + " m/s");
  }
  if (tempStr) summaryParts.push(tempStr);
  const summaryFull = summaryParts.filter(Boolean).join(" · ");
  if (els.summary) els.summary.textContent = summaryFull || "—";

  // Moon/twilight sub-line: sun state + moon altitude, then sun altitude on second line
  if (els.moonLine) {
    const sunAlt  = hour.sun_alt_deg;
    const moonAlt = hour.moon_alt_deg != null ? Math.round(hour.moon_alt_deg) : null;
    const moonParts = [];
    if (sunAlt != null && sunAlt > 0)        moonParts.push("☀ Daytime");
    else if (sunAlt != null && sunAlt > -18) moonParts.push("🌆 Twilight");
    else                                     moonParts.push("🌙 Night");
    if (moonAlt != null) moonParts.push("Moon " + moonAlt + "°");
    let moonHTML = escapeHtml(moonParts.join(" · "));
    if (sunAlt != null) {
      const sign = sunAlt >= 0 ? '+' : '';
      moonHTML += '<br><span class="hi-moon-sunalt">☀ Sun altitude: ' + sign + Math.round(sunAlt) + '°</span>';
    }
    els.moonLine.innerHTML = moonHTML;
  }

  // ── Mini-chart (±3 h) — param switchable via icon chips ──────────────────────
  if (els.sheet) els.sheet.dataset.currentHourIdx = hourIdx;
  const activeChartParam = els.sheet?.dataset.activeChartParam || 'moon_alt';
  renderHiChart(els, hours, hourIdx, activeChartParam);

  // ── Body ────────────────────────────────────────────────────────────────────
  let bodyHTML = "";

  // ── Section — Gate header (collapsible) + Category Cards inside ────────────
  const profile = getActiveProfile();
  // hiBd is already prioritized correctly (v5 score_breakdown preferred, computed above at line ~4077)
  const bdCats  = (hiBd && Array.isArray(hiBd.categories)) ? hiBd.categories : [];

  // Compute category scores for limiting factor detection, applying frontend gates
  const _hiDaytime = getSolarState(hour) === "day";
  const catScores = CATS.map(c => {
    const bdKey = c.bdKey || c.key.replace("_score","");
    let score = hour[c.key] ?? null;
    // Daylight gate: zero sky_darkness when sun is above horizon
    if (_hiDaytime && bdKey === "sky_darkness") score = 0;
    return { key: c.key, bdKey, label: c.label, ico: c.ico, score };
  });
  const validScores = catScores.filter(c => c.score != null);
  const minScore  = validScores.length ? Math.min(...validScores.map(c => c.score)) : null;
  const maxScore  = validScores.length ? Math.max(...validScores.map(c => c.score)) : null;
  const isLimiting = (cat) => minScore != null && cat.score === minScore && (maxScore - minScore) >= 10;

  // Gate header row (toggle collapses the whole category list)
  const gateCls = 'gate-badge gate-' + gateStatus;
  const gateBodyId = idPrefix + "hi-gate-body";
  const gateCollapsed = !!idPrefix;
  bodyHTML += '<div class="hour-inspector-section hi-gate-section">';
  bodyHTML += '<div class="hi-gate-header" data-panel="' + gateBodyId + '">'
    + '<span class="hi-toggle-btn">' + (gateCollapsed ? '▶' : '▼') + '</span>'
    + '<span class="hi-gate-title">Observation Gate</span>'
    + '<span class="hi-gate-spacer"></span>'
    + '<span class="' + gateCls + '">' + gateStatus + '</span>'
    + '</div>';
  // Category cards — inside the collapsible gate body (collapsed by default for embedded)
  bodyHTML += '<div id="' + gateBodyId + '" class="hi-cat-section" style="display:' + (gateCollapsed ? 'none' : '') + '">';

  const profileWeights = V5_CATEGORY_WEIGHTS[profile] || V5_CATEGORY_WEIGHTS.balanced;

  catScores.forEach((cat) => {
    const catScore  = cat.score;
    const pct       = catScore != null ? Math.max(0, Math.min(100, catScore)) : 0;
    const clr       = _fbColor(pct);
    const limiting  = isLimiting(cat);
    const panelId   = idPrefix + "hi-cat-" + cat.bdKey;

    // Per-category gate flags: from Python backend, or derived on frontend
    const catClosed = (cat.bdKey === 'sky_darkness' && (_hiDaytime || hour.sky_cat_closed))
                   || (cat.bdKey === 'atmosphere'   && hour.atm_cat_closed);

    // Get params from breakdown or fallback
    const bdCat = bdCats.find(c => c.key === cat.bdKey);
    let params  = [];
    if (bdCat && Array.isArray(bdCat.parameters) && bdCat.parameters.length > 0) {
      params = bdCat.parameters;
    } else if (HI_FALLBACK_PARAMS[cat.bdKey]) {
      params = HI_FALLBACK_PARAMS[cat.bdKey](hour);
    }

    // Weighted contribution: always use active profile weights (breakdown.weight is always Balanced)
    const effWeight    = profileWeights[cat.bdKey] ?? 0;
    const contribution = catScore != null ? Math.round(catScore * effWeight) : null;
    const weightFmt  = effWeight.toFixed(2);

    const catClosedBadge = catClosed
      ? '<span class="gate-badge gate-closed" style="font-size:9px;padding:1px 5px;margin-left:4px">CLOSED</span>'
      : '';

    bodyHTML += '<div class="hi-cat-card' + (limiting ? ' hi-limiting' : '') + '">';
    bodyHTML += '<div class="hi-cat-header" data-panel="' + panelId + '">'
      + '<span class="hi-toggle-btn">▶</span>'
      + '<span class="hi-cat-ico">' + cat.ico + '</span>'
      + '<span class="hi-cat-name">' + escapeHtml(cat.label) + '</span>'
      + catClosedBadge
      + '<div class="hi-cat-bar-wrap"><div class="hi-cat-bar-fill" style="width:' + pct + '%;background:' + clr + '"></div></div>'
      + '<span class="hi-cat-formula">'
      +   '<span class="hi-cat-score" style="color:' + clr + '">' + (catScore != null ? catScore : "—") + '</span>'
      +   '<span class="hi-cat-weight">×' + weightFmt + '</span>'
      +   '<span class="hi-cat-pts" style="color:' + clr + '">'
      +     (contribution != null ? '=' + contribution : '') + '</span>'
      + '</span>'
      + '</div>';

    // Params (collapsed by default)
    bodyHTML += '<div class="hi-cat-params" id="' + panelId + '" style="display:none">';
    if (params.length > 0) {
      params.forEach(p => {
        bodyHTML += renderScoreParamRow(p);
      });
    } else {
      bodyHTML += '<div style="font-size:11px;color:var(--muted);padding:4px 0">No parameter detail available.</div>';
    }
    bodyHTML += '</div>'; // hi-cat-params
    bodyHTML += '</div>'; // hi-cat-card
  });

  // Limiting factor banner
  if (minScore != null && maxScore - minScore >= 10) {
    const lim = catScores.find(c => c.score === minScore);
    bodyHTML += '<div class="hi-limiting-banner">⚠ Limiting factor: <strong>'
      + escapeHtml(lim.label) + '</strong> (' + minScore + ')</div>';
  }

  bodyHTML += '</div>'; // hi-gate-body (category cards)
  bodyHTML += '</div>'; // hi-gate-section

  // Clear legacy FWHM slot if exists
  if (els.fwhmSlot) els.fwhmSlot.innerHTML = '';

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

  // Chart param chip switcher — delegated on the full sheet
  if (els.sheet) {
    els.sheet.addEventListener('click', function(e) {
      const chip = e.target.closest('[data-chart-param]');
      if (!chip) return;
      const paramKey = chip.dataset.chartParam;
      const idx      = parseInt(els.sheet.dataset.currentHourIdx || '0', 10);
      const hrs      = weatherData?.hours;
      if (hrs) renderHiChart(els, hrs, idx, paramKey);
    });
  }

  // Delegated toggle for collapsible sections (v5 category cards + legacy panels)
  if (els.body) {
    els.body.addEventListener('click', function(e) {
      const title = e.target.closest('.hi-section-title[data-panel], .hi-cat-header[data-panel], .hi-gate-header[data-panel]');
      if (!title) return;
      const panel = document.getElementById(title.dataset.panel);
      const btn   = title.querySelector('.hi-toggle-btn');
      if (!panel) return;
      const isOpen = panel.style.display !== 'none';
      panel.style.display = isOpen ? 'none' : '';
      if (btn) btn.textContent = isOpen ? '▶' : '▼';
    });
  }
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

// ── Vertical layout (sidebar variant) ─────────────────────────────────────────

function renderWeatherHTMLVertical(rootEl) {
  rootEl.innerHTML = `
    <section class="card weather-vertical" id="poc-weather">
      <div class="v-inspector-embedded" data-role="v-inspector-embedded">
        <div class="v-inspector-header">
          <div class="v-inspector-left">
            <div class="v-inspector-time" data-role="v-hi-time">—</div>
            <div class="v-inspector-score-label">Score</div>
            <div class="v-inspector-score-row">
              <div class="v-inspector-score" data-role="v-hi-score">—</div>
              <div class="v-metrics-line" data-role="v-metrics-line">—</div>
            </div>
            <div class="v-inspector-label" data-role="v-hi-label">—</div>
          </div>
        </div>
        <div class="v-inspector-section v-charts-section">
          <div class="hi-gate-header" data-panel="v-emb-clouds">
            <span class="hi-toggle-btn">▶</span>
            <span class="hi-gate-title">Charts</span>
            <span class="hi-gate-spacer"></span>
          </div>
          <div id="v-emb-clouds" class="v-section-body" style="display:none">
            <div class="v-inspector-chart" data-role="v-hi-chart"></div>
          </div>
        </div>
        <div class="v-inspector-body" data-role="v-hi-body"></div>
      </div>
      <div class="v-mode-switch">
        <button class="htab" data-hmode="observing">Observing</button>
        <button class="htab" data-hmode="weather">Weather</button>
      </div>
      <div class="v-cards-roll" data-role="v-hourly" aria-label="hourly forecast"></div>
      <div class="legend">
        <span>Observation Gate:</span>
        <span><span class="dot" style="background:#3FB950"></span>Open</span>
        <span><span class="dot" style="background:#F2CC60"></span>Marginal</span>
        <span><span class="dot" style="background:#F85149"></span>Closed</span>
      </div>
      <div class="weather-meta" data-role="weather-meta" aria-live="polite">—</div>
    </section>
  `;
}

function setupEmbeddedInspectorToggles(weatherCard) {
  const container = weatherCard.querySelector("[data-role=v-inspector-embedded]");
  if (!container || container.dataset.togglesSetup === "true") return;
  container.dataset.togglesSetup = "true";
  container.addEventListener("click", function(e) {
    const title = e.target.closest(".hi-section-title[data-panel], .hi-cat-header[data-panel], .hi-gate-header[data-panel]");
    if (!title) return;
    const panel = document.getElementById(title.dataset.panel);
    const btn = title.querySelector(".hi-toggle-btn");
    if (!panel) return;
    const isOpen = panel.style.display !== "none";
    panel.style.display = isOpen ? "none" : "";
    if (btn) btn.textContent = isOpen ? "▶" : "▼";
    // Persist open panel IDs
    try {
      var allHeaders = container.querySelectorAll('.hi-gate-header[data-panel], .hi-section-title[data-panel], .hi-cat-header[data-panel]');
      var openIds = [];
      allHeaders.forEach(function(h) {
        var p = document.getElementById(h.dataset.panel);
        if (p && p.style.display !== 'none') openIds.push(h.dataset.panel);
      });
      localStorage.setItem(STORAGE_KEY_VERTICAL_PANELS, JSON.stringify(openIds));
    } catch (_) {}
  });
  const chartSlot = container.querySelector("[data-role=v-hi-chart]");
  if (chartSlot) {
    container.addEventListener("click", function(e) {
      const chip = e.target.closest("[data-chart-param]");
      if (!chip) return;
      const paramKey = chip.dataset.chartParam;
      const idx = parseInt(container.dataset.currentHourIdx || "0", 10);
      const hrs = weatherData?.hours;
      const card = container.closest("#poc-weather");
      if (hrs && card) {
        const els = getEmbeddedInspectorElements(card);
        if (els) {
          els.sheet.dataset.activeChartParam = paramKey;
          renderHiChart(els, hrs, idx, paramKey);
        }
      }
    });
  }
}

function getEmbeddedInspectorElements(weatherCard) {
  const container = weatherCard.querySelector("[data-role=v-inspector-embedded]");
  if (!container) return null;
  const sheet = { dataset: {} };
  return {
    time: container.querySelector("[data-role=v-hi-time]"),
    scoreVal: container.querySelector("[data-role=v-hi-score]"),
    scoreLabel: container.querySelector("[data-role=v-hi-label]"),
    summary: container.querySelector("[data-role=v-hi-summary]"),
    moonLine: container.querySelector("[data-role=v-hi-moon]"),
    scoreBar: container.querySelector("[data-role=v-hi-score-bar]"),
    chartSlot: container.querySelector("[data-role=v-hi-chart]"),
    body: container.querySelector("[data-role=v-hi-body]"),
    sheet
  };
}

function renderNowVertical(rootEl, nowHour) {
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const embeddedEls = getEmbeddedInspectorElements(weatherCard);
  if (embeddedEls && weatherData && weatherData.hours) {
    const r = findNearestHour(weatherData.hours);
    if (r.hour != null && embeddedEls.body) {
      const container = weatherCard.querySelector("[data-role=v-inspector-embedded]");
      if (container) {
        container.dataset.currentHourIdx = r.idx;
        container.dataset.activeChartParam = "moon_alt";
      }
      embeddedEls.sheet.dataset.currentHourIdx = r.idx;
      embeddedEls.sheet.dataset.activeChartParam = "moon_alt";
      renderHourInspector(r.idx, embeddedEls);
      setupEmbeddedInspectorToggles(weatherCard);
      // Restore expanded panel state
      try {
        var _raw = localStorage.getItem(STORAGE_KEY_VERTICAL_PANELS);
        if (_raw) {
          var _openIds = JSON.parse(_raw);
          var _container = weatherCard.querySelector("[data-role=v-inspector-embedded]");
          if (Array.isArray(_openIds) && _container) {
            _openIds.forEach(function(id) {
              var _panel = document.getElementById(id);
              if (!_panel) return;
              _panel.style.display = '';
              var _hdr = _container.querySelector('[data-panel="' + id + '"]');
              if (_hdr) { var _btn = _hdr.querySelector('.hi-toggle-btn'); if (_btn) _btn.textContent = '▼'; }
            });
          }
        }
      } catch (_) {}
    }
  }
  const metricsEl = weatherCard.querySelector("[data-role=v-metrics-line]");
  if (!metricsEl) return;
  if (!nowHour) {
    metricsEl.textContent = "—";
    return;
  }
  const cloud = formatCloud(nowHour.cloud_total);
  const score = getHourScore(nowHour);
  const obsLabel = score >= 75 ? "Good" : score >= 50 ? "Fair" : score >= 30 ? "Poor" : "Bad";
  const wind = formatWind(nowHour.wind_m_s);
  const windStr = wind != null ? wind + " m/s" : "—";
  const humRaw = nowHour.humidity_pct ?? nowHour.relative_humidity;
  const humidity = humRaw != null && isValidValue(humRaw)
    ? Math.round(humRaw > 1 ? humRaw : humRaw * 100) + "%"
    : "—";
  const tempStr = nowHour.temp_c != null && isValidValue(nowHour.temp_c)
    ? Math.round(Number(nowHour.temp_c)) + "°C"
    : "—";
  const moonAlt = nowHour.moon_alt_deg;
  const moonStr = moonAlt != null && isValidValue(moonAlt) ? Math.round(moonAlt) + "°" : "—";
  const parts = [
    "☁ " + cloud + "%",
    "🔭 " + obsLabel,
    "🌬 " + windStr,
    "💧 " + humidity,
    "🌡 " + tempStr,
    "🌙 " + moonStr
  ];
  metricsEl.textContent = parts.join(" ");
}

function renderVerticalHourCard(hour, hourIdx) {
  const timeStr = formatTime(hour.time);
  const score = formatScore(getHourScore(hour));
  const sc = scoreClass(score);
  const gateStatus = typeof hour.gate === "string" ? hour.gate : ((hour.gate && hour.gate.status) ? hour.gate.status : "OPEN");
  const solarCls = getSolarState(hour);
  const rank = scoreLabelText(sc, score);

  const cloud = formatCloud(hour.cloud_total);
  const tempStr = hour.temp_c != null && isValidValue(hour.temp_c) ? Math.round(Number(hour.temp_c)) + "°C" : null;
  const wind = formatWind(hour.wind_m_s);
  const visKm = formatVisibility(hour.visibility_m);
  const prob = formatPrecipProb(hour.precip_prob);

  const iconName = pickIcon(hour);
  const iconBase = (window.__WEATHER_POC_CONFIG && window.__WEATHER_POC_CONFIG.iconBase) ? window.__WEATHER_POC_CONFIG.iconBase : "/assets/icons/weather";
  const iconPath = (iconBase.charAt(iconBase.length - 1) === "/" ? iconBase : iconBase + "/") + iconName;
  const wxTempStr = hour.temp_c != null && isValidValue(hour.temp_c) ? Math.round(Number(hour.temp_c)) + "°C" : "—";

  let leftContent, rightContent;
  if (hourlyMode === "weather") {
    const paramParts = [
      wxTempStr,
      `☁️ ${cloud}%`,
      wind != null ? `💨 ${wind}m/s` : null,
      visKm != null ? `👁️ ${visKm}km` : null,
      "Obs: " + score
    ].filter(Boolean);
    const paramsLine = paramParts.length > 0 ? paramParts.join(" ") : "—";
    leftContent = `
        <div class="v-hour-time">${escapeHtml(timeStr)}</div>
        <img class="wx-ico v-hour-wx-ico" src="${escapeHtml(iconPath)}" alt="" aria-hidden="true">
      `;
    rightContent = `<div class="v-hour-params v-hour-params-inline">${escapeHtml(paramsLine)}</div>`;
  } else {
    const paramParts = [
      `☁️ ${cloud}%`,
      tempStr ? `🌡 ${tempStr}` : null,
      prob > 0 ? `🌧️ ${prob}%` : null,
      wind != null ? `💨 ${wind}m/s` : null,
      visKm != null ? `👁️ ${visKm}km` : null
    ].filter(Boolean);
    const paramsLine = paramParts.length > 0 ? paramParts.join(" ") : "—";
    leftContent = `
        <div class="v-hour-time">${escapeHtml(timeStr)}</div>
        <div class="v-hour-score" style="color:var(--${sc})">${score}</div>
        <div class="v-hour-label ${sc}">${escapeHtml(rank)}</div>
      `;
    rightContent = `
        ${renderConditionMarkers(hour)}
        <div class="v-hour-params">${escapeHtml(paramsLine)}</div>
      `;
  }

  const cardClass = hourlyMode === "weather" ? "v-hour-card v-hour-card-weather" : "v-hour-card";
  return `
    <div class="hour ${cardClass} gate-${gateStatus} ${solarCls}" data-hour-idx="${hourIdx}">
      <div class="v-hour-left">${leftContent}</div>
      <div class="v-hour-right">${rightContent}</div>
    </div>
  `;
}

function renderVerticalCardStack(rootEl, hours) {
  ensureFbStyles();
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;
  const hourlyEl = weatherCard.querySelector("[data-role=v-hourly]");
  if (!hourlyEl) return;
  const now = Date.now();
  const end72 = now + 72 * 60 * 60 * 1000;
  const futureHours = (hours || []).filter(h => {
    const dt = parseISO(h.time);
    return dt && dt.getTime() > now && dt.getTime() <= end72;
  });
  if (futureHours.length === 0) {
    hourlyEl.innerHTML = '<div style="padding:12px;text-align:center;color:var(--muted);font-size:12px">No forecast hours</div>';
    return;
  }
  hourlyEl.innerHTML = futureHours.map((hour, futureIdx) => {
    const fullIdx = hours.findIndex(h => h.time === hour.time);
    const hourIdx = fullIdx >= 0 ? fullIdx : futureIdx;
    return renderVerticalHourCard(hour, hourIdx);
  }).join("");
}

// Render weather widget HTML structure (location-agnostic; no city, profile, or time-range controls)
function renderWeatherHTML(rootEl) {
  rootEl.innerHTML = `
    <section class="card" id="poc-weather">
      <div class="top-panel-v2">

        <!-- Panel 1: Observing Quality -->
        <div class="tp-panel tp-quality" data-role="tp-quality">
          <div class="tp-label">Observing Quality</div>
          <div class="tp-quality-body">
            <div class="tp-quality-main">
              <div class="tp-gate-row">
                <span class="gate-badge" data-role="gate-badge">—</span>
              </div>
              <div class="tp-score-row">
                <span class="tp-score-val"  data-role="score-val">—</span>
                <span class="tp-score-rank" data-role="score-rank">—</span>
              </div>
              <div class="score-bar tp-score-bar" data-role="score-bar">
                <div class="score-bar-fill" style="width:0%"></div>
              </div>
              <button type="button" class="tp-explain-toggle"
                      data-role="explain-toggle" aria-expanded="false">Details ▶</button>
            </div>
            <div class="profile-switcher tp-profiles" data-role="profile-switcher"></div>
          </div>
        </div>

        <!-- Panel 2: Sky Status -->
        <div class="tp-panel tp-sky-status" data-role="tp-sky-status">
          <div class="tp-label">Sky Status
            <span class="tp-trend" data-role="tp-trend"></span>
          </div>
          <div class="tp-categories" data-role="tp-categories"></div>
          <div class="tp-diag-row"   data-role="tp-diag-row"></div>
        </div>

        <!-- Panel 3: Best Observing Window (flex:1) -->
        <div class="tp-panel tp-best-window" data-role="tp-best-window">
          <div class="tp-label">Best Observing Window</div>
          <div class="tp-window-range" data-role="tp-window-range">—</div>
          <div class="tp-window-score" data-role="tp-window-score"></div>
          <div class="tp-window-bar-wrap">
            <div class="tp-window-bar" data-role="tp-window-bar"></div>
          </div>
        </div>

        <!-- Hidden: Time & Location (kept for possible future use) -->
        <div class="tp-panel tp-time-location" data-role="tp-time-location" style="display:none">
          <div class="tp-label">Time &amp; Location</div>
          <div class="tp-loc-line"      data-role="tp-loc-line">—</div>
          <div class="tp-datetime-line" data-role="tp-datetime-line">—</div>
        </div>

      </div>

      <!-- Collapsible breakdown panel -->
      <div class="overall-explain-wrap">
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
                <table class="current-details-table" data-role="current-details-table"><tbody></tbody></table>
              </div>
            </div>
            <div class="expect-banner">
              <h4 class="expect-banner-title">What to expect the next few hours:</h4>
              <ul class="expect-banner-list" data-role="warnings-list"></ul>
            </div>
          </div>
        </div>
      </div>

      <div class="hourly-header">
        <span class="sectionTitle">Hourly</span>
        <div class="hourly-tabs">
          <button class="htab" data-hmode="observing" data-active="true">Observing</button>
          <button class="htab" data-hmode="matrix">Matrix</button>
          <button class="htab" data-hmode="weather">Weather</button>
        </div>
      </div>
      <div class="hourly" aria-label="hourly forecast" data-role="hourly">
        <!-- Will be populated by renderHourly -->
      </div>
      <div class="forecast-matrix-wrap" id="forecastMatrix" style="display:none" aria-label="Forecast matrix"></div>

      <div class="legend">
        <span>Observation Gate:</span>
        <span><span class="dot" style="background:#3FB950"></span>Open</span>
        <span><span class="dot" style="background:#F2CC60"></span>Marginal</span>
        <span><span class="dot" style="background:#F85149"></span>Closed</span>
      </div>
      <div class="weather-meta" data-role="weather-meta" aria-live="polite">—</div>
    </section>
  `;
}

export function mountWeather(rootEl, storeApi, options) {
  layoutMode = (options && options.layout === "vertical") ? "vertical" : "default";
  fetchSunMoonEvents(storeApi && storeApi.getState && storeApi.getState().location);

  if (layoutMode === "vertical") {
    renderWeatherHTMLVertical(rootEl);
  } else {
    renderWeatherHTML(rootEl);
    renderProfileSwitcher(rootEl);
  }
  const weatherCard = rootEl.querySelector("#poc-weather") || rootEl;

  var tabParam = typeof window !== "undefined" && window.location.search
    ? new URLSearchParams(window.location.search).get("tab") : null;
  if (tabParam === "observing" || tabParam === "weather" || tabParam === "matrix") {
    hourlyMode = tabParam;
  } else {
    try {
      var stored = localStorage.getItem(STORAGE_KEY_VERTICAL_TAB);
      if (stored === "observing" || stored === "weather" || stored === "matrix") hourlyMode = stored;
    } catch (e) {}
  }
  try {
    var storedOverlays = localStorage.getItem(STORAGE_KEY_MATRIX_OVERLAYS);
    if (storedOverlays) {
      var overlayArr = JSON.parse(storedOverlays);
      if (Array.isArray(overlayArr)) matrixOverlayParams = new Set(overlayArr);
    }
  } catch (_) {}
  weatherCard.querySelectorAll(".htab[data-hmode]").forEach(function(btn) {
    btn.removeAttribute("data-active");
    if (btn.dataset.hmode === hourlyMode) btn.setAttribute("data-active", "true");
    btn.addEventListener("click", function() {
      weatherCard.querySelectorAll(".htab[data-hmode]").forEach(function(b) { b.removeAttribute("data-active"); });
      btn.setAttribute("data-active", "true");
      hourlyMode = btn.dataset.hmode;
      try {
        localStorage.setItem(STORAGE_KEY_VERTICAL_TAB, hourlyMode);
      } catch (e) {}
      if (layoutMode === "vertical" && typeof window !== "undefined" && window.self !== window.top) {
        try {
          window.parent.postMessage({ type: "nc-weather-state", tab: hourlyMode }, "*");
        } catch (e2) {}
      }
      if (layoutMode === "vertical") {
        if (weatherData && weatherData.hours) {
          renderVerticalCardStack(rootEl, weatherData.hours);
        }
      } else {
        const hourlyEl = weatherCard.querySelector("[data-role=hourly]");
        const matrixWrap = weatherCard.querySelector("#forecastMatrix");
        if (hourlyMode === "matrix") {
          if (hourlyEl) hourlyEl.style.display = "none";
          if (matrixWrap) matrixWrap.style.display = "";
          if (weatherData && weatherData.hours) {
            renderForecastMatrix(rootEl, weatherData.hours);
          }
        } else {
          if (hourlyEl) hourlyEl.style.display = "";
          if (matrixWrap) matrixWrap.style.display = "none";
          if (weatherData && weatherData.hours) {
            renderHourly(rootEl, weatherData.hours);
          }
        }
      }
    });
  });

  if (layoutMode !== "vertical") {
    const matrixWrapEl = weatherCard.querySelector("#forecastMatrix");
    if (matrixWrapEl) {
      matrixWrapEl.addEventListener("click", function(e) {
        const cell = e.target.closest(".matrix-cell[data-hour-idx]");
        if (!cell || cell.classList.contains("matrix-time-cell")) return;
        const idx = parseInt(cell.dataset.hourIdx, 10);
        if (!isNaN(idx)) openHourInspector(idx);
      });
    }
  }

  let lastLocKey = "";
  const unsubscribe = storeApi.subscribe(async (state) => {
    if (!state.location || !state.location.lat || !state.location.lon) return;
    const locKey = state.location.lat + "," + state.location.lon;
    const locationChanged = lastLocKey !== locKey;
    lastLocKey = locKey;
    activeProfile = (state.profile && state.profile !== "default") ? state.profile : "balanced";
    currentMode = "7d";
    if (locationChanged) {
      await loadWeather(rootEl, state);
    } else if (weatherData && weatherData.hours) {
      var r = findNearestHour(weatherData.hours);
      if (layoutMode === "vertical") {
        renderNowVertical(rootEl, r.hour);
        renderVerticalCardStack(rootEl, weatherData.hours);
      } else {
        renderNow(rootEl, r.hour);
        renderHourly(rootEl, weatherData.hours);
        if (hourlyMode === "matrix") renderForecastMatrix(rootEl, weatherData.hours);
        const chartEls = getChartElements();
        if (currentChartParam && chartEls.overlay && chartEls.overlay.getAttribute("aria-hidden") === "false") {
          renderChart(currentChartParam);
        }
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

