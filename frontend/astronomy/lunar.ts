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
const cache = new Map<number, Readonly<LunarState>>();

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
