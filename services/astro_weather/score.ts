// Scoring v5 — Hierarchical Observing Quality Model
// Level 1: Observing Quality = Σ(category × profile_weight), gate-capped
// Level 2: Atmosphere / Sky Darkness / Dew Safety / Stability (each 0–100)
// Level 3: Parameter breakdown per category

import type {
  Profile,
  ProfileWeights,
  HourRecord,
  ScoreBreakdown,
  CategoryBreakdown,
  ScoreComponent,
  ObservabilityGate,
} from "./types";

// ─── Profile weights ───────────────────────────────────────────────────────────

const PROFILE_WEIGHTS: Record<Profile, ProfileWeights> = {
  balanced:  { atmosphere: 0.35, sky_darkness: 0.30, dew_safety: 0.20, stability: 0.15 },
  visual:    { atmosphere: 0.40, sky_darkness: 0.25, dew_safety: 0.20, stability: 0.15 },
  broadband: { atmosphere: 0.30, sky_darkness: 0.45, dew_safety: 0.15, stability: 0.10 },
  planetary: { atmosphere: 0.55, sky_darkness: 0.10, dew_safety: 0.20, stability: 0.15 },
};

// ─── Bortle base scores ────────────────────────────────────────────────────────

const BORTLE_BASE: Record<number, number> = {
  1: 100, 2: 95, 3: 90, 4: 80,
  5: 70,  6: 55, 7: 40, 8: 25, 9: 10,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Piecewise linear interpolation through sorted breakpoint table [[x, y], ...].
 * Clamps below the first and above the last anchor.
 */
function interpolate(x: number, table: [number, number][]): number {
  if (x <= table[0][0]) return table[0][1];
  if (x >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (x >= x0 && x <= x1) {
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return table[table.length - 1][1];
}

// ─── Category 1 — Atmosphere ──────────────────────────────────────────────────

function cloudsScore(
  cloud_low: number | null,
  cloud_mid: number | null,
  cloud_high: number | null,
  cloud_total: number | null,
): number {
  if (cloud_low !== null && cloud_mid !== null && cloud_high !== null) {
    return clamp(100 - 0.6 * cloud_low - 0.3 * cloud_mid - 0.1 * cloud_high, 0, 100);
  }
  if (cloud_total !== null) {
    return clamp(100 - cloud_total, 0, 100);
  }
  return 50;
}

// v5: 7Timer seeing index → FWHM arcseconds
const SEEING_TO_FWHM: [number, number][] = [
  [1, 0.7], [2, 0.9], [3, 1.1], [4, 1.4], [5, 1.8], [6, 2.5], [7, 3.5],
];

// v5: FWHM arcseconds → quality score
const FWHM_QUALITY: [number, number][] = [
  [0.7, 100], [1.0, 90], [1.3, 80], [1.6, 70],
  [2.0, 60],  [2.5, 45], [3.0, 30], [3.5, 15],
];

function seeingScore(seeing_1_7: number | null): number {
  if (seeing_1_7 === null) return 50;
  const fwhm = clamp(interpolate(clamp(seeing_1_7, 1, 7), SEEING_TO_FWHM), 0.7, 3.5);
  return interpolate(fwhm, FWHM_QUALITY);
}

function transparencyScore(visibility_m: number | null, humidity_pct: number | null): number {
  let score = 100;
  if (humidity_pct !== null) {
    if (humidity_pct > 90) score -= 25;
    else if (humidity_pct > 80) score -= 15;
    else if (humidity_pct > 70) score -= 5;
  }
  if (visibility_m !== null) {
    const vis_km = visibility_m / 1000;
    if (vis_km < 5) score -= 30;
    else if (vis_km < 10) score -= 15;
    else if (vis_km < 20) score -= 5;
  }
  return clamp(score, 0, 100);
}

function computeAtmosphere(hour: HourRecord): { score: number; parameters: ScoreComponent[] } {
  const cq = cloudsScore(hour.cloud_low, hour.cloud_mid, hour.cloud_high, hour.cloud_total);
  const sq = seeingScore(hour.seeing);
  const tq = transparencyScore(hour.visibility_m, hour.humidity_pct);
  const score = clamp(Math.round(0.40 * cq + 0.35 * sq + 0.25 * tq), 0, 100);

  return {
    score,
    parameters: [
      { key: "clouds",       label: "Clouds",      value: Math.round(cq), points: Math.round(0.40 * cq) },
      { key: "seeing",       label: "Seeing",       value: Math.round(sq), points: Math.round(0.35 * sq) },
      { key: "transparency", label: "Transparency", value: Math.round(tq), points: Math.round(0.25 * tq) },
    ],
  };
}

// ─── Category 2 — Sky Darkness ────────────────────────────────────────────────

function computeSkyDarkness(
  hour: HourRecord,
  bortle: number,
): { score: number; parameters: ScoreComponent[] } {
  const bortleClamped = clamp(Math.round(bortle), 1, 9);
  const base = BORTLE_BASE[bortleClamped] ?? 70;

  const sunAlt = hour.sun_alt_deg;

  // Daylight → immediate zero
  if (sunAlt !== null && sunAlt > 0) {
    return {
      score: 0,
      parameters: [
        { key: "bortle",  label: `Bortle ${bortleClamped}`, value: bortleClamped, points: 0 },
        { key: "sun",     label: "Daylight",                 value: Math.round(sunAlt), points: -base },
        { key: "moon",    label: "Moon",                     value: 0,            points: 0 },
      ],
    };
  }

  // Twilight penalty
  let twilightPenalty = 0;
  if (sunAlt !== null) {
    if (sunAlt > -6)       twilightPenalty = 70; // civil
    else if (sunAlt > -12) twilightPenalty = 40; // nautical
    else if (sunAlt > -18) twilightPenalty = 20; // astronomical
  }

  // Moon brightness penalty
  let moonPenalty = 0;
  const moonAlt   = hour.moon_alt_deg;
  const moonIllum = hour.moon_illum_pct;
  if (moonAlt !== null && moonAlt > 0 && moonIllum !== null) {
    if      (moonAlt > 60 && moonIllum > 75) moonPenalty = 45;
    else if (moonAlt > 40 && moonIllum > 50) moonPenalty = 30;
    else if (moonAlt > 20 && moonIllum > 25) moonPenalty = 15;
    else if (moonAlt <= 10)                  moonPenalty = 5;
  }

  const score = clamp(base - twilightPenalty - moonPenalty, 0, 100);

  return {
    score,
    parameters: [
      {
        key: "bortle",
        label: `Bortle ${bortleClamped}`,
        value: bortleClamped,
        points: base,
      },
      {
        key: "twilight",
        label: sunAlt !== null ? `Sun ${sunAlt.toFixed(1)}°` : "Sun unknown",
        value: Math.round(sunAlt ?? -90),
        points: -twilightPenalty,
      },
      {
        key: "moon",
        label: (moonAlt !== null && moonAlt > 0)
          ? `Moon ${moonAlt.toFixed(0)}° / ${(moonIllum ?? 0).toFixed(0)}%`
          : "Moon below horizon",
        value: Math.round(moonIllum ?? 0),
        points: -moonPenalty,
      },
    ],
  };
}

// ─── Category 3 — Dew Safety ─────────────────────────────────────────────────

const DEW_SPREAD_TABLE: [number, number][] = [
  [0, 5], [1, 20], [2, 40], [3, 60], [4, 80], [6, 100],
];

function computeDewSafety(hour: HourRecord): { score: number; parameters: ScoreComponent[] } {
  let spreadScore = 60;
  let spread: number | null = null;

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
        label: spread !== null ? `Spread ${spread.toFixed(1)}°C` : "Dew spread unknown",
        value: spread !== null ? Math.round(spread * 10) / 10 : 0,
        points: spreadScore,
      },
      {
        key: "wind_modifier",
        label: `Wind (${windKmh.toFixed(0)} km/h)`,
        value: Math.round(windKmh),
        points: windMod,
      },
    ],
  };
}

