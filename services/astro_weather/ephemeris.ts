// Ephemeris — simplified sun & moon position
// Accuracy ≈ ±0.5° (sufficient for twilight classification and sky-darkness scoring)
// Algorithms: Astronomical Almanac simplified / Meeus Ch.47 low-accuracy

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function julianDay(dt: Date): number {
  return dt.getTime() / 86400000 + 2440587.5;
}

/** Reduce angle to [0, 360) */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Compute Greenwich Mean Sidereal Time in hours for a given JD */
function gmst(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  // GMST at 0h UT (hours)
  const gmst0 =
    6.697374558 +
    2400.0513369 * T +
    0.0000258622 * T * T -
    0.0000000017222 * T * T * T;
  // Add UT fraction
  const utFraction = (JD % 1 + 0.5) % 1; // UT as fraction of day (0–1)
  return ((gmst0 + utFraction * 24.06570982441908) % 24 + 24) % 24;
}

/** Altitude of an object at given RA (rad), Dec (rad), from lat (deg), lon (deg), at JD */
function altitude(RA: number, Dec: number, lat: number, lon: number, JD: number): number {
  const GMST = gmst(JD); // hours
  const LST = (GMST + lon / 15 + 24) % 24; // Local Sidereal Time, hours
  const HA = (LST * 15 * DEG) - RA; // Hour Angle, rad
  const latR = lat * DEG;
  const sinAlt =
    Math.sin(latR) * Math.sin(Dec) +
    Math.cos(latR) * Math.cos(Dec) * Math.cos(HA);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD;
}

// ─── Sun ───────────────────────────────────────────────────────────────────────

/**
 * Compute sun altitude in degrees at given location and time.
 * Accuracy ≈ ±0.5° (Astronomical Almanac simplified).
 */
export function sunAltitudeDeg(dt: Date, lat: number, lon: number): number {
  const JD = julianDay(dt);
  const n = JD - 2451545.0; // days from J2000

  // Mean longitude and anomaly (degrees)
  const L = norm360(280.460 + 0.9856474 * n);
  const g = norm360(357.528 + 0.9856003 * n) * DEG; // rad

  // Ecliptic longitude (degrees → rad)
  const lambda = norm360(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG;

  // Obliquity of ecliptic
  const eps = 23.439 * DEG;

  // RA and Dec
  const sinDec = Math.sin(eps) * Math.sin(lambda);
  const Dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  const RA = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));

  return altitude(RA, Dec, lat, lon, JD);
}

// ─── Moon ──────────────────────────────────────────────────────────────────────

/**
 * Compute moon altitude and illumination at given location and time.
 * Accuracy: altitude ≈ ±2°, illumination ≈ ±5% (Meeus Ch.47 low-accuracy).
 */
export function moonPositionDeg(
  dt: Date,
  lat: number,
  lon: number,
): { altDeg: number; illumPct: number } {
  const JD = julianDay(dt);
  const d = JD - 2451545.0; // days from J2000

  // Moon's orbital elements (degrees)
  const L0 = norm360(218.316 + 13.176396 * d); // mean longitude
  const M  = norm360(134.963 + 13.064993 * d) * DEG; // mean anomaly (rad)
  const F  = norm360(93.272  + 13.229350 * d) * DEG; // argument of latitude (rad)

  // Ecliptic coordinates (degrees)
  const lambdaMoon = norm360(
    L0 +
    6.289 * Math.sin(M) -
    1.274 * Math.sin(2 * F - M) +
    0.658 * Math.sin(2 * F) -
    0.186 * Math.sin((357.528 + 0.985600 * d) * DEG) - // Sun's mean anomaly
    0.114 * Math.sin(2 * F)
  ) * DEG;
  const betaMoon = (5.128 * Math.sin(F) + 0.280 * Math.sin(M + F) - 0.277 * Math.sin(M - F)) * DEG;

  // Convert ecliptic → equatorial
  const eps = 23.439 * DEG;
  const sinDec =
    Math.sin(betaMoon) * Math.cos(eps) +
    Math.cos(betaMoon) * Math.sin(eps) * Math.sin(lambdaMoon);
  const Dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  const RA = Math.atan2(
    Math.cos(betaMoon) * Math.cos(eps) * Math.sin(lambdaMoon) -
      Math.sin(betaMoon) * Math.sin(eps),
    Math.cos(betaMoon) * Math.cos(lambdaMoon),
  );

  const altDeg = altitude(RA, Dec, lat, lon, JD);

  // Illumination: elongation between sun and moon
  // Sun's ecliptic longitude (simplified)
  const n = d;
  const gSun = norm360(357.528 + 0.9856003 * n) * DEG;
  const LSun = norm360(280.460 + 0.9856474 * n);
  const lambdaSun = norm360(LSun + 1.915 * Math.sin(gSun) + 0.020 * Math.sin(2 * gSun)) * DEG;

  // Geocentric elongation (simplified: use ecliptic longitude difference, beta≈0 for sun)
  const elong = Math.acos(
    Math.max(-1, Math.min(1,
      Math.sin(betaMoon) * Math.sin(0) +
      Math.cos(betaMoon) * Math.cos(0) * Math.cos(lambdaMoon - lambdaSun)
    ))
  );
  const illumPct = ((1 - Math.cos(elong)) / 2) * 100;

  return { altDeg, illumPct: Math.max(0, Math.min(100, illumPct)) };
}
