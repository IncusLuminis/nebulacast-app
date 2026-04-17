/**
 * /api/sky-ranking?lat=&lon=&tz=
 *
 * Recomputes sky object ranking for any observer location.
 * Fetches the static objects_today.json (ra_deg/dec_deg catalog),
 * recomputes altitude/visibility for the observer's night,
 * scores and ranks objects using the same rules as gen_ranking.py.
 */

// ── Astronomy (inline from sun-moon.js / sky.astro.js) ────────────────────

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function jd(date) { return date.getTime() / 86400000 + 2440587.5; }

function gmst(jdate) {
  const d = jdate - 2451545.0;
  let g = (18.697374558 + 24.06570982441908 * d) % 24;
  if (g < 0) g += 24;
  return g * (Math.PI / 12);
}

function altDeg(raDeg, decDeg, latDeg, lonDeg, date) {
  const jdate = jd(date);
  const lst   = gmst(jdate) + lonDeg * DEG;
  const ha    = lst - raDeg * DEG;
  const lat   = latDeg * DEG;
  const dec   = decDeg * DEG;
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD;
}

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

function moonRaDec(jdate) {
  const T  = (jdate - 2451545.0) / 36525.0;
  let Lp = (218.3164477 + 481267.88123421 * T) % 360; if (Lp < 0) Lp += 360;
  let Mp = (134.9633964 + 477198.8675055  * T) % 360; if (Mp < 0) Mp += 360;
  let F  = (93.2720950  + 483202.0175233  * T) % 360; if (F  < 0) F  += 360;
  let D  = (297.8501921 + 445267.1114034  * T) % 360; if (D  < 0) D  += 360;
  let M  = (357.5291092 + 35999.0502909   * T) % 360; if (M  < 0) M  += 360;
  const Mpr=Mp*DEG, Fr=F*DEG, Dr=D*DEG;
  let dLon = 6288774*Math.sin(Mpr) + 1274027*Math.sin(2*Dr-Mpr) + 658314*Math.sin(2*Dr)
           +  213618*Math.sin(2*Mpr) - 185116*Math.sin(M*DEG) - 114332*Math.sin(2*Fr)
           +   58793*Math.sin(2*Dr-2*Mpr) + 57066*Math.sin(2*Dr-M*DEG-Mpr)
           +   53322*Math.sin(2*Dr+Mpr) + 45758*Math.sin(2*Dr-M*DEG);
  let dLat = 5128122*Math.sin(Fr) + 280602*Math.sin(Mpr+Fr) + 277693*Math.sin(Mpr-Fr)
           +  173237*Math.sin(2*Dr-Fr) + 55413*Math.sin(2*Dr-Mpr+Fr)
           +   46271*Math.sin(2*Dr-Mpr-Fr) + 32573*Math.sin(2*Dr+Fr);
  const lam = (Lp + dLon/1e6) * DEG;
  const bet = (dLat/1e6) * DEG;
  const eps = (23.439 - 0.013*T/100) * DEG;
  const ra  = Math.atan2(Math.sin(lam)*Math.cos(eps) - Math.tan(bet)*Math.sin(eps), Math.cos(lam)) * RAD;
  const dec = Math.asin(Math.sin(bet)*Math.cos(eps) + Math.cos(bet)*Math.sin(eps)*Math.sin(lam)) * RAD;
  return { ra: (ra+360)%360, dec };
}

// ── Night window builder ───────────────────────────────────────────────────
// Returns array of {date, sunAlt, moonAlt} at STEP_MIN intervals for next DAYS days

const STEP_MIN  = 10;
const DAYS      = 2;   // look ahead 2 days to catch tonight + tomorrow night
const SUN_DUSK  = -6;  // civil dusk/dawn threshold
const SUN_DARK  = -12; // astronomical dark threshold

function buildNightSlots(lat, lon) {
  const now    = Date.now();
  const end    = now + DAYS * 86400000;
  const stepMs = STEP_MIN * 60000;
  const slots  = [];

  for (let t = now; t <= end; t += stepMs) {
    const date   = new Date(t);
    const jdate  = jd(date);
    const sun    = sunRaDec(jdate);
    const moon   = moonRaDec(jdate);
    const sAlt   = altDeg(sun.ra,  sun.dec,  lat, lon, date);
    const mAlt   = altDeg(moon.ra, moon.dec, lat, lon, date);
    slots.push({ date, sunAlt: sAlt, moonAlt: mAlt });
  }
  return slots;
}

