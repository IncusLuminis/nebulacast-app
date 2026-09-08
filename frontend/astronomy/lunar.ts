import { Body, Illumination, MoonPhase } from 'astronomy-engine';

/** One geocentric lunar contract for UI, APIs and generated JSON.
 * phase: cycle 0=new, .25=first quarter, .5=full, .75=last quarter.
 * fraction: illuminated disc area, NOT the cycle phase.
 * Resolution: UTC minute. A bounded cache shares work across renders.
 */
const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
const emojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
export const LUNAR_SOURCE = 'astronomy-engine@2.1.19';
export interface LunarState {
  timestamp_utc: string;
  source: string;
  phase: number;
  fraction: number;
  illum_pct: number;
  waxing: boolean;
  name: string;
  emoji: string;
  pct: number;
}
export interface LunarLocation { lat: number; lon: number; timezone: string; location_key?: string; }
export interface LunarSnapshot {
  schema_version: 'lunar-snapshot.v1';
  computed_at_utc: string;
  location_key: string;
  location: { lat: number; lon: number; timezone: string };
  source: string;
  freshness: 'live' | 'generated' | 'stale';
  status: 'available' | 'stale' | 'unavailable';
  lunar: { cycle_phase: number; illuminated_fraction: number; illuminated_percent: number; waxing: boolean; phase_name: string; emoji: string; alt_deg: number | null; az_deg: number | null };
}
const cache = new Map<number, Readonly<LunarState>>();
const snapshotCache = new Map<string, Readonly<LunarSnapshot>>();

function normalizeLocation(location: LunarLocation): Required<LunarLocation> {
  if (!location || !Number.isFinite(location.lat) || location.lat < -90 || location.lat > 90 || !Number.isFinite(location.lon) || location.lon < -180 || location.lon > 180 || !location.timezone) {
    throw new RangeError('Invalid lunar location');
  }
  const lat = Number(location.lat.toFixed(6));
  const lon = Number(location.lon.toFixed(6));
  return { lat, lon, timezone: location.timezone, location_key: location.location_key || `${lat}|${lon}|${location.timezone}` };
}

/** Canonical, presentation-neutral lunar snapshot for all consumers. */
export function createLunarSnapshot(input: { instant?: Date; location: LunarLocation }): Readonly<LunarSnapshot> {
  const location = normalizeLocation(input.location);
  const state = getLunarState(input.instant || new Date());
  const key = `${state.timestamp_utc}|${location.location_key}`;
  const cached = snapshotCache.get(key);
  if (cached) return cached;
  const snapshot = Object.freeze({
    schema_version: 'lunar-snapshot.v1' as const,
    computed_at_utc: state.timestamp_utc,
    location_key: location.location_key,
    location: { lat: location.lat, lon: location.lon, timezone: location.timezone },
    source: state.source,
    freshness: 'live' as const,
    status: 'available' as const,
    lunar: { cycle_phase: state.phase, illuminated_fraction: state.fraction, illuminated_percent: state.illum_pct, waxing: state.waxing, phase_name: state.name, emoji: state.emoji, alt_deg: null, az_deg: null },
  });
  if (snapshotCache.size >= 2048) snapshotCache.delete(snapshotCache.keys().next().value!);
  snapshotCache.set(key, snapshot);
  return snapshot;
}

export function getLunarState(date: Date = new Date()): Readonly<LunarState> {
  const ms = date.getTime();
  if (!Number.isFinite(ms)) throw new RangeError('Invalid lunar timestamp');
  const minute = Math.floor(ms / 60000);
  const cached = cache.get(minute);
  if (cached) return cached;
  const instant = new Date(minute * 60000);
  const phase = MoonPhase(instant) / 360;
  const fraction = Illumination(Body.Moon, instant).phase_fraction;
  const index = Math.floor(phase * 8 + 0.5) % 8;
  const result = Object.freeze({
    timestamp_utc: instant.toISOString(), source: LUNAR_SOURCE,
    phase, fraction, illum_pct: fraction * 100, waxing: phase < 0.5,
    name: names[index], emoji: emojis[index], pct: Math.round(fraction * 100),
  });
  if (cache.size >= 2048) cache.delete(cache.keys().next().value!);
  cache.set(minute, result);
  return result;
}

/** Read the wire-contract illumination value, expressed only as 0..100 percent. */
export function readIlluminationPct(value: unknown): number | null {
  return typeof value == 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}
