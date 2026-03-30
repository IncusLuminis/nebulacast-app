// services/astro_weather/providers/open_meteo.ts
async function fetchOpenMeteo(lat, lon, tz, hours, cache) {
  const forecastDays = Math.min(Math.ceil(hours / 24), 7);
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      "cloudcover",
      "cloudcover_low",
      "cloudcover_mid",
      "cloudcover_high",
      "precipitation",
      "precipitation_probability",
      "pressure_msl",
      "windspeed_10m",
      "winddirection_10m",
      "visibility",
      "temperature_2m",
      "relativehumidity_2m",
      "dewpoint_2m",
      "rain",
      "snowfall"
    ].join(","),
    timezone: tz,
    forecast_days: String(forecastDays),
    windspeed_unit: "ms",
    precipitation_unit: "mm",
    pressure_unit: "hPa",
    temperature_unit: "celsius"
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  if (cache) {
    const cacheKey = new Request(`https://cache.nebulacast/open-meteo?${params.toString()}`, {
      method: "GET"
    });
    const cached = await cache.match(cacheKey);
    if (cached) {
      const data2 = await cached.json();
      return { data: data2, fromCache: true, status: 200 };
    }
  }
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json"
    }
  });
  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (cache) {
    const cacheKey = new Request(`https://cache.nebulacast/open-meteo?${params.toString()}`, {
      method: "GET"
    });
    const cacheResponse = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600"
      }
    });
    await cache.put(cacheKey, cacheResponse);
  }
  return { data, fromCache: false, status: response.status };
}

// services/astro_weather/providers/seven_timer.ts
async function fetchSevenTimer(lat, lon) {
  const latInt = Math.round(lat);
  const lonInt = Math.round(lon);
  const url = `https://www.7timer.info/bin/api.pl?lon=${lonInt}&lat=${latInt}&product=astro&output=json`;
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      console.warn(`7Timer API error: ${response.status}`);
      return null;
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.dataseries)) {
      console.warn("7Timer: invalid response format");
      return null;
    }
    return data;
  } catch (error) {
    console.warn("7Timer fetch failed:", error);
    return null;
  }
}