// First contiguous night block: sunAlt < SUN_DUSK
function findNightBlock(slots) {
  // Find first dusk crossing (sun goes below SUN_DUSK)
  let start = -1;
  for (let i = 1; i < slots.length; i++) {
    if (slots[i-1].sunAlt >= SUN_DUSK && slots[i].sunAlt < SUN_DUSK) {
      start = i; break;
    }
  }
  // If already night (e.g. started after dusk), begin from now
  if (start === -1 && slots[0].sunAlt < SUN_DUSK) start = 0;
  if (start === -1) {
    // Daytime now — look further ahead for next dusk
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].sunAlt < SUN_DUSK) { start = i; break; }
    }
  }
  if (start === -1) return [];

  const night = [];
  for (let i = start; i < slots.length; i++) {
    if (slots[i].sunAlt >= SUN_DUSK) break; // dawn
    night.push(slots[i]);
  }
  return night;
}

// ── Visibility stats for one object ───────────────────────────────────────
function visStats(raDeg, decDeg, lat, lon, nightSlots, darkSlots) {
  if (!nightSlots.length) return null;

  const alts = nightSlots.map(s => altDeg(raDeg, decDeg, lat, lon, s.date));
  const maxAlt = Math.max(...alts);
  if (maxAlt <= 0) return null;

  const up = alts.filter(a => a > 0).length;
  const hoursUp = (up * STEP_MIN) / 60;

  // Best time = index of max alt during night
  const bestIdx = alts.indexOf(maxAlt);
  const bestDate = nightSlots[bestIdx].date;

  // Quality: dark + moon_down window
  const darkAlts = darkSlots.map(s => altDeg(raDeg, decDeg, lat, lon, s.date));
  const maxAltQ = darkAlts.length ? Math.max(...darkAlts) : null;

  // Best time quality
  let bestDateQ = bestDate;
  if (darkAlts.length) {
    const bestQIdx = darkAlts.indexOf(Math.max(...darkAlts));
    if (bestQIdx >= 0) bestDateQ = darkSlots[bestQIdx]?.date || bestDate;
  }

  // Min abs HA quality (closeness to meridian during dark)
  // Simplified: use alt at best quality time as proxy
  const minAbsHaDeg = maxAltQ != null ? (90 - maxAltQ) : null; // crude approximation

  return {
    maxAlt,
    maxAltQ: maxAltQ != null && maxAltQ > 0 ? maxAltQ : null,
    hoursUp,
    bestDate,
    bestDateQ,
    minAbsHaDeg,
  };
}

// ── Scoring (mirrors gen_objects.py score_item) ────────────────────────────
const GROUP_WEIGHTS = { planets: 25, dso: 5, calendar: 40, alerts: 10, solar_system: 10 };
const W_ALT   = 0.35;
const ALT_FLOOR = 12;
const ALT_FULL  = 45;
const MER_MAX   = 80;
const MER_WIN   = 20;
const MER_GATE  = 20;

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

function altToNorm(altVal) {
  if (altVal <= ALT_FLOOR) return 0;
  return clamp((altVal - ALT_FLOOR) / Math.max(1e-6, ALT_FULL - ALT_FLOOR), 0, 1);
}

function scoreItem(item, vis) {
  const group   = (item.group || 'dso').toLowerCase();
  const wGroup  = GROUP_WEIGHTS[group] ?? 1;
  const altQ    = vis.maxAltQ ?? vis.maxAlt;

  let raw;
  if (group === 'dso') {
    const altScore = altToNorm(altQ) * 100;
    // Meridian bonus: proxy via minAbsHaDeg
    let merBonus = 0;
    if (vis.minAbsHaDeg != null && altQ >= MER_GATE) {
      const ha = Math.abs(vis.minAbsHaDeg);
      if (ha <= MER_WIN) {
        const merTerm = 1 - ha / Math.max(1e-6, MER_WIN);
        merBonus = MER_MAX * merTerm * altToNorm(altQ);
      }
    }
    raw = W_ALT * altScore + merBonus;
  } else {
    // Planets / calendar / alerts: simple max alt score
    const altScoreSimple = clamp((vis.maxAlt / 90) * 100, 0, 100);
    raw = altScoreSimple;
  }

  return wGroup * raw;
}

// ── Note generator ─────────────────────────────────────────────────────────
function makeNote(item, vis, tz) {
  const group  = (item.group || 'dso').toLowerCase();
  const altQ   = vis.maxAltQ ?? vis.maxAlt;
  const altStr = `${Math.round(altQ)}°`;

  const bestLocal = vis.bestDateQ.toLocaleString('en-GB', {
    timeZone: tz || 'UTC', hour: '2-digit', minute: '2-digit', hour12: false
  });

  if (group === 'planets') {
    const qual = altQ >= 50 ? 'Excellent' : altQ >= 30 ? 'Good' : altQ >= 15 ? 'Fair' : 'Low';
    return `Bright planet. ${qual} visibility (${altStr} max). Best around ${bestLocal}.`;
  }
  if (group === 'calendar') {
    return `Sky event. Best around ${bestLocal}.`;
  }
  if (group === 'alerts') {
    return item.note || `Alert object. Check around ${bestLocal}.`;
  }
  // DSO
  const qual = altQ >= 50 ? 'Excellent' : altQ >= 35 ? 'Good' : altQ >= 20 ? 'Fair' : 'Low';
  return `${qual} visibility (${altStr} max). Best around ${bestLocal}.`;
}

