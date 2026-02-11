const TAU = Math.PI * 2;

function deg2rad(deg) { return (deg * Math.PI) / 180; }
function rad2deg(rad) { return (rad * 180) / Math.PI; }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

function normRad2Pi(rad) {
  let r = rad % TAU;
  if (r < 0) r += TAU;
  return r;
}

function normRadPi(rad) {
  let r = normRad2Pi(rad);
  if (r > Math.PI) r -= TAU;
  return r;
}

// Julian Date (UTC)
function toJulianDate(date) {
  const ms = date.getTime();
  return ms / 86400000 + 2440587.5;
}

// GMST (approx)
function gmstRad(jd) {
  const d = jd - 2451545.0;
  const gmstHours = 18.697374558 + 24.06570982441908 * d;
  const gmst = (gmstHours % 24) * (Math.PI / 12);
  return normRad2Pi(gmst);
}

function lstRad(jd, lonRad) {
  return normRad2Pi(gmstRad(jd) + lonRad);
}

// RA/Dec -> Alt/Az (robust standard)
// az: 0..2π, 0=N, π/2=E
function raDecToAltAz(raRad, decRad, latRad, lstRadVal) {
  const H = normRadPi(lstRadVal - raRad);

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinDec = Math.sin(decRad);
  const cosDec = Math.cos(decRad);

  const sinAlt = sinLat * sinDec + cosLat * cosDec * Math.cos(H);
  const alt = Math.asin(clamp(sinAlt, -1, 1));

  const cosAlt = Math.cos(alt);
  let sinAz, cosAz;

  if (cosAlt < 1e-12) {
    sinAz = 0;
    cosAz = 1;
  } else {
    sinAz = (-Math.sin(H) * cosDec) / cosAlt;
    cosAz = (sinDec - sinAlt * sinLat) / (cosAlt * cosLat);
  }

  let az = Math.atan2(sinAz, cosAz);
  az = normRad2Pi(az);

  return { altRad: alt, azRad: az };
}

// Stereographic projection from zenith
// Stereographic projection from zenith
function altAzToXY(altRad, azRad, cx, cy, R) {
  const z = (Math.PI / 2) - altRad; // zenith distance
  const rr = R * Math.tan(z / 2);   // horizon -> R

  // ✅ Mirror horizontally to match Stellarium/SkySafari orientation:
  // az: 0=N, π/2=E, π=W? (convention stays the same),
  // but on screen: E must be LEFT, W must be RIGHT.
  const x = cx - rr * Math.sin(azRad);
  const y = cy - rr * Math.cos(azRad);
  return { x, y, rr };
}

// Ecliptic -> Equatorial (J2000 mean obliquity used upstream)
function eclToRaDec(lambdaRad, betaRad, epsRad) {
  const sinLam = Math.sin(lambdaRad);
  const cosLam = Math.cos(lambdaRad);
  const sinBet = Math.sin(betaRad);
  const cosBet = Math.cos(betaRad);
  const sinE = Math.sin(epsRad);
  const cosE = Math.cos(epsRad);

  const x_e = cosBet * cosLam;
  const y_e = cosBet * sinLam;
  const z_e = sinBet;

  const x = x_e;
  const y = y_e * cosE - z_e * sinE;
  const z = y_e * sinE + z_e * cosE;

  const ra = normRad2Pi(Math.atan2(y, x));
  const dec = Math.asin(clamp(z, -1, 1));
  return { raRad: ra, decRad: dec };
}

// Galactic (l,b) -> Equatorial (RA,Dec), J2000 constants
function galToRaDec(lRad, bRad) {
  const raNgp = deg2rad(192.85948);
  const decNgp = deg2rad(27.12825);
  const lOmega = deg2rad(32.93192);

  const sinB = Math.sin(bRad);
  const cosB = Math.cos(bRad);
  const sinD = Math.sin(decNgp);
  const cosD = Math.cos(decNgp);

  const lmo = lRad - lOmega;
  const sinL = Math.sin(lmo);
  const cosL = Math.cos(lmo);

  const sinDec = sinB * sinD + cosB * cosD * sinL;
  const dec = Math.asin(clamp(sinDec, -1, 1));

  const y = cosB * cosL;
  const x = sinB * cosD - cosB * sinD * sinL;
  let ra = raNgp + Math.atan2(y, x);
  ra = normRad2Pi(ra);

  return { raRad: ra, decRad: dec };
}

export const Astro = {
  deg2rad, rad2deg, clamp,
  normRad2Pi, normRadPi,
  toJulianDate, gmstRad, lstRad,
  raDecToAltAz, altAzToXY,
  eclToRaDec, galToRaDec
};