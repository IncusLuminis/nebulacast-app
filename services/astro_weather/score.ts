// Scoring v4 — Atmosphere Quality + Profiles Model

import type { Profile, ProfileWeights, HourRecord, ScoreBreakdown, ObservabilityGate } from "./types";

// ─── Profile weights ───────────────────────────────────────────────────────────

const PROFILE_WEIGHTS: Record<Profile, ProfileWeights> = {
  balanced: {
    clouds: 0.35,
    seeing: 0.25,
    transparency: 0.20,
    wind: 0.10,
    humidity: 0.05,
    pressure_trend: 0.03,
    thermal: 0.02,
  },
  visual: {
    clouds: 0.40,
    seeing: 0.10,
    transparency: 0.25,
    wind: 0.10,
    humidity: 0.08,
    pressure_trend: 0.04,
    thermal: 0.03,
  },
  broadband: {
    clouds: 0.30,
    seeing: 0.15,
    transparency: 0.30,
    wind: 0.10,
    humidity: 0.07,
    pressure_trend: 0.05,
    thermal: 0.03,
  },
  planetary: {
    clouds: 0.20,
    seeing: 0.40,
    transparency: 0.10,
    wind: 0.20,
    humidity: 0.05,
    pressure_trend: 0.03,
    thermal: 0.02,
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Interpolate quality from a sorted breakpoint table [[x, quality], ...].
 * Clamps below the first and above the last anchor value.
 */
function interpolateTable(x: number, table: [number, number][]): number {
  if (x <= table[0][0]) return table[0][1];
  if (x >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, q0] = table[i];
    const [x1, q1] = table[i + 1];
    if (x >= x0 && x <= x1) {
      return q0 + ((x - x0) / (x1 - x0)) * (q1 - q0);
    }
  }
  return table[table.length - 1][1];
}

// ─── Quality functions (each returns 0–100) ────────────────────────────────────

function cloudQuality(
  cloud_low: number | null,
  cloud_mid: number | null,
  cloud_high: number | null,
  cloud_total: number | null
): number {
  let effective: number;
  if (cloud_low !== null && cloud_mid !== null && cloud_high !== null) {
    effective = 0.65 * cloud_low + 0.25 * cloud_mid + 0.10 * cloud_high;
  } else if (cloud_total !== null) {
    effective = cloud_total;
  } else {
    return 50; // Unknown → mid
  }
  return Math.max(0, 100 - effective);
}

// 7Timer seeing scale (1–7) → FWHM arcseconds
const SEEING_TO_FWHM: [number, number][] = [
  [1, 0.5],
  [2, 0.75],
  [3, 1.0],
  [4, 1.5],
  [5, 2.0],
  [6, 2.5],
  [7, 4.0],
];

// FWHM arcseconds → quality
const FWHM_QUALITY_TABLE: [number, number][] = [
  [0.5, 100],
  [1.0, 90],
  [1.5, 75],
  [2.0, 60],
  [2.5, 45],
  [3.0, 30],
  [4.0, 15],
];

function seeingQuality(seeing_1_7: number | null): number {
  if (seeing_1_7 === null) return 50;
  const clamped = clamp(seeing_1_7, 1, 7);
  const fwhm = clamp(interpolateTable(clamped, SEEING_TO_FWHM), 0.5, 4.0);
  return interpolateTable(fwhm, FWHM_QUALITY_TABLE);
}

// Visibility km → transparency quality
const TRANSPARENCY_TABLE: [number, number][] = [
  [0, 10],
  [5, 10],
  [10, 30],
  [20, 50],
  [30, 70],
  [50, 100],
];

function transparencyQuality(visibility_m: number | null): number {
  if (visibility_m === null) return 70;
  return interpolateTable(visibility_m / 1000, TRANSPARENCY_TABLE);
}

// Wind m/s → quality
const WIND_TABLE: [number, number][] = [
  [0, 100],
  [3, 100],
  [6, 80],
  [10, 55],
  [20, 30],
];

function windQuality(wind_m_s: number | null): number {
  if (wind_m_s === null) return 70;
  return interpolateTable(wind_m_s, WIND_TABLE);
}

// Humidity % → quality
const HUMIDITY_TABLE: [number, number][] = [
  [0, 100],
  [60, 100],
  [70, 80],
  [80, 60],
  [90, 40],
  [100, 20],
];

function humidityQuality(humidity_pct: number | null): number {
  if (humidity_pct === null) return 60;
  return interpolateTable(humidity_pct, HUMIDITY_TABLE);
}

// Pressure trend hPa/6h → quality
const PRESSURE_TREND_TABLE: [number, number][] = [
  [-10, 20],
  [-2, 20],
  [-1, 40],
  [1, 60],
  [2, 80],
  [10, 100],
];

function pressureTrendQuality(trend_hpa: number | null): number {
  if (trend_hpa === null) return 60;
  return interpolateTable(trend_hpa, PRESSURE_TREND_TABLE);
}

// Dewpoint spread °C → thermal quality
const THERMAL_TABLE: [number, number][] = [
  [0, 20],
  [1, 50],
  [2, 80],
  [4, 100],
  [20, 100],
];

function thermalQuality(temp_c: number | null, dewpoint_c: number | null): number {
  if (temp_c === null || dewpoint_c === null) return 60;
  const spread = Math.max(0, temp_c - dewpoint_c);
  return interpolateTable(spread, THERMAL_TABLE);
}

// High-cloud blanket penalty (deducted from weighted sum)
function highCloudPenalty(cloud_high: number | null): number {
  if (cloud_high === null) return 0;
  if (cloud_high >= 95) return 20;
  if (cloud_high >= 85) return 15;
  if (cloud_high >= 70) return 10;
  if (cloud_high >= 50) return 5;
  return 0;
}

// ─── Observability Gate ────────────────────────────────────────────────────────

export function computeGate(hour: HourRecord): ObservabilityGate {
  const vis_km = (hour.visibility_m ?? 10000) / 1000;

  if (
    (hour.rain_mm ?? 0) > 0 ||
    (hour.snowfall_mm ?? 0) > 0 ||
    (hour.cloud_low ?? 0) >= 95 ||
    (hour.cloud_mid ?? 0) >= 95 ||
    vis_km <= 1.0
  ) {
    return "CLOSED";
  }

  if (
    (hour.cloud_low ?? 0) >= 70 ||
    (hour.cloud_mid ?? 0) >= 70 ||
    (hour.cloud_high ?? 0) >= 80 ||
    vis_km <= 5.0 ||
    (hour.humidity_pct ?? 0) >= 90
  ) {
    return "MARGINAL";
  }

  return "OPEN";
}

// ─── Score category ────────────────────────────────────────────────────────────

export function scoreCategory(score: number): "Poor" | "Fair" | "Good" | "Excellent" {
  if (score >= 75) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 30) return "Fair";
  return "Poor";
}