// ─── Category 4 — Stability ───────────────────────────────────────────────────

const WIND_KMH_TABLE: [number, number][] = [
  [0, 100], [5, 100], [10, 85], [15, 70], [20, 50], [30, 30], [50, 10],
];

const HUMIDITY_STAB_TABLE: [number, number][] = [
  [0, 100], [50, 100], [60, 90], [70, 80], [80, 60], [90, 40], [100, 20],
];

function pressureTrendScore(trend: number | null): number {
  if (trend === null) return 70;
  if (trend >= -1 && trend <= 1)  return 100; // stable
  if (trend > 1   && trend <= 3)  return 80;  // slow rise
  if (trend < -1  && trend >= -3) return 80;  // slow fall
  if (trend > 3   && trend <= 6)  return 60;  // rapid rise
  if (trend < -3  && trend >= -6) return 50;  // rapid drop
  return 30; // extreme
}

function computeStability(
  hour: HourRecord,
  pressureTrend: number | null,
): { score: number; parameters: ScoreComponent[] } {
  const windKmh = hour.wind_m_s !== null ? hour.wind_m_s * 3.6 : null;
  const wq  = windKmh !== null ? interpolate(windKmh, WIND_KMH_TABLE) : 70;
  const hq  = interpolate(hour.humidity_pct ?? 65, HUMIDITY_STAB_TABLE);
  const pq  = pressureTrendScore(pressureTrend);

  const score = clamp(Math.round(0.45 * wq + 0.35 * hq + 0.20 * pq), 0, 100);

  return {
    score,
    parameters: [
      {
        key: "wind",
        label: windKmh !== null ? `Wind ${windKmh.toFixed(0)} km/h` : "Wind unknown",
        value: Math.round(wq),
        points: Math.round(0.45 * wq),
      },
      {
        key: "humidity",
        label: `Humidity ${hour.humidity_pct ?? "?"}%`,
        value: Math.round(hq),
        points: Math.round(0.35 * hq),
      },
      {
        key: "pressure_trend",
        label: pressureTrend !== null
          ? `Pressure ${pressureTrend > 0 ? "+" : ""}${pressureTrend.toFixed(1)} hPa/6h`
          : "Pressure unknown",
        value: Math.round(pq),
        points: Math.round(0.20 * pq),
      },
    ],
  };
}