// services/astro_weather/ephemeris.ts
var DEG = Math.PI / 180;
var RAD = 180 / Math.PI;
function julianDay(dt) {
  return dt.getTime() / 864e5 + 24405875e-1;
}
function norm360(deg) {
  return (deg % 360 + 360) % 360;
}
function gmst(JD) {
  const T = (JD - 2451545) / 36525;
  const gmst0 = 6.697374558 + 2400.0513369 * T + 258622e-10 * T * T - 17222e-13 * T * T * T;
  const utFraction = (JD % 1 + 0.5) % 1;
  return ((gmst0 + utFraction * 24.06570982441908) % 24 + 24) % 24;
}
function altitude(RA, Dec, lat, lon, JD) {
  const GMST = gmst(JD);
  const LST = (GMST + lon / 15 + 24) % 24;
  const HA = LST * 15 * DEG - RA;
  const latR = lat * DEG;
  const sinAlt = Math.sin(latR) * Math.sin(Dec) + Math.cos(latR) * Math.cos(Dec) * Math.cos(HA);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD;
}
function sunAltitudeDeg(dt, lat, lon) {
  const JD = julianDay(dt);
  const n = JD - 2451545;
  const L = norm360(280.46 + 0.9856474 * n);
  const g = norm360(357.528 + 0.9856003 * n) * DEG;
  const lambda = norm360(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;
  const eps = 23.439 * DEG;
  const sinDec = Math.sin(eps) * Math.sin(lambda);
  const Dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  const RA = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  return altitude(RA, Dec, lat, lon, JD);
}
function moonPositionDeg(dt, lat, lon) {
  const JD = julianDay(dt);
  const d = JD - 2451545;
  const L0 = norm360(218.316 + 13.176396 * d);
  const M = norm360(134.963 + 13.064993 * d) * DEG;
  const F = norm360(93.272 + 13.22935 * d) * DEG;
  const lambdaMoon = norm360(
    L0 + 6.289 * Math.sin(M) - 1.274 * Math.sin(2 * F - M) + 0.658 * Math.sin(2 * F) - 0.186 * Math.sin((357.528 + 0.9856 * d) * DEG) - // Sun's mean anomaly
    0.114 * Math.sin(2 * F)
  ) * DEG;
  const betaMoon = (5.128 * Math.sin(F) + 0.28 * Math.sin(M + F) - 0.277 * Math.sin(M - F)) * DEG;
  const eps = 23.439 * DEG;
  const sinDec = Math.sin(betaMoon) * Math.cos(eps) + Math.cos(betaMoon) * Math.sin(eps) * Math.sin(lambdaMoon);
  const Dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  const RA = Math.atan2(
    Math.cos(betaMoon) * Math.cos(eps) * Math.sin(lambdaMoon) - Math.sin(betaMoon) * Math.sin(eps),
    Math.cos(betaMoon) * Math.cos(lambdaMoon)
  );
  const altDeg = altitude(RA, Dec, lat, lon, JD);
  const n = d;
  const gSun = norm360(357.528 + 0.9856003 * n) * DEG;
  const LSun = norm360(280.46 + 0.9856474 * n);
  const lambdaSun = norm360(LSun + 1.915 * Math.sin(gSun) + 0.02 * Math.sin(2 * gSun)) * DEG;
  const elong = Math.acos(
    Math.max(-1, Math.min(
      1,
      Math.sin(betaMoon) * Math.sin(0) + Math.cos(betaMoon) * Math.cos(0) * Math.cos(lambdaMoon - lambdaSun)
    ))
  );
  const illumPct = (1 - Math.cos(elong)) / 2 * 100;
  return { altDeg, illumPct: Math.max(0, Math.min(100, illumPct)) };
}

// services/astro_weather/merge.ts
function mergeHourlyData(omData, stData, tz, hours, lat, lon) {
  const hourly = omData.hourly;
  if (!hourly || !hourly.time || hourly.time.length === 0) {
    return [];
  }
  const times = hourly.time;
  const cloudTotal = hourly.cloudcover || [];
  const cloudLow = hourly.cloudcover_low || [];
  const cloudMid = hourly.cloudcover_mid || [];
  const cloudHigh = hourly.cloudcover_high || [];
  const precip = hourly.precipitation || [];
  const precipProb = hourly.precipitation_probability || [];
  const pressure = hourly.pressure_msl || [];
  const wind = hourly.windspeed_10m || [];
  const windDir = hourly.winddirection_10m || [];
  const visibility = hourly.visibility || [];
  const temp = hourly.temperature_2m || [];
  const humidity = hourly.relativehumidity_2m || [];
  const dewpoint = hourly.dewpoint_2m || [];
  const rain = hourly.rain || [];
  const snowfall = hourly.snowfall || [];
  const stMap = /* @__PURE__ */ new Map();
  if (stData && stData.init && Array.isArray(stData.dataseries)) {
    try {
      const initTime = new Date(stData.init).getTime();
      for (const point of stData.dataseries) {
        const timepointHours = point.timepoint || 0;
        const pointTime = initTime + timepointHours * 3600 * 1e3;
        stMap.set(timepointHours, {
          seeing: point.seeing ?? null,
          transparency: point.transparency ?? null
        });
      }
    } catch (e) {
      console.warn("Failed to parse 7Timer init time:", e);
    }
  }
  const records = [];
  const now = Date.now();
  const cutoff = now + hours * 3600 * 1e3;
  for (let i = 0; i < times.length && i < hours; i++) {
    const timeStr = times[i];
    if (!timeStr) continue;
    try {
      const dt = new Date(timeStr);
      if (isNaN(dt.getTime()) || dt.getTime() > cutoff) break;
      const stIndex = Math.floor(i / 3);
      const stPoint = stMap.get(stIndex * 3) || { seeing: null, transparency: null };
      const sunAlt = sunAltitudeDeg(dt, lat, lon);
      const moon = moonPositionDeg(dt, lat, lon);
      records.push({
        time: dt.toISOString(),
        cloud_total: cloudTotal[i] ?? null,
        cloud_low: cloudLow[i] ?? null,
        cloud_mid: cloudMid[i] ?? null,
        cloud_high: cloudHigh[i] ?? null,
        precip_mm: precip[i] ?? 0,
        precip_prob: precipProb[i] ?? null,
        pressure_hpa: pressure[i] ?? null,
        wind_m_s: wind[i] ?? null,
        wind_dir_deg: windDir[i] ?? null,
        temp_c: temp[i] ?? null,
        visibility_m: visibility[i] ?? null,
        humidity_pct: humidity[i] ?? null,
        dewpoint_c: dewpoint[i] ?? null,
        rain_mm: rain[i] ?? null,
        snowfall_mm: snowfall[i] ?? null,
        seeing: stPoint.seeing,
        transparency: stPoint.transparency,
        // Ephemeris fields
        sun_alt_deg: sunAlt,
        moon_alt_deg: moon.altDeg,
        moon_illum_pct: moon.illumPct,
        // Scoring (computed later in astro-weather.ts)
        gate: "OPEN",
        score: 0,
        score_breakdown: {
          categories: [],
          total: 0,
          clamped_total: 0
        },
        atmosphere_score: 0,
        sky_darkness_score: 0,
        dew_safety_score: 0,
        stability_score: 0
      });
    } catch (e) {
      console.warn(`Failed to process hour ${i}:`, e);
      continue;
    }
  }
  return records;
}

// services/astro_weather/score.ts
var PROFILE_WEIGHTS = {
  balanced: { atmosphere: 0.35, sky_darkness: 0.3, dew_safety: 0.2, stability: 0.15 },
  visual: { atmosphere: 0.4, sky_darkness: 0.25, dew_safety: 0.2, stability: 0.15 },
  broadband: { atmosphere: 0.3, sky_darkness: 0.45, dew_safety: 0.15, stability: 0.1 },
  planetary: { atmosphere: 0.55, sky_darkness: 0.1, dew_safety: 0.2, stability: 0.15 }
};
var BORTLE_BASE = {
  1: 100,
  2: 95,
  3: 90,
  4: 80,
  5: 70,
  6: 55,
  7: 40,
  8: 25,
  9: 10
};
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function interpolate(x, table) {
  if (x <= table[0][0]) return table[0][1];
  if (x >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (x >= x0 && x <= x1) {
      return y0 + (x - x0) / (x1 - x0) * (y1 - y0);
    }
  }
  return table[table.length - 1][1];
}
function cloudsScore(cloud_low, cloud_mid, cloud_high, cloud_total) {
  if (cloud_low !== null && cloud_mid !== null && cloud_high !== null) {
    return clamp(100 - 0.6 * cloud_low - 0.3 * cloud_mid - 0.1 * cloud_high, 0, 100);
  }
  if (cloud_total !== null) {
    return clamp(100 - cloud_total, 0, 100);
  }
  return 50;
}
var SEEING_TO_FWHM = [
  [1, 0.7],
  [2, 0.9],
  [3, 1.1],
  [4, 1.4],
  [5, 1.8],
  [6, 2.5],
  [7, 3.5]
];
var FWHM_QUALITY = [
  [0.7, 100],
  [1, 90],
  [1.3, 80],
  [1.6, 70],
  [2, 60],
  [2.5, 45],
  [3, 30],
  [3.5, 15]
];
function seeingScore(seeing_1_7) {
  if (seeing_1_7 === null) return 50;
  const fwhm = clamp(interpolate(clamp(seeing_1_7, 1, 7), SEEING_TO_FWHM), 0.7, 3.5);
  return interpolate(fwhm, FWHM_QUALITY);
}
function transparencyScore(visibility_m, humidity_pct) {
  let score = 100;
  if (humidity_pct !== null) {
    if (humidity_pct > 90) score -= 25;
    else if (humidity_pct > 80) score -= 15;
    else if (humidity_pct > 70) score -= 5;
  }
  if (visibility_m !== null) {
    const vis_km = visibility_m / 1e3;
    if (vis_km < 5) score -= 30;
    else if (vis_km < 10) score -= 15;
    else if (vis_km < 20) score -= 5;
  }
  return clamp(score, 0, 100);
}
function computeAtmosphere(hour) {
  const cq = cloudsScore(hour.cloud_low, hour.cloud_mid, hour.cloud_high, hour.cloud_total);
  const sq = seeingScore(hour.seeing);
  const tq = transparencyScore(hour.visibility_m, hour.humidity_pct);
  const score = clamp(Math.round(0.4 * cq + 0.35 * sq + 0.25 * tq), 0, 100);
  return {
    score,
    parameters: [
      { key: "clouds", label: "Clouds", value: Math.round(cq), points: Math.round(0.4 * cq) },
      { key: "seeing", label: "Seeing", value: Math.round(sq), points: Math.round(0.35 * sq) },
      { key: "transparency", label: "Transparency", value: Math.round(tq), points: Math.round(0.25 * tq) }
    ]
  };
}
function computeSkyDarkness(hour, bortle) {
  const bortleClamped = clamp(Math.round(bortle), 1, 9);
  const base = BORTLE_BASE[bortleClamped] ?? 70;
  const sunAlt = hour.sun_alt_deg;
  if (sunAlt !== null && sunAlt > 0) {
    return {
      score: 0,
      parameters: [
        { key: "bortle", label: `Bortle ${bortleClamped}`, value: bortleClamped, points: 0 },
        { key: "sun", label: "Daylight", value: Math.round(sunAlt), points: -base },
        { key: "moon", label: "Moon", value: 0, points: 0 }
      ]
    };
  }
  let twilightPenalty = 0;
  if (sunAlt !== null) {
    if (sunAlt > -6) twilightPenalty = 70;
    else if (sunAlt > -12) twilightPenalty = 40;
    else if (sunAlt > -18) twilightPenalty = 20;
  }
  let moonPenalty = 0;
  const moonAlt = hour.moon_alt_deg;
  const moonIllum = hour.moon_illum_pct;
  if (moonAlt !== null && moonAlt > 0 && moonIllum !== null) {
    if (moonAlt > 60 && moonIllum > 75) moonPenalty = 45;
    else if (moonAlt > 40 && moonIllum > 50) moonPenalty = 30;
    else if (moonAlt > 20 && moonIllum > 25) moonPenalty = 15;
    else if (moonAlt <= 10) moonPenalty = 5;
  }
  const score = clamp(base - twilightPenalty - moonPenalty, 0, 100);
  return {
    score,
    parameters: [
      {
        key: "bortle",
        label: `Bortle ${bortleClamped}`,
        value: bortleClamped,
        points: base
      },
      {
        key: "twilight",
        label: sunAlt !== null ? `Sun ${sunAlt.toFixed(1)}\xB0` : "Sun unknown",
        value: Math.round(sunAlt ?? -90),
        points: -twilightPenalty
      },
      {
        key: "moon",
        label: moonAlt !== null && moonAlt > 0 ? `Moon ${moonAlt.toFixed(0)}\xB0 / ${(moonIllum ?? 0).toFixed(0)}%` : "Moon below horizon",
        value: Math.round(moonIllum ?? 0),
        points: -moonPenalty
      }
    ]
  };
}
var DEW_SPREAD_TABLE = [
  [0, 5],
  [1, 20],
  [2, 40],
  [3, 60],
  [4, 80],
  [6, 100]
];
function computeDewSafety(hour) {
  let spreadScore = 60;
  let spread = null;
  if (hour.temp_c !== null && hour.dewpoint_c !== null) {
    spread = hour.temp_c - hour.dewpoint_c;
    spreadScore = Math.round(interpolate(spread, DEW_SPREAD_TABLE));
  }
  const windKmh = (hour.wind_m_s ?? 0) * 3.6;
  const windMod = windKmh > 10 ? 5 : windKmh < 2 ? -5 : 0;
  const score = clamp(spreadScore + windMod, 0, 100);
  return {
    score,
    parameters: [
      {
        key: "dew_spread",
        label: spread !== null ? `Spread ${spread.toFixed(1)}\xB0C` : "Dew spread unknown",
        value: spread !== null ? Math.round(spread * 10) / 10 : 0,
        points: spreadScore
      },
      {
        key: "wind_modifier",
        label: `Wind (${windKmh.toFixed(0)} km/h)`,
        value: Math.round(windKmh),
        points: windMod
      }
    ]
  };
}
var WIND_KMH_TABLE = [
  [0, 100],
  [5, 100],
  [10, 85],
  [15, 70],
  [20, 50],
  [30, 30],
  [50, 10]
];
var HUMIDITY_STAB_TABLE = [
  [0, 100],
  [50, 100],
  [60, 90],
  [70, 80],
  [80, 60],
  [90, 40],
  [100, 20]
];
function pressureTrendScore(trend) {
  if (trend === null) return 70;
  if (trend >= -1 && trend <= 1) return 100;
  if (trend > 1 && trend <= 3) return 80;
  if (trend < -1 && trend >= -3) return 80;
  if (trend > 3 && trend <= 6) return 60;
  if (trend < -3 && trend >= -6) return 50;
  return 30;
}
function computeStability(hour, pressureTrend) {
  const windKmh = hour.wind_m_s !== null ? hour.wind_m_s * 3.6 : null;
  const wq = windKmh !== null ? interpolate(windKmh, WIND_KMH_TABLE) : 70;
  const hq = interpolate(hour.humidity_pct ?? 65, HUMIDITY_STAB_TABLE);
  const pq = pressureTrendScore(pressureTrend);
  const score = clamp(Math.round(0.45 * wq + 0.35 * hq + 0.2 * pq), 0, 100);
  return {
    score,
    parameters: [
      {
        key: "wind",
        label: windKmh !== null ? `Wind ${windKmh.toFixed(0)} km/h` : "Wind unknown",
        value: Math.round(wq),
        points: Math.round(0.45 * wq)
      },
      {
        key: "humidity",
        label: `Humidity ${hour.humidity_pct ?? "?"}%`,
        value: Math.round(hq),
        points: Math.round(0.35 * hq)
      },
      {
        key: "pressure_trend",
        label: pressureTrend !== null ? `Pressure ${pressureTrend > 0 ? "+" : ""}${pressureTrend.toFixed(1)} hPa/6h` : "Pressure unknown",
        value: Math.round(pq),
        points: Math.round(0.2 * pq)
      }
    ]
  };
}
function computeGate(hour) {
  const vis_km = (hour.visibility_m ?? 1e4) / 1e3;
  if ((hour.rain_mm ?? 0) > 0 || (hour.snowfall_mm ?? 0) > 0 || (hour.cloud_low ?? 0) >= 95 || (hour.cloud_mid ?? 0) >= 95 || vis_km <= 1) {
    return "CLOSED";
  }
  if ((hour.cloud_low ?? 0) >= 70 || (hour.cloud_mid ?? 0) >= 70 || (hour.cloud_high ?? 0) >= 80 || vis_km <= 5 || (hour.humidity_pct ?? 0) >= 90) {
    return "MARGINAL";
  }
  return "OPEN";
}
function computeScore(hour, pressureTrend, profile = "balanced", bortle = 5) {
  const weights = PROFILE_WEIGHTS[profile] ?? PROFILE_WEIGHTS.balanced;
  const atm = computeAtmosphere(hour);
  const sky = computeSkyDarkness(hour, bortle);
  const dew = computeDewSafety(hour);
  const stab = computeStability(hour, pressureTrend);
  const weightedSum = atm.score * weights.atmosphere + sky.score * weights.sky_darkness + dew.score * weights.dew_safety + stab.score * weights.stability;
  const gate = computeGate(hour);
  let cappedScore = weightedSum;
  if (gate === "CLOSED") cappedScore = Math.min(cappedScore, 20);
  else if (gate === "MARGINAL") cappedScore = Math.min(cappedScore, 69);
  const finalScore = clamp(Math.round(cappedScore), 0, 100);
  const categories = [
    {
      key: "atmosphere",
      label: "Atmosphere",
      score: atm.score,
      weight: weights.atmosphere,
      points: Math.round(atm.score * weights.atmosphere * 10) / 10,
      parameters: atm.parameters
    },
    {
      key: "sky_darkness",
      label: "Sky Darkness",
      score: sky.score,
      weight: weights.sky_darkness,
      points: Math.round(sky.score * weights.sky_darkness * 10) / 10,
      parameters: sky.parameters
    },
    {
      key: "dew_safety",
      label: "Dew Safety",
      score: dew.score,
      weight: weights.dew_safety,
      points: Math.round(dew.score * weights.dew_safety * 10) / 10,
      parameters: dew.parameters
    },
    {
      key: "stability",
      label: "Stability",
      score: stab.score,
      weight: weights.stability,
      points: Math.round(stab.score * weights.stability * 10) / 10,
      parameters: stab.parameters
    }
  ];
  return {
    score: finalScore,
    breakdown: {
      categories,
      total: Math.round(weightedSum * 10) / 10,
      clamped_total: finalScore
    },
    gate,
    atmosphere_score: atm.score,
    sky_darkness_score: sky.score,
    dew_safety_score: dew.score,
    stability_score: stab.score
  };
}

// services/astro_weather/derived.ts
function computeDerived(hours) {
  if (hours.length === 0) {
    return {
      pressure_trend_6h: null,
      wind_peak_next_24h: null,
      cloud_peak_next_24h: null,
      fog_risk: "low",
      heads_up: []
    };
  }
  const now = hours[0];
  const next24 = hours.slice(0, Math.min(24, hours.length));
  const next6 = hours.slice(0, Math.min(6, hours.length));
  let pressureTrend6h = null;
  if (next6.length >= 2) {
    const p0 = next6[0]?.pressure_hpa;
    const p6 = next6[next6.length - 1]?.pressure_hpa;
    if (p0 !== null && p6 !== null) {
      pressureTrend6h = Math.round((p6 - p0) * 10) / 10;
    }
  }
  let windPeak = null;
  for (const h of next24) {
    if (h.wind_m_s !== null) {
      if (windPeak === null || h.wind_m_s > windPeak) {
        windPeak = h.wind_m_s;
      }
    }
  }
  let cloudPeak = null;
  for (const h of next24) {
    if (h.cloud_total !== null) {
      const pct = h.cloud_total > 1 ? h.cloud_total : h.cloud_total * 100;
      if (cloudPeak === null || pct > cloudPeak) {
        cloudPeak = Math.round(pct);
      }
    }
  }
  const visM = now.visibility_m;
  let fogRisk = "low";
  if (visM !== null) {
    if (visM < 2e3) {
      fogRisk = "high";
    } else if (visM < 8e3) {
      fogRisk = "medium";
    }
  }
  const headsUp = [];
  const next12 = hours.slice(0, Math.min(12, hours.length));
  let cloudIncrease = false;
  if (next12.length >= 4) {
    const nowCloud = now.cloud_total ?? 0;
    const pctNow = nowCloud > 1 ? nowCloud : nowCloud * 100;
    for (let i = 3; i < next12.length; i++) {
      const futureCloud = next12[i].cloud_total ?? 0;
      const pctFuture = futureCloud > 1 ? futureCloud : futureCloud * 100;
      if (pctFuture > pctNow + 20) {
        const timeStr = new Date(next12[i].time).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit"
        });
        headsUp.push(`Clouds increase after ${timeStr}`);
        cloudIncrease = true;
        break;
      }
    }
  }
  if (windPeak !== null && windPeak > 8) {
    for (let i = 0; i < next12.length; i++) {
      if (next12[i].wind_m_s !== null && next12[i].wind_m_s > 8) {
        const startTime = new Date(next12[i].time).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit"
        });
        let endTime = startTime;
        for (let j = i + 1; j < next12.length; j++) {
          if (next12[j].wind_m_s !== null && next12[j].wind_m_s > 8) {
            endTime = new Date(next12[j].time).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit"
            });
          } else {
            break;
          }
        }
        if (endTime !== startTime) {
          headsUp.push(`Wind peaks ${startTime}\u2013${endTime}`);
        } else {
          headsUp.push(`Wind peaks around ${startTime}`);
        }
        break;
      }
    }
  }
  if (fogRisk !== "low") {
    headsUp.push(`Possible ${fogRisk === "high" ? "fog" : "haze"}`);
  }
  return {
    pressure_trend_6h: pressureTrend6h,
    wind_peak_next_24h: windPeak !== null ? Math.round(windPeak * 10) / 10 : null,
    cloud_peak_next_24h: cloudPeak,
    fog_risk: fogRisk,
    heads_up: headsUp.slice(0, 3)
  };
}

