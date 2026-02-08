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
    const z = (Math.PI / 2) - altRad;        // zenith distance
    const rr = R * Math.tan(z / 2);          // horizon (z=90°)->R
    const x = cx + rr * Math.sin(azRad);
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
  const minMag = options?.minStarMag ?? starCatalog?.limit_mag ?? 3.0;
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
      name: s.name || "",
      mag: s.mag,
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

// Milky Way bands are provided as (ra_deg, dec_deg) polylines in JSON
function buildMilkyWay(observer, viewport, milkywayJson) {
  if (!milkywayJson) return null;

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

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

      const xy = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
      out.push({ x: xy.x, y: xy.y });
      started = true;
    }
    return out;
  }

  return {
    mid: polyFromRaDec(milkywayJson.mid),
    top: polyFromRaDec(milkywayJson.top),
    bot: polyFromRaDec(milkywayJson.bot)
  };
}

function prepareObjects(objectsJson, observer, viewport, options) {
  if (!objectsJson || !Array.isArray(objectsJson.items)) return [];

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  const out = [];
  for (const it of objectsJson.items) {
    if (typeof it.ra_deg !== "number" || typeof it.dec_deg !== "number") continue;

    const raRad = A.deg2rad(it.ra_deg);
    const decRad = A.deg2rad(it.dec_deg);

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
    const altDeg = A.rad2deg(altRad);
    if (altRad < 0) continue;

    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);

    out.push({
      id: it.id || "",
      type: it.type || "ds",
      name: it.name_ru || it.name_en || it.name || it.id || "",
      ra_deg: it.ra_deg,
      dec_deg: it.dec_deg,
      mag: (typeof it.mag === "number") ? it.mag : null,
      color: it.color || null,
      altDeg,
      x, y
    });
  }

  // iteration-1 ranking + limits
  const minAlt = (typeof options?.minAltObjectsDeg === "number") ? options.minAltObjectsDeg : 10;
  let filtered = out.filter(o => o.altDeg >= minAlt);

  for (const o of filtered) {
    const mag = (typeof o.mag === "number") ? o.mag : 8.0;
    o._score = o.altDeg - 0.7 * mag;
  }

  filtered.sort((a, b) => (b._score - a._score));

  const maxN = (typeof options?.maxObjects === "number") ? options.maxObjects : 8;
  filtered = filtered.slice(0, Math.max(0, maxN));

  for (const o of filtered) delete o._score;

  return filtered;
}

function prepareAlerts(alertsJson, observer, viewport, options) {
  if (!alertsJson || !Array.isArray(alertsJson.items)) return [];

  const latRad = observer.latRad;
  const lstRad = observer.lstRad;

  const out = [];
  for (const it of alertsJson.items) {
    if (typeof it.ra_deg !== "number" || typeof it.dec_deg !== "number") continue;

    const raRad = A.deg2rad(it.ra_deg);
    const decRad = A.deg2rad(it.dec_deg);

    const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
    const altDeg = A.rad2deg(altRad);
    if (altRad < 0) continue;

    const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);

    out.push({
      id: it.id || "",
      level: it.level || "amateur",
      type: it.type || "event",
      title: it.title_ru || it.title_en || it.title || it.id || "",
      severity: (typeof it.severity === "number") ? it.severity : 2,
      altDeg,
      x, y
    });
  }

  const minAlt = (typeof options?.minAltAlertsDeg === "number") ? options.minAltAlertsDeg : 5;
  let filtered = out.filter(a => a.altDeg >= minAlt);

  for (const a of filtered) {
    const sev = (typeof a.severity === "number") ? a.severity : 2;
    a._score = 10 * sev + a.altDeg;
  }

  filtered.sort((a, b) => (b._score - a._score));

  const maxN = (typeof options?.maxAlerts === "number") ? options.maxAlerts : 8;
  filtered = filtered.slice(0, Math.max(0, maxN));

  for (const a of filtered) delete a._score;

  return filtered;
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
  buildEqGrid: buildEquatorialGrid
};