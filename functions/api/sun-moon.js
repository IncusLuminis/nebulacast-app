import { getLunarState, LUNAR_SOURCE } from "../lib/lunar.js";
/**
 * /api/sun-moon?lat=&lon=&tz=&days=&step_min=
 *
 * Returns sun/moon position frames in the same schema as the static
 * sky/data/sun_moon.json, computed on-the-fly for any observer location.
 *
 * Algorithms: Jean Meeus "Astronomical Algorithms" (low-precision solar,
 * simplified lunar). Accuracy: sun alt ~0.01°, moon alt ~0.3°.
 * Sufficient for sunrise/sunset/moonrise/moonset detection and hero panel.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ── Julian Date ────────────────────────────────────────────────────────────
function jd(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// ── GMST in radians ────────────────────────────────────────────────────────
function gmst(jdate) {
  const d = jdate - 2451545.0;
  let g = (18.697374558 + 24.06570982441908 * d) % 24;
  if (g < 0) g += 24;
  return g * (Math.PI / 12);
}

// ── HA / Alt / Az from RA/Dec ──────────────────────────────────────────────
function altAz(raDeg, decDeg, latDeg, lonDeg, jdate) {
  const lst = gmst(jdate) + lonDeg * DEG;
  const ha  = lst - raDeg * DEG;
  const lat = latDeg * DEG;
  const dec = decDeg * DEG;

  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  const cosAlt = Math.cos(alt);
  let az;
  if (cosAlt < 1e-10) {
    az = 0;
  } else {
    const sinAz = -Math.sin(ha) * Math.cos(dec) / cosAlt;
    const cosAz = (Math.sin(dec) - sinAlt * Math.sin(lat)) / (cosAlt * Math.cos(lat));
    az = Math.atan2(sinAz, cosAz);
    if (az < 0) az += 2 * Math.PI;
  }
  return { altDeg: alt * RAD, azDeg: az * RAD };
}

// ── Low-precision solar coordinates (Meeus ch.25) ─────────────────────────
function sunRaDec(jdate) {
  const n   = jdate - 2451545.0;
  const L   = (280.460 + 0.9856474 * n) % 360;
  const g   = ((357.528 + 0.9856003 * n) % 360) * DEG;
  const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG;
  const eps = (23.439 - 0.0000004 * n) * DEG;
  const ra  = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam)) * RAD;
  return { ra: (ra + 360) % 360, dec };
}

// ── Simplified lunar coordinates (Meeus ch.47 low-precision) ─────────────
function moonRaDec(jdate) {
  const T  = (jdate - 2451545.0) / 36525.0;
  // Mean longitude, mean anomaly, argument of latitude
  let Lp = (218.3164477 + 481267.88123421 * T) % 360;
  if (Lp < 0) Lp += 360;
  let M  = (357.5291092 + 35999.0502909  * T) % 360;  // Sun mean anomaly
  if (M  < 0) M  += 360;
  let Mp = (134.9633964 + 477198.8675055 * T) % 360;  // Moon mean anomaly
  if (Mp < 0) Mp += 360;
  let F  = (93.2720950  + 483202.0175233 * T) % 360;  // Arg of lat
  if (F  < 0) F  += 360;
  let D  = (297.8501921 + 445267.1114034 * T) % 360;  // Elongation
  if (D  < 0) D  += 360;

  const Mr  = M  * DEG, Mpr = Mp * DEG, Fr = F * DEG, Dr = D * DEG;

  // Longitude perturbations (degrees × 10⁻⁶)
  let dLon = 6288774 * Math.sin(Mpr)
           + 1274027 * Math.sin(2*Dr - Mpr)
           +  658314 * Math.sin(2*Dr)
           +  213618 * Math.sin(2*Mpr)
           -  185116 * Math.sin(Mr)
           -  114332 * Math.sin(2*Fr)
           +   58793 * Math.sin(2*Dr - 2*Mpr)
           +   57066 * Math.sin(2*Dr - Mr - Mpr)
           +   53322 * Math.sin(2*Dr + Mpr)
           +   45758 * Math.sin(2*Dr - Mr)
           -   40923 * Math.sin(Mr - Mpr)
           -   34720 * Math.sin(Dr)
           -   30383 * Math.sin(Mr + Mpr)
           +   15327 * Math.sin(2*Dr - 2*Fr)
           -   12528 * Math.sin(Mpr + 2*Fr)
           +   10980 * Math.sin(Mpr - 2*Fr)
           +   10675 * Math.sin(4*Dr - Mpr)
           +   10034 * Math.sin(3*Mpr)
           +    8548 * Math.sin(4*Dr - 2*Mpr);

  // Latitude perturbations
  let dLat = 5128122 * Math.sin(Fr)
           +  280602 * Math.sin(Mpr + Fr)
           +  277693 * Math.sin(Mpr - Fr)
           +  173237 * Math.sin(2*Dr - Fr)
           +   55413 * Math.sin(2*Dr - Mpr + Fr)
           +   46271 * Math.sin(2*Dr - Mpr - Fr)
           +   32573 * Math.sin(2*Dr + Fr)
           +   17198 * Math.sin(2*Mpr + Fr)
           +    9266 * Math.sin(2*Dr + Mpr - Fr)
           +    8822 * Math.sin(2*Mpr - Fr)
           +    8216 * Math.sin(2*Dr - Mr - Fr)
           +    4324 * Math.sin(2*Dr - 2*Mpr - Fr)
           +    4200 * Math.sin(2*Dr + Mpr + Fr);

  const lam = (Lp + dLon / 1e6) * DEG;  // ecliptic longitude
  const bet = (dLat / 1e6) * DEG;        // ecliptic latitude
  const eps = (23.439 - 0.013 * T / 100) * DEG;

  const ra  = Math.atan2(Math.sin(lam) * Math.cos(eps) - Math.tan(bet) * Math.sin(eps), Math.cos(lam)) * RAD;
  const dec = Math.asin(Math.sin(bet) * Math.cos(eps) + Math.cos(bet) * Math.sin(eps) * Math.sin(lam)) * RAD;

  return { ra: (ra + 360) % 360, dec };
}

// ── Format timestamp as "YYYY-Mon-DD HH:MMZ" ──────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtT(date) {
  const p2 = n => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${MONTHS[date.getUTCMonth()]}-${p2(date.getUTCDate())} ${p2(date.getUTCHours())}:${p2(date.getUTCMinutes())}Z`;
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const respHeaders = {
    "Content-Type":                "application/json; charset=utf-8",
    "Cache-Control":               "public, max-age=600",
    "Access-Control-Allow-Origin": "*",
  };

  if (request.method !== "GET") {
    return new Response(null, { status: 405, headers: { ...respHeaders, Allow: "GET, OPTIONS" } });
  }

  const url    = new URL(request.url);
  const lat    = parseFloat(url.searchParams.get("lat") ?? "");
  const lon    = parseFloat(url.searchParams.get("lon") ?? "");
  const daysRaw = Number(url.searchParams.get("days") ?? "7");
  const stepRaw = Number(url.searchParams.get("step_min") ?? "10");
  if (!Number.isInteger(daysRaw) || !Number.isInteger(stepRaw)) {
    return new Response(JSON.stringify({ error: "days and step_min must be integers" }),
      { status: 400, headers: { ...respHeaders, "Cache-Control": "no-store" } });
  }
  const days = Math.min(14, Math.max(1, daysRaw));
  const step = Math.min(60, Math.max(5, stepRaw));

  if (!isFinite(lat) || !isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return new Response(
      JSON.stringify({ error: "lat and lon are required and must be valid coordinates" }),
      { status: 400, headers: respHeaders }
    );
  }

  const now    = new Date();
  const startMs = Math.floor(now.getTime() / 60000) * 60000;
  const endMs   = startMs + days * 86400000;
  const stepMs  = step * 60000;

  const frames = [];
  for (let t = startMs; t <= endMs; t += stepMs) {
    const date   = new Date(t);
    const jdate  = jd(date);
    const sun    = sunRaDec(jdate);
    const moon   = moonRaDec(jdate);
    const lunar = getLunarState(date);
    const sunPos = altAz(sun.ra, sun.dec, lat, lon, jdate);
    const monPos = altAz(moon.ra, moon.dec, lat, lon, jdate);

    frames.push({
      t_utc: fmtT(date),
      sun: {
        ra_deg:  Math.round(sun.ra  * 1000) / 1000,
        dec_deg: Math.round(sun.dec * 1000) / 1000,
        alt_deg: Math.round(sunPos.altDeg * 10000) / 10000,
        az_deg:  Math.round(sunPos.azDeg  * 10000) / 10000,
      },
      moon: {
        ra_deg:   Math.round(moon.ra  * 1000) / 1000,
        dec_deg:  Math.round(moon.dec * 1000) / 1000,
        alt_deg:  Math.round(monPos.altDeg * 10000) / 10000,
        az_deg:   Math.round(monPos.azDeg  * 10000) / 10000,
        illum_pct: lunar.illum_pct,
        phase:     lunar.phase,
        waxing:    lunar.waxing,
        phase_name: lunar.name,
      },
    });
  }

  const result = {
    schema: "sun_moon.v2",
    version: 2,
    lunar_source: LUNAR_SOURCE,
    epoch: "apparent",
    generated_at: now.toISOString(),
    source: "JS low-precision (Meeus)",
    params: { days, step_min: step },
    site: { lat_deg: lat, lon_deg: lon },
    window: {
      start_utc: new Date(startMs).toISOString(),
      end_utc:   new Date(endMs).toISOString(),
    },
    frames,
  };

  return new Response(JSON.stringify(result), { headers: respHeaders });
}
