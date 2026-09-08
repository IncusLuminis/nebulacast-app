/** Tangent toward the actual Sun in the sky's mirrored stereographic projection.
 * Works below the horizon too; orientation must not depend on playback history.
 */
export function moonLimbRotation(moon, sun) {
  const vector = body => {
    const alt = body.altDeg * Math.PI / 180;
    const az = body.azDeg * Math.PI / 180;
    return [Math.cos(alt) * Math.sin(az), Math.cos(alt) * Math.cos(az), Math.sin(alt)];
  };
  const m = vector(moon), s = vector(sun);
  const dot = m.reduce((sum, value, i) => sum + value * s[i], 0);
  const tangent = s.map((value, i) => value - dot * m[i]);
  const dx = -(tangent[0] * (1 + m[2]) - m[0] * tangent[2]);
  const dy = -(tangent[1] * (1 + m[2]) - m[1] * tangent[2]);
  return Number.isFinite(dx + dy) && Math.hypot(dx, dy) > 1e-12 ? Math.atan2(dy, dx) : 0;
}
