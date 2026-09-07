import { getLunarState } from "../../shared/lunar.mjs";
// core/sky.prepare.js
import { DEFAULTS } from "./sky.constants.js";

const A = (function () {
  const TAU = Math.PI * 2;

  function deg2rad(deg) { return (deg * Math.PI) / 180; }
  function rad2deg(rad) { return (rad * 180) / Math.PI; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  function normRad2Pi(rad) {
    let r = rad % TAU;
    if (r < 0) r += TAU;
    return r;
  }

  function normRadPi(rad) {
    let r = normRad2Pi(rad);
    if (r > Math.PI) r -= TAU;
    return r;
  }

  function toJulianDate(date) {
    const ms = date.getTime();
    return ms / 86400000 + 2440587.5;
  }

  function gmstRad(jd) {
    const d = jd - 2451545.0;
    const gmstHours = 18.697374558 + 24.06570982441908 * d;
    const gmst = (gmstHours % 24) * (Math.PI / 12);
    return normRad2Pi(gmst);
  }

  function lstRad(jd, lonRad) {
    return normRad2Pi(gmstRad(jd) + lonRad);
  }

  // RA/Dec -> Alt/Az (az: 0=N, 90=E)
  function raDecToAltAz(raRad, decRad, latRad, lstRadVal) {
    const H = normRadPi(lstRadVal - raRad);

    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    const sinDec = Math.sin(decRad);
    const cosDec = Math.cos(decRad);

    const sinAlt = sinLat * sinDec + cosLat * cosDec * Math.cos(H);
    const alt = Math.asin(clamp(sinAlt, -1, 1));

    const cosAlt = Math.cos(alt);

    let sinAz, cosAz;
    if (cosAlt < 1e-12) {
      sinAz = 0;
      cosAz = 1;
    } else {
      sinAz = (-Math.sin(H) * cosDec) / cosAlt;
      cosAz = (sinDec - sinAlt * sinLat) / (cosAlt * cosLat);
    }

    let az = Math.atan2(sinAz, cosAz);
    az = normRad2Pi(az);

    return { altRad: alt, azRad: az };
  }

  // Ecliptic -> Equatorial (J2000 mean obliquity)
  function eclToRaDec(lambdaRad, betaRad, epsRad) {
    const sinLam = Math.sin(lambdaRad);
    const cosLam = Math.cos(lambdaRad);
    const sinBet = Math.sin(betaRad);
    const cosBet = Math.cos(betaRad);
    const sinE = Math.sin(epsRad);
    const cosE = Math.cos(epsRad);

    const x_e = cosBet * cosLam;
    const y_e = cosBet * sinLam;
    const z_e = sinBet;

    const x = x_e;
    const y = y_e * cosE - z_e * sinE;
    const z = y_e * sinE + z_e * cosE;

    const ra = normRad2Pi(Math.atan2(y, x));
    const dec = Math.asin(clamp(z, -1, 1));
    return { raRad: ra, decRad: dec };
  }

  // Stereographic from zenith: horizon -> radius R
  function altAzToXY(altRad, azRad, cx, cy, R) {
    const z = (Math.PI / 2) - altRad; // zenith distance
    const rr = R * Math.tan(z / 2);   // horizon -> R
  
    // ✅ Mirror horizontally (same as in sky.astro.js)
    const x = cx - rr * Math.sin(azRad);
    const y = cy - rr * Math.cos(azRad);
    return { x, y, rr };
  }

  return {
    deg2rad, rad2deg, clamp, normRad2Pi, normRadPi,
    toJulianDate, gmstRad, lstRad,
    raDecToAltAz, eclToRaDec, altAzToXY
  };
})();

const EPS = A.deg2rad(23.439291); // J2000 mean obliquity

function makeObserver(cfg) {
  const latRad = A.deg2rad(cfg.lat);
  const lonRad = A.deg2rad(cfg.lon);

  const date = cfg.datetimeISO ? new Date(cfg.datetimeISO) : new Date();
  const jd = A.toJulianDate(date);
  const lst = A.lstRad(jd, lonRad);

  return { latRad, lonRad, date, jd, lstRad: lst };
}

function starRadiusFromMag(mag) {
  const brightness = Math.pow(10, -0.4 * mag);
  const r = 0.8 + 2.8 * brightness;
  return A.clamp(r, 0.8, 3.0);
}

function prepareStars(starCatalog, observer, viewport, options) {
  const minMag = options?.minStarMag ?? starCatalog?.limit_mag ?? 4.0;
  const stars = [];

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  for (const s of starCatalog?.stars || []) {
    if (typeof s.mag !== "number") continue;
    if (s.mag > minMag) continue;

    const raRad = A.deg2rad(s.ra_deg);
    const decRad = A.deg2rad(s.dec_deg);

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
    if (altRad < 0) continue;

    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
    const r = starRadiusFromMag(s.mag);

    const altDeg = A.rad2deg(altRad);
    const azDeg = A.rad2deg(azRad);
    
    stars.push({
      id: s.id,
      hip:     s.hip     != null ? s.hip     : null,
      hd:      s.hd      != null ? s.hd      : null,
      name: s.name || "",
      mag: s.mag,
      designation: s.designation || "",
      spect:   s.spect   || null,
      dist_pc: s.dist_pc != null ? s.dist_pc : null,
      ra_deg: s.ra_deg,
      dec_deg: s.dec_deg,
      x, y, r,
      altDeg,
      azDeg
    });
  }

  return stars;
}

function prepareConstellations(constellations, starCatalog, observer, viewport, options) {
  if (!constellations || !constellations.lines) return { lines: [], labels: [] };

  const byId = new Map();
  for (const s of starCatalog?.stars || []) byId.set(s.id, s);

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  const projCache = new Map();
  function projStar(id) {
    if (projCache.has(id)) return projCache.get(id);
    const s = byId.get(id);
    if (!s) return null;

    const raRad = A.deg2rad(s.ra_deg);
    const decRad = A.deg2rad(s.dec_deg);

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
    if (altRad < 0) { projCache.set(id, null); return null; }

    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
    const out = { x, y, altRad };
    projCache.set(id, out);
    return out;
  }

  const lines = [];
  for (const ln of constellations.lines) {
    const a = projStar(ln.a);
    const b = projStar(ln.b);
    if (!a || !b) continue;
    lines.push({ con: ln.con, ax: a.x, ay: a.y, bx: b.x, by: b.y });
  }

  const labels = [];
  if (options?.showConstellationLabels && Array.isArray(constellations.labels)) {
    for (const lab of constellations.labels) {
      const raRad = A.deg2rad(lab.ra_deg);
      const decRad = A.deg2rad(lab.dec_deg);
      const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
      if (altRad < 0) continue;
      const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
      labels.push({ con: lab.con, x, y, name: lab.name_ru || lab.name_en || lab.con });
    }
  }

  return { lines, labels };
}

// --- Messier preparation ------------------------------------------
// Input: dso_messier.json (items[] with ra_deg/dec_deg/mag)
// Output: prepared list with x/y/altDeg etc, WITHOUT ranking/slicing
function prepareMessier(messierJson, observer, viewport, options) {
  if (!messierJson || !Array.isArray(messierJson.items)) return [];

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  const minAlt = (typeof options?.minAltMessierDeg === "number")
    ? options.minAltMessierDeg
    : 0; // default: show anything above horizon

  // optional: hard cap (future-proof if catalog grows)
  const maxN = (typeof options?.messierMaxN === "number" && options.messierMaxN > 0)
    ? Math.floor(options.messierMaxN)
    : null;

  const out = [];

  for (const it of messierJson.items) {
    let raVal = it.ra_deg;
    const decDeg = it.dec_deg;

    if (typeof raVal !== "number" || typeof decDeg !== "number") continue;

    // ✅ FIX: many catalogs store RA in HOURS but call it *_deg
    // heuristic: RA in [0..24] and Dec in [-90..90] => treat RA as hours
    const raLooksLikeHours = (raVal >= 0 && raVal <= 24.0) && (decDeg >= -90 && decDeg <= 90);
    const raDeg = raLooksLikeHours ? (raVal * 15.0) : raVal;

    const raRad = A.deg2rad(raDeg);
    const decRad = A.deg2rad(decDeg);

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
    if (!(altRad > 0)) continue; // below or on horizon (treat 0 as hidden)

    const altDeg = A.rad2deg(altRad);
    if (altDeg < minAlt) continue;

    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    const id = (it.id != null) ? String(it.id) : "";
    const name = (it.name != null) ? String(it.name) : id;

    const mag = (typeof it.mag === "number" && Number.isFinite(it.mag)) ? it.mag : null;

    out.push({
      group: "dso",
      id,
      type: it.type || "dso",
      name,

      // catalog IDs (top-level for easy access in UI/card layers)
      messier:    it.messier  != null ? it.messier    : null,
      ngc:        it.ngc      != null ? it.ngc        : null,
      type_label: it.type_label || null,

      // keep original inputs for debugging
      ra_deg: raVal,
      dec_deg: decDeg,
      ra_deg_norm: raDeg, // ✅ handy for sanity checks

      mag,
      altDeg,
      x, y,

      meta: it.meta || null,
    });
  }

  // deterministic order: brighter first, then higher altitude
  out.sort((a, b) => {
    const am = (a.mag == null) ? 99 : a.mag;
    const bm = (b.mag == null) ? 99 : b.mag;
    if (am !== bm) return am - bm;
    return (b.altDeg || 0) - (a.altDeg || 0);
  });

  if (maxN != null && out.length > maxN) return out.slice(0, maxN);
  return out;
}


function buildMeridianPolyline(viewport) {
  return [
    { x: viewport.cx, y: viewport.cy - viewport.R },
    { x: viewport.cx, y: viewport.cy },
    { x: viewport.cx, y: viewport.cy + viewport.R }
  ];
}

// Equator: dec=0, sample RA
function buildEquatorPolyline(observer, viewport) {
  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  const pts = [];
  let started = false;

  for (let raDeg = 0; raDeg <= 360; raDeg += 0.5) {
    const raRad = A.deg2rad(raDeg);
    const decRad = 0;

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
    if (altRad < 0) {
      if (started) pts.push(null);
      started = false;
      continue;
    }

    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
    pts.push({ x, y });
    started = true;
  }

  return pts;
}

// Ecliptic: beta=0, sample lambda
function buildEclipticPolyline(observer, viewport) {
  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  const pts = [];
  let started = false;

  for (let lamDeg = 0; lamDeg <= 360; lamDeg += 1.0) {
    const lambdaRad = A.deg2rad(lamDeg);
    const betaRad = 0;

    const { raRad, decRad } = A.eclToRaDec(lambdaRad, betaRad, EPS);
    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);

    if (altRad < 0) {
      if (started) pts.push(null);
      started = false;
      continue;
    }

    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
    pts.push({ x, y });
    started = true;
  }

  return pts;
}

