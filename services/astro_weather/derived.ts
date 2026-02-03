// Compute derived metrics from hourly data

import type { HourRecord, DerivedMetrics } from "./types";

export function computeDerived(hours: HourRecord[]): DerivedMetrics {
  if (hours.length === 0) {
    return {
      pressure_trend_6h: null,
      wind_peak_next_24h: null,
      cloud_peak_next_24h: null,
      fog_risk: "low",
      heads_up: [],
    };
  }

  const now = hours[0];
  const next24 = hours.slice(0, Math.min(24, hours.length));
  const next6 = hours.slice(0, Math.min(6, hours.length));

  // Pressure trend 6h
  let pressureTrend6h: number | null = null;
  if (next6.length >= 2) {
    const p0 = next6[0]?.pressure_hpa;
    const p6 = next6[next6.length - 1]?.pressure_hpa;
    if (p0 !== null && p6 !== null) {
      pressureTrend6h = Math.round((p6 - p0) * 10) / 10;
    }
  }

  // Wind peak next 24h
  let windPeak: number | null = null;
  for (const h of next24) {
    if (h.wind_m_s !== null) {
      if (windPeak === null || h.wind_m_s > windPeak) {
        windPeak = h.wind_m_s;
      }
    }
  }

  // Cloud peak next 24h
  let cloudPeak: number | null = null;
  for (const h of next24) {
    if (h.cloud_total !== null) {
      const pct = h.cloud_total > 1 ? h.cloud_total : h.cloud_total * 100;
      if (cloudPeak === null || pct > cloudPeak) {
        cloudPeak = Math.round(pct);
      }
    }
  }

  // Fog risk
  const visM = now.visibility_m;
  let fogRisk: "low" | "medium" | "high" = "low";
  if (visM !== null) {
    if (visM < 2000) {
      fogRisk = "high";
    } else if (visM < 8000) {
      fogRisk = "medium";
    }
  }

  // Heads-up messages (next 12h)
  const headsUp: string[] = [];
  const next12 = hours.slice(0, Math.min(12, hours.length));

  // Cloud increase warning
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
          minute: "2-digit",
        });
        headsUp.push(`Clouds increase after ${timeStr}`);
        cloudIncrease = true;
        break;
      }
    }
  }

  // Wind peak warning
  if (windPeak !== null && windPeak > 8) {
    for (let i = 0; i < next12.length; i++) {
      if (next12[i].wind_m_s !== null && next12[i].wind_m_s! > 8) {
        const startTime = new Date(next12[i].time).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        let endTime = startTime;
        for (let j = i + 1; j < next12.length; j++) {
          if (next12[j].wind_m_s !== null && next12[j].wind_m_s! > 8) {
            endTime = new Date(next12[j].time).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });
          } else {
            break;
          }
        }
        if (endTime !== startTime) {
          headsUp.push(`Wind peaks ${startTime}–${endTime}`);
        } else {
          headsUp.push(`Wind peaks around ${startTime}`);
        }
        break;
      }
    }
  }

  // Fog/haze warning
  if (fogRisk !== "low") {
    headsUp.push(`Possible ${fogRisk === "high" ? "fog" : "haze"}`);
  }

  return {
    pressure_trend_6h: pressureTrend6h,
    wind_peak_next_24h: windPeak !== null ? Math.round(windPeak * 10) / 10 : null,
    cloud_peak_next_24h: cloudPeak,
    fog_risk: fogRisk,
    heads_up: headsUp.slice(0, 3),
  };
}