// ─── Observability Gate ────────────────────────────────────────────────────────

export function computeGate(hour: HourRecord): ObservabilityGate {
  const vis_km = (hour.visibility_m ?? 10000) / 1000;

  if (
    (hour.rain_mm     ?? 0) > 0 ||
    (hour.snowfall_mm ?? 0) > 0 ||
    (hour.cloud_low   ?? 0) >= 95 ||
    (hour.cloud_mid   ?? 0) >= 95 ||
    vis_km <= 1.0
  ) {
    return "CLOSED";
  }

  if (
    (hour.cloud_low  ?? 0) >= 70 ||
    (hour.cloud_mid  ?? 0) >= 70 ||
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
  profile: Profile = "balanced",
  bortle = 5,
): {
  score: number;
  breakdown: ScoreBreakdown;
  gate: ObservabilityGate;
  atmosphere_score: number;
  sky_darkness_score: number;
  dew_safety_score: number;
  stability_score: number;
} {
  const weights = PROFILE_WEIGHTS[profile] ?? PROFILE_WEIGHTS.balanced;

  const atm  = computeAtmosphere(hour);
  const sky  = computeSkyDarkness(hour, bortle);
  const dew  = computeDewSafety(hour);
  const stab = computeStability(hour, pressureTrend);

  const weightedSum =
    atm.score  * weights.atmosphere   +
    sky.score  * weights.sky_darkness +
    dew.score  * weights.dew_safety   +
    stab.score * weights.stability;

  const gate = computeGate(hour);

  let cappedScore = weightedSum;
  if      (gate === "CLOSED")   cappedScore = Math.min(cappedScore, 20);
  else if (gate === "MARGINAL") cappedScore = Math.min(cappedScore, 69);

  const finalScore = clamp(Math.round(cappedScore), 0, 100);

  const categories: CategoryBreakdown[] = [
    {
      key: "atmosphere",
      label: "Atmosphere",
      score: atm.score,
      weight: weights.atmosphere,
      points: Math.round(atm.score * weights.atmosphere * 10) / 10,
      parameters: atm.parameters,
    },
    {
      key: "sky_darkness",
      label: "Sky Darkness",
      score: sky.score,
      weight: weights.sky_darkness,
      points: Math.round(sky.score * weights.sky_darkness * 10) / 10,
      parameters: sky.parameters,
    },
    {
      key: "dew_safety",
      label: "Dew Safety",
      score: dew.score,
      weight: weights.dew_safety,
      points: Math.round(dew.score * weights.dew_safety * 10) / 10,
      parameters: dew.parameters,
    },
    {
      key: "stability",
      label: "Stability",
      score: stab.score,
      weight: weights.stability,
      points: Math.round(stab.score * weights.stability * 10) / 10,
      parameters: stab.parameters,
    },
  ];

  return {
    score: finalScore,
    breakdown: {
      categories,
      total: Math.round(weightedSum * 10) / 10,
      clamped_total: finalScore,
    },
    gate,
    atmosphere_score:   atm.score,
    sky_darkness_score: sky.score,
    dew_safety_score:   dew.score,
    stability_score:    stab.score,
  };
}