function buildMilkyWay(observer, viewport, milkywayJson) {
  if (!milkywayJson?.bands) return null;

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;
  const R = viewport.R ?? viewport.r;

  function polyFromRaDec(points) {
    const out = [];
    let started = false;

    for (const p of points || []) {
      if (typeof p.ra_deg !== "number" || typeof p.dec_deg !== "number") continue;

      const raRad = A.deg2rad(p.ra_deg);
      const decRad = A.deg2rad(p.dec_deg);
      const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);

      if (altRad < 0) {
        if (started) out.push(null);
        started = false;
        continue;
      }

      const xy = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, R);
      out.push({ x: xy.x, y: xy.y });
      started = true;
    }
    return out;
  }

  const bands = milkywayJson.bands;

  return {
    mid: polyFromRaDec(bands.mid),
    top: polyFromRaDec(bands.top),
    bot: polyFromRaDec(bands.bot)
  };
}

function prepareObjects(objectsJson, observer, viewport, options) {
  if (!objectsJson || !Array.isArray(objectsJson.items)) return [];

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  // highlight id comes from widget via options (recommended),
  // fallback to global to keep backwards compatibility.
  const hidRaw =
    (options && options.uiHighlightId != null) ? String(options.uiHighlightId) :
    ((typeof window !== "undefined" && window.__skyHighlight && window.__skyHighlight.id != null)
      ? String(window.__skyHighlight.id)
      : null);

  const hid = hidRaw ? hidRaw.toLowerCase() : null;

  function normStr(v) {
    return (v == null) ? "" : String(v).trim();
  }

  function isHighlightedItem(it) {
    if (!hid) return false;

    const g = normStr(it.group).toLowerCase();
    const id = normStr(it.id || it.name || it.name_en || it.name_ru).toLowerCase();
    const name = normStr(it.name_ru || it.name_en || it.name || it.id).toLowerCase();

    const candidates = [
      id,
      name,
      (g && id) ? `${g}:${id}` : null,
      (g && name) ? `${g}:${name}` : null,
    ].filter(Boolean);

    return candidates.includes(hid);
  }

  const out = [];
  for (const it of objectsJson.items) {
    if (typeof it.ra_deg !== "number" || typeof it.dec_deg !== "number") continue;

    const raRad = A.deg2rad(it.ra_deg);
    const decRad = A.deg2rad(it.dec_deg);

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
    if (altRad < 0) continue; // below horizon -> cannot be on map

    const altDeg = A.rad2deg(altRad);
    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    const group = normStr(it.group).toLowerCase(); // IMPORTANT: keep group
    const stableId = normStr(it.id || it.name || it.name_en || it.name_ru); // IMPORTANT: never empty if possible

    out.push({
      group,                               // <-- NEW (used by highlight)
      id: stableId || "",                  // <-- fixed: stable id
      type: it.type || "ds",
      name: it.name_ru || it.name_en || it.name || stableId || "",
      ra_deg: it.ra_deg,
      dec_deg: it.dec_deg,
      mag: (typeof it.mag === "number") ? it.mag : null,
      color: it.color || null,
      altDeg,
      x, y,
      note: (typeof it.note === "string" && it.note.trim()) ? it.note.trim() : null,

      __is_highlight: isHighlightedItem(it), // internal helper
    });
  }

  // ranking + limits
  const minAlt = (typeof options?.minAltObjectsDeg === "number") ? options.minAltObjectsDeg : 10;
  const maxN = (typeof options?.maxObjects === "number") ? options.maxObjects : 8;

  // strict base filter
  let filtered = out.filter(o => o.altDeg >= minAlt);

  for (const o of filtered) {
    const mag = (typeof o.mag === "number") ? o.mag : 8.0;
    o._score = o.altDeg - 0.7 * mag;
  }
  filtered.sort((a, b) => (b._score - a._score));
  filtered = filtered.slice(0, Math.max(0, maxN));

  // FORCE INCLUDE highlighted object (above horizon already guaranteed here)
  const forced = hid ? out.find(o => o.__is_highlight) : null;
  if (forced) {
    const already = filtered.some(o =>
      (o.group && forced.group && o.group === forced.group && o.id && forced.id && o.id === forced.id) ||
      (o.name && forced.name && o.name === forced.name)
    );

    if (!already) {
      if (filtered.length >= maxN && maxN > 0) filtered[filtered.length - 1] = forced;
      else filtered.push(forced);
    }
  }

  for (const o of filtered) {
    delete o._score;
    delete o.__is_highlight;
  }

  return filtered;
}


