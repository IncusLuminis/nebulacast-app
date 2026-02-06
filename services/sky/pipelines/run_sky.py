(function () {
  "use strict";

  // ============================================================
  // SKY widget v0.4 (monolith, but internally modular)
  // Layers:
  // - Background + horizon circle
  // - Azimuthal grid (alt circles + az rays)
  // - Meridian / Equator / Ecliptic
  // - Milky Way (schematic band, galactic frame)
  // - Constellations (lines + labels)
  // - Stars
  //
  // Rules:
  // - Below horizon: hidden
  // - All inside dome is clipped to horizon circle
  // ============================================================

  const SKY = {};

  const DEFAULTS = {
    baseUrl: "/sky",
    mountId: null,
    lat: 52.2297,
    lon: 21.0122,
    datetimeISO: null,
    options: {
      minStarMag: 3.5,

      showGridAz: true,

      showMeridian: true,
      showEquator: true,
      showEcliptic: true,

      showMilkyWay: true,

      showConstellations: true,
      showConstellationLabels: true
    }
  };

  // -----------------------------
  // skyAstro
  // -----------------------------
  SKY.skyAstro = (function () {
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

    // GMST in radians (approx; good for visualization)
    function gmstRad(jd) {
      const d = jd - 2451545.0;
      const gmstHours = 18.697374558 + 24.06570982441908 * d;
      const gmst = (gmstHours % 24) * (Math.PI / 12);
      return normRad2Pi(gmst);
    }

    function lstRad(jd, lonRad) {
      return normRad2Pi(gmstRad(jd) + lonRad);
    }

    // RA/Dec -> Alt/Az
    // az: 0..2π, 0=N, π/2=E
    function raDecToAltAz(raRad, decRad, latRad, lstRadVal) {
      const H = normRadPi(lstRadVal - raRad);

      const sinLat = Math.sin(latRad);
      const cosLat = Math.cos(latRad);
      const sinDec = Math.sin(decRad);
      const cosDec = Math.cos(decRad);

      const sinAlt = sinLat * sinDec + cosLat * cosDec * Math.cos(H);
      const alt = Math.asin(clamp(sinAlt, -1, 1));

      // Stable azimuth formula for our N=0 convention
      const y = -Math.sin(H) * cosDec;
      const x = sinDec - Math.sin(alt) * sinLat;
      let az = Math.atan2(y, x);
      az = normRad2Pi(az);

      return { altRad: alt, azRad: az };
    }

    // Alt/Az -> x/y (azimuthal equidistant; zenith center)
    function altAzToXY(altRad, azRad, cx, cy, R) {
      const rr = ((Math.PI / 2) - altRad) / (Math.PI / 2) * R;
      const x = cx + rr * Math.sin(azRad);
      const y = cy - rr * Math.cos(azRad);
      return { x, y, rr };
    }

    // Ecliptic lon/lat -> RA/Dec (mean obliquity eps)
    function eclToRaDec(lambdaRad, betaRad, epsRad) {
      const sinLam = Math.sin(lambdaRad);
      const cosLam = Math.cos(lambdaRad);
      const sinBet = Math.sin(betaRad);
      const cosBet = Math.cos(betaRad);
      const sinE = Math.sin(epsRad);
      const cosE = Math.cos(epsRad);

      // sin(dec) = sin(beta)*cos(eps) + cos(beta)*sin(eps)*sin(lambda)
      const sinDec = sinBet * cosE + cosBet * sinE * sinLam;
      const dec = Math.asin(clamp(sinDec, -1, 1));

      // ra = atan2( sin(lambda)*cos(eps) - tan(beta)*sin(eps), cos(lambda) )
      const y = sinLam * cosE - Math.tan(betaRad) * sinE;
      const x = cosLam;
      let ra = Math.atan2(y, x);
      ra = normRad2Pi(ra);

      return { raRad: ra, decRad: dec };
    }

    // Galactic (l,b) -> Equatorial (RA,Dec), J2000 constants
    // RA_NGP = 192.85948°, Dec_NGP = 27.12825°, l_omega = 32.93192°
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

    return {
      deg2rad, rad2deg, clamp, normRad2Pi, normRadPi,
      toJulianDate, gmstRad, lstRad,
      raDecToAltAz, altAzToXY,
      eclToRaDec, galToRaDec
    };
  })();

  // -----------------------------
  // skyData
  // -----------------------------
  SKY.skyData = (function () {
    const cache = new Map();

    async function loadJSON(url) {
      if (cache.has(url)) return cache.get(url);
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
      const json = await res.json();
      cache.set(url, json);
      return json;
    }

    function loadStars(baseUrl) {
      return loadJSON(`${baseUrl}/data/stars_v1.json`);
    }

    function loadConstellations(baseUrl) {
      return loadJSON(`${baseUrl}/data/constellations_v1.json`);
    }

    function loadMilkyWay(baseUrl) {
      return loadJSON(`${baseUrl}/data/milkyway_v1.json`);
    }

    return { loadJSON, loadStars, loadConstellations, loadMilkyWay };
  })();

  // -----------------------------
  // skyLayout
  // -----------------------------
  SKY.skyLayout = (function () {
    const PADDING = 14;

    function computeViewport(container, dpr) {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.max(10, Math.floor(0.5 * Math.min(w, h) - PADDING));
      return { w, h, dpr, cx, cy, R, padding: PADDING };
    }

    function setupCanvas(canvas, container) {
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const vp = computeViewport(container, dpr);

      canvas.style.width = vp.w + "px";
      canvas.style.height = vp.h + "px";
      canvas.width = vp.w * vp.dpr;
      canvas.height = vp.h * vp.dpr;

      const ctx = canvas.getContext("2d");
      ctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);

      return { ctx, viewport: vp };
    }

    return { setupCanvas, computeViewport };
  })();

  // -----------------------------
  // skyPrepare
  // -----------------------------
  SKY.skyPrepare = (function () {
    const A = SKY.skyAstro;
    const EPS = A.deg2rad(23.439291); // J2000 mean obliquity

    function makeObserver(cfg) {
      const latRad = A.deg2rad(cfg.lat);
      const lonRad = A.deg2rad(cfg.lon);
      const date = cfg.datetimeISO ? new Date(cfg.datetimeISO) : new Date();
      const jd = A.toJulianDate(date);
      const lst = A.lstRad(jd, lonRad);
      return { latRad, lonRad, date, jd, lstRad: lst };
    }

    function starRadiusFromMag(mag) {
      const brightness = Math.pow(10, -0.4 * mag);
      const r = 0.8 + 2.8 * brightness;
      return A.clamp(r, 0.8, 3.0);
    }

    function prepareStars(starCatalog, observer, viewport, options) {
      const minMag = options.minStarMag ?? starCatalog.limit_mag ?? 3.0;
      const stars = [];

      const latRad = observer.latRad;
      const lstRad = observer.lstRad;

      for (const s of starCatalog.stars || []) {
        if (typeof s.mag !== "number") continue;
        if (s.mag > minMag) continue;

        const raRad = A.deg2rad(s.ra_deg);
        const decRad = A.deg2rad(s.dec_deg);

        const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
        if (altRad < 0) continue;

        const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
        const r = starRadiusFromMag(s.mag);

        stars.push({ id: s.id, name: s.name || "", mag: s.mag, x, y, r });
      }

      return stars;
    }

    function prepareConstellations(constellations, starCatalog, observer, viewport, options) {
      if (!constellations || !constellations.lines) return { lines: [], labels: [] };

      const byId = new Map();
      for (const s of starCatalog.stars || []) byId.set(s.id, s);

      const latRad = observer.latRad;
      const lstRad = observer.lstRad;

      const projCache = new Map();
      function projStar(id) {
        if (projCache.has(id)) return projCache.get(id);
        const s = byId.get(id);
        if (!s) return null;

        const raRad = A.deg2rad(s.ra_deg);
        const decRad = A.deg2rad(s.dec_deg);

        const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
        if (altRad < 0) { projCache.set(id, null); return null; }

        const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
        const out = { x, y, altRad };
        projCache.set(id, out);
        return out;
      }

      const lines = [];
      for (const ln of constellations.lines) {
        const a = projStar(ln.a);
        const b = projStar(ln.b);
        if (!a || !b) continue;
        lines.push({ con: ln.con, ax: a.x, ay: a.y, bx: b.x, by: b.y });
      }

      const labels = [];
      if (options.showConstellationLabels && Array.isArray(constellations.labels)) {
        for (const lab of constellations.labels) {
          const raRad = A.deg2rad(lab.ra_deg);
          const decRad = A.deg2rad(lab.dec_deg);
          const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
          if (altRad < 0) continue;
          const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
          labels.push({ con: lab.con, x, y, name: lab.name_ru || lab.name_en || lab.con });
        }
      }

      return { lines, labels };
    }

    // Polyline builder helpers (with horizon breaks; simple version)
    function buildEquatorPolyline(observer, viewport) {
      const latRad = observer.latRad;
      const lstRad = observer.lstRad;
      const pts = [];
      let started = false;

      for (let raDeg = 0; raDeg <= 360; raDeg += 0.5) {
        const raRad = A.deg2rad(raDeg);
        const decRad = 0;

        const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);
        if (altRad < 0) {
          if (started) pts.push(null);
          started = false;
          continue;
        }
        const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
        pts.push({ x, y });
        started = true;
      }
      return pts;
    }

    function buildEclipticPolyline(observer, viewport) {
      const latRad = observer.latRad;
      const lstRad = observer.lstRad;
      const pts = [];
      let started = false;

      for (let lamDeg = 0; lamDeg <= 360; lamDeg += 0.5) {
        const lambdaRad = A.deg2rad(lamDeg);
        const betaRad = 0;

        const { raRad, decRad } = A.eclToRaDec(lambdaRad, betaRad, EPS);
        const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);

        if (altRad < 0) {
          if (started) pts.push(null);
          started = false;
          continue;
        }
        const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
        pts.push({ x, y });
        started = true;
      }
      return pts;
    }

    function buildMeridianPolyline(viewport) {
      // visual meridian (N-zenith-S) is a straight diameter in this projection
      return [
        { x: viewport.cx, y: viewport.cy - viewport.R },
        { x: viewport.cx, y: viewport.cy },
        { x: viewport.cx, y: viewport.cy + viewport.R }
      ];
    }

    function buildMilkyWay(observer, viewport, mwJson) {
      if (!mwJson || !mwJson.bands || !mwJson.bands.length) return null;

      const latRad = observer.latRad;
      const lstRad = observer.lstRad;

      function sample(bDeg, stepDeg) {
        const pts = [];
        let started = false;

        for (let lDeg = 0; lDeg <= 360; lDeg += stepDeg) {
          const lRad = A.deg2rad(lDeg);
          const bRad = A.deg2rad(bDeg);

          const { raRad, decRad } = A.galToRaDec(lRad, bRad);
          const { altRad, azRad } = A.raDecToAltAz(raRad, decRad, latRad, lstRad);

          if (altRad < 0) {
            if (started) pts.push(null);
            started = false;
            continue;
          }

          const { x, y } = A.altAzToXY(altRad, azRad, viewport.cx, viewport.cy, viewport.R);
          pts.push({ x, y });
          started = true;
        }

        return pts;
      }

      const band = mwJson.bands[0];
      const midB = typeof band.b_deg === "number" ? band.b_deg : 0.0;
      const halfW = typeof band.half_width_deg === "number" ? band.half_width_deg : 7.0;
      const step = typeof band.step_deg === "number" ? band.step_deg : 1.0;

      const mid = sample(midB, step);
      const top = sample(midB + halfW, step);
      const bot = sample(midB - halfW, step);

      return { mid, top, bot };
    }

    return {
      makeObserver,
      prepareStars,
      prepareConstellations,
      buildMeridianPolyline,
      buildEquatorPolyline,
      buildEclipticPolyline,
      buildMilkyWay
    };
  })();

  // -----------------------------
  // skyRender
  // -----------------------------
  SKY.skyRender = (function () {
    function clear(ctx, vp) {
      ctx.clearRect(0, 0, vp.w, vp.h);
    }

    function drawBackground(ctx, vp) {
      const g = ctx.createRadialGradient(vp.cx, vp.cy, 0, vp.cx, vp.cy, vp.R * 1.2);
      g.addColorStop(0, "rgba(10, 20, 45, 1)");
      g.addColorStop(1, "rgba(5, 8, 18, 1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, vp.w, vp.h);
    }

    function drawHorizon(ctx, vp) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(vp.cx, vp.cy, vp.R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.25;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(vp.cx, vp.cy, vp.R + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120,160,255,0.10)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    function drawGridAz(ctx, vp) {
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;

      const altCircles = [0, 30, 60];
      for (const alt of altCircles) {
        const rr = (90 - alt) / 90 * vp.R;
        ctx.beginPath();
        ctx.arc(vp.cx, vp.cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let az = 0; az < 360; az += 30) {
        const rad = (az * Math.PI) / 180;
        const x = vp.cx + vp.R * Math.sin(rad);
        const y = vp.cy - vp.R * Math.cos(rad);
        ctx.beginPath();
        ctx.moveTo(vp.cx, vp.cy);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.30)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const labelAlt = (alt) => {
        const rr = (90 - alt) / 90 * vp.R;
        ctx.fillText(`${alt}°`, vp.cx + rr + 6, vp.cy);
      };
      labelAlt(30);
      labelAlt(60);

      ctx.restore();
    }

    function drawCardinals(ctx, vp) {
      ctx.save();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const pad = 18;
      ctx.fillText("N", vp.cx, vp.cy - vp.R - pad);
      ctx.fillText("S", vp.cx, vp.cy + vp.R + pad);
      ctx.fillText("E", vp.cx + vp.R + pad, vp.cy);
      ctx.fillText("W", vp.cx - vp.R - pad, vp.cy);

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      for (let az = 0; az < 360; az += 45) {
        const rad = (az * Math.PI) / 180;
        const x1 = vp.cx + (vp.R - 6) * Math.sin(rad);
        const y1 = vp.cy - (vp.R - 6) * Math.cos(rad);
        const x2 = vp.cx + (vp.R + 2) * Math.sin(rad);
        const y2 = vp.cy - (vp.R + 2) * Math.cos(rad);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawPolylineWithBreaks(ctx, pts) {
      ctx.beginPath();
      let penDown = false;
      for (const p of pts) {
        if (!p) { penDown = false; continue; }
        if (!penDown) { ctx.moveTo(p.x, p.y); penDown = true; }
        else { ctx.lineTo(p.x, p.y); }
      }
      ctx.stroke();
    }

    function drawMeridian(ctx, vp, meridianPts) {
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      drawPolylineWithBreaks(ctx, meridianPts);
      ctx.restore();
    }

    function drawEquator(ctx, vp, equatorPts) {
      ctx.save();
      ctx.setLineDash([]); // explicit solid
      ctx.strokeStyle = "rgba(140,200,255,0.22)";
      ctx.lineWidth = 1.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      drawPolylineWithBreaks(ctx, equatorPts);
      ctx.restore();
    }

    function drawEcliptic(ctx, vp, eclPts) {
      ctx.save();
      ctx.setLineDash([6, 6]); // explicit dashed
      ctx.strokeStyle = "rgba(255,210,140,0.24)";
      ctx.lineWidth = 1.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      drawPolylineWithBreaks(ctx, eclPts);
      ctx.restore();
    }

    function drawMilkyWay(ctx, vp, mw) {
      if (!mw) return;

      ctx.save();
      ctx.setLineDash([]);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // wide soft glow (mid)
      ctx.strokeStyle = "rgba(220,230,255,0.06)";
      ctx.lineWidth = 14;
      drawPolylineWithBreaks(ctx, mw.mid);

      // edges hint
      ctx.strokeStyle = "rgba(220,230,255,0.08)";
      ctx.lineWidth = 6;
      drawPolylineWithBreaks(ctx, mw.top);
      drawPolylineWithBreaks(ctx, mw.bot);

      // ridge
      ctx.strokeStyle = "rgba(220,230,255,0.12)";
      ctx.lineWidth = 2;
      drawPolylineWithBreaks(ctx, mw.mid);

      ctx.restore();
    }

    function drawConstellations(ctx, vp, consPrepared) {
      if (!consPrepared) return;

      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(160,190,255,0.28)";
      ctx.lineWidth = 1.25;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      for (const ln of consPrepared.lines || []) {
        ctx.beginPath();
        ctx.moveTo(ln.ax, ln.ay);
        ctx.lineTo(ln.bx, ln.by);
        ctx.stroke();
      }

      if (consPrepared.labels && consPrepared.labels.length) {
        ctx.fillStyle = "rgba(190,210,255,0.55)";
        ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const lab of consPrepared.labels) ctx.fillText(lab.name, lab.x, lab.y);
      }

      ctx.restore();
    }

    function drawStars(ctx, vp, starsPrepared) {
      ctx.save();
      ctx.setLineDash([]);
      for (const s of starsPrepared) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        if (s.mag <= 0.2) {
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r + 2.0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(180,200,255,0.08)";
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.78)";
          ctx.fill();
        }
      }
      ctx.restore();
    }

    return {
      clear,
      drawBackground,
      drawHorizon,
      drawGridAz,
      drawCardinals,
      drawMeridian,
      drawEquator,
      drawEcliptic,
      drawMilkyWay,
      drawConstellations,
      drawStars
    };
  })();

  // -----------------------------
  // skyWidget
  // -----------------------------
  SKY.skyWidget = (function () {
    const D = SKY.skyData;
    const L = SKY.skyLayout;
    const P = SKY.skyPrepare;
    const R = SKY.skyRender;

    function deepMerge(dst, src) {
      if (!src) return dst;
      for (const k of Object.keys(src)) {
        const v = src[k];
        if (v && typeof v === "object" && !Array.isArray(v)) dst[k] = deepMerge(dst[k] || {}, v);
        else dst[k] = v;
      }
      return dst;
    }

    function makeRoot(container) {
      const root = document.createElement("div");
      root.className = "sky-root";
      root.innerHTML = `
        <div class="sky-canvas-wrap"><canvas class="sky-canvas"></canvas></div>
        <div class="sky-status" data-role="status">Loading…</div>
      `;
      container.appendChild(root);
      return {
        root,
        canvas: root.querySelector("canvas.sky-canvas"),
        status: root.querySelector('[data-role="status"]')
      };
    }

    function injectStyleOnce() {
      if (document.getElementById("sky-widget-style")) return;
      const style = document.createElement("style");
      style.id = "sky-widget-style";
      style.textContent = `
        .sky-root { position: relative; width: 100%; height: 100%; }
        .sky-canvas-wrap { width: 100%; height: 100%; }
        .sky-canvas { width: 100%; height: 100%; display:block; }
        .sky-status {
          position: absolute; left: 12px; bottom: 10px;
          font: 12px system-ui, -apple-system, Segoe UI, Roboto, Arial;
          color: rgba(255,255,255,0.70);
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 6px 10px;
          user-select: none;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }

    function resolveMount(cfg) {
      if (cfg.mountId) {
        const el = document.getElementById(cfg.mountId);
        if (el) return el;
      }
      const div = document.createElement("div");
      div.style.width = "420px";
      div.style.height = "420px";
      document.body.appendChild(div);
      return div;
    }

    function makeStatusText(observer, starsCount, consLines) {
      const dt = observer.date;
      const pad2 = (n) => String(n).padStart(2, "0");
      const stamp = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
      return `lat ${(observer.latRad * 180 / Math.PI).toFixed(2)}°, lon ${(observer.lonRad * 180 / Math.PI).toFixed(2)}° | ${stamp} | stars ${starsCount} | cons ${consLines}`;
    }

    async function init(userCfg) {
      const cfg = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), userCfg || {});
      injectStyleOnce();

      const mount = resolveMount(cfg);
      const { root, canvas, status } = makeRoot(mount);

      let ctx, viewport;
      ({ ctx, viewport } = L.setupCanvas(canvas, mount));

      let starCatalog = null;
      let constellations = null;
      let milkyway = null;

      try {
        status.textContent = "Loading stars…";
        starCatalog = await D.loadStars(cfg.baseUrl);

        status.textContent = "Loading constellations…";
        constellations = await D.loadConstellations(cfg.baseUrl);

        status.textContent = "Loading Milky Way…";
        milkyway = await D.loadMilkyWay(cfg.baseUrl);

      } catch (e) {
        console.error(e);
        status.textContent = "Failed to load sky data (check /sky/data/*.json)";
        return makeHandle({ root });
      }

      let observer, starsPrepared, consPrepared;
      let meridianPts, equatorPts, eclipticPts;
      let mwPrepared;

      function recomputeAll() {
        observer = P.makeObserver(cfg);
        starsPrepared = P.prepareStars(starCatalog, observer, viewport, cfg.options || {});
        consPrepared = cfg.options.showConstellations
          ? P.prepareConstellations(constellations, starCatalog, observer, viewport, cfg.options || {})
          : { lines: [], labels: [] };

        meridianPts = cfg.options.showMeridian ? P.buildMeridianPolyline(viewport) : [];
        equatorPts = cfg.options.showEquator ? P.buildEquatorPolyline(observer, viewport) : [];
        eclipticPts = cfg.options.showEcliptic ? P.buildEclipticPolyline(observer, viewport) : [];

        mwPrepared = cfg.options.showMilkyWay ? P.buildMilkyWay(observer, viewport, milkyway) : null;
      }

      function render() {
        R.clear(ctx, viewport);
        R.drawBackground(ctx, viewport);

        // ---- CLIP to horizon circle (inside dome) ----
        ctx.save();
        ctx.beginPath();
        ctx.arc(viewport.cx, viewport.cy, viewport.R, 0, Math.PI * 2);
        ctx.clip();

        // inside-dome layers
        if (cfg.options?.showGridAz) R.drawGridAz(ctx, viewport);

        if (cfg.options?.showMeridian) R.drawMeridian(ctx, viewport, meridianPts);
        if (cfg.options?.showEquator) R.drawEquator(ctx, viewport, equatorPts);
        if (cfg.options?.showEcliptic) R.drawEcliptic(ctx, viewport, eclipticPts);

        if (cfg.options?.showMilkyWay && mwPrepared) R.drawMilkyWay(ctx, viewport, mwPrepared);

        if (cfg.options?.showConstellations) R.drawConstellations(ctx, viewport, consPrepared);

        // stars on top
        R.drawStars(ctx, viewport, starsPrepared);

        ctx.restore(); // end clip

        // overlays outside clip
        R.drawHorizon(ctx, viewport);
        R.drawCardinals(ctx, viewport);

        status.textContent = makeStatusText(observer, starsPrepared.length, (consPrepared.lines || []).length);
      }

      function resize() {
        ({ ctx, viewport } = L.setupCanvas(canvas, mount));
        recomputeAll();
        render();
      }

      function update(patch) {
        deepMerge(cfg, patch || {});
        recomputeAll();
        render();
      }

      const ro = new ResizeObserver(() => resize());
      ro.observe(mount);

      recomputeAll();
      render();

      return makeHandle({ root, update, resize, ro });
    }

    function makeHandle(parts) {
      return {
        update: parts.update || function () { },
        resize: parts.resize || function () { },
        destroy: function () {
          try { parts.ro && parts.ro.disconnect(); } catch (_) { }
          if (parts.root && parts.root.parentNode) parts.root.parentNode.removeChild(parts.root);
        }
      };
    }

    return { init };
  })();

  // ============================================================
  // Bootstrap
  // ============================================================
  const userCfg = (typeof window !== "undefined" && window.SKY_CONFIG) ? window.SKY_CONFIG : null;

  SKY.skyWidget.init(userCfg || {})
    .then((handle) => { window.__skyWidget = handle; })
    .catch((err) => { console.error("SKY init failed:", err); });

})();