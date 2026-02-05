/**
 * Sun Equation widget (sun_moon)
 * Pure frontend: uses SunCalc if available.
 */

const SUNMOON_DAYS_RANGE = 3; // today ±3 days (7 days total)

function getSunCalc() {
  const lib = window.SunCalc || (typeof SunCalc !== "undefined" ? SunCalc : null);
  if (!lib) {
    console.warn("[sun_moon] SunCalc not loaded");
  }
  return lib;
}

function formatDateLabel(baseDate, offset) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offset);
  const today = new Date();
  const baseMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((dMid - baseMid) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";
  const opts = { weekday: "short" };
  return d.toLocaleDateString(undefined, opts);
}

function getMoonPhaseInfo(illum) {
  const phase = illum.phase; // 0..1
  const frac = illum.fraction; // 0..1
  const pct = Math.round(frac * 100);
  let name, emoji;
  if (phase < 0.0625 || phase >= 0.9375) {
    name = "New Moon";
    emoji = "🌑";
  } else if (phase < 0.1875) {
    name = "Waxing Crescent";
    emoji = "🌒";
  } else if (phase < 0.3125) {
    name = "First Quarter";
    emoji = "🌓";
  } else if (phase < 0.4375) {
    name = "Waxing Gibbous";
    emoji = "🌔";
  } else if (phase < 0.5625) {
    name = "Full Moon";
    emoji = "🌕";
  } else if (phase < 0.6875) {
    name = "Waning Gibbous";
    emoji = "🌖";
  } else if (phase < 0.8125) {
    name = "Last Quarter";
    emoji = "🌗";
  } else {
    name = "Waning Crescent";
    emoji = "🌘";
  }
  return { name, emoji, pct };
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
  const local = getLocalDate(dateUtc, tz);
  return local.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function computeDaySamples(baseDate, offset, lat, lon, tz) {
  const SunCalcLib = getSunCalc();
  if (!SunCalcLib) return null;
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offset);

  const samples = [];
  for (let h = 0; h < 24; h++) {
    // Construct Date in target tz by taking midnight local and adding hours
    const localMidnight = getLocalDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()), tz);
    const local = new Date(localMidnight.getTime() + h * 3600000);
    const utc = new Date(local.toLocaleString("en-US", { timeZone: "UTC" }));

    const sunPos = SunCalcLib.getPosition(utc, lat, lon);
    const moonPos = SunCalcLib.getMoonPosition(utc, lat, lon);

    samples.push({
      hour: h,
      time: utc.toISOString(),
      sunAlt: (sunPos.altitude || 0) * 180 / Math.PI,
      moonAlt: (moonPos.altitude || 0) * 180 / Math.PI
    });
  }

  const times = SunCalcLib.getTimes(d, lat, lon);
  const moonTimes = SunCalcLib.getMoonTimes(d, lat, lon, true);
  const illum = SunCalcLib.getMoonIllumination(d);
  const moonInfo = getMoonPhaseInfo(illum);

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

  const day = diffHours(times.sunrise, times.sunset);
  const astroNight = diffHours(times.night, times.nightEnd);
  const civil = diffHours(times.dawn, times.dusk);
  const astroTwilight = diffHours(times.nauticalDawn || times.dawn, times.nauticalDusk || times.dusk) || null;
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

  const padding = { left: 32, right: 10, top: 10, bottom: 32 };
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;

  const xs = data.samples.map(s => s.hour);
  const sunAlts = data.samples.map(s => s.sunAlt);
  const minAlt = Math.min(-18, Math.min.apply(null, sunAlts)) - 2;
  const maxAlt = Math.max(60, Math.max.apply(null, sunAlts)) + 2;

  function xForHour(hr) {
    return padding.left + (hr / 23) * innerW;
  }
  function yForAlt(a) {
    const t = (a - minAlt) / (maxAlt - minAlt);
    return padding.top + (1 - t) * innerH;
  }

  // Background twilight bands based on alt thresholds
  const bandSteps = 96; // fine enough for smooth bands
  function altAtFraction(f) {
    const hr = f * 23;
    const i0 = Math.floor(hr);
    const i1 = Math.min(23, i0 + 1);
    const t = hr - i0;
    const a0 = sunAlts[i0];
    const a1 = sunAlts[i1];
    return a0 + (a1 - a0) * t;
  }

  function altForHour(hr) {
    const i0 = Math.floor(hr);
    const i1 = Math.min(23, i0 + 1);
    const t = hr - i0;
    const a0 = sunAlts[i0];
    const a1 = sunAlts[i1];
    return a0 + (a1 - a0) * t;
  }

  function fillBand(minDeg, maxDeg, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(padding.left, yForAlt(minDeg));
    for (let i = 0; i <= bandSteps; i++) {
      const f = i / bandSteps;
      const hr = f * 23;
      const alt = Math.max(minDeg, Math.min(maxDeg, altAtFraction(f)));
      const y = yForAlt(alt);
      const x = xForHour(hr);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(padding.left + innerW, yForAlt(maxDeg));
    ctx.lineTo(padding.left, yForAlt(maxDeg));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // Astronomical night: alt <= -18 (darkest)
  fillBand(-90, -18, "rgba(0, 0, 0, 0.72)");
  // Astronomical twilight: -18 < alt <= -6
  fillBand(-18, -6, "rgba(20, 20, 20, 0.55)");
  // Civil twilight: -6 < alt <= 0 (lightest)
  fillBand(-6, 0, "rgba(40, 40, 40, 0.42)");

  // Daylight area under the sun curve between sunrise and sunset
  function fillDaylight(times) {
    if (!times || !times.sunrise || !times.sunset) return;
    const sunriseHr = getLocalHour(times.sunrise, tz);
    const sunsetHr = getLocalHour(times.sunset, tz);
    if (sunriseHr == null || sunsetHr == null) return;
    const start = Math.max(0, Math.min(23, sunriseHr));
    const end = Math.max(0, Math.min(23, sunsetHr));
    if (end <= start) return;

    const steps = 80;
    ctx.save();
    ctx.beginPath();
    // Horizon line from sunrise to sunset
    ctx.moveTo(xForHour(start), yHorizon);
    for (let i = 0; i <= steps; i++) {
      const hr = start + (end - start) * (i / steps);
      ctx.lineTo(xForHour(hr), yHorizon);
    }
    // Back along the sun curve
    for (let i = steps; i >= 0; i--) {
      const hr = start + (end - start) * (i / steps);
      const alt = Math.max(0, altForHour(hr));
      const y = yForAlt(alt);
      ctx.lineTo(xForHour(hr), y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 230, 140, 0.16)";
    ctx.fill();
    ctx.restore();
  }

  // Axes
  ctx.strokeStyle = "rgba(120,130,150,0.45)";
  ctx.lineWidth = 0.8;
  const yHorizon = yForAlt(0);
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
    ctx.moveTo(x, yHorizon);
    ctx.lineTo(x, yHorizon + 3);
    ctx.stroke();
    ctx.fillText(String(hr).padStart(2, "0"), x, yHorizon + 4);
  }

  const tz = data.tz || "UTC";

  // Daylight fill must know times, so do it after yHorizon and tz are defined
  fillDaylight(data.times);

  // Event markers (Sun + Moon) — только линии, подписи рисуем в DOM ниже графика
  function drawEvent(label, dateObj, rowIndex, color, isMoon) {
    if (!dateObj) return;
    const hr = getLocalHour(dateObj, tz);
    if (hr == null || hr < 0 || hr > 24) return;
    const xLine = xForHour(hr);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash(isMoon ? [2, 3] : [3, 4]);
    ctx.beginPath();
    ctx.moveTo(xLine, yHorizon - 6);
    ctx.lineTo(xLine, padding.top + innerH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Sun curve
  ctx.beginPath();
  data.samples.forEach((s, idx) => {
    const x = xForHour(s.hour);
    const y = yForAlt(s.sunAlt);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#ffd36b";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Moon curve
  ctx.beginPath();
  data.samples.forEach((s, idx) => {
    const x = xForHour(s.hour);
    const y = yForAlt(s.moonAlt);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "rgba(143,182,255,0.9)";
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Sun emoji at solar noon (approx)
  if (data.times && data.times.solarNoon) {
    const hrNoon = getLocalHour(data.times.solarNoon, tz);
    if (hrNoon != null) {
      const xNoon = xForHour(hrNoon);
      const altNoon = altForHour(Math.max(0, Math.min(23, hrNoon)));
      const yNoon = yForAlt(altNoon);
      ctx.save();
      ctx.font = "16px system-ui, Apple Color Emoji, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("☀️", xNoon, yNoon);
      ctx.restore();
    }
  }

  // Moon emoji near its highest altitude
  if (data.moonInfo && data.samples && data.samples.length) {
    let best = data.samples[0];
    data.samples.forEach(s => {
      if (s.moonAlt > best.moonAlt) best = s;
    });
    const x = xForHour(best.hour);
    const y = yForAlt(best.moonAlt);
    ctx.save();
    ctx.font = "16px system-ui, Apple Color Emoji, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(data.moonInfo.emoji, x, y);
    ctx.restore();
  }

  // Altitude labels on the left for culmination heights
  const maxSunAltVal = Math.max.apply(null, sunAlts);
  const ySunMax = yForAlt(maxSunAltVal);
  ctx.save();
  ctx.font = "10px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(200,200,210,0.9)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(`☀ ${maxSunAltVal.toFixed(0)}°`, padding.left - 6, ySunMax);
  if (data.moonInfo && data.samples && data.samples.length) {
    let bestMoon = data.samples[0];
    data.samples.forEach(s => {
      if (s.moonAlt > bestMoon.moonAlt) bestMoon = s;
    });
    const yMoonMax = yForAlt(bestMoon.moonAlt);
    ctx.fillText(`🌙 ${bestMoon.moonAlt.toFixed(0)}°`, padding.left - 6, yMoonMax);
  }
  ctx.restore();

  // Label key solar and lunar times with vertical markers only
  if (data.times) {
    drawEvent("Night", data.times.nightEnd, 0, "rgba(180,180,180,0.7)", false);
    drawEvent("Astro twilight", data.times.nauticalDawn || data.times.nightEnd, 0, "rgba(150,150,150,0.7)", false);
    drawEvent("Civil twilight", data.times.dawn, 0, "rgba(200,200,200,0.8)", false);
    drawEvent("Sunrise", data.times.sunrise, 0, "#ffd36b", false);
    drawEvent("Sun culmination", data.times.solarNoon, 0, "#ffd36b", false);
    drawEvent("Sunset", data.times.sunset, 0, "#ffd36b", false);
    drawEvent("Civil twilight", data.times.dusk, 0, "rgba(200,200,200,0.8)", false);
    drawEvent("Astro twilight", data.times.nauticalDusk || data.times.night, 0, "rgba(150,150,150,0.7)", false);
    drawEvent("Night", data.times.night, 0, "rgba(180,180,180,0.7)", false);
  }
  if (data.moonTimes) {
    drawEvent("Moonrise", data.moonTimes.rise, 1, "#8fb6ff", true);
    drawEvent("Moon culmination", data.moonCulmination || null, 1, "#8fb6ff", true);
    drawEvent("Moonset", data.moonTimes.set, 1, "#8fb6ff", true);
  }

  // Selected hour marker
  if (selectedHour != null) {
    const s = data.samples.find(s => s.hour === selectedHour) || data.samples[0];
    const x = xForHour(s.hour);
    ctx.save();
    // vertical line
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + innerH);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    // sun point
    ctx.beginPath();
    ctx.arc(x, yForAlt(s.sunAlt), 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd36b";
    ctx.fill();
    // moon point
    ctx.beginPath();
    ctx.arc(x, yForAlt(s.moonAlt), 3, 0, Math.PI * 2);
    ctx.fillStyle = "#8fb6ff";
    ctx.fill();
    ctx.restore();
  }
}

export function mountSunMoon(rootEl, storeApi) {
  const state = storeApi.getState();
  const baseDate = new Date();

  rootEl.innerHTML = `
    <div class="sunmoon-card">
      <div class="sunmoon-header">
        <div class="sunmoon-title">Sun Equation</div>
        <div class="sunmoon-moon" data-role="moon-info"></div>
      </div>
      <div class="sunmoon-controls" data-role="day-controls"></div>
      <div class="sunmoon-graph-wrap">
        <canvas class="sunmoon-canvas" data-role="canvas"></canvas>
      </div>
      <div class="sunmoon-events" data-role="events"></div>
      <div class="sunmoon-hourline" data-role="hour-line"></div>
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
          <span class="sunmoon-summary-label">Moon phase</span>
          <span class="sunmoon-summary-value" data-role="moon-phase">—</span>
        </div>
      </div>
    </div>
  `;

  const dayControlsEl = rootEl.querySelector("[data-role=day-controls]");
  const canvas = rootEl.querySelector("[data-role=canvas]");
  const moonInfoEl = rootEl.querySelector("[data-role=moon-info]");
  const eventsEl = rootEl.querySelector("[data-role=events]");
  const dayLenEl = rootEl.querySelector("[data-role=day-length]");
  const nightLenEl = rootEl.querySelector("[data-role=night-length]");
  const civilLenEl = rootEl.querySelector("[data-role=civil-length]");
  const moonPhaseEl = rootEl.querySelector("[data-role=moon-phase]");
  const hourLineEl = rootEl.querySelector("[data-role=hour-line]");

  let cachedDays = new Map(); // key: offset, value: computed data
  let selectedOffset = 0;
  let selectedHour = new Date().getHours();

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
    const key = offset + "|" + loc.lat.toFixed(4) + "|" + loc.lon.toFixed(4) + "|" + (loc.tz || "UTC");
    if (cachedDays.has(key)) return cachedDays.get(key);
    const data = computeDaySamples(baseDate, offset, loc.lat, loc.lon, loc.tz);
    cachedDays.set(key, data);

    // publish sun:times event for this date
    if (data && data.times) {
      const payload = {
        type: "sun:times",
        date: data.date.toISOString().slice(0,10),
        location: { lat: loc.lat, lon: loc.lon, tz: loc.tz || "UTC", name: loc.name },
        times: {
          sunrise: data.times.sunrise ? data.times.sunrise.toISOString() : null,
          sunset: data.times.sunset ? data.times.sunset.toISOString() : null,
          solarNoon: data.times.solarNoon ? data.times.solarNoon.toISOString() : null,
          dawn: data.times.dawn ? data.times.dawn.toISOString() : null,
          dusk: data.times.dusk ? data.times.dusk.toISOString() : null,
          nauticalDawn: data.times.nauticalDawn ? data.times.nauticalDawn.toISOString() : null,
          nauticalDusk: data.times.nauticalDusk ? data.times.nauticalDusk.toISOString() : null,
          night: data.times.night ? data.times.night.toISOString() : null,
          nightEnd: data.times.nightEnd ? data.times.nightEnd.toISOString() : null
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
      btn.textContent = formatDateLabel(baseDate, offset);
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
    const data = ensureDay(selectedOffset);
    if (!data) {
      if (moonInfoEl) moonInfoEl.textContent = "SunCalc unavailable";
      return;
    }
    const { moonInfo, times } = data;

    if (moonInfoEl) {
      moonInfoEl.textContent = `Moon: ${moonInfo.emoji} ${moonInfo.name}, ${moonInfo.pct}%`;
    }
    if (moonPhaseEl) {
      moonPhaseEl.textContent = `${moonInfo.emoji} ${moonInfo.name}, ${moonInfo.pct}%`;
    }

    const durations = computeDurations(times);
    if (dayLenEl) dayLenEl.textContent = formatDuration(durations.day);
    if (nightLenEl) nightLenEl.textContent = formatDuration(durations.astroNight);
    if (civilLenEl) civilLenEl.textContent = formatDuration(durations.civil);

    if (eventsEl) {
      const tzLocal = data.tz || "UTC";
      const evOrdered = [];

      // Moon / night / twilights / sun in explicit order
      if (data.moonTimes && data.moonTimes.rise) {
        evOrdered.push({ label: "Moonrise", time: data.moonTimes.rise });
      }
      if (times && times.nightEnd) {
        evOrdered.push({ label: "Night end", time: times.nightEnd });
      }
      if (data.moonCulmination) {
        evOrdered.push({ label: "Moon culmination", time: data.moonCulmination });
      }
      if (times && (times.nauticalDawn || times.nightEnd)) {
        evOrdered.push({ label: "Astro twilight", time: times.nauticalDawn || times.nightEnd });
      }
      if (times && times.dawn) {
        evOrdered.push({ label: "Civil twilight", time: times.dawn });
      }
      if (times && times.sunrise) {
        evOrdered.push({ label: "Sunrise", time: times.sunrise });
      }
      if (times && times.solarNoon) {
        evOrdered.push({ label: "Sun culmination", time: times.solarNoon });
      }
      if (times && times.sunset) {
        evOrdered.push({ label: "Sunset", time: times.sunset });
      }
      if (times && times.dusk) {
        evOrdered.push({ label: "Civil twilight", time: times.dusk });
      }
      if (times && (times.nauticalDusk || times.night)) {
        evOrdered.push({ label: "Astro twilight", time: times.nauticalDusk || times.night });
      }
      if (times && times.night) {
        evOrdered.push({ label: "Night", time: times.night });
      }
      if (data.moonTimes && data.moonTimes.set) {
        evOrdered.push({ label: "Moonset", time: data.moonTimes.set });
      }

      eventsEl.innerHTML = evOrdered
        .filter(e => e.time)
        .map(e => {
          return `<span class="sunmoon-event"><span class="sunmoon-event-label">${e.label}</span><span class="sunmoon-event-time">${formatLocalTime(e.time, tzLocal)}</span></span>`;
        })
        .join(" ");
    }

    if (hourLineEl) {
      const sample = data.samples.find(s => s.hour === selectedHour) || data.samples[0];
      const timeStr = String(sample.hour).padStart(2,"0")+":00";
      const sunAlt = sample.sunAlt.toFixed(1);
      const moonAlt = sample.moonAlt.toFixed(1);
      hourLineEl.textContent = `${timeStr} • Sun ${sunAlt}° • Moon ${moonAlt}° • Illum ${moonInfo.pct}%`;
    }

    drawSunMoonCanvas(canvas, data, selectedHour);
  }

  // Simple hour scrubber: click on canvas to select hour
  if (canvas) {
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const w = rect.width || 1;
      const hr = Math.round((x / w) * 23);
      selectedHour = Math.max(0, Math.min(23, hr));
      update();
    });
  }

  renderControls();
  update();

  // React to location changes from global store
  storeApi.subscribe(() => {
    cachedDays.clear();
    update();
  });
}

