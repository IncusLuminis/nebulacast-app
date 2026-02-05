// services/astro_weather/providers/open_meteo.ts
async function fetchOpenMeteo(lat, lon, tz, hours) {
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
      "temperature_2m"
    ].join(","),
    timezone: tz,
    forecast_days: String(forecastDays),
    windspeed_unit: "ms",
    precipitation_unit: "mm",
    pressure_unit: "hPa",
    temperature_unit: "celsius"
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
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

// services/astro_weather/merge.ts
function mergeHourlyData(omData, stData, tz, hours) {
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
        seeing: stPoint.seeing,
        transparency: stPoint.transparency,
        score: 0,
        // Will be computed later
        score_breakdown: {
          components: [],
          total: 0,
          clamped_total: 0
        }
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
  default: {
    clouds: 30,
    wind: 15,
    seeing: 20,
    transparency: 15,
    visibility: 10,
    pressure_trend: 5,
    precip_risk: 10,
    temp: 5
  },
  visual: {
    clouds: 35,
    wind: 12,
    seeing: 18,
    transparency: 18,
    visibility: 10,
    pressure_trend: 3,
    precip_risk: 8,
    temp: 6
  },
  broadband: {
    clouds: 25,
    wind: 10,
    seeing: 15,
    transparency: 30,
    visibility: 8,
    pressure_trend: 5,
    precip_risk: 10,
    temp: 7
  },
  planetary: {
    clouds: 25,
    wind: 20,
    seeing: 30,
    transparency: 10,
    visibility: 8,
    pressure_trend: 3,
    precip_risk: 7,
    temp: 7
  }
};
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function computeCloudPoints(cloudTotal, weight) {
  if (cloudTotal === null) return weight * 0.5;
  const pct = cloudTotal > 1 ? cloudTotal : cloudTotal * 100;
  return weight * (1 - clamp(pct / 100, 0, 1));
}
function computeWindPoints(windMs, weight) {
  if (windMs === null) return weight * 0.5;
  const thresh = 4;
  if (windMs <= thresh) return weight;
  const excess = windMs - thresh;
  return weight * Math.max(0, 1 - excess / 8);
}
function computeSeeingPoints(seeing, weight) {
  if (seeing === null) return weight * 0.5;
  if (seeing < 1) return weight;
  if (seeing > 7) return 0;
  return weight * (1 - (seeing - 1) / 6);
}
function computeTransparencyPoints(transparency, weight) {
  if (transparency === null) return weight * 0.5;
  if (transparency < 1) return weight;
  if (transparency > 4) return 0;
  return weight * (1 - (transparency - 1) / 3);
}
function computeVisibilityPoints(visibilityM, weight) {
  if (visibilityM === null) return weight * 0.5;
  const km = visibilityM / 1e3;
  if (km >= 20) return weight;
  if (km < 2) return 0;
  return weight * clamp((km - 2) / 18, 0, 1);
}
function computePressureTrendPoints(pressureTrend, weight) {
  if (pressureTrend === null) return weight * 0.5;
  const normalized = clamp((pressureTrend + 5) / 10, 0, 1);
  return weight * normalized;
}
function computePrecipRiskPoints(precipProb, precipMm, weight) {
  if (precipProb === null && precipMm === null) return weight * 0.5;
  const prob = precipProb !== null ? precipProb > 1 ? precipProb : precipProb * 100 : 0;
  const mm = precipMm !== null ? precipMm : 0;
  if (prob === 0 && mm === 0) return weight;
  if (prob > 50 || mm > 0.5) return 0;
  return weight * (1 - clamp(prob / 50, 0, 1));
}
function computeTempPoints(tempC, weight) {
  if (tempC === null) return weight * 0.5;
  if (tempC < -10) return weight * 0.3;
  if (tempC > 30) return weight * 0.5;
  if (tempC >= -5 && tempC <= 25) return weight;
  if (tempC < -5) {
    return weight * clamp(0.3 + (tempC + 10) / 5 * 0.7, 0.3, 1);
  }
  return weight * clamp(1 - (tempC - 25) / 5 * 0.5, 0.5, 1);
}
function computeScore(hour, pressureTrend, profile = "default") {
  const weights = PROFILE_WEIGHTS[profile] || PROFILE_WEIGHTS.default;
  const components = [
    {
      key: "clouds",
      label: "Clouds",
      value: hour.cloud_total ?? 0,
      points: computeCloudPoints(hour.cloud_total, weights.clouds)
    },
    {
      key: "wind",
      label: "Wind",
      value: hour.wind_m_s ?? 0,
      points: computeWindPoints(hour.wind_m_s, weights.wind)
    },
    {
      key: "seeing",
      label: "Seeing",
      value: hour.seeing ?? 0,
      points: computeSeeingPoints(hour.seeing, weights.seeing)
    },
    {
      key: "transparency",
      label: "Transparency",
      value: hour.transparency ?? 0,
      points: computeTransparencyPoints(hour.transparency, weights.transparency)
    },
    {
      key: "visibility",
      label: "Visibility",
      value: hour.visibility_m ?? 0,
      points: computeVisibilityPoints(hour.visibility_m, weights.visibility)
    },
    {
      key: "pressure_trend",
      label: "Pressure trend",
      value: pressureTrend ?? 0,
      points: computePressureTrendPoints(pressureTrend, weights.pressure_trend)
    },
    {
      key: "precip_risk",
      label: "Precip risk",
      value: hour.precip_prob ?? 0,
      points: computePrecipRiskPoints(hour.precip_prob, hour.precip_mm, weights.precip_risk)
    },
    {
      key: "temp",
      label: "Temperature",
      value: hour.temp_c ?? 0,
      points: computeTempPoints(hour.temp_c, weights.temp)
    }
  ];
  const total = components.reduce((sum, c) => sum + c.points, 0);
  const clampedTotal = clamp(Math.round(total), 0, 100);
  return {
    score: clampedTotal,
    breakdown: {
      components,
      total: Math.round(total * 10) / 10,
      clamped_total: clampedTotal
    }
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
function parseQueryParams(url) {
  const lat = parseFloat(url.searchParams.get("lat") || "");
  const lon = parseFloat(url.searchParams.get("lon") || "");
  const tz = url.searchParams.get("tz") || "Europe/Warsaw";
  const hours = Math.min(Math.max(24, parseInt(url.searchParams.get("hours") || "72", 10)), 120);
  const profile = url.searchParams.get("profile") || "default";
  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error("Invalid lat: must be number in [-90, 90]");
  }
  if (isNaN(lon) || lon < -180 || lon > 180) {
    throw new Error("Invalid lon: must be number in [-180, 180]");
  }
  const validProfiles = ["default", "visual", "broadband", "planetary"];
  if (!validProfiles.includes(profile)) {
    throw new Error(`Invalid profile: must be one of ${validProfiles.join(", ")}`);
  }
  return { lat, lon, tz, hours, profile };
}
function createErrorResponse(message, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      }
    }
  );
}
function createSuccessResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
  });
}
async function onRequest(context) {
  const { request } = context;
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
    return createErrorResponse("Method not allowed", 405);
  }
  try {
    const url = new URL(request.url);
    const { lat, lon, tz, hours, profile } = parseQueryParams(url);
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }
    const [omData, stData] = await Promise.all([
      fetchOpenMeteo(lat, lon, tz, hours),
      fetchSevenTimer(lat, lon)
    ]);
    let hourRecords = mergeHourlyData(omData, stData, tz, hours);
    for (let i = 0; i < hourRecords.length; i++) {
      const hour = hourRecords[i];
      const pressureTrend = i + 6 < hourRecords.length ? (hourRecords[i + 6].pressure_hpa ?? null) - (hour.pressure_hpa ?? 0) : null;
      const { score, breakdown } = computeScore(hour, pressureTrend, profile);
      hour.score = score;
      hour.score_breakdown = breakdown;
    }
    const derived = computeDerived(hourRecords);
    const location = {
      lat,
      lon,
      tz
    };
    const response = {
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      location,
      horizon_hours: hourRecords.length,
      profile,
      hours: hourRecords,
      derived
    };
    const responseObj = createSuccessResponse(response);
    await cache.put(cacheKey, responseObj.clone());
    return responseObj;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("astro-weather API error:", error);
    return createErrorResponse(message, 500);
  }
}
export {
  onRequest
};