// functions/api/astro-weather.ts
var VALID_PROFILES = ["balanced", "visual", "broadband", "planetary"];
var HOURS_MIN = 1;
var HOURS_MAX = 168;
function parseQueryParams(url) {
  const lat = parseFloat(url.searchParams.get("lat") ?? "");
  const lon = parseFloat(url.searchParams.get("lon") ?? "");
  const tzRaw = url.searchParams.get("tz") ?? "Europe/Warsaw";
  const tz = typeof tzRaw === "string" && tzRaw.length > 0 ? tzRaw : "Europe/Warsaw";
  const hoursRaw = parseInt(url.searchParams.get("hours") ?? "72", 10);
  const hours = Math.min(Math.max(Number.isFinite(hoursRaw) ? hoursRaw : 72, HOURS_MIN), HOURS_MAX);
  const profile = url.searchParams.get("profile") ?? "balanced";
  const bortleRaw = parseInt(url.searchParams.get("bortle") ?? "5", 10);
  const bortle = Math.min(9, Math.max(1, Number.isFinite(bortleRaw) ? bortleRaw : 5));
  const name = url.searchParams.get("name") ?? void 0;
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Invalid lat: must be number in [-90, 90]");
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error("Invalid lon: must be number in [-180, 180]");
  }
  if (!VALID_PROFILES.includes(profile)) {
    throw new Error(`Invalid profile: must be one of ${VALID_PROFILES.join(", ")}`);
  }
  return { lat, lon, tz, hours, profile, bortle, name };
}
function jsonHeaders(cfRay) {
  const h = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };
  if (cfRay) h["CF-Ray"] = cfRay;
  return h;
}
function createErrorPayload(opts) {
  const body = {
    ok: false,
    where: opts.where,
    message: opts.message,
    req: opts.req
  };
  if (opts.stack !== void 0) body.stack = opts.stack;
  return body;
}
function createErrorResponse(message, status = 400, cfRay, payload) {
  const body = payload ?? { error: message };
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders(cfRay)
  });
}
function createSuccessResponse(data, cfRay) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=600",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };
  if (cfRay) headers["CF-Ray"] = cfRay;
  return new Response(JSON.stringify(data), { headers });
}
async function onRequest(context) {
  const { request } = context;
  const cfRay = request.headers.get("cf-ray") ?? request.headers.get("CF-Ray") ?? void 0;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  if (request.method !== "GET") {
    return createErrorResponse("Method not allowed", 405, cfRay);
  }
  let reqParams = {};
  try {
    const url = new URL(request.url);
    const parsed = parseQueryParams(url);
    const { lat, lon, tz, hours, profile, bortle, name } = parsed;
    reqParams = { lat, lon, tz, hours, profile, name };
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }
    let omResult;
    try {
      omResult = await fetchOpenMeteo(lat, lon, tz, hours, cache);
    } catch (omError) {
      if (omError instanceof Error && omError.message === "RATE_LIMITED") {
        const staleCacheKey = new Request(`https://cache.nebulacast/open-meteo?latitude=${lat}&longitude=${lon}&timezone=${encodeURIComponent(tz)}&forecast_days=${Math.min(Math.ceil(hours / 24), 7)}`, {
          method: "GET"
        });
        const staleCached = await cache.match(staleCacheKey);
        if (staleCached) {
          const staleData = await staleCached.json();
          omResult = { data: staleData, fromCache: true, status: 200 };
        } else {
          const headers = {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=60",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS"
          };
          if (cfRay) headers["CF-Ray"] = cfRay;
          return new Response(
            JSON.stringify({
              ok: true,
              source: "rate-limited",
              message: "Open-Meteo rate limited; please retry in a few minutes",
              location: { lat, lon, tz },
              hours: [],
              derived: {}
            }),
            { status: 200, headers }
          );
        }
      } else {
        throw omError;
      }
    }
    const stData = await fetchSevenTimer(lat, lon);
    let hourRecords = mergeHourlyData(omResult.data, stData, tz, hours, lat, lon);
    if (!hourRecords || hourRecords.length === 0) {
      console.error("[astro-weather] mergeHourlyData returned empty array", {
        omData: omResult.data,
        stData,
        tz,
        hours
      });
      throw new Error("No hourly data available after merge");
    }
    for (let i = 0; i < hourRecords.length; i++) {
      const hour = hourRecords[i];
      const pressureTrend = i + 6 < hourRecords.length ? (hourRecords[i + 6].pressure_hpa ?? null) - (hour.pressure_hpa ?? 0) : null;
      const {
        score,
        breakdown,
        gate,
        atmosphere_score,
        sky_darkness_score,
        dew_safety_score,
        stability_score
      } = computeScore(hour, pressureTrend, profile, bortle);
      hour.score = score;
      hour.score_breakdown = breakdown;
      hour.gate = gate;
      hour.atmosphere_score = atmosphere_score;
      hour.sky_darkness_score = sky_darkness_score;
      hour.dew_safety_score = dew_safety_score;
      hour.stability_score = stability_score;
    }
    const derived = computeDerived(hourRecords);
    const location = { lat, lon, tz };
    const response = {
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      location,
      horizon_hours: hourRecords.length,
      profile,
      bortle,
      hours: hourRecords,
      derived
    };
    const responseObj = createSuccessResponse(response, cfRay);
    await cache.put(cacheKey, responseObj.clone());
    return responseObj;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const stack = error instanceof Error ? error.stack : void 0;
    console.error("[astro-weather]", message, error);
    const payload = createErrorPayload({
      ok: false,
      where: "astro-weather",
      message,
      stack,
      req: reqParams
    });
    return createErrorResponse(
      message,
      500,
      cfRay,
      payload
    );
  }
}
export {
  onRequest
};