function prepareAlerts(alertsJson, observer, viewport, options) {
  if (!alertsJson || !Array.isArray(alertsJson.items)) return [];

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  function num(v) {
    if (v == null) return null;
    const n = Number(v);
    return (typeof n === "number" && isFinite(n)) ? n : null;
  }

  function parseMs(s) {
    const ms = Date.parse(s);
    return Number.isFinite(ms) ? ms : null;
  }

  function roundN(x, n) {
    const p = Math.pow(10, n);
    return Math.round(x * p) / p;
  }

  function canonicalId(id) {
    let s = (id == null) ? "" : String(id).trim();
    // TOCP duplicates: "TCP Jxxxx" vs "Jxxxx"
    s = s.replace(/^TCP\s+/i, "");
    return s;
  }

  function severityFromItem(it) {
    const sn = num(it.score_norm);
    if (sn != null) return Math.max(1, Math.min(5, 1 + Math.floor(sn * 4)));

    const sr = num(it.score_raw);
    if (sr != null) {
      const s01 = Math.max(0, Math.min(1, sr / 100));
      return Math.max(1, Math.min(5, 1 + Math.floor(s01 * 4)));
    }

    const g = String(it.group || "").toLowerCase();
    if (g === "grb") return 5;
    if (g === "neocp") return 4;
    return 2;
  }

  function titleFromItem(it) {
    const t =
      it.title_ru || it.title_en || it.title ||
      (it.meta && (it.meta.title || it.meta.designation_raw)) ||
      it.id;
    return (t == null) ? "" : String(t);
  }

  // ── force-include highlighted alert (mirrors prepareObjects logic) ──────────
  const hidRaw =
    (options && options.uiHighlightId != null) ? String(options.uiHighlightId) :
    ((typeof window !== "undefined" && window.__skyHighlight && window.__skyHighlight.id != null)
      ? String(window.__skyHighlight.id)
      : null);
  const hid = hidRaw ? hidRaw.toLowerCase() : null;

  function isHighlightedAlert(id, title, group) {
    if (!hid) return false;
    const idL    = String(id    || "").toLowerCase();
    const titleL = String(title || "").toLowerCase();
    const groupL = String(group || "").toLowerCase();
    return [
      idL,
      titleL,
      (groupL && idL)    ? `${groupL}:${idL}`    : null,
      (groupL && titleL) ? `${groupL}:${titleL}` : null,
    ].filter(Boolean).includes(hid);
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // 1) collapse raw items -> best per key (ignore updated_utc in key)
  const bestByKey = new Map();

  for (const it of alertsJson.items) {
    const raDeg = num(it.ra_deg);
    const decDeg = num(it.dec_deg);
    if (raDeg == null || decDeg == null) continue;

    const source = (it.source || "").trim().toLowerCase();
    const group = (it.group || "").trim().toLowerCase();

    // coords rounding: enough to absorb tiny numeric differences but not merge different objects
    const raR = roundN(raDeg, 4);
    const decR = roundN(decDeg, 4);

    const idC = canonicalId(it.id || "");
    // If id empty (rare), fall back to title/meta designation
    const idOrTitle = idC || canonicalId(titleFromItem(it));

    const key = `${source}|${group}|${idOrTitle}|${raR}|${decR}`;

    const cand = {
      _src: it,
      raDeg,
      decDeg,
      raR,
      decR,
      idC: idC || "",
      title: titleFromItem(it),
      severity: severityFromItem(it),
      updated_ms: parseMs(it.updated_utc),
      score_norm: num(it.score_norm),
    };

    const prev = bestByKey.get(key);
    if (!prev) {
      bestByKey.set(key, cand);
      continue;
    }

    // choose "better" record:
    // 1) newer updated_ms (if both exist)
    // 2) higher severity
    // 3) higher score_norm
    const pMs = prev.updated_ms;
    const cMs = cand.updated_ms;

    let take = false;
    if (pMs == null && cMs != null) take = true;
    else if (pMs != null && cMs != null && cMs > pMs) take = true;
    else if ((cMs == null && pMs == null) || (pMs != null && cMs != null && cMs === pMs)) {
      if (cand.severity > prev.severity) take = true;
      else if (cand.severity === prev.severity) {
        const ps = (typeof prev.score_norm === "number") ? prev.score_norm : -1;
        const cs = (typeof cand.score_norm === "number") ? cand.score_norm : -1;
        if (cs > ps) take = true;
      }
    }

    if (take) bestByKey.set(key, cand);
  }

  // 2) project -> out
  const out = [];
  for (const cand of bestByKey.values()) {
    const it = cand._src;

    const raRad = A.deg2rad(cand.raDeg);
    const decRad = A.deg2rad(cand.decDeg);

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
    if (altRad < 0) continue;

    const altDeg = A.rad2deg(altRad);
    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    out.push({
      // contract used by drawAlerts
      id: cand.idC || canonicalId(it.id || ""),
      level: it.level || "amateur",
      type: it.type || "event",
      title: cand.title,
      severity: cand.severity,
      altDeg,
      x, y,

      // extras (optional)
      group: it.group || null,
      source: it.source || null,
      updated_utc: it.updated_utc || null,
      updated_ms: cand.updated_ms,
      ra_deg: cand.raDeg,
      dec_deg: cand.decDeg,
      mag: (num(it.mag) != null) ? num(it.mag) : null,
      note: (typeof it.note === "string" && it.note.trim()) ? it.note.trim() : null,
      meta: it.meta || null,

      __is_highlight: isHighlightedAlert(cand.idC || it.id, cand.title, it.group),
    });
  }

  const minAlt = (typeof options?.minAltAlertsDeg === "number") ? options.minAltAlertsDeg : 5;
  let filtered = out.filter(a => a.altDeg >= minAlt);

  for (const a of filtered) {
    const sev = (typeof a.severity === "number") ? a.severity : 2;
    const rec = (typeof a.updated_ms === "number") ? (a.updated_ms / 1e12) : 0;
    a._score = 10 * sev + a.altDeg + rec;
  }

  filtered.sort((a, b) => (b._score - a._score));

  const maxN = (typeof options?.maxAlerts === "number") ? options.maxAlerts : 8;
  filtered = filtered.slice(0, Math.max(0, maxN));

  // FORCE INCLUDE highlighted alert even if it was pushed out by ranking ──────
  const forcedAlert = hid ? out.find(a => a.__is_highlight) : null;
  if (forcedAlert) {
    const already = filtered.some(a =>
      (a.group && forcedAlert.group && a.group === forcedAlert.group &&
       a.id    && forcedAlert.id    && a.id    === forcedAlert.id) ||
      (a.title && forcedAlert.title && a.title === forcedAlert.title)
    );
    if (!already) {
      if (filtered.length >= maxN && maxN > 0) filtered[filtered.length - 1] = forcedAlert;
      else filtered.push(forcedAlert);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────

  for (const a of filtered) { delete a._score; delete a.__is_highlight; }

  return filtered;
}

// -----------------------------
// Sun/Moon prepared layer from sun_moon.json (frames[])
// -----------------------------
function parseHorizonsTUTC(s) {
  // expects "2026-Feb-08 07:05Z"
  // returns ms since epoch (UTC) or NaN
  if (!s || typeof s !== "string") return NaN;
  const m = s.match(/^(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})Z$/);
  if (!m) return NaN;

  const year = +m[1];
  const mon3 = m[2];
  const day = +m[3];
  const hh = +m[4];
  const mm = +m[5];

  const monMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const mon = monMap[mon3];
  if (mon == null) return NaN;

  return Date.UTC(year, mon, day, hh, mm, 0, 0);
}

function pickNearestFrame(frames, tMs) {
  if (!Array.isArray(frames) || !frames.length) return null;
  let best = null;
  let bestDt = Infinity;

  for (const f of frames) {
    const ms = parseHorizonsTUTC(f?.t_utc);
    if (!isFinite(ms)) continue;
    const dt = Math.abs(ms - tMs);
    if (dt < bestDt) { bestDt = dt; best = f; }
  }
  return best;
}

function prepareSunMoon(sunMoonJson, observer, viewport) {
  if (!sunMoonJson || !Array.isArray(sunMoonJson.frames)) return [];

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  const R = viewport.R ?? viewport.r;
  const tMs = observer?.date ? observer.date.getTime() : Date.now();
  const frame = pickNearestFrame(sunMoonJson.frames, tMs);
  if (!frame) return [];

  const out = [];

  // tolerant numeric parser: accepts numbers + numeric strings
  function num(v) {
    if (v == null) return null;
    const n = Number(v);
    return (typeof n === "number" && isFinite(n)) ? n : null;
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function pushBody(key, label, color, radiusPx) {
    const b = frame[key];
    if (!b) return;

    // RA/Dec are required for our current pipeline (we compute alt/az ourselves)
    const raDeg = num(b.ra_deg);
    const decDeg = num(b.dec_deg);
    if (raDeg == null || decDeg == null) return;

    const raRad = A.deg2rad(raDeg);
    const decRad = A.deg2rad(decDeg);

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);

    const altDeg = A.rad2deg(altRad);
    const azDeg  = A.rad2deg(azRad);

    // keep in prepared even if below horizon (UI/debug); render can decide
    const visible = (altRad >= 0);

    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, R);

    const lunar = key === "moon" ? getLunarState(new Date(tMs)) : null;
    const illum_pct = lunar?.illum_pct ?? null;
    const phase = lunar?.phase ?? null;
    const waxing = lunar?.waxing ?? null;

    out.push({
      id: key,                 // "sun" / "moon"
      type: key,               // to distinguish in UI
      name: label,             // label text on canvas
      ra_deg: raDeg,
      dec_deg: decDeg,
      mag: (key === "sun") ? -26.74 : null,
      color: color || null,
      r: radiusPx,
      altDeg,
      azDeg,
      x, y,

      visible,
      illum_pct,
      phase,
      waxing
    });
  }

  // tweak sizes/colors as you like
  pushBody("sun",  "Sun",  "rgba(255,230,180,0.95)", 6.0);
  pushBody("moon", "Moon", "rgba(210,230,255,0.85)", 6.0);

  return out;
}

// Equatorial grid (RA lines + Dec lines), clipped by horizon with breaks
function buildEquatorialGrid(observer, viewport, options) {
  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  const raStepH = options?.eqGrid?.raStepHours ?? 2;
  const decStep = options?.eqGrid?.decStepDeg ?? 15;
  const stepDeg = options?.eqGrid?.sampleStepDeg ?? 1.0;

  function polylineRADec(samples) {
    const pts = [];
    let started = false;
    for (const { raDeg, decDeg } of samples) {
      const raRad = A.deg2rad(raDeg);
      const decRad = A.deg2rad(decDeg);

      const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
      if (altRad < 0) {
        if (started) pts.push(null);
        started = false;
        continue;
      }
      const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
      pts.push({ x, y });
      started = true;
    }
    return pts;
  }

  const decLines = [];
  for (let dec = -75; dec <= 75; dec += decStep) {
    const samples = [];
    for (let ra = 0; ra <= 360; ra += stepDeg) samples.push({ raDeg: ra, decDeg: dec });
    decLines.push({ decDeg: dec, pts: polylineRADec(samples) });
  }

  const raLines = [];
  for (let h = 0; h < 24; h += raStepH) {
    const raDeg = h * 15;
    const samples = [];
    for (let dec = -80; dec <= 80; dec += stepDeg) samples.push({ raDeg, decDeg: dec });
    raLines.push({ raHours: h, raDeg, pts: polylineRADec(samples) });
  }

  return { decLines, raLines };
}


// --- Planets preparation ------------------------------------------

function preparePlanets(planetsJson, observer, viewport) {
  if (!planetsJson || !Array.isArray(planetsJson.frames)) return [];

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;
  const R = viewport.R ?? viewport.r;

  const tMs = observer?.date ? observer.date.getTime() : Date.now();
  const frame = pickNearestFrame(planetsJson.frames, tMs);
  if (!frame || !frame.planets) return [];

  const out = [];

  // tolerant numeric parser: accepts numbers + numeric strings
  function num(v) {
    if (v == null) return null;
    const n = Number(v);
    return (typeof n === "number" && isFinite(n)) ? n : null;
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // simple palette by planet key
  const palette = {
    mercury: "rgba(210,230,255,0.70)",
    venus:   "rgba(255,235,200,0.85)",
    mars:    "rgba(255,190,170,0.80)",
    jupiter: "rgba(255,230,180,0.78)",
    saturn:  "rgba(255,240,200,0.78)",
    uranus:  "rgba(190,240,255,0.70)",
    neptune: "rgba(170,210,255,0.70)",
  };

  for (const key of Object.keys(frame.planets || {})) {
    const b = frame.planets[key];
    if (!b) continue;

    const raDeg = num(b.ra_deg);
    const decDeg = num(b.dec_deg);
    if (raDeg == null || decDeg == null) continue;

    const raRad = A.deg2rad(raDeg);
    const decRad = A.deg2rad(decDeg);

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
    const altDeg = A.rad2deg(altRad);
    const azDeg  = A.rad2deg(azRad);

    const visible = (altRad >= 0);

    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, R);

    const mag = num(b.mag);

    // phase fields (optional, but your JSON has them)
    let illum_pct = null;
    let phase = null;
    let waxing = null;

    const rawIllum = (b.illum_pct != null) ? b.illum_pct : (b.illum != null ? b.illum : null);
    const rawPhase = (b.phase != null) ? b.phase : null;
    const rawWaxing = (b.waxing != null) ? b.waxing : null;

    const illumNum = num(rawIllum);
    if (illumNum != null) {
      illum_pct = (illumNum <= 1.01) ? clamp(illumNum, 0, 1) * 100 : clamp(illumNum, 0, 100);
    }

    const phaseNum = num(rawPhase);
    if (phaseNum != null) {
      phase = (phaseNum > 1.01) ? (phaseNum / 100) : phaseNum;
      phase = clamp(phase, 0, 1);
    } else if (illum_pct != null) {
      phase = clamp(illum_pct / 100, 0, 1);
    }

    if (typeof rawWaxing === "boolean") {
      waxing = rawWaxing;
    } else if (rawWaxing != null) {
      const w = String(rawWaxing).toLowerCase().trim();
      if (w === "true" || w === "1" || w === "yes") waxing = true;
      else if (w === "false" || w === "0" || w === "no") waxing = false;
    }

    if (illum_pct == null && phase != null) illum_pct = clamp(phase, 0, 1) * 100;

    // size a bit by brightness (optional)
    let r = 4.2;
    if (mag != null) {
      // brighter -> slightly bigger; clamp to sane range
      r = clamp(5.2 - (mag * 0.35), 3.6, 6.0);
    }

    out.push({
      id: key,
      type: "planet",            // IMPORTANT: drawObjects treats this as planet marker
      name: b.name || key,
      ra_deg: raDeg,
      dec_deg: decDeg,
      altDeg,
      azDeg,
      x, y,
      r,
      color: palette[key] || "rgba(255,230,180,0.78)",

      // optional extras (for UI + possible phase rendering)
      mag: (mag != null ? mag : null),
      visible,
      illum_pct,
      phase,
      waxing
    });
  }

  return out;
}

export const Prepare = {
  makeObserver,
  prepareStars,
  prepareConstellations,
  buildMeridianPolyline,
  buildEquatorPolyline,
  buildEclipticPolyline,
  buildMilkyWay,
  prepareObjects,
  prepareAlerts,
  buildEquatorialGrid,
  buildEqGrid: buildEquatorialGrid,
  prepareSunMoon,
  preparePlanets,
  prepareMessier
};