// ── Quota-based ranking (mirrors gen_ranking.py build_ranking) ─────────────
const RANKING_CFG = {
  total_top: 7,
  quotas:  { planets: 2, dso: 5, calendar: 1, alerts: 1 },
  reserve: { calendar: 1, alerts: 1 },
  order:   ['alerts', 'calendar', 'planets', 'dso'],
};

function buildRanking(scored) {
  const buckets = {};
  for (const it of scored) {
    const g = it.group;
    if (!buckets[g]) buckets[g] = [];
    buckets[g].push(it);
  }
  for (const lst of Object.values(buckets)) {
    lst.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }

  const picked = [];
  const usedCount = {};
  const usedIds = new Set();

  function pick(group, limit) {
    if (limit <= 0) return;
    const quota = RANKING_CFG.quotas[group] ?? 0;
    if (!quota) return;
    for (const it of (buckets[group] || [])) {
      if (picked.length >= RANKING_CFG.total_top) break;
      if (usedIds.has(it.id)) continue;
      if ((usedCount[group] || 0) >= quota) break;
      picked.push(it);
      usedIds.add(it.id);
      usedCount[group] = (usedCount[group] || 0) + 1;
      if (--limit <= 0) break;
    }
  }

  for (const [g, n] of Object.entries(RANKING_CFG.reserve)) pick(g, n);
  for (const g of RANKING_CFG.order) {
    if (picked.length >= RANKING_CFG.total_top) break;
    pick(g, RANKING_CFG.quotas[g] ?? 0);
  }

  return picked.slice(0, RANKING_CFG.total_top);
}

// ── Request handler ────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }});
  }

  const respHeaders = {
    'Content-Type':                'application/json; charset=utf-8',
    'Cache-Control':               'public, max-age=600',
    'Access-Control-Allow-Origin': '*',
  };

  const url = new URL(request.url);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lon = parseFloat(url.searchParams.get('lon') ?? '');
  const tz  = url.searchParams.get('tz') ?? 'UTC';

  if (!isFinite(lat) || !isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return new Response(JSON.stringify({ error: 'lat and lon are required and must be valid coordinates' }),
      { status: 400, headers: respHeaders });
  }

  try {
    // Fetch static objects catalog (ra/dec, no location-specific data)
    const objectsUrl = `${url.origin}/sky/data/objects_today.json`;
    const objResp = await fetch(objectsUrl);
    if (!objResp.ok) throw new Error('Failed to fetch objects_today.json');
    const objData = await objResp.json();
    const items = objData.items ?? [];

    // Build night time slots
    const allSlots  = buildNightSlots(lat, lon);
    const night     = findNightBlock(allSlots);
    const dark      = night.filter(s => s.sunAlt < SUN_DARK && s.moonAlt < 0);

    if (!night.length) {
      return new Response(JSON.stringify({ meta: { count: 0 }, items: [] }), { headers: respHeaders });
    }

    // Score each item
    const scored = [];
    for (const item of items) {
      const { ra_deg, dec_deg } = item;
      if (!isFinite(ra_deg) || !isFinite(dec_deg)) continue;

      const vis = visStats(ra_deg, dec_deg, lat, lon, night, dark);
      if (!vis) continue; // never rises above horizon

      const score = scoreItem(item, vis);
      const bestLocal = vis.bestDateQ.toLocaleString('en-GB', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).replace(/(\d+)\/(\d+)\/(\d+),\s*(\d+:\d+:\d+)/, '$3-$2-$1T$4');

      scored.push({
        id:      item.id,
        group:   item.group,
        type:    item.type,
        name:    item.name,
        ra_deg,
        dec_deg,
        mag:     item.mag ?? null,
        meta:    item.meta ?? {},
        score:   Math.round(score * 1000) / 1000,
        vis: {
          max_alt_deg:         Math.round(vis.maxAlt * 100) / 100,
          max_alt_deg_quality: vis.maxAltQ != null ? Math.round(vis.maxAltQ * 100) / 100 : null,
          hours_up:            Math.round(vis.hoursUp * 100) / 100,
          best_time_local:     bestLocal,
        },
        note: makeNote(item, vis, tz),
      });
    }

    const ranking = buildRanking(scored);

    return new Response(JSON.stringify({
      meta: {
        generated_at: new Date().toISOString(),
        observer: { lat, lon, tz },
        count: ranking.length,
        total_top: RANKING_CFG.total_top,
        quotas: RANKING_CFG.quotas,
      },
      items: ranking,
    }), { headers: respHeaders });

  } catch (err) {
    console.error('[sky-ranking]', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: respHeaders });
  }
}
