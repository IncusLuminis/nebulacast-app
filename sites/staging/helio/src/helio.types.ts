/**
 * TypeScript types for the helio_now.json data contract.
 * Baseline: docs/Helio/Helio Data Contract v1.md
 * Additive (hero, storm_risk, etc.): docs/Helio/Helio Data Contract v1.4.md
 */

export type HelioStatus = "quiet" | "active" | "elevated" | "storm";
export type AuroraLabel  = "none" | "possible" | "good";
export type ImpactLevel  = "none" | "low" | "moderate" | "high";
export type AlertLevel   = "info" | "watch" | "warning";
export type ScaleValue       = "G0"|"G1"|"G2"|"G3"|"G4"|"G5"|"R0"|"R1"|"R2"|"R3"|"R4"|"R5"|"S0"|"S1"|"S2"|"S3"|"S4"|"S5";
export type CmeTrackerStatus      = "detected" | "inbound" | "arrival_window" | "arrived";
export type CmeImpactLevel        = "low" | "moderate" | "high" | "unknown";
export type CoronalHoleStatus     = "quiet" | "watch" | "active" | "strong";
export type ChainSeverity         = "none" | "low" | "moderate" | "strong" | "severe";

export interface ChainPanelColumn {
  state:    string;
  severity: ChainSeverity;
  label:    string;
  messages: string[];
}

export interface ChainPanel {
  sun:   ChainPanelColumn;
  space: ChainPanelColumn;
  earth: ChainPanelColumn;
}

export interface KpForecastPoint {
  t_utc: string;
  kp:    number;
}

export interface KpHistoryPoint { t_utc: string; kp: number; }

export interface WindHistoryPoint {
  t_utc:        string;
  kms:          number | null;
  density:      number | null;  // cm⁻³
  temp_kk:      number | null;  // kilo-Kelvin
  pressure_npa: number | null;  // nPa
}

export interface XrayHistoryPoint { t_utc: string; flux: number; }  // W/m²
export interface BzHistoryPoint   { t_utc: string; bz:   number; }

export interface HelioMetrics {
  kp_latest:       number | null;
  kp_time_utc:     string | null;
  kp_forecast_3h:  KpForecastPoint[];
  kp_history_1h:   KpHistoryPoint[];
  xray_flux_wm2:   number | null;
  xray_class:      "A"|"B"|"C"|"M"|"X" | null;
  xray_history_1h: XrayHistoryPoint[];
  solar_wind_kms:  number | null;
  wind_history_1h: WindHistoryPoint[];
  imf_bz_nt:       number | null;
  imf_bt_nt:       number | null;
  bz_history_1h:   BzHistoryPoint[];
  bz_history_5m:   BzHistoryPoint[];
}

export interface HelioSummary {
  status: HelioStatus;
  label:  string;
  text:   string;
}

export interface HelioScales {
  g_scale: ScaleValue;
  r_scale: ScaleValue;
  s_scale: ScaleValue;
}

/** Optional UI mirror for the Space Weather hero (additive; never required). */
export interface HelioHeroScales {
  g?: string;
  r?: string;
  s?: string;
  x?: string;
}

export interface HelioHeroBlock {
  kp?:           number;
  status_label?: string;
  scales?:       HelioHeroScales;
}

export interface HelioForecast {
  kp_max_next_24h: number | null;
  kp_max_at_utc:   string | null;
  trend:           "falling" | "steady" | "rising" | "unknown";
}

/** Additive: derived geomagnetic storm risk for Storm Risk panel (optional on older JSON). */
export interface HelioStormRiskNow {
  g_level: number; // 0–5
  label:   string;
}

export interface HelioStormRiskForecast24h {
  G1:           number;
  G2:           number;
  G3:           number;
  G4:           number;
  G5:           number;
  max_expected: number; // 0–5, highest G implied by max Kp in window
}

export interface HelioStormRisk {
  now:          HelioStormRiskNow;
  forecast_24h: HelioStormRiskForecast24h;
}

export interface HelioAuroraHint {
  aurora_possible:    boolean;
  aurora_min_lat_est: number | null;
  aurora_label:       AuroraLabel;
  summary:            string;
}

export interface ObserverImpact {
  kind:    "aurora" | "radio" | "solar_activity";
  level:   ImpactLevel;
  label:   string;
  summary: string;
}

export interface HelioEvent {
  t_utc:          string;
  kind:           string;
  domain:         string;
  severity:       number | null;
  severity_label: string | null;
  level:          AlertLevel;
  title:          string;
  summary_short:  string;
  source_code:    string | null;
  raw_title:      string | null;
  raw_body:       string | null;
  relevance:      number;
  dedupe_key:     string;
}

export type TimelineEventType =
  | "solar_flare"
  | "cme_launch"
  | "cme_arrival"
  | "geomagnetic_storm"
  | "geomagnetic_watch"
  | "radio_blackout"
  | "radiation_storm"
  | "space_weather_info";

export interface TimelineEvent {
  event_time:     string;                       // UTC ISO-8601 with Z
  event_type:     TimelineEventType;
  event_title:    string;
  level:          AlertLevel;                   // "info" | "watch" | "warning"
  severity_label: string | null;                // e.g. "C2.3" | "minor" | "strong"
  description:    string;                       // expanded detail text
  source:         string;                       // "NOAA_SWPC" | "NASA_DONKI"
  is_active:      boolean;                      // currently in progress
  is_future:      boolean;                      // predicted future event
  metadata:       Record<string, unknown>;      // source-specific fields
}

export interface CoronalHoleState {
  status:              CoronalHoleStatus;
  estimated_speed_kms: number | null;
  note:                string;
}

export interface CmeTrackerEvent {
  status:           CmeTrackerStatus;
  impact_level:     CmeImpactLevel;
  speed_kms:        number | null;
  half_angle_deg:   number | null;
  launch_time_utc:  string | null;
  arrival_time_utc: string | null;
  progress:         number | null;   // 0.0–1.0; null when status is "detected"
  source_location:  string | null;   // e.g. "N12E30"
  is_earth_direct:  boolean;
  model:            string;          // "enlil"
}

export interface HelioNow {
  schema_version:   string;
  updated_utc:      string;
  hero?:            HelioHeroBlock;
  source: {
    domain:   string;
    provider: string;
    products: string[];
  };
  metrics:          HelioMetrics;
  summary:          HelioSummary;
  scales:           HelioScales;
  forecast:         HelioForecast;
  storm_risk?:      HelioStormRisk;
  aurora_hint:      HelioAuroraHint;
  observer_impacts: ObserverImpact[];
  coronal_hole:     CoronalHoleState | null;
  alerts_preview:   HelioEvent[];
  alerts_all:       HelioEvent[];
  timeline:         TimelineEvent[];
  cme_tracker:      CmeTrackerEvent | null;
  chain_panel?:     ChainPanel;
  raw: {
    alerts_count: number;
  };
}

export interface HelioWidgetOptions {
  dataUrl:       string;
  refreshMs?:    number;   // default 10 min
  lat?:          number;   // observer latitude °N
  lon?:          number;   // observer longitude °E
  locationName?: string;   // display name (e.g. "Moscow")
  baseUrl?:      string;   // optional override for /assets/* origin; if omitted and dataUrl is absolute (e.g. https://staging.nebulacast.app/...), that host is used; else https://staging.nebulacast.app
}