// ─── Main scoring function ─────────────────────────────────────────────────────

export function computeScore(
  hour: HourRecord,
  pressureTrend: number | null,
  profile: Profile = "balanced"
): { score: number; breakdown: ScoreBreakdown; gate: ObservabilityGate } {
  const weights = PROFILE_WEIGHTS[profile] ?? PROFILE_WEIGHTS.balanced;

  const cloudQ    = cloudQuality(hour.cloud_low, hour.cloud_mid, hour.cloud_high, hour.cloud_total);
  const seeingQ   = seeingQuality(hour.seeing);
  const transQ    = transparencyQuality(hour.visibility_m);
  const windQ     = windQuality(hour.wind_m_s);
  const humidityQ = humidityQuality(hour.humidity_pct);
  const pressureQ = pressureTrendQuality(pressureTrend);
  const thermalQ  = thermalQuality(hour.temp_c, hour.dewpoint_c);

  const weightedSum =
    cloudQ    * weights.clouds +
    seeingQ   * weights.seeing +
    transQ    * weights.transparency +
    windQ     * weights.wind +
    humidityQ * weights.humidity +
    pressureQ * weights.pressure_trend +
    thermalQ  * weights.thermal;

  const penalty = highCloudPenalty(hour.cloud_high);
  const rawScore = weightedSum - penalty;

  const gate = computeGate(hour);

  let cappedScore = rawScore;
  if (gate === "CLOSED") {
    cappedScore = Math.min(cappedScore, 20);
  } else if (gate === "MARGINAL") {
    cappedScore = Math.min(cappedScore, 69);
  }

  const finalScore = clamp(Math.round(cappedScore), 0, 100);

  const components = [
    { key: "clouds",         label: "Clouds",          value: cloudQ,    points: cloudQ    * weights.clouds },
    { key: "seeing",         label: "Seeing",           value: seeingQ,   points: seeingQ   * weights.seeing },
    { key: "transparency",   label: "Transparency",     value: transQ,    points: transQ    * weights.transparency },
    { key: "wind",           label: "Wind",             value: windQ,     points: windQ     * weights.wind },
    { key: "humidity",       label: "Humidity",         value: humidityQ, points: humidityQ * weights.humidity },
    { key: "pressure_trend", label: "Pressure trend",   value: pressureQ, points: pressureQ * weights.pressure_trend },
    { key: "thermal",        label: "Thermal stability", value: thermalQ, points: thermalQ  * weights.thermal },
  ];

  return {
    score: finalScore,
    breakdown: {
      components,
      total: Math.round(weightedSum * 10) / 10,
      clamped_total: finalScore,
    },
    gate,
  };
}
