// TypeScript interfaces for astro-weather API contract — Scoring v5

export interface Location {
  name?: string;
  lat: number;
  lon: number;
  tz: string;
}

export type ObservabilityGate = "OPEN" | "MARGINAL" | "CLOSED";

export interface HourRecord {
  time: string; // ISO string in location tz

  // Clouds
  cloud_total: number | null;
  cloud_low: number | null;
  cloud_mid: number | null;
  cloud_high: number | null;

  // Precipitation
  precip_mm: number | null;
  precip_prob: number | null;
  rain_mm: number | null;
  snowfall_mm: number | null;

  // Atmosphere
  pressure_hpa: number | null;
  wind_m_s: number | null;
  wind_dir_deg: number | null;
  temp_c: number | null;
  visibility_m: number | null;
  humidity_pct: number | null;
  dewpoint_c: number | null;

  // 7Timer
  seeing: number | null;       // 1–7 scale
  transparency: number | null; // 1–4 scale

  // Ephemeris — computed by merge.ts
  sun_alt_deg: number | null;
  moon_alt_deg: number | null;
  moon_illum_pct: number | null;

  // Scoring
  gate: ObservabilityGate;
  score: number;
  score_breakdown: ScoreBreakdown;

  // v5 category scores (Level 2)
  atmosphere_score: number;
  sky_darkness_score: number;
  dew_safety_score: number;
  stability_score: number;
}

// ─── Score breakdown (v5 hierarchical) ────────────────────────────────────────

export interface ScoreComponent {
  key: string;
  label: string;
  value: number;   // raw parameter value or quality 0–100
  points: number;  // contribution to category score
}

export interface CategoryBreakdown {
  key: "atmosphere" | "sky_darkness" | "dew_safety" | "stability";
  label: string;
  score: number;                // 0–100
  weight: number;               // profile-dependent weight
  points: number;               // score × weight (contribution to final score)
  parameters: ScoreComponent[]; // Level 3 parameter breakdown
}

export interface ScoreBreakdown {
  categories: CategoryBreakdown[];
  total: number;          // weighted sum before gate cap
  clamped_total: number;  // after gate cap = final score
}

// ─── Derived metrics ───────────────────────────────────────────────────────────

export interface DerivedMetrics {
  pressure_trend_6h: number | null;
  wind_peak_next_24h: number | null;
  cloud_peak_next_24h: number | null;
  fog_risk: "low" | "medium" | "high";
  heads_up: string[];
}

// ─── API response ──────────────────────────────────────────────────────────────

export interface AstroWeatherResponse {
  generated_at: string;
  location: Location;
  horizon_hours: number;
  profile: string;
  bortle: number;
  hours: HourRecord[];
  derived: DerivedMetrics;
}

// ─── Profile types ─────────────────────────────────────────────────────────────

export type Profile = "balanced" | "visual" | "broadband" | "planetary";

/** v5: weights apply to the 4 scoring categories */
export interface ProfileWeights {
  atmosphere: number;
  sky_darkness: number;
  dew_safety: number;
  stability: number;
}
