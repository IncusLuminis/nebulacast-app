import { getLunarState } from "./lunar.mjs";

/**
 * Return the shared moon display state for map consumers.
 * SunCalc is used only for the observer's topocentric position; phase and
 * illumination always come from the versioned lunar source.
 */
export function getMoonDisplay(date, lat, lon, sunCalc) {
  if (!sunCalc || !(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const moonPos = sunCalc.getMoonPosition(date, lat, lon);
  if (!moonPos || !Number.isFinite(moonPos.altitude) || !Number.isFinite(moonPos.azimuth)) return null;
  const lunar = getLunarState(date);
  return {
    phaseName: lunar.name,
    phaseEmoji: lunar.emoji,
    illumPct: lunar.pct,
    altDeg: moonPos.altitude * 180 / Math.PI,
    azDeg: (moonPos.azimuth * 180 / Math.PI + 180) % 360,
  };
}
