// TypeScript interfaces for astro-weather API contract

export interface Location {
  name?: string;
  lat: number;
  lon: number;
  tz: string;
}

export type ObservabilityGate = "OPEN" | "MARGINAL" | "CLOSED";

export interface HourRecord {
  time: string; // ISO string in location tz
  cloud_total: number | null;
  cloud_low: number | null;
  cloud_mid: number | null;
  cloud_high: number | null;
  precip_mm: number | null;
  precip_prob: number | null;
  pressure_hpa: number | null;
  wind_m_s: number | null;
  wind_dir_deg: number | null;
  temp_c: number | null;
  visibility_m: number | null;
  humidity_pct: number | null;
  dewpoint_c: number | null;
  rain_mm: number | null;
  snowfall_mm: number | null;
  seeing: number | null;
  transparency: number | null;
  gate: ObservabilityGate;
  score: number;
  score_breakdown: ScoreBreakdown;
}

export interface ScoreComponent {
  key: string;
  label: string;
  value: number;
  points: number;
}

export interface ScoreBreakdown {
  components: ScoreComponent[];
  total: number;
  clamped_total: number;
}

export interface DerivedMetrics {
  pressure_trend_6h: number | null;
  wind_peak_next_24h: number | null;
  cloud_peak_next_24h: number | null;
  fog_risk: "low" | "medium" | "high";
  heads_up: string[];
}

export interface AstroWeatherResponse {
  generated_at: string;
  location: Location;
  horizon_hours: number;
  profile: string;
  hours: HourRecord[];
  derived: DerivedMetrics;
}

export type Profile = "balanced" | "visual" | "broadband" | "planetary";

export interface ProfileWeights {
  clouds: number;
  seeing: number;
  transparency: number;
  wind: number;
  humidity: number;
  pressure_trend: number;
  thermal: number;
}
