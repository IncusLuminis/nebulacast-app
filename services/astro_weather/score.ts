// Scoring engine with profile weights

import type { Profile, ProfileWeights, HourRecord, ScoreBreakdown } from "./types";

const PROFILE_WEIGHTS: Record<Profile, ProfileWeights> = {
  default: {
    clouds: 30,
    wind: 15,
    seeing: 20,
    transparency: 15,
    visibility: 10,
    pressure_trend: 5,
    precip_risk: 10,
    temp: 5,
  },
  visual: {
    clouds: 35,
    wind: 12,
    seeing: 18,
    transparency: 18,
    visibility: 10,
    pressure_trend: 3,
    precip_risk: 8,
    temp: 6,
  },
  broadband: {
    clouds: 25,
    wind: 10,
    seeing: 15,
    transparency: 30,
    visibility: 8,
    pressure_trend: 5,
    precip_risk: 10,
    temp: 7,
  },
  planetary: {
    clouds: 25,
    wind: 20,
    seeing: 30,
    transparency: 10,
    visibility: 8,
    pressure_trend: 3,
    precip_risk: 7,
    temp: 7,
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeCloudPoints(cloudTotal: number | null, weight: number): number {
  if (cloudTotal === null) return weight * 0.5; // Unknown = mid penalty
  const pct = cloudTotal > 1 ? cloudTotal : cloudTotal * 100;
  return weight * (1 - clamp(pct / 100, 0, 1));
}

function computeWindPoints(windMs: number | null, weight: number): number {
  if (windMs === null) return weight * 0.5;
  const thresh = 4.0; // m/s threshold
  if (windMs <= thresh) return weight;
  const excess = windMs - thresh;
  return weight * Math.max(0, 1 - excess / 8); // Linear decay after threshold
}

function computeSeeingPoints(seeing: number | null, weight: number): number {
  if (seeing === null) return weight * 0.5;
  // 1 = best, 7 = worst
  if (seeing < 1) return weight;
  if (seeing > 7) return 0;
  return weight * (1 - (seeing - 1) / 6);
}

function computeTransparencyPoints(transparency: number | null, weight: number): number {
  if (transparency === null) return weight * 0.5;
  // 1 = best, 4 = worst
  if (transparency < 1) return weight;
  if (transparency > 4) return 0;
  return weight * (1 - (transparency - 1) / 3);
}

function computeVisibilityPoints(visibilityM: number | null, weight: number): number {
  if (visibilityM === null) return weight * 0.5;
  const km = visibilityM / 1000;
  if (km >= 20) return weight;
  if (km < 2) return 0;
  return weight * clamp((km - 2) / 18, 0, 1);
}

function computePressureTrendPoints(
  pressureTrend: number | null,
  weight: number
): number {
  if (pressureTrend === null) return weight * 0.5;
  // Rising pressure = good (positive trend)
  // Falling pressure = bad (negative trend)
  const normalized = clamp((pressureTrend + 5) / 10, 0, 1);
  return weight * normalized;
}

function computePrecipRiskPoints(
  precipProb: number | null,
  precipMm: number | null,
  weight: number
): number {
  if (precipProb === null && precipMm === null) return weight * 0.5;
  const prob = precipProb !== null ? (precipProb > 1 ? precipProb : precipProb * 100) : 0;
  const mm = precipMm !== null ? precipMm : 0;
  
  if (prob === 0 && mm === 0) return weight;
  if (prob > 50 || mm > 0.5) return 0;
  return weight * (1 - clamp(prob / 50, 0, 1));
}

function computeTempPoints(tempC: number | null, weight: number): number {
  if (tempC === null) return weight * 0.5;
  // Penalize extreme cold (< -10°C) and extreme heat (> 30°C)
  if (tempC < -10) return weight * 0.3;
  if (tempC > 30) return weight * 0.5;
  if (tempC >= -5 && tempC <= 25) return weight;
  // Gradual penalty outside comfort zone
  if (tempC < -5) {
    return weight * clamp(0.3 + (tempC + 10) / 5 * 0.7, 0.3, 1);
  }
  return weight * clamp(1 - (tempC - 25) / 5 * 0.5, 0.5, 1);
}

export function computeScore(
  hour: HourRecord,
  pressureTrend: number | null,
  profile: Profile = "default"
): { score: number; breakdown: ScoreBreakdown } {
  const weights = PROFILE_WEIGHTS[profile] || PROFILE_WEIGHTS.default;

  const components = [
    {
      key: "clouds",
      label: "Clouds",
      value: hour.cloud_total ?? 0,
      points: computeCloudPoints(hour.cloud_total, weights.clouds),
    },
    {
      key: "wind",
      label: "Wind",
      value: hour.wind_m_s ?? 0,
      points: computeWindPoints(hour.wind_m_s, weights.wind),
    },
    {
      key: "seeing",
      label: "Seeing",
      value: hour.seeing ?? 0,
      points: computeSeeingPoints(hour.seeing, weights.seeing),
    },
    {
      key: "transparency",
      label: "Transparency",
      value: hour.transparency ?? 0,
      points: computeTransparencyPoints(hour.transparency, weights.transparency),
    },
    {
      key: "visibility",
      label: "Visibility",
      value: hour.visibility_m ?? 0,
      points: computeVisibilityPoints(hour.visibility_m, weights.visibility),
    },
    {
      key: "pressure_trend",
      label: "Pressure trend",
      value: pressureTrend ?? 0,
      points: computePressureTrendPoints(pressureTrend, weights.pressure_trend),
    },
    {
      key: "precip_risk",
      label: "Precip risk",
      value: hour.precip_prob ?? 0,
      points: computePrecipRiskPoints(hour.precip_prob, hour.precip_mm, weights.precip_risk),
    },
    {
      key: "temp",
      label: "Temperature",
      value: hour.temp_c ?? 0,
      points: computeTempPoints(hour.temp_c, weights.temp),
    },
  ];

  const total = components.reduce((sum, c) => sum + c.points, 0);
  const clampedTotal = clamp(Math.round(total), 0, 100);

  return {
    score: clampedTotal,
    breakdown: {
      components,
      total: Math.round(total * 10) / 10,
      clamped_total: clampedTotal,
    },
  };
}
