export const DEFAULTS = {
  baseUrl: "/sky",
  mountId: null,
  lat: 52.2297,
  lon: 21.0122,
  datetimeISO: null,
  options: {
    minStarMag: 3.5,

    showGridAz: true,
    showGridEq: true,

    showConstellations: true,
    showConstellationLabels: true,

    showMeridian: true,
    showEquator: true,
    showEcliptic: true,

    showMilkyWay: true,
    showObjects: true,
    showAlerts: true,

    // limits (iteration-1)
    maxObjects: 8,
    maxAlerts: 8,
    minAltObjectsDeg: 10,
    minAltAlertsDeg: 5,

    // grid density
    eqGrid: {
      raStepHours: 2,     // RA lines every 2h
      decStepDeg: 15,     // Dec circles every 15°
      sampleStepDeg: 1.0  // polyline sampling step
    }
  }
};

export const UI = {
  LABEL_ALT_MIN_DEG: 15
};

export const LAYOUT = {
  // Reserve space for N/E/S/W labels outside horizon circle
  PADDING: 34
};