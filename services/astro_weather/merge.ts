// Merge Open-Meteo and 7Timer data into aligned hourly records

import type { HourRecord } from "./types";
import type { OpenMeteoResponse } from "./providers/open_meteo";
import type { SevenTimerResponse } from "./providers/seven_timer";
import { sunAltitudeDeg, moonPositionDeg } from "./ephemeris";

export function mergeHourlyData(
  omData: OpenMeteoResponse,
  stData: SevenTimerResponse | null,
  tz: string,
  hours: number,
  lat: number,
  lon: number,
): HourRecord[] {
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

  // Build 7Timer timepoint map
  const stMap = new Map<number, { seeing: number | null; transparency: number | null }>();
  if (stData && stData.init && Array.isArray(stData.dataseries)) {
    try {
      const initTime = new Date(stData.init).getTime();
      for (const point of stData.dataseries) {
        const timepointHours = point.timepoint || 0;
        const pointTime = initTime + timepointHours * 3600 * 1000;
        stMap.set(timepointHours, {
          seeing: point.seeing ?? null,
          transparency: point.transparency ?? null,
        });
      }
    } catch (e) {
      console.warn("Failed to parse 7Timer init time:", e);
    }
  }

  const records: HourRecord[] = [];
  const now = Date.now();
  const cutoff = now + hours * 3600 * 1000;

  for (let i = 0; i < times.length && i < hours; i++) {
    const timeStr = times[i];
    if (!timeStr) continue;

    try {
      const dt = new Date(timeStr);
      if (isNaN(dt.getTime()) || dt.getTime() > cutoff) break;

      // Find nearest 7Timer point (3-hour intervals)
      const stIndex = Math.floor(i / 3);
      const stPoint = stMap.get(stIndex * 3) || { seeing: null, transparency: null };

      // Ephemeris — compute sun & moon position for this hour at the location
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
          clamped_total: 0,
        },
        atmosphere_score: 0,
        sky_darkness_score: 0,
        dew_safety_score: 0,
        stability_score: 0,
      });
    } catch (e) {
      console.warn(`Failed to process hour ${i}:`, e);
      continue;
    }
  }

  return records;
}
